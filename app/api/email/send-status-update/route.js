import { NextResponse } from 'next/server'
import { sendStatusUpdateEmail } from '@/lib/email'
import { supabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    const body = await request.json()
    const { shipmentId, newStatus } = body

    if (!shipmentId || !newStatus) {
      return NextResponse.json(
        { error: 'Missing required fields: shipmentId and newStatus' },
        { status: 400 }
      )
    }

    // Fetch shipment details with user info
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('*')
      .eq('id', shipmentId)
      .single()

    if (shipmentError || !shipment) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      )
    }

    // Get user email - try to fetch from auth.users via RPC or use service role
    // For now, we'll use a workaround: fetch from profiles if email is stored there
    // Or use the user_id to query auth.users (requires service role key)
    
    // Check if we have service role key for admin access
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    let userEmail = null

    if (serviceRoleKey) {
      // Use service role to access auth.users
      const { createClient } = await import('@supabase/supabase-js')
      const adminSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        serviceRoleKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )
      
      const { data: authUser } = await adminSupabase.auth.admin.getUserById(shipment.user_id)
      userEmail = authUser?.user?.email
    }

    // Fallback: try to get email from profiles if stored there
    if (!userEmail) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', shipment.user_id)
        .single()
      
      userEmail = profile?.email
    }

    if (!userEmail) {
      // Last resort: try to get from auth.users using RPC (if available)
      // Or return error
      return NextResponse.json(
        { error: 'User email not found. Please ensure user has an email address.' },
        { status: 404 }
      )
    }

    // Prepare shipment details
    const shipmentDetails = {
      pickupLocation: shipment.pickup_location,
      deliveryLocation: shipment.drop_off_location,
      cost: shipment.cost,
    }

    // Send email
    const emailResult = await sendStatusUpdateEmail({
      to: userEmail,
      trackingNumber: shipment.tracking_number,
      status: newStatus,
      shipmentDetails,
    })

    if (!emailResult.success) {
      console.error('Email sending failed:', emailResult.error)
      return NextResponse.json(
        { error: 'Failed to send email', details: emailResult.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      emailId: emailResult.data?.id,
    })
  } catch (error) {
    console.error('Email API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}


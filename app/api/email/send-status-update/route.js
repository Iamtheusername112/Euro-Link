import { NextResponse } from 'next/server'
// Use free email service (Nodemailer) instead of Resend
import { sendStatusUpdateEmail } from '@/lib/email-free'
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

    // Get user email using service role key (required for accessing auth.users)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!serviceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not configured. Cannot fetch user email.')
      return NextResponse.json(
        { error: 'Server configuration error. SUPABASE_SERVICE_ROLE_KEY is required for email sending.' },
        { status: 500 }
      )
    }

    let userEmail = null

    try {
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
      
      console.log('Fetching user email for:', shipment.user_id)
      const { data: authUser, error: authError } = await adminSupabase.auth.admin.getUserById(shipment.user_id)
      
      if (authError) {
        console.error('Error fetching user from auth:', authError)
      } else {
        userEmail = authUser?.user?.email
        console.log('User email found:', userEmail ? 'Yes' : 'No', userEmail)
      }
    } catch (error) {
      console.error('Error accessing auth.users:', error)
    }

    // Fallback: try to get email from profiles if stored there
    if (!userEmail) {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', shipment.user_id)
          .single()
        
        if (!profileError && profile?.email) {
          userEmail = profile.email
          console.log('User email found in profiles:', userEmail)
        }
      } catch (error) {
        console.error('Error fetching email from profiles:', error)
      }
    }

    if (!userEmail) {
      console.error('User email not found for user:', shipment.user_id)
      return NextResponse.json(
        { error: 'User email not found. Please ensure the user has a valid email address in their account.' },
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


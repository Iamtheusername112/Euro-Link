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
    // Use service role client to ensure we get all data including tracking_number
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    
    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json(
        { error: 'Server configuration error. SUPABASE_SERVICE_ROLE_KEY is required.' },
        { status: 500 }
      )
    }

    const { createClient } = await import('@supabase/supabase-js')
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Fetch shipment with ALL fields to ensure we get tracking_number
    const { data: shipment, error: shipmentError } = await adminSupabase
      .from('shipments')
      .select('*')
      .eq('id', shipmentId)
      .single()

    if (shipmentError) {
      console.error('❌ Error fetching shipment:', shipmentError)
      console.error('Shipment ID:', shipmentId)
      return NextResponse.json(
        { error: 'Shipment not found', details: shipmentError?.message },
        { status: 404 }
      )
    }

    if (!shipment) {
      console.error('❌ Shipment is null for ID:', shipmentId)
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      )
    }

    // Verify tracking number exists and log it
    console.log('📦 Fetched shipment data:', {
      id: shipment.id,
      tracking_number: shipment.tracking_number,
      status: shipment.status,
      user_id: shipment.user_id
    })

    if (!shipment.tracking_number) {
      console.error('❌ Shipment missing tracking_number! Full shipment data:', JSON.stringify(shipment, null, 2))
      return NextResponse.json(
        { error: 'Shipment tracking number not found in database' },
        { status: 500 }
      )
    }

    // Ensure tracking number is a string and not null/undefined
    let trackingNumber = String(shipment.tracking_number).trim()
    
    if (!trackingNumber || trackingNumber === 'undefined' || trackingNumber === 'null') {
      console.error('❌ Invalid tracking number:', trackingNumber)
      return NextResponse.json(
        { error: 'Invalid tracking number in database' },
        { status: 500 }
      )
    }

    // Prevent test tracking numbers from being used in real emails
    if (trackingNumber.includes('TEST') || trackingNumber.includes('test') || trackingNumber === 'EU-TEST123456') {
      console.error('❌ BLOCKED: Test tracking number detected in real shipment:', trackingNumber)
      console.error('Shipment ID:', shipmentId)
      console.error('Full shipment data:', JSON.stringify(shipment, null, 2))
      return NextResponse.json(
        { error: 'Cannot send email: Shipment has test tracking number. Please use a real shipment.' },
        { status: 400 }
      )
    }

    console.log('✅ Using tracking number for email:', trackingNumber)

    // Get user email using service role key (required for accessing auth.users)
    let userEmail = null

    try {
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

    // Send email with verified tracking number
    console.log('📧 Sending email with tracking number:', trackingNumber)
    const emailResult = await sendStatusUpdateEmail({
      to: userEmail,
      trackingNumber: trackingNumber, // Use the verified/cleaned tracking number
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


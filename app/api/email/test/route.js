import { NextResponse } from 'next/server'
import { sendStatusUpdateEmail } from '@/lib/email-free'
import { createClient } from '@supabase/supabase-js'

/**
 * Test Email Endpoint - Uses Real Shipment Data
 * POST /api/email/test
 * Body: { to: "email@example.com" } (optional - if not provided, uses recipient email from shipment)
 * 
 * This endpoint fetches a real shipment from the database and sends
 * an email with the actual tracking number and shipment details.
 */
export async function POST(request) {
  try {
    const body = await request.json()
    const { to } = body // Admin can specify any email address
    
    console.log('🧪 Testing email sending with real shipment data', { to })

    // Get Supabase service role client to fetch real shipment
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json(
        { error: 'Server configuration error. SUPABASE_SERVICE_ROLE_KEY is required.' },
        { status: 500 }
      )
    }

    const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Fetch a real shipment from the database with recipient info
    // Get the most recent shipment that has a tracking number
    const { data: shipments, error: shipmentError } = await adminSupabase
      .from('shipments')
      .select('tracking_number, pickup_location, drop_off_location, cost, status, recipient_info, user_id')
      .not('tracking_number', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)

    if (shipmentError || !shipments || shipments.length === 0) {
      console.warn('No shipments found in database.')
      return NextResponse.json(
        { 
          success: false,
          error: 'No shipments found in database',
          message: 'Please create a shipment first to use real shipment data for the test email.',
        },
        { status: 404 }
      )
    }

    // Use the real shipment data
    const shipment = shipments[0]
    const trackingNumber = shipment.tracking_number

    // Determine recipient email: use provided 'to' parameter, or fallback to shipment recipient email
    let recipientEmail = to
    
    // If no email provided, try to get it from shipment
    if (!recipientEmail) {
      if (shipment.recipient_info && typeof shipment.recipient_info === 'object') {
        recipientEmail = shipment.recipient_info.email
      } else if (typeof shipment.recipient_info === 'string') {
        try {
          const recipientInfo = JSON.parse(shipment.recipient_info)
          recipientEmail = recipientInfo.email
        } catch (e) {
          console.error('Error parsing recipient_info:', e)
        }
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!recipientEmail || !emailRegex.test(recipientEmail)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid or missing email address',
          message: 'Please provide a valid email address in the "to" field, or ensure the shipment has a valid recipient email.',
        },
        { status: 400 }
      )
    }

    console.log('✅ Sending test email:', {
      to: recipientEmail,
      trackingNumber,
      status: shipment.status,
      pickupLocation: shipment.pickup_location,
      deliveryLocation: shipment.drop_off_location,
    })

    // Send email to the specified email address with real shipment data
    const emailResult = await sendStatusUpdateEmail({
      to: recipientEmail,
      trackingNumber: trackingNumber,
      status: shipment.status || 'In Transit',
      shipmentDetails: {
        pickupLocation: shipment.pickup_location || 'Pickup Location',
        deliveryLocation: shipment.drop_off_location || 'Delivery Location',
        cost: shipment.cost || 0,
      },
    })

    if (!emailResult.success) {
      console.error('❌ Test email failed:', emailResult.error)
      console.error('Original error:', emailResult.originalError)
      console.error('Troubleshooting:', emailResult.troubleshooting)
      
      return NextResponse.json(
        { 
          success: false,
          error: emailResult.error || 'Failed to send test email',
          details: emailResult.originalError || emailResult.error,
          troubleshooting: emailResult.troubleshooting || {
            checkEnvVars: 'Verify EMAIL_USER and EMAIL_APP_PASSWORD are set in .env.local',
            checkGmailAppPassword: 'Make sure you\'re using Gmail App Password, not regular password',
            checkTwoFactor: 'Ensure 2-Step Verification is enabled on your Gmail account',
            generateAppPassword: 'Generate a new App Password at: https://myaccount.google.com/apppasswords'
          }
        },
        { status: 500 }
      )
    }

    console.log('✅ Test email sent successfully:', emailResult.data)

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to: ${recipientEmail}`,
      emailId: emailResult.data?.id,
      shipmentData: {
        trackingNumber: trackingNumber,
        status: shipment.status || 'In Transit',
        pickupLocation: shipment.pickup_location,
        deliveryLocation: shipment.drop_off_location,
        cost: shipment.cost,
        recipientEmail: recipientEmail,
      },
      instructions: [
        `1. Check ${recipientEmail}'s inbox (and spam folder)`,
        `2. Look for email with subject containing tracking number: ${trackingNumber}`,
        '3. Verify the email content shows the real tracking number and shipment details',
        '4. Click the "Track Your Shipment" button to test the link',
        '5. Verify the tracking number matches what you see in the admin dashboard',
        `6. The email was sent to: ${recipientEmail}`,
      ],
    })
  } catch (error) {
    console.error('Test email API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error', 
        details: error.message 
      },
      { status: 500 }
    )
  }
}


import { NextResponse } from 'next/server'
import { sendStatusUpdateEmail } from '@/lib/email-free'

/**
 * Test Email Endpoint
 * POST /api/email/test
 * Body: { to: "email@example.com", testType: "status" | "driver" }
 */
export async function POST(request) {
  try {
    const body = await request.json()
    const { to, testType = 'status' } = body

    if (!to) {
      return NextResponse.json(
        { error: 'Missing required field: to (email address)' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Invalid email address format' },
        { status: 400 }
      )
    }

    console.log('🧪 Testing email sending to:', to)

    // Send test email
    const emailResult = await sendStatusUpdateEmail({
      to: to,
      trackingNumber: 'EU-TEST123456',
      status: 'In Transit',
      shipmentDetails: {
        pickupLocation: '123 Main St, New York, NY',
        deliveryLocation: '456 Oak Ave, Los Angeles, CA',
        cost: 45.99,
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
      message: `Test email sent successfully to ${to}`,
      emailId: emailResult.data?.id,
      instructions: [
        '1. Check your inbox (and spam folder)',
        '2. Look for email with subject: "🚚 Your Shipment is On the Way! - Tracking: EU-TEST123456"',
        '3. Verify the email content looks correct',
        '4. Click the "Track Your Shipment" button to test the link',
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


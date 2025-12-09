/**
 * Free Email Service using Nodemailer with Gmail SMTP
 * No monthly subscription required - completely free!
 */

import nodemailer from 'nodemailer'

// Create reusable transporter
let transporter = null

const getTransporter = () => {
  if (transporter) return transporter

  // Gmail SMTP configuration
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail address
      pass: process.env.EMAIL_APP_PASSWORD, // Gmail App Password (not regular password)
    },
  })

  return transporter
}

export const sendStatusUpdateEmail = async ({ to, trackingNumber, status, shipmentDetails }) => {
  // Check for environment variables
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    const missingVars = []
    if (!process.env.EMAIL_USER) missingVars.push('EMAIL_USER')
    if (!process.env.EMAIL_APP_PASSWORD) missingVars.push('EMAIL_APP_PASSWORD')
    
    console.warn('Email credentials not configured. Missing:', missingVars.join(', '))
    return { 
      success: false, 
      error: `Email service not configured. Missing environment variables: ${missingVars.join(', ')}. Please add them to your .env.local file.` 
    }
  }

  const statusMessages = {
    'Pending': {
      title: 'Your Shipment is Pending',
      message: 'Your shipment has been received and is being prepared for dispatch.',
      icon: '⏳'
    },
    'Paid': {
      title: 'Payment Confirmed',
      message: 'Your payment has been confirmed. Your shipment will be processed shortly.',
      icon: '✅'
    },
    'Processing': {
      title: 'Shipment Processing',
      message: 'Your shipment is being processed and prepared for pickup.',
      icon: '📦'
    },
    'Picked Up': {
      title: 'Shipment Picked Up',
      message: 'Great news! Your shipment has been picked up and is on its way to our facility.',
      icon: '📥'
    },
    'In Transit': {
      title: 'Your Shipment is On the Way!',
      message: 'Great news! Your shipment has started its journey and is now in transit.',
      icon: '🚚'
    },
    'On Route': {
      title: 'Your Shipment is On the Way!',
      message: 'Your shipment is on route to its destination.',
      icon: '🚛'
    },
    'Out for Delivery': {
      title: 'Out for Delivery',
      message: 'Your package is out for delivery and will arrive soon!',
      icon: '📦'
    },
    'Delivered': {
      title: 'Package Delivered Successfully!',
      message: 'Your package has been delivered successfully. Thank you for choosing Euro-Link!',
      icon: '🎉'
    },
    'Cancelled': {
      title: 'Shipment Cancelled',
      message: 'Your shipment has been cancelled. If you have any questions, please contact our support team.',
      icon: '❌'
    }
  }

  const statusInfo = statusMessages[status] || {
    title: 'Shipment Status Update',
    message: `Your shipment status has been updated to ${status}.`,
    icon: '📦'
  }

  try {
    const emailHtml = generateEmailHTML({
      trackingNumber,
      status,
      statusTitle: statusInfo.title,
      statusMessage: statusInfo.message,
      statusIcon: statusInfo.icon,
      shipmentDetails,
    })

    const mailOptions = {
      from: `Euro-Link <${process.env.EMAIL_USER}>`,
      to: to,
      subject: `${statusInfo.icon} ${statusInfo.title} - Tracking: ${trackingNumber}`,
      html: emailHtml,
    }

    console.log('Sending email via Gmail SMTP:', { to, subject: mailOptions.subject })

    const info = await getTransporter().sendMail(mailOptions)
    
    console.log('Email sent successfully:', info.messageId)
    return { success: true, data: { id: info.messageId } }
  } catch (error) {
    console.error('Email sending error:', error)
    
    // Provide more helpful error messages for common Gmail authentication errors
    let errorMessage = error.message
    let troubleshooting = {}
    
    if (error.message && error.message.includes('535')) {
      errorMessage = 'Gmail authentication failed. Invalid username or password.'
      troubleshooting = {
        issue: 'Gmail rejected the login credentials',
        solutions: [
          'Verify EMAIL_USER is your full Gmail address (e.g., yourname@gmail.com)',
          'Ensure EMAIL_APP_PASSWORD is a 16-character App Password, not your regular Gmail password',
          'Make sure 2-Step Verification is enabled on your Gmail account',
          'Generate a new App Password: https://myaccount.google.com/apppasswords',
          'Check that both EMAIL_USER and EMAIL_APP_PASSWORD are set in .env.local'
        ]
      }
    } else if (error.message && error.message.includes('EAUTH')) {
      errorMessage = 'Email authentication failed. Check your credentials.'
      troubleshooting = {
        issue: 'Authentication error',
        solutions: [
          'Verify EMAIL_USER and EMAIL_APP_PASSWORD are correct',
          'Make sure you\'re using an App Password, not your regular password',
          'Check that 2-Step Verification is enabled'
        ]
      }
    } else if (error.message && error.message.includes('ECONNECTION')) {
      errorMessage = 'Could not connect to Gmail SMTP server.'
      troubleshooting = {
        issue: 'Connection error',
        solutions: [
          'Check your internet connection',
          'Verify Gmail SMTP is not blocked by firewall',
          'Try again in a few moments'
        ]
      }
    }
    
    return { 
      success: false, 
      error: errorMessage,
      originalError: error.message,
      troubleshooting
    }
  }
}

export const sendDriverAssignmentEmail = async ({ to, trackingNumber, driverName, shipmentDetails }) => {
  // Check for environment variables
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    const missingVars = []
    if (!process.env.EMAIL_USER) missingVars.push('EMAIL_USER')
    if (!process.env.EMAIL_APP_PASSWORD) missingVars.push('EMAIL_APP_PASSWORD')
    
    console.warn('Email credentials not configured. Missing:', missingVars.join(', '))
    return { 
      success: false, 
      error: `Email service not configured. Missing environment variables: ${missingVars.join(', ')}. Please add them to your .env.local file.` 
    }
  }

  try {
    const emailHtml = generateEmailHTML({
      trackingNumber,
      status: 'Driver Assigned',
      statusTitle: 'Driver Assigned to Your Shipment',
      statusMessage: `Driver ${driverName} has been assigned to deliver your shipment. Your package will be on its way soon!`,
      statusIcon: '🚚',
      shipmentDetails,
    })

    const mailOptions = {
      from: `Euro-Link <${process.env.EMAIL_USER}>`,
      to: to,
      subject: `🚚 Driver Assigned to Your Shipment - Tracking: ${trackingNumber}`,
      html: emailHtml,
    }

    console.log('Sending driver assignment email:', { to })

    const info = await getTransporter().sendMail(mailOptions)
    
    console.log('Email sent successfully:', info.messageId)
    return { success: true, data: { id: info.messageId } }
  } catch (error) {
    console.error('Email sending error:', error)
    
    // Provide more helpful error messages for common Gmail authentication errors
    let errorMessage = error.message
    let troubleshooting = {}
    
    if (error.message && error.message.includes('535')) {
      errorMessage = 'Gmail authentication failed. Invalid username or password.'
      troubleshooting = {
        issue: 'Gmail rejected the login credentials',
        solutions: [
          'Verify EMAIL_USER is your full Gmail address (e.g., yourname@gmail.com)',
          'Ensure EMAIL_APP_PASSWORD is a 16-character App Password, not your regular Gmail password',
          'Make sure 2-Step Verification is enabled on your Gmail account',
          'Generate a new App Password: https://myaccount.google.com/apppasswords',
          'Check that both EMAIL_USER and EMAIL_APP_PASSWORD are set in .env.local'
        ]
      }
    } else if (error.message && error.message.includes('EAUTH')) {
      errorMessage = 'Email authentication failed. Check your credentials.'
      troubleshooting = {
        issue: 'Authentication error',
        solutions: [
          'Verify EMAIL_USER and EMAIL_APP_PASSWORD are correct',
          'Make sure you\'re using an App Password, not your regular password',
          'Check that 2-Step Verification is enabled'
        ]
      }
    } else if (error.message && error.message.includes('ECONNECTION')) {
      errorMessage = 'Could not connect to Gmail SMTP server.'
      troubleshooting = {
        issue: 'Connection error',
        solutions: [
          'Check your internet connection',
          'Verify Gmail SMTP is not blocked by firewall',
          'Try again in a few moments'
        ]
      }
    }
    
    return { 
      success: false, 
      error: errorMessage,
      originalError: error.message,
      troubleshooting
    }
  }
}

// Generate HTML email template
function generateEmailHTML({ trackingNumber, status, statusTitle, statusMessage, statusIcon, shipmentDetails }) {
  // Determine the app URL - prioritize explicit setting, then Vercel URL, then localhost
  let appUrl = process.env.NEXT_PUBLIC_APP_URL
  
  // If not set, try to use Vercel's automatic URL (for production)
  if (!appUrl && process.env.VERCEL_URL) {
    appUrl = `https://${process.env.VERCEL_URL}`
  }
  
  // Fallback to localhost for development
  if (!appUrl) {
    appUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-app.vercel.app' // This should be set via NEXT_PUBLIC_APP_URL
      : 'http://localhost:3000'
  }
  
  // Ensure URL doesn't end with a slash
  appUrl = appUrl.replace(/\/$/, '')
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${statusTitle}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #f97316; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Euro-Link</h1>
              <p style="margin: 5px 0 0 0; color: #ffffff; font-size: 14px; opacity: 0.9;">Your Trusted Shipping Partner</p>
            </td>
          </tr>

          <!-- Status Icon -->
          <tr>
            <td style="padding: 40px 30px 20px; text-align: center;">
              <div style="font-size: 64px; margin-bottom: 20px;">${statusIcon}</div>
              <h2 style="margin: 0 0 10px 0; color: #1f2937; font-size: 24px; font-weight: bold;">${statusTitle}</h2>
              <p style="margin: 0; color: #6b7280; font-size: 16px; line-height: 1.6;">${statusMessage}</p>
            </td>
          </tr>

          <!-- Tracking Info Card -->
          <tr>
            <td style="padding: 0 30px;">
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 30px; border: 1px solid #e5e7eb;">
                <div style="margin-bottom: 15px;">
                  <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Tracking Number</p>
                  <p style="margin: 0; color: #1f2937; font-size: 20px; font-weight: bold; font-family: monospace;">${trackingNumber}</p>
                </div>
                <div style="border-top: 1px solid #e5e7eb; padding-top: 15px;">
                  <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Current Status</p>
                  <p style="margin: 0; color: #f97316; font-size: 18px; font-weight: 600;">${status}</p>
                </div>
              </div>
            </td>
          </tr>

          ${shipmentDetails ? `
          <!-- Shipment Details -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px; font-weight: 600;">Shipment Details</h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${shipmentDetails.pickupLocation ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                    <strong style="color: #1f2937;">From:</strong> ${shipmentDetails.pickupLocation}
                  </td>
                </tr>
                ` : ''}
                ${shipmentDetails.deliveryLocation ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                    <strong style="color: #1f2937;">To:</strong> ${shipmentDetails.deliveryLocation}
                  </td>
                </tr>
                ` : ''}
                ${shipmentDetails.cost ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                    <strong style="color: #1f2937;">Cost:</strong> €${parseFloat(shipmentDetails.cost).toFixed(2)}
                  </td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 30px 30px; text-align: center;">
              <a href="${appUrl}/track?number=${trackingNumber}" style="display: inline-block; background-color: #f97316; color: #ffffff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-size: 16px; font-weight: 600;">Track Your Shipment</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; border-top: 1px solid #e5e7eb;">
              <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 16px; font-weight: 600;">Need Help?</h3>
              <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">Our customer support team is here to help you. Feel free to reach out to us:</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 5px 0;">
                    <a href="mailto:euroslinks@gmail.com" style="color: #f97316; text-decoration: none; font-size: 14px;">📧 euroslinks@gmail.com</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 5px 0;">
                    <a href="tel:+12703551537" style="color: #f97316; text-decoration: none; font-size: 14px;">📞 +12703551537</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 20px 0 0 0; color: #9ca3af; font-size: 12px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                © ${new Date().getFullYear()} Euro-Link. All rights reserved.<br>
                This is an automated email. Please do not reply directly to this message.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}


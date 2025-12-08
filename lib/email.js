import { Resend } from 'resend'
import React from 'react'

const resend = new Resend(process.env.RESEND_API_KEY)

export const sendStatusUpdateEmail = async ({ to, trackingNumber, status, shipmentDetails }) => {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured. Email not sent.')
    return { success: false, error: 'Email service not configured' }
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
    'In Transit': {
      title: 'Your Shipment is On the Way!',
      message: 'Great news! Your shipment has started its journey and is now in transit.',
      icon: '🚚'
    },
    'On Route': {
      title: 'Your Shipment is On the Way!',
      message: 'Your shipment is on route to its destination.',
      icon: '🚚'
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
    }
  }

  const statusInfo = statusMessages[status] || {
    title: 'Shipment Status Update',
    message: `Your shipment status has been updated to ${status}.`,
    icon: '📦'
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Euro-Link <noreply@eurolink.com>', // Update with your verified domain
      to: [to],
      subject: `${statusInfo.icon} ${statusInfo.title} - Tracking: ${trackingNumber}`,
      react: EmailTemplate({
        trackingNumber,
        status,
        statusTitle: statusInfo.title,
        statusMessage: statusInfo.message,
        statusIcon: statusInfo.icon,
        shipmentDetails,
      }),
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Email sending error:', error)
    return { success: false, error: error.message }
  }
}

export const sendDriverAssignmentEmail = async ({ to, trackingNumber, driverName, shipmentDetails }) => {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured. Email not sent.')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Euro-Link <noreply@eurolink.com>', // Update with your verified domain
      to: [to],
      subject: `🚚 Driver Assigned to Your Shipment - Tracking: ${trackingNumber}`,
      react: EmailTemplate({
        trackingNumber,
        status: 'Driver Assigned',
        statusTitle: 'Driver Assigned to Your Shipment',
        statusMessage: `Driver ${driverName} has been assigned to deliver your shipment. Your package will be on its way soon!`,
        statusIcon: '🚚',
        shipmentDetails,
      }),
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Email sending error:', error)
    return { success: false, error: error.message }
  }
}

// Email Template Component
function EmailTemplate({ trackingNumber, status, statusTitle, statusMessage, statusIcon, shipmentDetails }) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{statusTitle}</title>
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', backgroundColor: '#f5f5f5' }}>
        <table width="100%" cellPadding="0" cellSpacing="0" style={{ backgroundColor: '#f5f5f5', padding: '20px 0' }}>
          <tr>
            <td align="center">
              <table width="600" cellPadding="0" cellSpacing="0" style={{ backgroundColor: '#ffffff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                {/* Header */}
                <tr>
                  <td style={{ backgroundColor: '#f97316', padding: '30px', textAlign: 'center' }}>
                    <h1 style={{ margin: 0, color: '#ffffff', fontSize: '28px', fontWeight: 'bold' }}>
                      Euro-Link
                    </h1>
                    <p style={{ margin: '5px 0 0 0', color: '#ffffff', fontSize: '14px', opacity: 0.9 }}>
                      Your Trusted Shipping Partner
                    </p>
                  </td>
                </tr>

                {/* Status Icon */}
                <tr>
                  <td style={{ padding: '40px 30px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '64px', marginBottom: '20px' }}>
                      {statusIcon}
                    </div>
                    <h2 style={{ margin: '0 0 10px 0', color: '#1f2937', fontSize: '24px', fontWeight: 'bold' }}>
                      {statusTitle}
                    </h2>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '16px', lineHeight: '1.6' }}>
                      {statusMessage}
                    </p>
                  </td>
                </tr>

                {/* Tracking Info Card */}
                <tr>
                  <td style={{ padding: '0 30px' }}>
                    <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '20px', marginBottom: '30px', border: '1px solid #e5e7eb' }}>
                      <div style={{ marginBottom: '15px' }}>
                        <p style={{ margin: '0 0 5px 0', color: '#6b7280', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Tracking Number
                        </p>
                        <p style={{ margin: 0, color: '#1f2937', fontSize: '20px', fontWeight: 'bold', fontFamily: 'monospace' }}>
                          {trackingNumber}
                        </p>
                      </div>
                      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '15px' }}>
                        <p style={{ margin: '0 0 5px 0', color: '#6b7280', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Current Status
                        </p>
                        <p style={{ margin: 0, color: '#f97316', fontSize: '18px', fontWeight: '600' }}>
                          {status}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>

                {/* Shipment Details */}
                {shipmentDetails && (
                  <tr>
                    <td style={{ padding: '0 30px 30px' }}>
                      <h3 style={{ margin: '0 0 15px 0', color: '#1f2937', fontSize: '18px', fontWeight: '600' }}>
                        Shipment Details
                      </h3>
                      <table width="100%" cellPadding="0" cellSpacing="0">
                        {shipmentDetails.pickupLocation && (
                          <tr>
                            <td style={{ padding: '8px 0', color: '#6b7280', fontSize: '14px' }}>
                              <strong style={{ color: '#1f2937' }}>From:</strong> {shipmentDetails.pickupLocation}
                            </td>
                          </tr>
                        )}
                        {shipmentDetails.deliveryLocation && (
                          <tr>
                            <td style={{ padding: '8px 0', color: '#6b7280', fontSize: '14px' }}>
                              <strong style={{ color: '#1f2937' }}>To:</strong> {shipmentDetails.deliveryLocation}
                            </td>
                          </tr>
                        )}
                        {shipmentDetails.cost && (
                          <tr>
                            <td style={{ padding: '8px 0', color: '#6b7280', fontSize: '14px' }}>
                              <strong style={{ color: '#1f2937' }}>Cost:</strong> €{parseFloat(shipmentDetails.cost).toFixed(2)}
                            </td>
                          </tr>
                        )}
                      </table>
                    </td>
                  </tr>
                )}

                {/* CTA Button */}
                <tr>
                  <td style={{ padding: '0 30px 30px', textAlign: 'center' }}>
                    <a
                      href={`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/track?number=${trackingNumber}`}
                      style={{
                        display: 'inline-block',
                        backgroundColor: '#f97316',
                        color: '#ffffff',
                        padding: '14px 32px',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontSize: '16px',
                        fontWeight: '600',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      Track Your Shipment
                    </a>
                  </td>
                </tr>

                {/* Footer */}
                <tr>
                  <td style={{ backgroundColor: '#f9fafb', padding: '30px', borderTop: '1px solid #e5e7eb' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#1f2937', fontSize: '16px', fontWeight: '600' }}>
                      Need Help?
                    </h3>
                    <p style={{ margin: '0 0 15px 0', color: '#6b7280', fontSize: '14px', lineHeight: '1.6' }}>
                      Our customer support team is here to help you. Feel free to reach out to us:
                    </p>
                    <table width="100%" cellPadding="0" cellSpacing="0">
                      <tr>
                        <td style={{ padding: '5px 0' }}>
                          <a href="mailto:support@eurolink.com" style={{ color: '#f97316', textDecoration: 'none', fontSize: '14px' }}>
                            📧 support@eurolink.com
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '5px 0' }}>
                          <a href="tel:+1234567890" style={{ color: '#f97316', textDecoration: 'none', fontSize: '14px' }}>
                            📞 +1 (234) 567-890
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '5px 0' }}>
                          <a href="https://eurolink.com" style={{ color: '#f97316', textDecoration: 'none', fontSize: '14px' }}>
                            🌐 www.eurolink.com
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style={{ margin: '20px 0 0 0', color: '#9ca3af', fontSize: '12px', textAlign: 'center', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                      © {new Date().getFullYear()} Euro-Link. All rights reserved.<br />
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
  )
}


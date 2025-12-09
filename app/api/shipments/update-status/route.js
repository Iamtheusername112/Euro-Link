import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getStatusConfig, isValidTransition } from '@/lib/statusConfig'

/**
 * API Route for updating shipment status
 * This route handles RLS properly by using service role key
 */
export async function POST(request) {
  try {
    const body = await request.json()
    const { shipmentId, newStatus, location, notes, adminId } = body

    if (!shipmentId || !newStatus) {
      return NextResponse.json(
        { error: 'Missing required fields: shipmentId and newStatus' },
        { status: 400 }
      )
    }

    // Validate status
    const statusConfig = getStatusConfig(newStatus)
    if (!statusConfig) {
      return NextResponse.json(
        { error: `Invalid status: ${newStatus}` },
        { status: 400 }
      )
    }

    // Get Supabase service role client (bypasses RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Server configuration error. Please contact administrator.' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Fetch current shipment
    const { data: shipment, error: fetchError } = await supabase
      .from('shipments')
      .select('*')
      .eq('id', shipmentId)
      .single()

    if (fetchError || !shipment) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      )
    }

    // Validate transition (optional check)
    if (shipment.status && !isValidTransition(shipment.status, newStatus)) {
      console.warn(`Invalid status transition: ${shipment.status} -> ${newStatus}`)
      // Don't block, but log it
    }

    // Update shipment status
    const { data: updatedShipment, error: updateError } = await supabase
      .from('shipments')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', shipmentId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating shipment:', updateError)
      return NextResponse.json(
        { error: 'Failed to update shipment status', details: updateError.message },
        { status: 500 }
      )
    }

    // Add to status history (using service role, bypasses RLS)
    // Note: updated_by column doesn't exist in schema, so we don't include it
    const { data: historyData, error: historyError } = await supabase
      .from('shipment_status_history')
      .insert({
        shipment_id: shipmentId,
        status: newStatus,
        location: location || 'Status updated',
        notes: notes || `Status updated to ${newStatus}`,
      })
      .select()
      .single()

    if (historyError) {
      console.error('Error adding status history:', historyError)
      // Don't fail the whole operation if history insert fails
    }

    // Create notification for user
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: shipment.user_id,
        shipment_id: shipmentId,
        type: 'status_update',
        title: `${statusConfig.icon} Status Update: ${statusConfig.label}`,
        message: `Your shipment ${shipment.tracking_number} status has been updated to ${statusConfig.label}. ${statusConfig.description}`,
        read: false,
      })

    if (notificationError) {
      console.error('Error creating notification:', notificationError)
      // Don't fail if notification fails
    }

    return NextResponse.json({
      success: true,
      shipment: updatedShipment,
      statusHistory: historyData,
      message: `Status updated to ${newStatus}`,
    })
  } catch (error) {
    console.error('Status update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}


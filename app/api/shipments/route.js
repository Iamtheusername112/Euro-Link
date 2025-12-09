import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const trackingNumber = searchParams.get('number')
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')

    // For public tracking (by tracking number), use service role to bypass RLS
    if (trackingNumber) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (!supabaseUrl) {
        return NextResponse.json(
          { error: 'Database not configured. Please set NEXT_PUBLIC_SUPABASE_URL in .env.local' },
          { status: 500 }
        )
      }

      // Use service role for public tracking (bypasses RLS)
      const adminSupabase = serviceRoleKey
        ? createClient(supabaseUrl, serviceRoleKey, {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          })
        : supabase // Fallback to regular client if service role not available

      const { data, error } = await adminSupabase
        .from('shipments')
        .select(`
          *,
          shipment_status_history (
            id,
            status,
            location,
            timestamp,
            notes
          )
        `)
        .eq('tracking_number', trackingNumber.trim())
        .single()

      if (error) {
        console.error('❌ Supabase Error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          trackingNumber: trackingNumber.trim(),
        })

        // Handle specific error codes
        if (error.code === 'PGRST116') {
          return NextResponse.json(
            { 
              error: 'Shipment not found',
              message: `No shipment found with tracking number: ${trackingNumber.trim()}`,
              trackingNumber: trackingNumber.trim(),
            },
            { status: 404 }
          )
        }

        if (error.code === '42501') {
          return NextResponse.json(
            { 
              error: 'Permission denied',
              message: 'Unable to access shipment data. Please contact support.',
              details: 'RLS policy may be blocking access',
            },
            { status: 403 }
          )
        }

        if (error.code === 'PGRST301') {
          return NextResponse.json(
            { 
              error: 'Multiple shipments found',
              message: 'Multiple shipments found with the same tracking number. Please contact support.',
            },
            { status: 500 }
          )
        }

        // Generic error
        return NextResponse.json(
          { 
            error: error.message || 'Failed to fetch shipment',
            code: error.code,
            details: error.details,
            trackingNumber: trackingNumber.trim(),
          },
          { status: 500 }
        )
      }

      if (!data) {
        console.warn('⚠️ No data returned for tracking number:', trackingNumber.trim())
        return NextResponse.json(
          { 
            error: 'Shipment not found',
            message: `No shipment data found for tracking number: ${trackingNumber.trim()}`,
            trackingNumber: trackingNumber.trim(),
          },
          { status: 404 }
        )
      }

      console.log('✅ Shipment fetched successfully:', {
        trackingNumber: data.tracking_number,
        status: data.status,
        hasHistory: !!data.shipment_status_history?.length,
      })

      return NextResponse.json(data)
    }

    // For authenticated queries (by userId or status), use regular client
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local' },
        { status: 500 }
      )
    }

    let query = supabase
      .from('shipments')
      .select('*')

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ API Route Error (GET):', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      trackingNumber: trackingNumber || 'N/A',
    })
    
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        type: error.name || 'UnknownError',
        message: 'An unexpected error occurred while fetching shipment data',
      },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { data, error } = await supabase
      .from('shipments')
      .insert([body])
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const body = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('shipments')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}


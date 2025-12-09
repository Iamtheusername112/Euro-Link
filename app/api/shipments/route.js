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
        console.error('Error fetching shipment by tracking number:', error)
        if (error.code === 'PGRST116') {
          return NextResponse.json(
            { error: 'Shipment not found' },
            { status: 404 }
          )
        }
        return NextResponse.json(
          { error: error.message || 'Failed to fetch shipment' },
          { status: 500 }
        )
      }

      if (!data) {
        return NextResponse.json(
          { error: 'Shipment not found' },
          { status: 404 }
        )
      }

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
    console.error('API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
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


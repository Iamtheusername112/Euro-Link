import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request) {
  try {
    console.log('📬 Notifications API GET request received')
    
    if (!supabase) {
      console.error('❌ Supabase not configured')
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    console.log('📬 Request params:', { userId, unreadOnly })

    if (!userId) {
      console.warn('⚠️ Missing userId parameter')
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 })
    }

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (unreadOnly) {
      query = query.eq('read', false)
    }

    console.log('📬 Executing Supabase query...')
    const { data, error } = await query

    if (error) {
      console.error('❌ Supabase error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
      
      // If table doesn't exist, return empty array instead of error
      if (error.message?.includes('does not exist') || 
          error.code === '42P01' || 
          error.code === 'PGRST205' ||
          error.message?.includes('schema cache') ||
          error.message?.includes('relation') && error.message?.includes('does not exist')) {
        console.warn('⚠️ Notifications table not found. Returning empty array.')
        return NextResponse.json([])
      }
      
      // Return error but log it
      return NextResponse.json(
        { 
          error: error.message || 'Failed to fetch notifications',
          code: error.code,
        },
        { status: 500 }
      )
    }

    console.log('✅ Notifications fetched successfully:', { count: data?.length || 0 })
    
    // Ensure we always return an array
    return NextResponse.json(Array.isArray(data) ? data : [])
  } catch (error) {
    console.error('❌ API exception:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
    })
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        type: error.name || 'UnknownError',
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
      .from('notifications')
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
      .from('notifications')
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


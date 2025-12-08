import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Get admin credentials from environment variables
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@eurolink.com'
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

    // Verify admin credentials (server-side only)
    if (!ADMIN_PASSWORD) {
      console.error('ADMIN_PASSWORD not configured in environment variables')
      return NextResponse.json(
        { error: 'Admin authentication not configured' },
        { status: 500 }
      )
    }

    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase() || password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Invalid admin credentials' },
        { status: 401 }
      )
    }

    // Try to login with admin credentials
    const { data, error } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    })

    if (error) {
      // Admin account might not exist yet - create it
      if (error.message.includes('Invalid login credentials') || error.message.includes('Email not confirmed')) {
        // Create admin user
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          options: {
            data: {
              full_name: 'System Administrator',
            },
          },
        })

        if (signUpError) {
          return NextResponse.json(
            { error: signUpError.message || 'Failed to create admin account' },
            { status: 500 }
          )
        }

        // Create admin profile
        if (signUpData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: signUpData.user.id,
              full_name: 'System Administrator',
              role: 'Admin',
            })

          if (profileError && profileError.code !== '23505') {
            console.error('Profile creation error:', profileError)
          }

          // Try login again
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
          })

          if (loginError) {
            return NextResponse.json(
              { error: 'Please verify your email or contact support' },
              { status: 401 }
            )
          }

          return NextResponse.json({
            success: true,
            user: loginData.user,
            session: loginData.session,
          })
        }
      } else {
        return NextResponse.json(
          { error: error.message || 'Failed to login' },
          { status: 401 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      user: data.user,
      session: data.session,
    })
  } catch (error) {
    console.error('Admin verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Simplified Admin Login API
 * 1. Verifies credentials match env vars
 * 2. Creates admin account if needed
 * 3. Logs in and returns session
 */
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

    if (!ADMIN_PASSWORD) {
      console.error('ADMIN_PASSWORD not configured')
      return NextResponse.json(
        { error: 'Admin authentication not configured. Please set ADMIN_PASSWORD in .env.local' },
        { status: 500 }
      )
    }

    // Verify credentials match
    const emailMatch = email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
    const passwordMatch = password === ADMIN_PASSWORD

    if (!emailMatch || !passwordMatch) {
      if (!emailMatch && !passwordMatch) {
        return NextResponse.json(
          { error: `Invalid email and password. Please use: ${ADMIN_EMAIL}` },
          { status: 401 }
        )
      } else if (!emailMatch) {
        return NextResponse.json(
          { error: `Invalid email. Please use: ${ADMIN_EMAIL}` },
          { status: 401 }
        )
      } else {
        return NextResponse.json(
          { error: 'Invalid password. Please check your admin password.' },
          { status: 401 }
        )
      }
    }

    // Setup Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    // Try to login
    let loginResult = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    })

    // If login fails, create account
    if (loginResult.error) {
      console.log('Login failed, creating admin account...', loginResult.error.message)
      
      // Create admin account
      const signUpResult = await supabase.auth.signUp({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        options: {
          emailRedirectTo: undefined,
          data: {
            full_name: 'System Administrator',
          },
        },
      })

      if (signUpResult.error) {
        console.error('Sign up error:', signUpResult.error)
        return NextResponse.json(
          { error: `Failed to create admin account: ${signUpResult.error.message}` },
          { status: 500 }
        )
      }

      if (!signUpResult.data.user) {
        return NextResponse.json(
          { error: 'Failed to create admin user' },
          { status: 500 }
        )
      }

      // Create admin profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: signUpResult.data.user.id,
          full_name: 'System Administrator',
          role: 'Admin',
        })

      if (profileError && profileError.code !== '23505') {
        console.error('Profile creation error:', profileError)
        // Continue anyway
      }

      // Try login again after signup
      loginResult = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      })

      if (loginResult.error) {
        return NextResponse.json(
          { error: `Account created but login failed: ${loginResult.error.message}. Please try again.` },
          { status: 401 }
        )
      }
    }

    // Ensure admin profile exists
    if (loginResult.data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', loginResult.data.user.id)
        .single()

      if (!profile) {
        // Create profile if missing
        await supabase
          .from('profiles')
          .insert({
            id: loginResult.data.user.id,
            full_name: 'System Administrator',
            role: 'Admin',
          })
      } else if (profile.role !== 'Admin' && profile.role !== 'Driver') {
        // Update role if needed
        await supabase
          .from('profiles')
          .update({ role: 'Admin' })
          .eq('id', loginResult.data.user.id)
      }
    }

    // Return success with session info
    return NextResponse.json({
      success: true,
      user: loginResult.data.user,
      session: loginResult.data.session,
    })
  } catch (error) {
    console.error('Admin verification error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

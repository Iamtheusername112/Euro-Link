import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
        { error: 'Admin authentication not configured. Please set ADMIN_PASSWORD in .env.local' },
        { status: 500 }
      )
    }

    // Check Supabase configuration
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase not configured')
      return NextResponse.json(
        { error: 'Database not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local' },
        { status: 500 }
      )
    }

    // Verify credentials match
    console.log('Verifying credentials:', {
      providedEmail: email.toLowerCase(),
      expectedEmail: ADMIN_EMAIL.toLowerCase(),
      emailMatch: email.toLowerCase() === ADMIN_EMAIL.toLowerCase(),
      passwordMatch: password === ADMIN_PASSWORD,
      hasPassword: !!ADMIN_PASSWORD,
    })
    
    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase() || password !== ADMIN_PASSWORD) {
      console.error('Credential mismatch:', {
        emailMatch: email.toLowerCase() === ADMIN_EMAIL.toLowerCase(),
        passwordMatch: password === ADMIN_PASSWORD,
      })
      return NextResponse.json(
        { error: `Invalid admin credentials. Expected email: ${ADMIN_EMAIL}` },
        { status: 401 }
      )
    }

    // Create server-side Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    // Try to login with admin credentials
    const { data, error } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    })

    if (error) {
      console.log('Login error:', error.message)
      
      // Admin account might not exist yet - create it
      if (error.message.includes('Invalid login credentials') || 
          error.message.includes('Email not confirmed') ||
          error.message.includes('User not found')) {
        
        console.log('Creating admin account...')
        
        // Create admin user with email confirmation disabled
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          options: {
            emailRedirectTo: undefined,
            data: {
              full_name: 'System Administrator',
            },
          },
        })

        if (signUpError) {
          console.error('Sign up error:', signUpError)
          return NextResponse.json(
            { error: signUpError.message || 'Failed to create admin account' },
            { status: 500 }
          )
        }

        if (!signUpData.user) {
          return NextResponse.json(
            { error: 'Failed to create admin user' },
            { status: 500 }
          )
        }

        // Create admin profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: signUpData.user.id,
            full_name: 'System Administrator',
            role: 'Admin',
          })

        if (profileError && profileError.code !== '23505') {
          console.error('Profile creation error:', profileError)
          // Continue anyway - profile might already exist
        }

        // Use the session from signup if available, otherwise try login
        if (signUpData.session) {
          console.log('Returning signup session')
          return NextResponse.json({
            success: true,
            user: signUpData.user,
            session: signUpData.session, // Return full session object
          })
        }

        // Try login again after account creation
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
        })

        if (loginError) {
          console.error('Login after signup error:', loginError)
          return NextResponse.json(
            { error: `Account created but login failed: ${loginError.message}. Please try logging in again.` },
            { status: 401 }
          )
        }

        console.log('Returning login session after signup')
        return NextResponse.json({
          success: true,
          user: loginData.user,
          session: loginData.session, // Return full session object
        })
      } else {
        return NextResponse.json(
          { error: error.message || 'Failed to login' },
          { status: 401 }
        )
      }
    }

    console.log('Returning successful login session')
    return NextResponse.json({
      success: true,
      user: data.user,
      session: data.session, // Return full session object
    })
  } catch (error) {
    console.error('Admin verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


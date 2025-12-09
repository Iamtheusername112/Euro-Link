'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { toast } from '@/lib/utils/toast'
import { supabase } from '@/lib/supabase'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    
    if (!supabase) {
      toast.error('Database not configured. Please check your .env.local file.')
      return
    }
    
    setLoading(true)

    try {
      console.log('Starting admin login...')
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout - server may not be responding')), 10000)
      )

      // Verify admin credentials via API (server-side only)
      const fetchPromise = fetch('/api/admin/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const response = await Promise.race([fetchPromise, timeoutPromise])
      console.log('API response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Admin login failed:', errorData.error)
        toast.error(errorData.error || 'Invalid admin credentials')
        setLoading(false)
        return
      }

      const data = await response.json()
      console.log('API verification successful:', { success: data.success })

      // Skip setSession entirely - use direct client-side login instead (more reliable)
      console.log('Performing direct client-side login...')
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      })

      if (loginError) {
        console.error('Direct login failed:', loginError)
        console.error('Error details:', {
          message: loginError.message,
          status: loginError.status,
          name: loginError.name,
        })
        
        // Check if it's an email confirmation issue - for admin, we can bypass this
        if (loginError.message.includes('Email not confirmed') || loginError.message.includes('email_not_confirmed')) {
          console.log('Email not confirmed - this is expected for admin accounts')
          // Admin accounts might not have email confirmed, but API verified credentials
          // Try to continue anyway by checking if API verification passed
          if (data.success) {
            console.log('API verification passed, attempting to proceed...')
            // The API already verified, so we can proceed
            // But we still need a session - let's try to get it from the API response
            if (data.session) {
              console.log('Using session from API response...')
              // Store session manually if possible
              try {
                if (typeof window !== 'undefined' && data.session.access_token) {
                  // Force refresh to reload with session
                  window.location.href = '/admin/dashboard'
                  return
                }
              } catch (e) {
                console.error('Failed to use API session:', e)
              }
            }
          }
          toast.error('Admin account needs activation. Please contact support or check Supabase settings.')
        } else if (loginError.message.includes('Invalid login credentials') || loginError.message.includes('invalid_credentials')) {
          toast.error('Invalid credentials. Please check your email and password.')
        } else {
          toast.error(`Login failed: ${loginError.message}. Check console for details.`)
        }
        setLoading(false)
        return
      }

      console.log('Login successful:', { userId: loginData.user?.id })
      
      // Verify session was set
      const { data: { session: currentSession }, error: getSessionError } = await supabase.auth.getSession()
      console.log('Session verification:', { hasSession: !!currentSession, error: getSessionError })
      
      if (getSessionError) {
        console.error('Get session error:', getSessionError)
        toast.error('Failed to verify session')
        setLoading(false)
        return
      }

      if (!currentSession) {
        console.error('Session not set after login')
        toast.error('Session not set. Please try again.')
        setLoading(false)
        return
      }

      console.log('Login successful, verifying profile...', { userId: currentSession.user?.id })
      
      // Ensure admin profile exists before redirecting
      const { data: profileCheck, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentSession.user.id)
        .single()

      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        console.log('Creating admin profile...')
        const { error: createError } = await supabase
          .from('profiles')
          .insert({
            id: currentSession.user.id,
            full_name: currentSession.user.email?.split('@')[0] || 'System Administrator',
            role: 'Admin',
          })

        if (createError && createError.code !== '23505') {
          console.error('Error creating profile:', createError)
          toast.error('Failed to create admin profile. Please contact support.')
          setLoading(false)
          return
        }
        console.log('Admin profile created successfully')
      } else if (profileError) {
        console.error('Error checking profile:', profileError)
        toast.error('Failed to verify admin access')
        setLoading(false)
        return
      } else if (profileCheck && profileCheck.role !== 'Admin' && profileCheck.role !== 'Driver') {
        console.error('User does not have admin role:', profileCheck.role)
        toast.error('Access denied. Admin role required.')
        setLoading(false)
        return
      }

      console.log('Profile verified, redirecting...')
      toast.success('Admin login successful!')
      
      // Force AuthContext to refresh by triggering auth state change
      // Wait a moment for session to be fully established
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Double-check session is still valid before redirecting
      const { data: { session: finalCheck } } = await supabase.auth.getSession()
      if (!finalCheck) {
        console.error('Session lost before redirect')
        toast.error('Session expired. Please try again.')
        setLoading(false)
        return
      }
      
      console.log('Redirecting to admin dashboard...', { userId: finalCheck.user?.id })
      // Use window.location for hard redirect - this forces a full page reload
      // which ensures AuthContext re-initializes with the new session
      window.location.replace('/admin/dashboard')
    } catch (error) {
      console.error('Login error:', error)
      toast.error(error.message || 'Failed to login. Check console for details.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Admin Login" showBack={true} />
      
      <main className="px-4 py-8 max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Admin Portal</h2>
            <p className="text-sm text-gray-600">Access the admin dashboard</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="admin@eurolink.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter admin password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white py-3 rounded-lg font-medium transition"
            >
              {loading ? 'Logging in...' : 'Login as Admin'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Regular user?{' '}
              <a href="/auth/login" className="text-red-500 font-medium hover:underline">
                User Login
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}


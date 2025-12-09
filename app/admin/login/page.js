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
      toast.error('Database not configured')
      return
    }
    
    setLoading(true)

    try {
      // Step 1: Verify credentials via API
      const response = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Invalid admin credentials')
        setLoading(false)
        return
      }

      // Step 2: Set session on client side - use direct login for reliability
      console.log('Setting session via direct login...')
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (loginError) {
        console.error('Login error:', loginError)
        // If direct login fails, try using session from API
        if (data.session) {
          console.log('Trying to set session from API response...')
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          })

          if (sessionError) {
            toast.error(`Login failed: ${loginError.message}`)
            setLoading(false)
            return
          }
        } else {
          toast.error(`Login failed: ${loginError.message}`)
          setLoading(false)
          return
        }
      }

      // Step 3: Verify session is set and persisted
      const { data: { session }, error: sessionCheckError } = await supabase.auth.getSession()
      
      if (sessionCheckError || !session) {
        toast.error('Failed to establish session. Please try again.')
        setLoading(false)
        return
      }

      console.log('Session verified:', { userId: session.user?.id, hasAccessToken: !!session.access_token })

      // Step 4: Ensure profile exists
      const { data: profileCheck } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (!profileCheck) {
        // Create profile if missing
        await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            full_name: 'System Administrator',
            role: 'Admin',
          })
      }

      // Step 5: Success - redirect with delay to ensure AuthContext picks up session
      toast.success('Admin login successful!')
      
      // Wait a bit longer to ensure session is persisted and AuthContext can detect it
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Use replace instead of href to avoid adding to history
      window.location.replace('/admin/dashboard')
      
    } catch (error) {
      console.error('Login error:', error)
      toast.error(error.message || 'Failed to login')
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

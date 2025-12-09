'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function HomePage() {
  const { user, loading: authLoading } = useAuth()
  const hasRedirected = useRef(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirected.current) return
    
    // Wait for auth to finish loading
    if (authLoading) return
    
    // Set redirecting state
    setIsRedirecting(true)
    hasRedirected.current = true
    
    // If we have a user, redirect to dashboard
    if (user !== null) {
      // Use window.location for hard redirect to prevent loops
      window.location.replace('/dashboard')
      return
    }
    
    // If no user, redirect to login
    if (user === null) {
      // Use window.location for hard redirect to prevent loops
      window.location.replace('/auth/login')
      return
    }
  }, [user, authLoading])

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-white text-lg">Redirecting...</p>
        <p className="text-gray-400 text-sm mt-2">
          {authLoading ? 'Checking authentication...' : isRedirecting ? 'Taking you there...' : 'Please wait...'}
        </p>
      </div>
    </div>
  )
}

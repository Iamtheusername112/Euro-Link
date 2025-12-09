'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function HomePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const hasRedirected = useRef(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirected.current) return
    
    // If we already have user info, redirect immediately
    if (user !== null && !authLoading) {
      setIsRedirecting(true)
      hasRedirected.current = true
      router.replace('/dashboard')
      return
    }
    
    // If auth is done loading and no user, redirect to login
    if (!authLoading && user === null) {
      setIsRedirecting(true)
      hasRedirected.current = true
      router.replace('/auth/login')
      return
    }
    
    // While loading, show loading state (already handled in render)
  }, [user, authLoading, router])

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

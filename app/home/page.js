'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function HomePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const hasRedirected = useRef(false)
  const redirectTimeoutRef = useRef(null)

  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirected.current) return
    
    // Set a maximum wait time of 2 seconds for auth to load
    redirectTimeoutRef.current = setTimeout(() => {
      if (!hasRedirected.current) {
        hasRedirected.current = true
        // If still loading after 2 seconds, check user state anyway
        if (user !== null) {
          router.replace('/dashboard')
        } else {
          router.replace('/auth/login')
        }
      }
    }, 2000) // 2 second max wait
    
    // If auth is done loading, redirect immediately
    if (!authLoading) {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current)
        redirectTimeoutRef.current = null
      }
      
      hasRedirected.current = true
      
      // Use router.replace for faster client-side navigation
      if (user !== null) {
        router.replace('/dashboard')
      } else {
        router.replace('/auth/login')
      }
    }

    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current)
      }
    }
  }, [user, authLoading, router])

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-white text-lg">Redirecting...</p>
        <p className="text-gray-400 text-sm mt-2">
          {authLoading ? 'Checking authentication...' : 'Taking you there...'}
        </p>
      </div>
    </div>
  )
}

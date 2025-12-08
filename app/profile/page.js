'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, User, Settings, ChevronRight, LogOut } from '@/components/icons'
import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'
import ShipmentCard from '@/components/ui/ShipmentCard'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/utils/toast'

export default function ProfilePage() {
  const router = useRouter()
  const { user, profile, signOut } = useAuth()
  const [stats, setStats] = useState({
    packagesSent: 0,
    packagesReceived: 0,
  })
  const [recentShipment, setRecentShipment] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    fetchProfileData()
  }, [user, router])

  const fetchProfileData = async () => {
    if (!supabase || !user) return

    setLoading(true)
    try {
      // Fetch user shipments
      const { data: shipments, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        console.error('Error fetching shipments:', error)
      } else {
        const sent = shipments?.length || 0
        const delivered = shipments?.filter(s => s.status === 'Delivered').length || 0
        
        setStats({
          packagesSent: sent,
          packagesReceived: delivered,
        })

        if (shipments && shipments.length > 0) {
          setRecentShipment({
            trackingNumber: shipments[0].tracking_number,
            status: shipments[0].status,
          })
        }
      }
    } catch (error) {
      console.error('Error fetching profile data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Logged out successfully')
    } catch (error) {
      toast.error('Error logging out')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <Header title="Profile" showBack={true} />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  const userName = profile?.full_name || user?.email?.split('@')[0] || 'User'
  const userRole = profile?.role || 'Customer'

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="Profile" showBack={true} />
      
      <main className="px-4 py-6 max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="relative inline-block mb-3">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-200 via-yellow-200 to-green-200 flex items-center justify-center">
              <span className="text-gray-700 font-bold text-2xl">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full"></div>
            <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-green-400 rounded-full"></div>
          </div>
          <h2 className="text-xl font-bold text-gray-800">{userName}</h2>
          <p className="text-sm text-gray-600">{userRole}</p>
          {user?.email && (
            <p className="text-xs text-gray-500 mt-1">{user.email}</p>
          )}
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1 bg-white rounded-lg p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-gray-800">{stats.packagesSent}</p>
            <p className="text-xs text-gray-600 mt-1">Package Sent</p>
          </div>
          <div className="flex-1 bg-white rounded-lg p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-gray-800">{stats.packagesReceived}</p>
            <p className="text-xs text-gray-600 mt-1">Package Received</p>
          </div>
        </div>

        <button 
          onClick={() => router.push('/notifications')}
          className="w-full bg-white hover:bg-gray-50 rounded-lg p-4 mb-4 flex items-center justify-between transition shadow-sm"
        >
          <div className="flex items-center gap-3">
            <Bell size={20} className="text-gray-600" />
            <span className="text-gray-700 font-medium">Notification History</span>
          </div>
          <ChevronRight size={20} className="text-gray-400" />
        </button>

        {recentShipment && (
          <div className="mb-4">
            <ShipmentCard {...recentShipment} />
          </div>
        )}

        <div className="space-y-2 mb-4">
          <button 
            onClick={() => router.push('/profile/settings')}
            className="w-full bg-white hover:bg-gray-50 rounded-lg p-4 flex items-center justify-between transition shadow-sm"
          >
            <div className="flex items-center gap-3">
              <User size={20} className="text-gray-600" />
              <span className="text-gray-700 font-medium">Profile settings</span>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </button>
          <button 
            onClick={() => router.push('/profile/password')}
            className="w-full bg-white hover:bg-gray-50 rounded-lg p-4 flex items-center justify-between transition shadow-sm"
          >
            <div className="flex items-center gap-3">
              <Settings size={20} className="text-gray-600" />
              <span className="text-gray-700 font-medium">Change password</span>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="w-full bg-red-500 hover:bg-red-600 text-white rounded-lg p-4 flex items-center justify-center gap-2 transition shadow-sm"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </main>

      <BottomNav />
    </div>
  )
}

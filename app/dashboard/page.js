'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Package, Phone, MessageSquare, ChevronRight, QrCode } from '@/components/icons'
import BottomNav from '@/components/layout/BottomNav'
import Header from '@/components/layout/Header'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/utils/toast'

export default function UserDashboard() {
  const router = useRouter()
  const { user, profile, loading: authLoading, signOut } = useAuth()
  const [currentOrder, setCurrentOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/login')
        return
      }
      fetchDashboardData()
    }
  }, [user, authLoading, router])

  const fetchDashboardData = async () => {
    if (!supabase || !user) return

    setLoading(true)
    try {
      // Fetch current/active shipment
      const { data: shipments, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['Pending', 'Paid', 'In Transit', 'On Route'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching current order:', error)
      } else if (shipments) {
        setCurrentOrder(shipments)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 pb-20">
        <div className="flex items-center justify-center h-screen">
          <p className="text-white">Loading...</p>
        </div>
      </div>
    )
  }

  const userName = profile?.full_name || user?.email?.split('@')[0] || 'User'

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      <main className="px-4 py-4">
        {/* User Profile and Tracking Section */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-gray-400 text-sm">{getGreeting()}</p>
            <p className="text-white font-bold text-lg">{userName}</p>
            <div className="mt-2 relative">
              <input
                type="text"
                placeholder="Enter tracking number"
                className="w-full bg-gray-800 text-white placeholder-gray-500 rounded-lg px-4 py-2.5 pl-10 pr-10 border border-gray-700 focus:outline-none focus:border-orange-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    router.push(`/track?number=${e.target.value}`)
                  }
                }}
              />
              <Package size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <button
                onClick={() => toast.info('QR Scanner coming soon')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <QrCode size={18} className="text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Current Order Section */}
        {currentOrder ? (
          <div className="bg-gray-800 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">Current Order</h3>
              <button
                onClick={() => router.push(`/track?number=${currentOrder.tracking_number}`)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition"
              >
                Tracking
              </button>
            </div>
            
            <p className="text-gray-400 text-sm mb-4">ID - {currentOrder.tracking_number}</p>
            
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* From/To Section */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-gray-500 text-xs mb-1">From</p>
                <p className="text-white font-medium">{currentOrder.pickup_location?.split(',')[0] || 'Alabama'}</p>
                <p className="text-gray-400 text-xs mt-1">
                  {new Date(currentOrder.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">To</p>
                <p className="text-white font-medium">{currentOrder.drop_off_location?.split(',')[0] || 'USA'}</p>
                <p className="text-gray-400 text-xs mt-1">
                  {new Date(new Date(currentOrder.created_at).getTime() + 13 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Supplier/Dealer Section */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
              <div>
                <p className="text-gray-500 text-xs mb-2">Supplier</p>
                <p className="text-white font-medium mb-2">{currentOrder.sender_info?.name || 'Sean Parker'}</p>
                <div className="flex gap-2">
                  <button className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition">
                    <Phone size={14} className="text-white" />
                  </button>
                  <button className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition">
                    <MessageSquare size={14} className="text-white" />
                  </button>
                </div>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-2">Dealer</p>
                <p className="text-white font-medium mb-2">{currentOrder.recipient_info?.name || 'Jason Rolai'}</p>
                <div className="flex gap-2">
                  <button className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition">
                    <Phone size={14} className="text-white" />
                  </button>
                  <button className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition">
                    <MessageSquare size={14} className="text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl p-6 mb-4 text-center">
            <Package size={48} className="mx-auto text-gray-600 mb-3" />
            <p className="text-gray-400 mb-4">No active orders</p>
            <button
              onClick={() => router.push('/create-shipment')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition"
            >
              Create Shipment
            </button>
          </div>
        )}

        {/* Available Cargos Section */}
        <div className="bg-gray-800 rounded-xl p-4 mb-4 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-bold">Available Cargos</h3>
            <ChevronRight size={20} className="text-gray-400" />
          </div>
          <div className="mb-3">
            <p className="text-white font-medium mb-1">New Truck</p>
            <p className="text-gray-400 text-sm mb-2">Optimums Prime</p>
            <div className="flex items-center gap-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs">Per day</p>
                <p className="text-orange-500 font-semibold">$40.00</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Weight</p>
                <p className="text-white font-semibold">10 Ton</p>
              </div>
            </div>
          </div>
          <div className="h-32 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
            <div className="text-center">
              <Package size={48} className="text-orange-500 mx-auto mb-2" />
              <p className="text-gray-400 text-xs">Truck Image</p>
            </div>
          </div>
        </div>

        {/* Available City and Recent Delivery Row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Available City */}
          <div className="bg-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold text-sm">Available City</h3>
              <ChevronRight size={16} className="text-gray-400" />
            </div>
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-bold">
                TN
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                UK
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                IS
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                <span className="text-white text-lg">+</span>
              </div>
            </div>
          </div>

          {/* Recent Delivery */}
          <div className="bg-orange-500 rounded-xl p-4 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold text-sm">Recent Delivery</h3>
              <ChevronRight size={16} className="text-white" />
            </div>
            <div className="flex items-center justify-center h-20">
              <div className="bg-white/20 rounded-lg p-3">
                <Package size={32} className="text-white" />
              </div>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}

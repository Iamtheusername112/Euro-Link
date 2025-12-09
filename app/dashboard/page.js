'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Package, Phone, MessageSquare, ChevronRight, QrCode } from '@/components/icons'
import BottomNav from '@/components/layout/BottomNav'
import Header from '@/components/layout/Header'
import NotificationBell from '@/components/ui/NotificationBell'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/utils/toast'

export default function UserDashboard() {
  const router = useRouter()
  const { user, profile, loading: authLoading, signOut } = useAuth()
  const [currentOrder, setCurrentOrder] = useState(null)
  const [recentDeliveries, setRecentDeliveries] = useState([])
  const [availableCities, setAvailableCities] = useState([])
  const [loading, setLoading] = useState(true)
  const hasRedirected = useRef(false)

  useEffect(() => {
    if (authLoading) return // Wait for auth to load
    
    if (!user) {
      if (!hasRedirected.current) {
        hasRedirected.current = true
        // Use window.location for hard redirect to prevent loops
        window.location.replace('/auth/login')
      }
      return
    }
    
    // User is authenticated, fetch data
    fetchDashboardData()
  }, [user, authLoading]) // Removed router from dependencies

  // Set up real-time subscription for status updates
  useEffect(() => {
    if (!supabase || !user || authLoading) return

    console.log('Setting up real-time subscription for user shipments:', user.id)

    const channel = supabase
      .channel('shipment-status-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shipments',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Shipment update received:', payload.new)
          console.log('Previous status:', payload.old?.status, 'New status:', payload.new.status)
          
          // Always refresh dashboard data to get latest current order (without loading spinner)
          fetchDashboardData(false)
          
          // Show toast notification
          toast.success(`Status updated: ${payload.new.status}`)
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to shipment updates')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Channel subscription error')
        } else if (status === 'TIMED_OUT') {
          console.error('Channel subscription timed out')
        } else if (status === 'CLOSED') {
          console.warn('Channel closed')
        }
      })

    return () => {
      console.log('Cleaning up subscription')
      supabase.removeChannel(channel)
    }
  }, [user, supabase, authLoading])

  const fetchDashboardData = async (showLoading = true) => {
    if (!supabase || !user) return

    if (showLoading) {
      setLoading(true)
    }
    try {
      // Fetch current/active shipment
      const { data: activeShipment, error: activeError } = await supabase
        .from('shipments')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['Pending', 'Paid', 'In Transit', 'On Route', 'Out for Delivery'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (activeError && activeError.code !== 'PGRST116') {
        console.error('Error fetching current order:', activeError)
      } else if (activeShipment) {
        console.log('Setting current order:', activeShipment.status)
        setCurrentOrder(activeShipment)
      } else {
        setCurrentOrder(null)
      }

      // Fetch recent deliveries (last 3 delivered shipments)
      const { data: deliveries, error: deliveriesError } = await supabase
        .from('shipments')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'Delivered')
        .order('updated_at', { ascending: false })
        .limit(3)

      if (!deliveriesError && deliveries) {
        setRecentDeliveries(deliveries)
      }

      // Fetch available cities from all user shipments
      const { data: allShipments, error: citiesError } = await supabase
        .from('shipments')
        .select('pickup_location, drop_off_location')
        .eq('user_id', user.id)

      if (!citiesError && allShipments) {
        // Extract unique cities from pickup and drop-off locations
        const citiesSet = new Set()
        allShipments.forEach(shipment => {
          if (shipment.pickup_location) {
            const city = shipment.pickup_location.split(',')[0]?.trim()
            if (city) citiesSet.add(city)
          }
          if (shipment.drop_off_location) {
            const city = shipment.drop_off_location.split(',')[0]?.trim()
            if (city) citiesSet.add(city)
          }
        })
        
        // Convert to array and get first 3 with abbreviations
        const citiesArray = Array.from(citiesSet).slice(0, 3).map(city => {
          // Get first 2 letters as abbreviation
          const abbrev = city.substring(0, 2).toUpperCase()
          return { name: city, abbrev }
        })
        setAvailableCities(citiesArray)
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
      {/* Header with Notifications */}
      <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-orange-400">Euro-Link</h1>
          <NotificationBell />
        </div>
      </div>
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
            
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-400 text-sm">ID - {currentOrder.tracking_number}</p>
              {/* Status Badge - Updates in real-time */}
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                currentOrder.status === 'Delivered' ? 'bg-green-500/20 text-green-400' :
                currentOrder.status === 'In Transit' || currentOrder.status === 'On Route' ? 'bg-blue-500/20 text-blue-400' :
                currentOrder.status === 'Out for Delivery' ? 'bg-purple-500/20 text-purple-400' :
                'bg-yellow-500/20 text-yellow-400'
              }`}>
                {currentOrder.status}
              </span>
            </div>
            
            {/* Progress Bar - Updates based on status */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {(currentOrder.status === 'Pending' || currentOrder.status === 'Paid' || 
                    currentOrder.status === 'In Transit' || currentOrder.status === 'On Route' || 
                    currentOrder.status === 'Out for Delivery' || currentOrder.status === 'Delivered') && (
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  )}
                  {(currentOrder.status === 'In Transit' || currentOrder.status === 'On Route' || 
                    currentOrder.status === 'Out for Delivery' || currentOrder.status === 'Delivered') && (
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  )}
                  {(currentOrder.status === 'Delivered') && (
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  )}
                  {currentOrder.status !== 'Delivered' && (
                    <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                  )}
                </div>
              </div>
            </div>

            {/* From/To Section */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-gray-500 text-xs mb-1">From</p>
                <p className="text-white font-medium">
                  {currentOrder.pickup_location?.split(',')[0] || currentOrder.pickup_location || 'N/A'}
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  {new Date(currentOrder.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">To</p>
                <p className="text-white font-medium">
                  {currentOrder.drop_off_location?.split(',')[0] || currentOrder.drop_off_location || 'N/A'}
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  {currentOrder.updated_at && currentOrder.status === 'Delivered' 
                    ? new Date(currentOrder.updated_at).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })
                    : 'In transit'}
                </p>
              </div>
            </div>

            {/* Supplier/Dealer Section */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
              <div>
                <p className="text-gray-500 text-xs mb-2">Sender</p>
                <p className="text-white font-medium mb-2">
                  {currentOrder.sender_info?.name || profile?.full_name || 'N/A'}
                </p>
                <div className="flex gap-2">
                  {currentOrder.sender_info?.phone && (
                    <a 
                      href={`tel:${currentOrder.sender_info.phone}`}
                      className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition"
                    >
                      <Phone size={14} className="text-white" />
                    </a>
                  )}
                  {currentOrder.sender_info?.email && (
                    <a 
                      href={`mailto:${currentOrder.sender_info.email}`}
                      className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition"
                    >
                      <MessageSquare size={14} className="text-white" />
                    </a>
                  )}
                </div>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-2">Recipient</p>
                <p className="text-white font-medium mb-2">
                  {currentOrder.recipient_info?.name || 'N/A'}
                </p>
                <div className="flex gap-2">
                  {currentOrder.recipient_info?.phone && (
                    <a 
                      href={`tel:${currentOrder.recipient_info.phone}`}
                      className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition"
                    >
                      <Phone size={14} className="text-white" />
                    </a>
                  )}
                  {currentOrder.recipient_info?.email && (
                    <a 
                      href={`mailto:${currentOrder.recipient_info.email}`}
                      className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition"
                    >
                      <MessageSquare size={14} className="text-white" />
                    </a>
                  )}
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

        {/* Package Stats Section */}
        <div className="bg-gray-800 rounded-xl p-4 mb-4 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-bold">Package Stats</h3>
            <ChevronRight size={20} className="text-gray-400" />
          </div>
          <div className="mb-3">
            {currentOrder ? (
              <>
                <p className="text-white font-medium mb-1">Current Package</p>
                <p className="text-gray-400 text-sm mb-2">{currentOrder.package_size || 'Standard'}</p>
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Cost</p>
                    <p className="text-orange-500 font-semibold">€{parseFloat(currentOrder.cost || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Type</p>
                    <p className="text-white font-semibold">{currentOrder.delivery_type || 'Normal'}</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="text-white font-medium mb-1">No Active Package</p>
                <p className="text-gray-400 text-sm mb-2">Create your first shipment</p>
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Total Shipments</p>
                    <p className="text-orange-500 font-semibold">0</p>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="h-32 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
            <div className="text-center">
              <Package size={48} className="text-orange-500 mx-auto mb-2" />
              <p className="text-gray-400 text-xs">{currentOrder ? 'Active Package' : 'No Package'}</p>
            </div>
          </div>
        </div>

        {/* Available City and Recent Delivery Row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Available City */}
          <div className="bg-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold text-sm">Cities</h3>
              <ChevronRight size={16} className="text-gray-400" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {availableCities.length > 0 ? (
                availableCities.map((city, index) => {
                  const colors = ['bg-red-600', 'bg-blue-600', 'bg-blue-500']
                  return (
                    <div 
                      key={index}
                      className={`w-8 h-8 rounded-full ${colors[index % colors.length]} flex items-center justify-center text-white text-xs font-bold`}
                      title={city.name}
                    >
                      {city.abbrev}
                    </div>
                  )
                })
              ) : (
                <p className="text-gray-400 text-xs">No cities yet</p>
              )}
            </div>
          </div>

          {/* Recent Delivery */}
          <div 
            className="bg-orange-500 rounded-xl p-4 relative overflow-hidden cursor-pointer hover:bg-orange-600 transition"
            onClick={() => recentDeliveries.length > 0 && router.push('/history')}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold text-sm">Recent Delivery</h3>
              <ChevronRight size={16} className="text-white" />
            </div>
            <div className="flex items-center justify-center h-20">
              {recentDeliveries.length > 0 ? (
                <div className="text-center">
                  <div className="bg-white/20 rounded-lg p-3 inline-block mb-1">
                    <Package size={32} className="text-white" />
                  </div>
                  <p className="text-white text-xs font-medium">{recentDeliveries.length} delivered</p>
                </div>
              ) : (
                <div className="bg-white/20 rounded-lg p-3">
                  <Package size={32} className="text-white" />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}

'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Circle, Package } from '@/components/icons'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/utils/toast'
import { useAuth } from '@/contexts/AuthContext'

function TrackContent() {
  const router = useRouter()
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const trackingNumber = searchParams.get('number') || ''
  const [shipment, setShipment] = useState(null)
  const [statusHistory, setStatusHistory] = useState([])
  const [loading, setLoading] = useState(true)

  // Define fetchStatusHistory first using useCallback
  const fetchStatusHistory = useCallback(async (shipmentId) => {
    if (!supabase || !shipmentId) return

    try {
      const { data, error } = await supabase
        .from('shipment_status_history')
        .select('*')
        .eq('shipment_id', shipmentId)
        .order('timestamp', { ascending: true })

      if (error) {
        console.error('Error fetching status history:', error)
      } else {
        setStatusHistory(data || [])
      }
    } catch (error) {
      console.error('Error fetching status history:', error)
    }
  }, [])

  const fetchShipmentData = async () => {
    if (!trackingNumber) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // Use API route for public tracking (bypasses RLS)
      const response = await fetch(`/api/shipments?number=${encodeURIComponent(trackingNumber.trim())}`)
      const result = await response.json()

      if (!response.ok) {
        console.error('Error fetching shipment:', result)
        if (response.status === 404) {
          toast.error('Shipment not found. Please check your tracking number.')
        } else {
          toast.error(result.error || 'Failed to load shipment')
        }
        setShipment(null)
      } else {
        setShipment(result)
        // Fetch status history separately if not included
        if (result.id && (!result.shipment_status_history || result.shipment_status_history.length === 0)) {
          fetchStatusHistory(result.id)
        } else if (result.shipment_status_history) {
          setStatusHistory(result.shipment_status_history)
        }
      }
    } catch (error) {
      console.error('Error fetching shipment:', error)
      toast.error('Failed to load shipment. Please try again.')
      setShipment(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (trackingNumber) {
      fetchShipmentData()
    } else {
      setLoading(false)
    }
  }, [trackingNumber])

  // Set up real-time subscription for status updates
  useEffect(() => {
    if (!supabase || !shipment?.id) return

    console.log('Setting up real-time subscription for shipment:', shipment.id)

    const channel = supabase
      .channel(`shipment-${shipment.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shipments',
          filter: `id=eq.${shipment.id}`,
        },
        (payload) => {
          console.log('Shipment update received:', payload.new)
          setShipment(payload.new)
          toast.success(`Status updated: ${payload.new.status}`)
          // Refresh status history
          fetchStatusHistory(payload.new.id)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shipment_status_history',
          filter: `shipment_id=eq.${shipment.id}`,
        },
        () => {
          console.log('Status history update received')
          fetchStatusHistory(shipment.id)
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to shipment updates')
        }
      })

    return () => {
      console.log('Cleaning up subscription')
      supabase.removeChannel(channel)
    }
  }, [shipment?.id, fetchStatusHistory])

  // Fetch status history when shipment is loaded
  useEffect(() => {
    if (shipment?.id) {
      fetchStatusHistory(shipment.id)
    }
  }, [shipment?.id, fetchStatusHistory])

  // Build status timeline from history and current status
  const getStatusTimeline = () => {
    if (!shipment) return []

    const statusOrder = [
      'Pending',
      'Paid',
      'In Transit',
      'On Route',
      'Out for Delivery',
      'Delivered'
    ]

    const timeline = []
    const currentStatusIndex = statusOrder.indexOf(shipment.status)

    statusOrder.forEach((status, index) => {
      const historyEntry = statusHistory.find(h => h.status === status)
      const isCompleted = index <= currentStatusIndex
      
      timeline.push({
        status: status,
        completed: isCompleted,
        date: historyEntry 
          ? new Date(historyEntry.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })
          : isCompleted 
            ? new Date(shipment.updated_at || shipment.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })
            : '',
        time: historyEntry
          ? new Date(historyEntry.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
          : isCompleted
            ? new Date(shipment.updated_at || shipment.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
            : '',
        location: historyEntry?.location || '',
      })
    })

    return timeline.filter(item => item.completed || item.status === shipment.status)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <Header title="Track your pack" showBack={true} />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (!shipment && trackingNumber) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <Header title="Track your pack" showBack={true} />
        <div className="px-4 py-6 max-w-md mx-auto">
          <div className="bg-white rounded-lg p-6 shadow-sm text-center">
            <p className="text-gray-600 mb-4">Shipment not found</p>
            <p className="text-sm text-gray-500 mb-4">
              No shipment found with tracking number: <span className="font-mono font-medium">{trackingNumber}</span>
            </p>
            <button
              onClick={() => router.push('/')}
              className="text-orange-600 hover:text-orange-700 text-sm font-medium"
            >
              Go back to home
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!trackingNumber) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <Header title="Track your pack" showBack={true} />
        <div className="px-4 py-6 max-w-md mx-auto">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Track Your Package</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.target)
                const number = formData.get('trackingNumber')
                if (number) {
                  router.push(`/track?number=${encodeURIComponent(number.trim())}`)
                }
              }}
              className="space-y-4"
            >
              <div>
                <label htmlFor="trackingNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Tracking Number
                </label>
                <input
                  type="text"
                  id="trackingNumber"
                  name="trackingNumber"
                  placeholder="e.g., EU-1234567890123"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium transition"
              >
                Track Package
              </button>
            </form>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Don't have an account? <button onClick={() => router.push('/')} className="text-orange-600 hover:text-orange-700 font-medium">Go to home</button>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const statusTimeline = getStatusTimeline()

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="Track your pack" showBack={true} />
      
      <main className="px-4 py-6 max-w-md mx-auto">
        {/* Map placeholder */}
        <div className="bg-gray-200 rounded-lg h-48 mb-4 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400"></div>
          <div className="relative z-10 text-center">
            <div className="w-16 h-16 bg-red-500 rounded-full mx-auto mb-2 flex items-center justify-center">
              <Package size={24} className="text-white" />
            </div>
            <p className="text-xs text-gray-600">Map View</p>
          </div>
          {/* Real location data */}
          {shipment.pickup_location && (
            <div className="absolute top-2 left-2 text-xs text-gray-500 bg-white/70 px-2 py-1 rounded">
              {shipment.pickup_location.split(',')[0]}
            </div>
          )}
          {shipment.drop_off_location && (
            <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white/70 px-2 py-1 rounded">
              {shipment.drop_off_location.split(',')[0]}
            </div>
          )}
        </div>

        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-1">Tracking number</p>
          <p className="text-sm font-semibold text-gray-800">{shipment.tracking_number}</p>
        </div>

        {/* Current Status Badge */}
        <div className="mb-4">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
            shipment.status === 'Delivered' ? 'bg-green-100 text-green-800' :
            shipment.status === 'In Transit' || shipment.status === 'On Route' ? 'bg-blue-100 text-blue-800' :
            shipment.status === 'Out for Delivery' ? 'bg-purple-100 text-purple-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            <Package size={16} />
            <span>Current Status: {shipment.status}</span>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Package status</h3>
          <div className="space-y-4">
            {statusTimeline.length > 0 ? (
              statusTimeline.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex flex-col items-center pt-1">
                    {item.completed ? (
                      <CheckCircle2 size={20} className="text-green-500" />
                    ) : (
                      <Circle size={20} className="text-gray-300" />
                    )}
                    {index < statusTimeline.length - 1 && (
                      <div className={`w-0.5 h-8 mt-1 ${item.completed ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${item.completed ? 'text-gray-800' : 'text-gray-400'}`}>
                      {item.status}
                    </p>
                    {item.date && (
                      <p className="text-xs text-gray-500 mt-1">
                        {item.date} {item.time && `• ${item.time}`}
                      </p>
                    )}
                    {item.location && (
                      <p className="text-xs text-gray-400 mt-1">{item.location}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No status history available</p>
                <p className="text-xs mt-1">Status updates will appear here</p>
              </div>
            )}
          </div>
        </div>

        {user && (
          <button className="w-full bg-pink-500 hover:bg-pink-600 text-white py-3 rounded-lg font-medium transition">
            View pack
          </button>
        )}
      </main>

      {user && <BottomNav />}
    </div>
  )
}

export default function TrackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 pb-20">
        <Header title="Track your pack" showBack={true} />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    }>
      <TrackContent />
    </Suspense>
  )
}


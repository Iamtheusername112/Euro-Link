'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'
import { CheckCircle2, Circle, Package } from '@/components/icons'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/utils/toast'

function TrackContent() {
  const searchParams = useSearchParams()
  const trackingNumber = searchParams.get('number') || ''
  const [shipment, setShipment] = useState(null)
  const [statusHistory, setStatusHistory] = useState([])
  const [loading, setLoading] = useState(true)

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

  const fetchShipmentData = async () => {
    if (!supabase || !trackingNumber) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('tracking_number', trackingNumber)
        .single()

      if (error) {
        console.error('Error fetching shipment:', error)
        toast.error('Shipment not found')
      } else {
        setShipment(data)
      }
    } catch (error) {
      console.error('Error fetching shipment:', error)
      toast.error('Failed to load shipment')
    } finally {
      setLoading(false)
    }
  }

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

  if (!shipment) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <Header title="Track your pack" showBack={true} />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Shipment not found</p>
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
          {/* Mock street names */}
          <div className="absolute top-2 left-2 text-xs text-gray-500">Front Street</div>
          <div className="absolute bottom-2 right-2 text-xs text-gray-500">Canterbury Drive</div>
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

        <button className="w-full bg-pink-500 hover:bg-pink-600 text-white py-3 rounded-lg font-medium transition">
          View pack
        </button>
      </main>

      <BottomNav />
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


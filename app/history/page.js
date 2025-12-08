'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'
import ShipmentCard from '@/components/ui/ShipmentCard'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/utils/toast'

export default function HistoryPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [shipments, setShipments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && supabase) {
      fetchShipments()
      
      // Set up real-time subscription for status updates
      const channel = supabase
        .channel('user-shipments-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'shipments',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            // Update the shipment in the list
            setShipments(prevShipments => 
              prevShipments.map(shipment => 
                shipment.id === payload.new.id ? payload.new : shipment
              )
            )
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'shipments',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            // Add new shipment to the list
            setShipments(prevShipments => [payload.new, ...prevShipments])
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    } else if (!user) {
      router.push('/auth/login')
    } else {
      setLoading(false)
    }
  }, [user, router])

  const fetchShipments = async () => {
    if (!supabase || !user) {
      setLoading(false)
      return
    }
    
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching shipments:', error)
        // Check if table doesn't exist
        if (error.message?.includes('does not exist') || error.code === '42P01') {
          console.warn('Shipments table not found. Please run SETUP_DATABASE.sql in Supabase.')
          toast.error('Database not set up. Please contact administrator.')
        } else {
          toast.error('Failed to load shipment history')
        }
        setLoading(false)
        return
      }

      setShipments(data || [])
    } catch (error) {
      console.error('Error fetching shipments:', error)
      toast.error('Failed to load shipment history')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <Header title="Shipment History" showBack={true} />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="Shipment History" showBack={true} />
      
      <main className="px-4 py-6 max-w-md mx-auto">
        {shipments.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-gray-500 mb-4">No shipments yet</p>
            <button
              onClick={() => router.push('/create-shipment')}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition"
            >
              Create Your First Shipment
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {shipments.map((shipment) => (
              <div
                key={shipment.id}
                onClick={() => router.push(`/track?number=${shipment.tracking_number}`)}
                className="cursor-pointer"
              >
                <ShipmentCard
                  trackingNumber={shipment.tracking_number}
                  status={shipment.status}
                  location={shipment.pickup_location?.split(',')[0] || 'N/A'}
                  date={new Date(shipment.created_at).toLocaleDateString()}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}


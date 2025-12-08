'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'
import { Bell, Package, CheckCircle2 } from '@/components/icons'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/utils/toast'

export default function NotificationsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && supabase) {
      fetchNotifications()
      
      // Set up real-time subscription for notifications
      const channel = supabase
        .channel('notifications-page-updates')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('New notification received:', payload.new)
            setNotifications(prev => [payload.new, ...prev])
            toast.success('New notification received')
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('Notification updated:', payload.new)
            setNotifications(prev => 
              prev.map(n => n.id === payload.new.id ? payload.new : n)
            )
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    } else if (!user) {
      router.push('/auth/login')
    }
  }, [user, router])

  const fetchNotifications = async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/notifications?userId=${user.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }
      const data = await response.json()
      // Ensure data is an array
      setNotifications(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast.error('Failed to load notifications')
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      })
      fetchNotifications()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!user) return

    try {
      await fetch(`/api/notifications/mark-all-read?userId=${user.id}`, {
        method: 'POST',
      })
      fetchNotifications()
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('Failed to mark all as read')
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <Header title="Notifications" showBack={true} />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="Notifications" showBack={true} />
      
      <main className="px-4 py-6 max-w-md mx-auto">
        {notifications.length > 0 && unreadCount > 0 && (
          <div className="mb-4 flex justify-end">
            <button
              onClick={markAllAsRead}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Mark all as read
            </button>
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <Bell size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => {
                  if (!notification.read) markAsRead(notification.id)
                  if (notification.shipment_id) {
                    // Get tracking number and navigate
                    router.push(`/track?number=${notification.shipment_id}`)
                  }
                }}
                className={`bg-white rounded-lg p-4 shadow-sm cursor-pointer transition ${
                  !notification.read ? 'border-l-4 border-blue-500 bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {notification.type === 'status_update' && <Package size={16} className="text-blue-500" />}
                      {notification.type === 'delivered' && <CheckCircle2 size={16} className="text-green-500" />}
                      <p className="font-semibold text-gray-800">{notification.title}</p>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}


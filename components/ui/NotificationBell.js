'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from '@/components/icons'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/lib/utils/toast'

export default function NotificationBell() {
  const router = useRouter()
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    if (user && supabase) {
      fetchNotifications()
      
      // Set up real-time subscription for notifications
      const channel = supabase
        .channel('notifications-updates')
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
            fetchNotifications()
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
          () => {
            console.log('Notification updated')
            fetchNotifications()
          }
        )
        .subscribe((status) => {
          console.log('Notification subscription status:', status)
        })

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user])

  const fetchNotifications = async () => {
    if (!user || !supabase) return

    try {
      // Fetch unread count
      try {
        const response = await fetch(`/api/notifications?userId=${user.id}&unreadOnly=true`)
        if (response.ok) {
          const data = await response.json()
          // Check if response is an error object
          if (data && typeof data === 'object' && !Array.isArray(data) && 'error' in data) {
            console.warn('API returned error:', data.error)
            setUnreadCount(0)
          } else {
            // Ensure data is an array
            const unreadData = Array.isArray(data) ? data : []
            setUnreadCount(unreadData.length || 0)
          }
        } else {
          setUnreadCount(0)
        }
      } catch (err) {
        console.warn('Failed to fetch unread notifications:', err)
        setUnreadCount(0)
      }
      
      // Fetch recent notifications for dropdown
      let notificationsArray = []
      try {
        const allResponse = await fetch(`/api/notifications?userId=${user.id}`)
        if (allResponse.ok) {
          const allData = await allResponse.json()
          // Check if response is an error object
          if (allData && typeof allData === 'object' && !Array.isArray(allData) && 'error' in allData) {
            console.warn('API returned error:', allData.error)
            notificationsArray = []
          } else if (Array.isArray(allData)) {
            notificationsArray = allData
          } else {
            // Not an array, set to empty array
            notificationsArray = []
          }
        }
      } catch (err) {
        console.error('Error fetching all notifications:', err)
        notificationsArray = []
      }
      
      // Safely slice the array (guaranteed to be an array at this point)
      setNotifications(Array.isArray(notificationsArray) ? notificationsArray.slice(0, 5) : [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setUnreadCount(0)
      setNotifications([])
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
    try {
      await fetch(`/api/notifications/mark-all-read?userId=${user.id}`, {
        method: 'POST',
      })
      fetchNotifications()
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  if (!user) return null

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-800 transition"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50 border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-purple-600 hover:text-purple-700"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowDropdown(false)
                    router.push('/notifications')
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All
                </button>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => {
                        if (!notification.read) markAsRead(notification.id)
                        setShowDropdown(false)
                      }}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-800">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}


'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, X, Package, Users, DollarSign, Truck, TrendingUp, Clock, CheckCircle2, AlertCircle, Plus, Search, Phone, Send, User, Trash2, Mail } from '@/components/icons'
import Sidebar from '@/components/layout/Sidebar'
import { toast } from '@/lib/utils/toast'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { getStatusConfig, getStatusesInOrder } from '@/lib/statusConfig'

export default function AdminDashboard() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  
  // Dashboard Stats
  const [stats, setStats] = useState({
    totalShipments: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    activeDrivers: 0,
    pendingShipments: 0,
    inTransitShipments: 0,
    deliveredShipments: 0,
  })
  
  // Users Management
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [notificationTitle, setNotificationTitle] = useState('')
  const [notificationMessage, setNotificationMessage] = useState('')
  const [showEmailTestModal, setShowEmailTestModal] = useState(false)
  const [emailErrorDetails, setEmailErrorDetails] = useState(null)
  const [testEmailAddress, setTestEmailAddress] = useState('')
  const [testEmailLoading, setTestEmailLoading] = useState(false)
  
  // Shipments Management
  const [shipments, setShipments] = useState([])
  const [filteredShipments, setFilteredShipments] = useState([])
  const [shipmentSearchTerm, setShipmentSearchTerm] = useState('')
  const [shipmentStatusFilter, setShipmentStatusFilter] = useState('all')
  const [shipmentUserFilter, setShipmentUserFilter] = useState(null)
  const [selectedShipment, setSelectedShipment] = useState(null)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showDriverModal, setShowDriverModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showSendEmailModal, setShowSendEmailModal] = useState(false)
  const [sendEmailLoading, setSendEmailLoading] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [drivers, setDrivers] = useState([])
  const [selectedDriverId, setSelectedDriverId] = useState('')

  useEffect(() => {
    // Give AuthContext time to initialize
    if (authLoading) {
      return // Still loading, wait
    }
    
    if (!user) {
      console.log('No user found, redirecting to login')
      router.replace('/admin/login')
      return
    }
    
    console.log('User found, checking admin access...', { userId: user.id, email: user.email })
    checkAdminAccess()
  }, [user, authLoading, router])

  const checkAdminAccess = async () => {
    if (!supabase || !user) {
      console.log('checkAdminAccess: Missing supabase or user', { hasSupabase: !!supabase, hasUser: !!user })
      return
    }

    try {
      console.log('Checking admin access for user:', user.id, user.email)
      
      // First check if profile exists and get role
      const { data: userProfile, error } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .single()

      console.log('Profile check result:', { userProfile, error, errorCode: error?.code })

      if (error) {
        console.error('Error fetching profile:', error)
        
        // If profile doesn't exist, try to create it
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating admin profile...')
          const { data: newProfileData, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              full_name: user.email?.split('@')[0] || 'System Administrator',
              role: 'Admin',
            })
            .select()
            .single()
          
          console.log('Profile creation result:', { newProfileData, createError })
          
          if (createError) {
            if (createError.code === '23505') {
              // Profile already exists, fetch it
              console.log('Profile already exists, fetching...')
              const { data: existingProfile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()
              
              if (existingProfile && (existingProfile.role === 'Admin' || existingProfile.role === 'Driver')) {
                console.log('Access granted with existing profile')
                setLoading(false)
                fetchDashboardData()
                fetchUsers()
                fetchShipments()
                fetchDrivers()
                return
              }
            } else {
              console.error('Error creating profile:', createError)
              toast.error(`Failed to create admin profile: ${createError.message}`)
              router.replace('/admin/login')
              return
            }
          } else if (newProfileData && (newProfileData.role === 'Admin' || newProfileData.role === 'Driver')) {
            console.log('Access granted with newly created profile')
            setLoading(false)
            fetchDashboardData().catch(err => console.error('Error fetching dashboard data:', err))
            fetchUsers().catch(err => console.error('Error fetching users:', err))
            fetchShipments().catch(err => console.error('Error fetching shipments:', err))
            fetchDrivers().catch(err => console.error('Error fetching drivers:', err))
            return
          }
        }
        
        console.error('Profile check failed, redirecting to login')
        toast.error('Access denied. Please contact administrator.')
        router.replace('/admin/login')
        return
      }

      if (!userProfile) {
        console.error('No profile returned')
        toast.error('Profile not found. Please contact administrator.')
        router.replace('/admin/login')
        return
      }

      if (userProfile.role !== 'Admin' && userProfile.role !== 'Driver') {
        console.error('Access denied - role:', userProfile.role)
        toast.error(`Access denied. Your role is: ${userProfile.role}. Admin or Driver required.`)
        router.replace('/admin/login')
        return
      }

      console.log('✅ Access granted, loading dashboard data...', { role: userProfile.role })
      // Set loading to false FIRST so dashboard can render
      setLoading(false)
      // Then fetch data (don't await - let it load in background)
      fetchDashboardData().catch(err => console.error('Error fetching dashboard data:', err))
      fetchUsers().catch(err => console.error('Error fetching users:', err))
      fetchShipments().catch(err => console.error('Error fetching shipments:', err))
      fetchDrivers().catch(err => console.error('Error fetching drivers:', err))
      console.log('✅ Dashboard initialized, data fetching started')
    } catch (error) {
      console.error('Error checking access:', error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      })
      toast.error(`Failed to verify access: ${error.message}`)
      router.replace('/admin/login')
    }
  }

  const fetchDashboardData = async () => {
    if (!supabase) return

    try {
      const { data: shipments } = await supabase
        .from('shipments')
        .select('*')

      const { data: users } = await supabase
        .from('profiles')
        .select('*')

      const totalShipments = shipments?.length || 0
      const totalRevenue = shipments?.reduce((sum, s) => sum + (parseFloat(s.cost) || 0), 0) || 0
      const totalCustomers = users?.filter(u => u.role === 'Customer').length || 0
      const activeDrivers = users?.filter(u => u.role === 'Driver').length || 0
      const pendingShipments = shipments?.filter(s => s.status === 'Pending' || s.status === 'Paid').length || 0
      const inTransitShipments = shipments?.filter(s => s.status === 'In Transit' || s.status === 'On Route').length || 0
      const deliveredShipments = shipments?.filter(s => s.status === 'Delivered').length || 0

      setStats({
        totalShipments,
        totalRevenue,
        totalCustomers,
        activeDrivers,
        pendingShipments,
        inTransitShipments,
        deliveredShipments,
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    if (!supabase) return

    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const usersWithStats = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: shipments } = await supabase
            .from('shipments')
            .select('id')
            .eq('user_id', profile.id)

          return {
            ...profile,
            shipmentCount: shipments?.length || 0,
          }
        })
      )

      setUsers(usersWithStats)
      setFilteredUsers(usersWithStats)
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchShipments = async () => {
    if (!supabase) return

    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setShipments(data || [])
      setFilteredShipments(data || [])
    } catch (error) {
      console.error('Error fetching shipments:', error)
    }
  }

  const fetchDrivers = async () => {
    if (!supabase) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'Driver')
        .order('full_name', { ascending: true })

      if (error) throw error
      setDrivers(data || [])
    } catch (error) {
      console.error('Error fetching drivers:', error)
    }
  }

  // Filter users
  useEffect(() => {
    let filtered = [...users]

    if (userSearchTerm) {
      filtered = filtered.filter(u =>
        u.full_name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        u.phone?.toLowerCase().includes(userSearchTerm.toLowerCase())
      )
    }

    if (userRoleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === userRoleFilter)
    }

    setFilteredUsers(filtered)
  }, [userSearchTerm, userRoleFilter, users])

  // Filter shipments
  useEffect(() => {
    let filtered = [...shipments]

    if (shipmentUserFilter) {
      filtered = filtered.filter(s => s.user_id === shipmentUserFilter)
    }

    if (shipmentSearchTerm) {
      filtered = filtered.filter(s =>
        s.tracking_number?.toLowerCase().includes(shipmentSearchTerm.toLowerCase()) ||
        s.pickup_location?.toLowerCase().includes(shipmentSearchTerm.toLowerCase()) ||
        s.drop_off_location?.toLowerCase().includes(shipmentSearchTerm.toLowerCase())
      )
    }

    if (shipmentStatusFilter !== 'all') {
      filtered = filtered.filter(s => {
        if (shipmentStatusFilter === 'pending') {
          return s.status === 'Pending' || s.status === 'Paid'
        }
        if (shipmentStatusFilter === 'in-transit') {
          return s.status === 'In Transit' || s.status === 'On Route'
        }
        if (shipmentStatusFilter === 'delivered') {
          return s.status === 'Delivered'
        }
        return s.status === shipmentStatusFilter
      })
    }

    setFilteredShipments(filtered)
  }, [shipmentSearchTerm, shipmentStatusFilter, shipmentUserFilter, shipments])

  const testEmailSending = async () => {
    if (!testEmailAddress) {
      toast.error('Please enter an email address')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(testEmailAddress)) {
      toast.error('Invalid email address format')
      return
    }

    setTestEmailLoading(true)
    try {
      console.log('🧪 Testing email sending to:', testEmailAddress)
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: testEmailAddress,
          testType: 'status',
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('Test email failed:', result)
        toast.error(result.error || 'Failed to send test email', {
          duration: 5000,
        })
        // Store error details to show in modal
        setEmailErrorDetails({
          error: result.error || 'Failed to send test email',
          details: result.details,
          troubleshooting: result.troubleshooting,
        })
      } else {
        console.log('✅ Test email sent successfully:', result)
        const recipientEmail = result.shipmentData?.recipientEmail || 'recipient'
        toast.success(`Test email sent to ${recipientEmail}! Check their inbox and spam folder.`)
        setShowEmailTestModal(false)
        setTestEmailAddress('')
        setEmailErrorDetails(null) // Clear any previous errors
      }
    } catch (error) {
      console.error('Test email error:', error)
      toast.error(`Failed to send test email: ${error.message}`)
    } finally {
      setTestEmailLoading(false)
    }
  }

  const sendNotification = async () => {
    if (!notificationTitle || !notificationMessage) {
      toast.error('Please fill in title and message')
      return
    }

    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: selectedUser.id,
          type: 'admin_message',
          title: notificationTitle,
          message: notificationMessage,
        })

      if (error) throw error

      toast.success('Notification sent successfully')
      setShowNotificationModal(false)
      setNotificationTitle('')
      setNotificationMessage('')
      setSelectedUser(null)
    } catch (error) {
      console.error('Send notification error:', error)
      toast.error('Failed to send notification')
    }
  }

  const updateShipmentStatus = async () => {
    if (!newStatus || !selectedShipment) {
      console.error('Missing status or shipment:', { newStatus, selectedShipment })
      toast.error('Please select a status')
      return
    }

    console.log('Updating shipment status:', {
      shipmentId: selectedShipment.id,
      trackingNumber: selectedShipment.tracking_number,
      oldStatus: selectedShipment.status,
      newStatus: newStatus,
    })

    try {
      // Use API route to update status (handles RLS properly with service role)
      const response = await fetch('/api/shipments/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shipmentId: selectedShipment.id,
          newStatus: newStatus,
          location: 'Status updated by admin',
          notes: `Status updated from ${selectedShipment.status} to ${newStatus}`,
          adminId: user?.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Status update failed:', errorData)
        toast.error(errorData.error || 'Failed to update status')
        return
      }

      const result = await response.json()
      console.log('✅ Status update completed successfully:', result)

      // Send email notification
      try {
        const emailResponse = await fetch('/api/email/send-status-update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            shipmentId: selectedShipment.id,
            newStatus: newStatus,
          }),
        })

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json()
          console.warn('Email sending failed:', errorData)
          // Don't fail the whole operation if email fails
        } else {
          console.log('✅ Email sent successfully')
        }
      } catch (emailError) {
        console.error('Email sending error:', emailError)
        // Don't fail the whole operation if email fails
      }

      toast.success(`Status updated to ${newStatus}. User notified via app and email.`)
      setShowStatusModal(false)
      setSelectedShipment(null)
      setNewStatus('')
      
      // Refresh data
      await fetchShipments()
      await fetchDashboardData()
    } catch (error) {
      console.error('Error updating status:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })
      toast.error(`Failed to update status: ${error.message || 'Unknown error'}`)
    }
  }

  const assignDriver = async () => {
    if (!selectedDriverId || !selectedShipment) return

    try {
      const { error } = await supabase
        .from('shipments')
        .update({ 
          driver_id: selectedDriverId,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedShipment.id)

      if (error) throw error

      const driver = drivers.find(d => d.id === selectedDriverId)
      const driverName = driver?.full_name || 'Driver'

      await supabase
        .from('notifications')
        .insert({
          user_id: selectedShipment.user_id,
          shipment_id: selectedShipment.id,
          type: 'assignment',
          title: 'Driver Assigned',
          message: `Driver ${driverName} has been assigned to your shipment ${selectedShipment.tracking_number}.`,
        })

      // Send email notification
      try {
        const emailResponse = await fetch('/api/email/send-driver-assignment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            shipmentId: selectedShipment.id,
            driverId: selectedDriverId,
          }),
        })

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json()
          console.warn('Email sending failed:', errorData)
          // Don't fail the whole operation if email fails
        }
      } catch (emailError) {
        console.error('Email sending error:', emailError)
        // Don't fail the whole operation if email fails
      }

      toast.success('Driver assigned successfully. Email sent to customer.')
      setShowDriverModal(false)
      setSelectedShipment(null)
      setSelectedDriverId('')
      fetchShipments()
    } catch (error) {
      console.error('Error assigning driver:', error)
      toast.error('Failed to assign driver')
    }
  }

  const sendEmailToRecipient = async () => {
    if (!selectedShipment) return

    // Get recipient email from shipment
    let recipientEmail = null
    
    if (selectedShipment.recipient_info && typeof selectedShipment.recipient_info === 'object') {
      recipientEmail = selectedShipment.recipient_info.email
    } else if (typeof selectedShipment.recipient_info === 'string') {
      try {
        const recipientInfo = JSON.parse(selectedShipment.recipient_info)
        recipientEmail = recipientInfo.email
      } catch (e) {
        console.error('Error parsing recipient_info:', e)
      }
    }

    if (!recipientEmail) {
      toast.error('Recipient email not found for this shipment')
      setShowSendEmailModal(false)
      setSelectedShipment(null)
      return
    }

    setSendEmailLoading(true)

    try {
      const response = await fetch('/api/email/send-status-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shipmentId: selectedShipment.id,
          newStatus: selectedShipment.status || 'In Transit',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Email sending failed:', errorData)
        toast.error(errorData.error || 'Failed to send email')
        return
      }

      const result = await response.json()
      console.log('✅ Email sent successfully:', result)
      
      toast.success(`Email sent successfully to ${recipientEmail}`)
      setShowSendEmailModal(false)
      setSelectedShipment(null)
    } catch (error) {
      console.error('Error sending email:', error)
      toast.error(`Failed to send email: ${error.message || 'Unknown error'}`)
    } finally {
      setSendEmailLoading(false)
    }
  }

  const deleteShipment = async () => {
    if (!selectedShipment) return

    setDeleteLoading(true)
    try {
      // Delete related data first (cascading deletes)
      const shipmentId = selectedShipment.id

      // Delete status history
      await supabase
        .from('shipment_status_history')
        .delete()
        .eq('shipment_id', shipmentId)

      // Delete notifications related to this shipment
      await supabase
        .from('notifications')
        .delete()
        .eq('shipment_id', shipmentId)

      // Delete the shipment itself
      const { error } = await supabase
        .from('shipments')
        .delete()
        .eq('id', shipmentId)

      if (error) throw error

      toast.success(`Shipment ${selectedShipment.tracking_number} deleted successfully`)
      setShowDeleteModal(false)
      setSelectedShipment(null)
      
      // Refresh data
      await fetchShipments()
      await fetchDashboardData()
    } catch (error) {
      console.error('Error deleting shipment:', error)
      toast.error(`Failed to delete shipment: ${error.message || 'Unknown error'}`)
    } finally {
      setDeleteLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-800'
      case 'In Transit':
      case 'On Route':
        return 'bg-blue-100 text-blue-800'
      case 'Pending':
      case 'Paid':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-100 text-purple-800'
      case 'Driver':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Show loading only if auth is still loading OR if we're actively checking access
  // Don't show loading if user exists but we're just fetching data
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Authenticating...</p>
        </div>
      </div>
    )
  }

  // If no user after auth loading is done, show redirecting message
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // If still checking access, show loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Verifying access...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-600 hover:text-gray-800"
              >
                <Menu size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
                <p className="text-sm text-gray-600">Welcome back, {profile?.full_name || 'Admin'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowEmailTestModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2"
                title="Test email configuration"
              >
                📧 Test Email
              </button>
              <button
                onClick={() => router.push('/create-shipment')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2"
              >
                <Plus size={20} />
                Create Shipment
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 px-6">
          <div className="flex gap-1">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'users', label: 'Users' },
              { id: 'shipments', label: 'Shipments' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-medium transition border-b-2 ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between mb-2">
                    <Package size={24} className="text-blue-500" />
                    <span className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded">Total</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-800">{stats.totalShipments}</p>
                  <p className="text-sm text-gray-600 mt-1">Total Shipments</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign size={24} className="text-green-500" />
                    <span className="text-xs text-gray-500 bg-green-50 px-2 py-1 rounded">Revenue</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-800">€{stats.totalRevenue.toFixed(2)}</p>
                  <p className="text-sm text-gray-600 mt-1">Total Revenue</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
                  <div className="flex items-center justify-between mb-2">
                    <Users size={24} className="text-purple-500" />
                    <span className="text-xs text-gray-500 bg-purple-50 px-2 py-1 rounded">Users</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-800">{stats.totalCustomers}</p>
                  <p className="text-sm text-gray-600 mt-1">Total Customers</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-orange-500">
                  <div className="flex items-center justify-between mb-2">
                    <Truck size={24} className="text-orange-500" />
                    <span className="text-xs text-gray-500 bg-orange-50 px-2 py-1 rounded">Drivers</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-800">{stats.activeDrivers}</p>
                  <p className="text-sm text-gray-600 mt-1">Active Drivers</p>
                </div>
              </div>

              {/* Status Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <Clock size={24} className="text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-800">{stats.pendingShipments}</p>
                        <p className="text-sm text-gray-600">Pending</p>
                      </div>
                    </div>
                    <TrendingUp size={20} className="text-yellow-500" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Truck size={24} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-800">{stats.inTransitShipments}</p>
                        <p className="text-sm text-gray-600">In Transit</p>
                      </div>
                    </div>
                    <TrendingUp size={20} className="text-blue-500" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <CheckCircle2 size={24} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-800">{stats.deliveredShipments}</p>
                        <p className="text-sm text-gray-600">Delivered</p>
                      </div>
                    </div>
                    <TrendingUp size={20} className="text-green-500" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      placeholder="Search by name, email, phone..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    {['all', 'Customer', 'Driver', 'Admin'].map((role) => (
                      <button
                        key={role}
                        onClick={() => setUserRoleFilter(role)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                          userRoleFilter === role
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {role === 'all' ? 'All' : role}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shipments</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center">
                                  <span className="text-white font-semibold text-sm">
                                    {user.full_name?.charAt(0) || 'U'}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{user.full_name || 'No name'}</p>
                                  <p className="text-xs text-gray-500">{user.email || 'N/A'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">
                                {user.phone ? (
                                  <div className="flex items-center gap-2">
                                    <Phone size={14} className="text-gray-400" />
                                    <span>{user.phone}</span>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">N/A</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Package size={16} className="text-gray-400" />
                                <span className="text-sm text-gray-900">{user.shipmentCount}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setActiveTab('shipments')
                                    setShipmentUserFilter(user.id)
                                    setShipmentSearchTerm('')
                                  }}
                                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                >
                                  View
                                </button>
                                {user.role === 'Customer' && (
                                  <button
                                    onClick={() => {
                                      setSelectedUser(user)
                                      setShowNotificationModal(true)
                                    }}
                                    className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                                  >
                                    Notify
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                            No users found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Shipments Tab */}
          {activeTab === 'shipments' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={shipmentSearchTerm}
                      onChange={(e) => {
                        setShipmentSearchTerm(e.target.value)
                        setShipmentUserFilter(null)
                      }}
                      placeholder="Search by tracking number, location..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    {['all', 'pending', 'in-transit', 'delivered'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setShipmentStatusFilter(status)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                          shipmentStatusFilter === status
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {status === 'all' ? 'All' : status === 'in-transit' ? 'In Transit' : status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                  {shipmentUserFilter && (
                    <button
                      onClick={() => setShipmentUserFilter(null)}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition"
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
              </div>

              {/* Shipments Table */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tracking</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredShipments.length > 0 ? (
                        filteredShipments.map((shipment) => (
                          <tr key={shipment.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-gray-900">{shipment.tracking_number}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <User size={16} className="text-gray-400" />
                                <span className="text-sm text-gray-900">
                                  {shipment.sender_info?.name || 'N/A'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-900">
                                {shipment.pickup_location?.split(',')[0] || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-900">
                                {shipment.drop_off_location?.split(',')[0] || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(shipment.status)}`}>
                                {shipment.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              €{parseFloat(shipment.cost || 0).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(shipment.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => router.push(`/track?number=${shipment.tracking_number}`)}
                                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedShipment(shipment)
                                    setNewStatus(shipment.status)
                                    setShowStatusModal(true)
                                  }}
                                  className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                                >
                                  Status
                                </button>
                                {!shipment.driver_id && (
                                  <button
                                    onClick={() => {
                                      setSelectedShipment(shipment)
                                      setShowDriverModal(true)
                                    }}
                                    className="text-green-600 hover:text-green-700 text-sm font-medium"
                                  >
                                    Assign
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setSelectedShipment(shipment)
                                    setShowSendEmailModal(true)
                                  }}
                                  className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center gap-1"
                                  title="Send email to recipient"
                                  disabled={sendEmailLoading}
                                >
                                  <Mail size={16} />
                                  Email
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedShipment(shipment)
                                    setShowDeleteModal(true)
                                  }}
                                  className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                                  title="Delete shipment"
                                >
                                  <Trash2 size={16} />
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                            No shipments found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && selectedShipment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Update Shipment Status</h3>
            <p className="text-sm text-gray-600 mb-4">
              Tracking: <span className="font-medium">{selectedShipment.tracking_number}</span>
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select a status</option>
                  <option value="Pending">⏳ Pending - Order Processing</option>
                  <option value="Paid">✅ Paid - Payment Confirmed</option>
                  <option value="Processing">📦 Processing - Preparing for Pickup</option>
                  <option value="Picked Up">📥 Picked Up - Collected from Sender</option>
                  <option value="In Transit">🚚 In Transit - On the Way</option>
                  <option value="On Route">🚛 On Route - Approaching Destination</option>
                  <option value="Out for Delivery">📦 Out for Delivery - Arriving Soon</option>
                  <option value="Delivered">🎉 Delivered - Successfully Delivered</option>
                  <option value="Cancelled">❌ Cancelled</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowStatusModal(false)
                  setSelectedShipment(null)
                  setNewStatus('')
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={updateShipmentStatus}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium transition"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Driver Assignment Modal */}
      {showDriverModal && selectedShipment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Assign Driver</h3>
            <p className="text-sm text-gray-600 mb-4">
              Tracking: <span className="font-medium">{selectedShipment.tracking_number}</span>
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Driver
                </label>
                {drivers.length > 0 ? (
                  <select
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select a driver</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.full_name || driver.email}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-gray-500">No drivers available</p>
                )}
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowDriverModal(false)
                  setSelectedShipment(null)
                  setSelectedDriverId('')
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={assignDriver}
                disabled={!selectedDriverId}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-2 rounded-lg font-medium transition"
              >
                Assign Driver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotificationModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Send Notification</h3>
            <p className="text-sm text-gray-600 mb-4">
              To: <span className="font-medium">{selectedUser.full_name || 'User'}</span>
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Notification title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Notification message"
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowNotificationModal(false)
                  setSelectedUser(null)
                  setNotificationTitle('')
                  setNotificationMessage('')
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={sendNotification}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium transition"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Test Modal */}
      {showEmailTestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">🧪 Test Email Sending</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will send a test email using real shipment data. The email will be sent to the recipient email address from the most recent shipment.
            </p>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800 font-medium mb-1">How it works:</p>
                <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                  <li>Fetches the most recent shipment from the database</li>
                  <li>Uses the recipient email address from that shipment</li>
                  <li>Sends email with real tracking number and shipment details</li>
                  <li>Perfect for testing the actual email flow</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800 font-medium mb-1">What will be tested:</p>
                <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                  <li>Email service configuration</li>
                  <li>Gmail SMTP connection</li>
                  <li>Email template rendering</li>
                  <li>Email delivery</li>
                </ul>
              </div>

              {/* Error Details */}
              {emailErrorDetails && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-red-600 text-lg">⚠️</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-800 mb-1">
                        {emailErrorDetails.error}
                      </p>
                      {emailErrorDetails.details && (
                        <p className="text-xs text-red-700 mb-3 font-mono break-all">
                          {emailErrorDetails.details}
                        </p>
                      )}
                      {emailErrorDetails.troubleshooting && (
                        <div className="mt-3">
                          <p className="text-xs font-semibold text-red-800 mb-2">
                            {emailErrorDetails.troubleshooting.issue || 'Troubleshooting:'}
                          </p>
                          {emailErrorDetails.troubleshooting.solutions && (
                            <ol className="text-xs text-red-700 space-y-1.5 list-decimal list-inside">
                              {emailErrorDetails.troubleshooting.solutions.map((solution, idx) => (
                                <li key={idx}>{solution}</li>
                              ))}
                            </ol>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-red-200">
                    <a
                      href="https://myaccount.google.com/apppasswords"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-red-600 hover:text-red-800 underline"
                    >
                      🔗 Generate Gmail App Password →
                    </a>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowEmailTestModal(false)
                  setTestEmailAddress('')
                  setEmailErrorDetails(null)
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium transition"
              >
                {emailErrorDetails ? 'Close' : 'Cancel'}
              </button>
              <button
                onClick={testEmailSending}
                disabled={testEmailLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-2 rounded-lg font-medium transition"
              >
                {testEmailLoading ? 'Sending...' : 'Send Test Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedShipment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 size={24} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Shipment</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-700 mb-2">
                Are you sure you want to delete this shipment?
              </p>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-sm font-medium text-gray-900">
                  Tracking Number: <span className="font-mono">{selectedShipment.tracking_number}</span>
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  From: {selectedShipment.pickup_location?.split(',')[0] || 'N/A'}
                </p>
                <p className="text-xs text-gray-600">
                  To: {selectedShipment.drop_off_location?.split(',')[0] || 'N/A'}
                </p>
                <p className="text-xs text-gray-600">
                  Status: <span className="font-medium">{selectedShipment.status}</span>
                </p>
              </div>
              <p className="text-xs text-red-600 mt-3">
                ⚠️ This will also delete all related status history and notifications.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedShipment(null)
                }}
                disabled={deleteLoading}
                className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 py-2 rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={deleteShipment}
                disabled={deleteLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-2 rounded-lg font-medium transition flex items-center justify-center gap-2"
              >
                {deleteLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete Shipment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Email Modal */}
      {showSendEmailModal && selectedShipment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Mail size={24} className="text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Send Status Email</h3>
                <p className="text-sm text-gray-500">Send email to recipient</p>
              </div>
            </div>

            <div className="mb-6">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Tracking Number</p>
                    <p className="text-sm font-mono font-medium text-gray-900">
                      {selectedShipment.tracking_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Recipient Email</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedShipment.recipient_info?.email || 
                       (typeof selectedShipment.recipient_info === 'string' 
                         ? (() => {
                             try {
                               return JSON.parse(selectedShipment.recipient_info || '{}').email || 'N/A'
                             } catch {
                               return 'N/A'
                             }
                           })()
                         : 'N/A')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Recipient Name</p>
                    <p className="text-sm text-gray-900">
                      {selectedShipment.recipient_info?.name || 
                       (typeof selectedShipment.recipient_info === 'string' 
                         ? (() => {
                             try {
                               return JSON.parse(selectedShipment.recipient_info || '{}').name || 'N/A'
                             } catch {
                               return 'N/A'
                             }
                           })()
                         : 'N/A')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Current Status</p>
                    <p className="text-sm text-gray-900">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedShipment.status)}`}>
                        {selectedShipment.status}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-600">
                This will send a status update email to the recipient email address provided when this shipment was created.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSendEmailModal(false)
                  setSelectedShipment(null)
                }}
                disabled={sendEmailLoading}
                className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 py-2 rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={sendEmailToRecipient}
                disabled={sendEmailLoading}
                className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white py-2 rounded-lg font-medium transition flex items-center justify-center gap-2"
              >
                {sendEmailLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail size={16} />
                    Send Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

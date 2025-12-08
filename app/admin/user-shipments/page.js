'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Menu, Package, Search, Filter, CheckCircle2, Clock, AlertCircle, Truck, User } from '@/components/icons'
import Sidebar from '@/components/layout/Sidebar'
import { toast } from '@/lib/utils/toast'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

function ShipmentsManagementContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = searchParams.get('userId')
  const { user, loading: authLoading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [shipments, setShipments] = useState([])
  const [filteredShipments, setFilteredShipments] = useState([])
  const [userInfo, setUserInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedShipment, setSelectedShipment] = useState(null)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showDriverModal, setShowDriverModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [drivers, setDrivers] = useState([])
  const [selectedDriverId, setSelectedDriverId] = useState('')

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/admin/login')
        return
      }
      checkAdminAccess()
    }
  }, [user, authLoading, router])

  const checkAdminAccess = async () => {
    if (!supabase || !user) return

    try {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!userProfile || (userProfile.role !== 'Admin' && userProfile.role !== 'Driver')) {
        toast.error('Access denied')
        router.push('/')
        return
      }

      fetchData()
      fetchDrivers()
    } catch (error) {
      console.error('Error checking access:', error)
      router.push('/admin/login')
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

  const fetchData = async () => {
    if (!supabase) return

    setLoading(true)
    try {
      let query = supabase
        .from('shipments')
        .select('*')
        .order('created_at', { ascending: false })

      // If userId is provided, filter by user
      if (userId) {
        query = query.eq('user_id', userId)
        
        // Fetch user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
        setUserInfo(profile)
      }

      const { data, error } = await query

      if (error) throw error
      setShipments(data || [])
      setFilteredShipments(data || [])
    } catch (error) {
      console.error('Error fetching shipments:', error)
      toast.error('Failed to load shipments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let filtered = [...shipments]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.pickup_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.drop_off_location?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => {
        if (statusFilter === 'pending') {
          return s.status === 'Pending' || s.status === 'Paid'
        }
        if (statusFilter === 'in-transit') {
          return s.status === 'In Transit' || s.status === 'On Route'
        }
        if (statusFilter === 'delivered') {
          return s.status === 'Delivered'
        }
        return s.status === statusFilter
      })
    }

    setFilteredShipments(filtered)
  }, [searchTerm, statusFilter, shipments])

  const updateShipmentStatus = async () => {
    if (!newStatus || !selectedShipment) return

    try {
      const { error } = await supabase
        .from('shipments')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedShipment.id)

      if (error) throw error

      // Add to status history
      await supabase
        .from('shipment_status_history')
        .insert({
          shipment_id: selectedShipment.id,
          status: newStatus,
          location: 'Status updated',
          notes: `Status updated to ${newStatus}`,
        })

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: selectedShipment.user_id,
          shipment_id: selectedShipment.id,
          type: 'status_update',
          title: 'Shipment Status Update',
          message: `Your shipment ${selectedShipment.tracking_number} status has been updated to ${newStatus}.`,
        })

      toast.success('Status updated successfully')
      setShowStatusModal(false)
      setSelectedShipment(null)
      setNewStatus('')
      fetchData()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
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

      // Get driver name
      const driver = drivers.find(d => d.id === selectedDriverId)
      const driverName = driver?.full_name || 'Driver'

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: selectedShipment.user_id,
          shipment_id: selectedShipment.id,
          type: 'assignment',
          title: 'Driver Assigned',
          message: `Driver ${driverName} has been assigned to your shipment ${selectedShipment.tracking_number}.`,
        })

      toast.success('Driver assigned successfully')
      setShowDriverModal(false)
      setSelectedShipment(null)
      setSelectedDriverId('')
      fetchData()
    } catch (error) {
      console.error('Error assigning driver:', error)
      toast.error('Failed to assign driver')
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
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
                <h1 className="text-2xl font-bold text-gray-800">
                  {userId ? 'User Shipments' : 'All Shipments'}
                </h1>
                {userInfo && (
                  <p className="text-sm text-gray-600">
                    {userInfo.full_name} • {userInfo.role}
                  </p>
                )}
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Total: {filteredShipments.length}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by tracking number, location..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              {['all', 'pending', 'in-transit', 'delivered'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    statusFilter === status
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'All' : status === 'in-transit' ? 'In Transit' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Shipments Table */}
        <div className="flex-1 overflow-auto p-6">
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
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="In Transit">In Transit</option>
                  <option value="On Route">On Route</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
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
    </div>
  )
}

export default function ShipmentsManagementPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    }>
      <ShipmentsManagementContent />
    </Suspense>
  )
}

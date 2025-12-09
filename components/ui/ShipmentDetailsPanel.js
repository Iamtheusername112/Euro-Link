'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Phone, MessageSquare, MapPin, Camera, Truck, X, Maximize2, ZoomIn, ZoomOut } from '@/components/icons'

// Dynamically import map component to avoid SSR issues
const ShipmentMap = dynamic(() => import('@/components/ui/ShipmentMap'), { 
  ssr: false,
  loading: () => (
    <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
      <div className="text-center text-gray-400">
        <MapPin size={48} className="mx-auto mb-2" />
        <p className="font-medium">Loading map...</p>
      </div>
    </div>
  )
})

export default function ShipmentDetailsPanel({ shipment, onClose }) {
  const [activeTab, setActiveTab] = useState('shipping')

  if (!shipment) return null

  const tabs = [
    { id: 'shipping', label: 'Shipping Info' },
    { id: 'vehicle', label: 'Vehicle Info' },
    { id: 'documents', label: 'Documents' },
    { id: 'company', label: 'Company' },
    { id: 'billing', label: 'Billing' },
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'On Route':
      case 'In Transit':
        return 'bg-blue-500'
      case 'Waiting':
      case 'Pending':
      case 'Paid':
        return 'bg-yellow-500'
      case 'Delivered':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="bg-white h-full flex flex-col fixed lg:relative inset-0 lg:inset-auto z-50 lg:z-auto">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800">{shipment.tracking_number}</h3>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium text-white mt-2 ${getStatusColor(shipment.status)}`}>
              {shipment.status}
            </span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-500 hover:text-gray-700 p-2"
          >
            <X size={24} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2">
            <Phone size={16} />
            Call Driver
          </button>
          <button className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2">
            <MessageSquare size={16} />
            Chat with Driver
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 px-6">
        <div className="flex gap-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-3 px-2 border-b-2 transition whitespace-nowrap text-sm font-medium
                ${activeTab === tab.id 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'shipping' && (
          <div className="space-y-6">
            {/* Truck Capacity */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Current Truck Capacity</span>
                <span className="text-lg font-bold text-gray-800">82%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                <div className="bg-blue-600 h-4 rounded-full" style={{ width: '82%' }} />
              </div>
              <div className="flex justify-center">
                <div className="relative">
                  {/* Semi-truck illustration */}
                  <svg width="120" height="80" viewBox="0 0 200 100" className="text-blue-600">
                    {/* Truck body */}
                    <rect x="20" y="40" width="80" height="40" rx="4" fill="currentColor" opacity="0.2" />
                    <rect x="20" y="40" width="80" height="40" rx="4" stroke="currentColor" strokeWidth="2" fill="none" />
                    {/* Trailer */}
                    <rect x="100" y="45" width="70" height="35" rx="2" fill="currentColor" opacity="0.3" />
                    <rect x="100" y="45" width="70" height="35" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
                    {/* Wheels */}
                    <circle cx="40" cy="85" r="8" fill="currentColor" opacity="0.4" />
                    <circle cx="80" cy="85" r="8" fill="currentColor" opacity="0.4" />
                    <circle cx="120" cy="85" r="8" fill="currentColor" opacity="0.4" />
                    <circle cx="160" cy="85" r="8" fill="currentColor" opacity="0.4" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Route Information */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600">Current Time</p>
                  <p className="text-lg font-mono font-semibold text-gray-800">{shipment.time_elapsed || '01:38:47'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Time Left</p>
                  <p className="text-lg font-semibold text-gray-800">{shipment.time_remaining || 57} min. left</p>
                </div>
              </div>
              <button className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium transition">
                Change Route
              </button>
            </div>

            {/* Real Map View */}
            <div className="relative">
              <ShipmentMap
                pickupLocation={shipment.pickup_location}
                dropOffLocation={shipment.drop_off_location}
                height="h-64"
                showRoute={true}
              />
            </div>

            {/* Cargo Photo Reports */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Cargo Photo Reports</h4>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[1, 2, 3].map((num) => (
                  <div key={num} className="bg-gray-100 rounded-lg aspect-square flex flex-col items-center justify-center p-2 border border-gray-200">
                    <Camera size={24} className="text-gray-400 mb-1" />
                    <p className="text-xs text-gray-500 text-center">Point #{num} Cargo Photo</p>
                    <p className="text-xs text-gray-400 mt-1">Location, Time</p>
                  </div>
                ))}
              </div>
              <button className="w-full border-2 border-dashed border-gray-300 hover:border-blue-500 text-gray-600 hover:text-blue-600 py-3 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2">
                <Camera size={16} />
                Add Photo
              </button>
            </div>
          </div>
        )}

        {activeTab === 'vehicle' && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Vehicle Type</p>
              <p className="font-medium text-gray-800">{shipment.vehicle_type || 'Semi-Truck'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">License Plate</p>
              <p className="font-medium text-gray-800">N/A</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Driver Name</p>
              <p className="font-medium text-gray-800">N/A</p>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="text-center text-gray-500 py-8">
            <p>No documents available</p>
          </div>
        )}

        {activeTab === 'company' && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Company Name</p>
              <p className="font-medium text-gray-800">{shipment.sender_info?.name || shipment.partner || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Contact</p>
              <p className="font-medium text-gray-800">N/A</p>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Cost</p>
              <p className="font-medium text-lg text-gray-800">€{shipment.cost?.toFixed(2) || '0.00'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Payment Status</p>
              <p className="font-medium text-gray-800">{shipment.payment_status || shipment.status || 'Pending'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

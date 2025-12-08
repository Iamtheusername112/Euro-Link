'use client'

import { Truck, Clock, MapPin } from '@/components/icons'

export default function ShipmentCardGrid({ shipments, onSelectShipment, selectedId }) {
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

  const getVehicleIcon = (vehicleType, index) => {
    // Return different vehicle representations based on type
    const size = 48
    const baseClasses = "text-gray-400"
    
    if (vehicleType === 'semi-truck') {
      return (
        <div className="w-12 h-12 flex items-center justify-center">
          <svg width={size} height={size} viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="2" className={baseClasses}>
            {/* Truck cab */}
            <rect x="20" y="40" width="60" height="40" rx="4" fill="currentColor" fillOpacity="0.1" stroke="currentColor" />
            {/* Trailer */}
            <rect x="80" y="45" width="90" height="35" rx="2" fill="currentColor" fillOpacity="0.1" stroke="currentColor" />
            {/* Wheels */}
            <circle cx="35" cy="85" r="8" fill="currentColor" fillOpacity="0.3" />
            <circle cx="65" cy="85" r="8" fill="currentColor" fillOpacity="0.3" />
            <circle cx="100" cy="85" r="8" fill="currentColor" fillOpacity="0.3" />
            <circle cx="150" cy="85" r="8" fill="currentColor" fillOpacity="0.3" />
          </svg>
        </div>
      )
    } else if (vehicleType === 'truck') {
      return (
        <div className="w-12 h-12 flex items-center justify-center">
          <svg width={size} height={size} viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="2" className={baseClasses}>
            <rect x="20" y="40" width="140" height="40" rx="4" fill="currentColor" fillOpacity="0.1" stroke="currentColor" />
            <rect x="30" y="50" width="8" height="8" fill="currentColor" fillOpacity="0.3" />
            <rect x="50" y="50" width="8" height="8" fill="currentColor" fillOpacity="0.3" />
            <rect x="70" y="50" width="8" height="8" fill="currentColor" fillOpacity="0.3" />
            <rect x="90" y="50" width="8" height="8" fill="currentColor" fillOpacity="0.3" />
            <circle cx="40" cy="85" r="8" fill="currentColor" fillOpacity="0.3" />
            <circle cx="120" cy="85" r="8" fill="currentColor" fillOpacity="0.3" />
          </svg>
        </div>
      )
    } else {
      // Van (default)
      return (
        <div className="w-12 h-12 flex items-center justify-center">
          <svg width={size} height={size} viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="2" className={baseClasses}>
            <rect x="20" y="40" width="100" height="40" rx="4" fill="currentColor" fillOpacity="0.1" stroke="currentColor" />
            <rect x="30" y="50" width="8" height="8" fill="currentColor" fillOpacity="0.3" />
            <rect x="50" y="50" width="8" height="8" fill="currentColor" fillOpacity="0.3" />
            <rect x="70" y="50" width="8" height="8" fill="currentColor" fillOpacity="0.3" />
            <line x1="120" x2="120" y1="40" y2="80" stroke="currentColor" />
            <circle cx="40" cy="85" r="8" fill="currentColor" fillOpacity="0.3" />
            <circle cx="90" cy="85" r="8" fill="currentColor" fillOpacity="0.3" />
          </svg>
        </div>
      )
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {shipments.map((shipment) => (
        <div
          key={shipment.id}
          onClick={() => onSelectShipment(shipment)}
          className={`
            bg-white rounded-lg p-4 cursor-pointer transition-all
            border-2 hover:border-blue-500 hover:shadow-lg
            ${selectedId === shipment.id ? 'border-blue-500 shadow-lg ring-2 ring-blue-200' : 'border-gray-200'}
          `}
        >
          {/* Tracking ID and Status */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {getVehicleIcon(shipment.vehicle_type || 'van', shipment.id)}
              <span className="font-semibold text-gray-800 text-sm">{shipment.tracking_number}</span>
            </div>
            <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getStatusColor(shipment.status)}`}>
              {shipment.status}
            </span>
          </div>

          {/* Time Info */}
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className="text-gray-400" />
            <span className="font-mono text-sm text-gray-700">{shipment.time_elapsed || '00:00:00'}</span>
            <span className="text-sm text-gray-500">
              {shipment.time_remaining || 0} min. left
            </span>
          </div>

          {/* Locations */}
          <div className="space-y-1.5">
            {shipment.recent_locations?.slice(0, 3).map((location, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                <MapPin size={12} className="text-gray-400" />
                <span className="truncate">{location}</span>
              </div>
            )) || (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <MapPin size={12} />
                <span>{shipment.pickup_location?.split(',')[0] || 'Location'}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

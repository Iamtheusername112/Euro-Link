'use client'

import { MapPin, Calendar } from '@/components/icons'

export default function ShipmentCard({ trackingNumber, status, location, date }) {
  const statusColors = {
    Pending: 'bg-yellow-100 text-yellow-700',
    Delivered: 'bg-green-100 text-green-700',
    'In Transit': 'bg-blue-100 text-blue-700',
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 mb-3">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-xs text-gray-500 mb-1">Tracking number</p>
          <p className="text-sm font-semibold text-gray-800">{trackingNumber}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status] || statusColors.Pending}`}>
          {status}
        </span>
      </div>
      {location && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
          <MapPin size={14} className="text-red-500" />
          <span>{location}</span>
        </div>
      )}
      {date && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Calendar size={12} />
          <span>{date}</span>
        </div>
      )}
    </div>
  )
}


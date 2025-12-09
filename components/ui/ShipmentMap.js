'use client'

import { useEffect, useState } from 'react'

export default function ShipmentMap({ 
  pickupLocation, 
  dropOffLocation, 
  height = 'h-48',
  showRoute = true 
}) {
  const [pickupCoords, setPickupCoords] = useState(null)
  const [dropOffCoords, setDropOffCoords] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mapUrl, setMapUrl] = useState('')

  // Geocode addresses to coordinates
  const geocodeAddress = async (address) => {
    if (!address) return null
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            'User-Agent': 'Euro-Link Courier App'
          }
        }
      )
      const data = await response.json()
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          displayName: data[0].display_name
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error)
    }
    
    return null
  }

  // Extract coordinates from address string
  const parseCoordinates = (location) => {
    if (!location) return null
    
    const parts = location.split(',')
    if (parts.length >= 2) {
      const lat = parseFloat(parts[parts.length - 2]?.trim())
      const lng = parseFloat(parts[parts.length - 1]?.trim())
      
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng, displayName: parts.slice(0, -2).join(', ').trim() || location }
      }
    }
    
    return null
  }

  useEffect(() => {
    const loadMapData = async () => {
      setLoading(true)
      
      let pickup = parseCoordinates(pickupLocation)
      let dropOff = parseCoordinates(dropOffLocation)
      
      if (!pickup && pickupLocation) {
        pickup = await geocodeAddress(pickupLocation)
      }
      
      if (!dropOff && dropOffLocation) {
        dropOff = await geocodeAddress(dropOffLocation)
      }
      
      setPickupCoords(pickup)
      setDropOffCoords(dropOff)
      
      // Generate static map URL if we have coordinates
      if (pickup || dropOff) {
        let centerLat, centerLng, zoom = 13
        
        if (pickup && dropOff) {
          centerLat = (pickup.lat + dropOff.lat) / 2
          centerLng = (pickup.lng + dropOff.lng) / 2
          const latDiff = Math.abs(pickup.lat - dropOff.lat)
          const lngDiff = Math.abs(pickup.lng - dropOff.lng)
          const maxDiff = Math.max(latDiff, lngDiff)
          
          if (maxDiff > 1) zoom = 6
          else if (maxDiff > 0.5) zoom = 7
          else if (maxDiff > 0.1) zoom = 8
          else if (maxDiff > 0.05) zoom = 9
          else zoom = 10
        } else if (pickup) {
          centerLat = pickup.lat
          centerLng = pickup.lng
        } else {
          centerLat = dropOff.lat
          centerLng = dropOff.lng
        }
        
        // Use OpenStreetMap static map (via Leaflet static image)
        const markers = []
        if (pickup) markers.push(`marker-color:green|${pickup.lat},${pickup.lng}`)
        if (dropOff) markers.push(`marker-color:red|${dropOff.lat},${dropOff.lng}`)
        
        // Use OpenStreetMap static map API
        const staticMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${Math.min(pickup?.lng || centerLng, dropOff?.lng || centerLng) - 0.1},${Math.min(pickup?.lat || centerLat, dropOff?.lat || centerLat) - 0.1},${Math.max(pickup?.lng || centerLng, dropOff?.lng || centerLng) + 0.1},${Math.max(pickup?.lat || centerLat, dropOff?.lat || centerLat) + 0.1}&layer=mapnik&marker=${pickup ? `${pickup.lat},${pickup.lng}` : ''}${dropOff ? `&marker=${dropOff.lat},${dropOff.lng}` : ''}`
        
        setMapUrl(staticMapUrl)
      }
      
      setLoading(false)
    }

    if (pickupLocation || dropOffLocation) {
      loadMapData()
    } else {
      setLoading(false)
    }
  }, [pickupLocation, dropOffLocation])

  if (loading) {
    return (
      <div className={`bg-gray-200 rounded-lg ${height} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
          <p className="text-xs text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }

  if (!pickupCoords && !dropOffCoords) {
    return (
      <div className={`bg-gray-200 rounded-lg ${height} flex items-center justify-center`}>
        <div className="text-center">
          <p className="text-xs text-gray-600">Map unavailable</p>
          <p className="text-xs text-gray-500 mt-1">Location data not available</p>
        </div>
      </div>
    )
  }

  // Use iframe with OpenStreetMap embed for simplicity and reliability
  return (
    <div className={`rounded-lg overflow-hidden ${height} relative`}>
      <iframe
        width="100%"
        height="100%"
        frameBorder="0"
        scrolling="no"
        marginHeight="0"
        marginWidth="0"
        src={mapUrl || `https://www.openstreetmap.org/export/embed.html?bbox=${(pickupCoords?.lng || dropOffCoords?.lng || 0) - 0.1},${(pickupCoords?.lat || dropOffCoords?.lat || 0) - 0.1},${(pickupCoords?.lng || dropOffCoords?.lng || 0) + 0.1},${(pickupCoords?.lat || dropOffCoords?.lat || 0) + 0.1}&layer=mapnik${pickupCoords ? `&marker=${pickupCoords.lat},${pickupCoords.lng}` : ''}${dropOffCoords ? `&marker=${dropOffCoords.lat},${dropOffCoords.lng}` : ''}`}
        className="w-full h-full"
        style={{ border: 0 }}
        allowFullScreen
      />
      
      {/* Overlay with location info */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-xs">
        {pickupCoords && (
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>Pickup: {pickupCoords.displayName || pickupLocation}</span>
          </div>
        )}
        {dropOffCoords && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            <span>Drop-off: {dropOffCoords.displayName || dropOffLocation}</span>
          </div>
        )}
      </div>
    </div>
  )
}

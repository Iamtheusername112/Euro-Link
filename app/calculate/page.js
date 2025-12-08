'use client'

import { useState } from 'react'
import { MapPin, Package } from '@/components/icons'
import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'
import { toast } from '@/lib/utils/toast'

export default function CalculatePage() {
  const [pickupLocation, setPickupLocation] = useState('')
  const [dropOff, setDropOff] = useState('')
  const [packageSize, setPackageSize] = useState('5KG')
  const [deliveryType, setDeliveryType] = useState('Express')
  const [calculating, setCalculating] = useState(false)
  const [result, setResult] = useState(null)

  const handleCalculate = async () => {
    if (!pickupLocation || !dropOff) {
      toast.error('Please fill in both locations')
      return
    }
    
    setCalculating(true)
    try {
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickupLocation, dropOff, packageSize, deliveryType }),
      })
      
      const data = await response.json()
      if (response.ok) {
        setResult(data)
        toast.success(`Estimated cost: ${data.cost} ${data.currency}`)
      } else {
        toast.error(data.error || 'Failed to calculate')
      }
    } catch (error) {
      toast.error('Error calculating shipping cost')
    } finally {
      setCalculating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="Calculate & Ship" showBack={true} />
      
      <main className="px-4 py-6 max-w-md mx-auto">
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pickup Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-yellow-500" size={20} />
              <input
                type="text"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                placeholder="Enter pickup location"
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Drop Off
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600" size={20} />
              <input
                type="text"
                value={dropOff}
                onChange={(e) => setDropOff(e.target.value)}
                placeholder="Enter drop off location"
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Package size</h3>
          <div className="flex gap-4">
            {['1KG', '5KG', '10KG'].map((size) => (
              <button
                key={size}
                onClick={() => setPackageSize(size)}
                className={`flex-1 p-4 rounded-lg border-2 transition ${
                  packageSize === size
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="text-center">
                  <div className="mb-2">
                    <Package size={32} className="mx-auto text-gray-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{size}</span>
                  {packageSize === size && (
                    <div className="mt-2 w-4 h-4 rounded-full bg-red-500 mx-auto"></div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Delivery type</h3>
          <div className="flex gap-3">
            <button
              onClick={() => setDeliveryType('Express')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                deliveryType === 'Express'
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {deliveryType === 'Express' && '✓ '}
              Express
            </button>
            <button
              onClick={() => setDeliveryType('Normal')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                deliveryType === 'Normal'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {deliveryType === 'Normal' && '✓ '}
              Normal
            </button>
          </div>
        </div>

        {result && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">Shipping Estimate</h4>
            <p className="text-2xl font-bold text-green-700 mb-1">
              {result.cost} {result.currency}
            </p>
            <p className="text-sm text-green-600 mb-3">
              Estimated delivery: {result.estimatedDays} day{result.estimatedDays > 1 ? 's' : ''}
            </p>
            <button
              onClick={() => router.push('/create-shipment')}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition"
            >
              Create Shipment with This Rate
            </button>
          </div>
        )}

        <button
          onClick={handleCalculate}
          disabled={calculating}
          className="w-full bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white py-3 rounded-lg font-medium transition"
        >
          {calculating ? 'Calculating...' : 'Calculate now'}
        </button>
      </main>

      <BottomNav />
    </div>
  )
}


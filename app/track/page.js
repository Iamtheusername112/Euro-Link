'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'
import { CheckCircle2, Circle, Package } from '@/components/icons'

function TrackContent() {
  const searchParams = useSearchParams()
  const trackingNumber = searchParams.get('number') || '#9809570923'
  
  // Mock status timeline - would come from Supabase
  const statusTimeline = [
    { status: 'Courier Requested', completed: true, date: '20-02-21', time: '10:00' },
    { status: 'Package Picked-up', completed: true, date: '20-02-21', time: '10:30' },
    { status: 'In transit', completed: false, date: '20-02-21', time: '10:45' },
    { status: 'Package delivered', completed: false, date: '20-02-21', time: '10:50' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="Track your pack" showBack={true} />
      
      <main className="px-4 py-6 max-w-md mx-auto">
        {/* Map placeholder */}
        <div className="bg-gray-200 rounded-lg h-48 mb-4 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400"></div>
          <div className="relative z-10 text-center">
            <div className="w-16 h-16 bg-red-500 rounded-full mx-auto mb-2 flex items-center justify-center">
              <Package size={24} className="text-white" />
            </div>
            <p className="text-xs text-gray-600">Map View</p>
          </div>
          {/* Mock street names */}
          <div className="absolute top-2 left-2 text-xs text-gray-500">Front Street</div>
          <div className="absolute bottom-2 right-2 text-xs text-gray-500">Canterbury Drive</div>
        </div>

        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-1">Tracking number</p>
          <p className="text-sm font-semibold text-gray-800">{trackingNumber}</p>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Package status</h3>
          <div className="space-y-4">
            {statusTimeline.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex flex-col items-center pt-1">
                  {item.completed ? (
                    <CheckCircle2 size={20} className="text-green-500" />
                  ) : (
                    <Circle size={20} className="text-gray-300" />
                  )}
                  {index < statusTimeline.length - 1 && (
                    <div className={`w-0.5 h-8 mt-1 ${item.completed ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${item.completed ? 'text-gray-800' : 'text-gray-400'}`}>
                    {item.status}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {item.date}. {item.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button className="w-full bg-pink-500 hover:bg-pink-600 text-white py-3 rounded-lg font-medium transition">
          View pack
        </button>
      </main>

      <BottomNav />
    </div>
  )
}

export default function TrackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 pb-20">
        <Header title="Track your pack" showBack={true} />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    }>
      <TrackContent />
    </Suspense>
  )
}


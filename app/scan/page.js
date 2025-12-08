'use client'

import { QrCode } from '@/components/icons'
import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'
import { toast } from '@/lib/utils/toast'

export default function ScanPage() {
  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      <Header title="Scan QR Code" />
      
      <main className="px-4 py-6 max-w-md mx-auto">
        <div className="bg-gray-800 rounded-xl p-8 text-center">
          <div className="w-64 h-64 mx-auto mb-6 border-4 border-orange-500 rounded-lg flex items-center justify-center relative">
            <QrCode size={120} className="text-gray-600" />
            <div className="absolute inset-0 border-2 border-dashed border-orange-500/50 rounded-lg"></div>
          </div>
          <p className="text-white text-lg mb-2">Scan QR Code</p>
          <p className="text-gray-400 text-sm mb-6">
            Point your camera at a tracking QR code
          </p>
          <button
            onClick={() => toast.info('QR Scanner functionality coming soon')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-medium transition"
          >
            Start Scanning
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}


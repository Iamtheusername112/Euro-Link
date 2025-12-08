'use client'

import { Package } from '@/components/icons'

export default function PromoBanner() {
  return (
    <div className="bg-gradient-to-r from-orange-400 to-yellow-400 rounded-lg p-4 mb-4 relative overflow-hidden">
      <div className="flex items-center justify-between relative z-10">
        <div className="flex-1">
          <h3 className="text-white font-bold text-lg mb-1">Save up to 45%</h3>
          <p className="text-white text-sm mb-2">
            Use code <span className="font-semibold">OFSAPCE</span> and save up-to 45% cost
          </p>
          <button className="bg-pink-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-pink-600 transition">
            Send now
          </button>
        </div>
        <div className="ml-4">
          <Package size={48} className="text-white opacity-80" />
        </div>
      </div>
    </div>
  )
}


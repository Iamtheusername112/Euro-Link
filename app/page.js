'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Rocket } from '@/components/icons'

export default function LandingPage() {
  const router = useRouter()

  const handleStart = () => {
    router.push('/home')
  }

  const handleNext = () => {
    router.push('/home')
  }

  const handlePrev = () => {
    // Can implement slide navigation if needed
  }

  return (
    <div className="landing-page bg-gray-100 overflow-hidden relative">
      {/* Hero Image Section */}
      <div className="relative h-full w-full">
        {/* Truck Image Background with Sunset */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop')`,
          }}
        >
          {/* Gradient Overlay - darker at bottom for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/80" />
        </div>

        {/* Alternative: Use a sunset/truck image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-0"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1504307651254-35680f293033?q=80&w=2076&auto=format&fit=crop')`,
          }}
        />

        {/* Brand Name - Top Left */}
        <div className="absolute top-8 left-6 z-10">
          <h1 className="text-2xl font-bold text-orange-400 drop-shadow-lg">Euro-Link</h1>
        </div>

        {/* Text Overlay - Centered, positioned lower */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-32 px-6 z-10">
          <div className="text-center space-y-3 w-full">
            <h2 className="text-5xl md:text-6xl font-bold text-white leading-tight drop-shadow-lg">
              Stress-Free
            </h2>
            <h2 className="text-5xl md:text-6xl font-bold text-white leading-tight drop-shadow-lg">
              Shipping
            </h2>
            <p className="text-white/95 text-base md:text-lg mt-4 max-w-sm mx-auto font-light">
              Send your package fast create a shipment in seconds.
            </p>
          </div>
        </div>

        {/* Bottom Navigation Bar */}
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <div className="bg-black/70 backdrop-blur-sm rounded-t-3xl px-6 py-5">
            <div className="flex items-center justify-between max-w-md mx-auto">
              {/* Left Arrow Button */}
              <button
                onClick={handlePrev}
                className="w-12 h-12 rounded-full bg-gray-300/20 hover:bg-gray-300/30 flex items-center justify-center transition active:scale-95"
                aria-label="Previous"
              >
                <ChevronLeft size={20} className="text-gray-300" />
              </button>

              {/* Start Button - Center, Orange */}
              <button
                onClick={handleStart}
                className="flex-1 mx-4 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-full px-6 py-3.5 flex items-center justify-center gap-2 font-semibold text-base transition-all shadow-lg shadow-orange-500/40 active:scale-95"
              >
                <Rocket size={20} />
                <span>Start</span>
              </button>

              {/* Right Arrows Button */}
              <button
                onClick={handleNext}
                className="w-12 h-12 rounded-full bg-gray-300/20 hover:bg-gray-300/30 flex items-center justify-center transition active:scale-95"
                aria-label="Next"
              >
                <div className="flex items-center gap-0.5">
                  <ChevronRight size={14} className="text-gray-300" />
                  <ChevronRight size={14} className="text-gray-300 -ml-1.5" />
                  <ChevronRight size={14} className="text-gray-300 -ml-1.5" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

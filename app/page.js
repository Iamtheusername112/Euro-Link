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
    <div className="landing-page bg-gray-100 overflow-hidden relative min-h-screen">
      {/* Hero Image Section */}
      <div className="relative h-full w-full min-h-screen">
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

        {/* Text Overlay - Centered */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 z-10">
          <div className="text-center space-y-6 w-full max-w-md mx-auto">
            <div className="space-y-3">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight drop-shadow-lg">
                Stress-Free
              </h2>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight drop-shadow-lg">
                Shipping
              </h2>
              <p className="text-white/95 text-sm sm:text-base md:text-lg mt-4 font-light px-4">
                Send your package fast create a shipment in seconds.
              </p>
            </div>

            {/* Start Button - Centered in the middle */}
            <div className="pt-8">
              <button
                onClick={handleStart}
                className="w-full max-w-xs mx-auto bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-full px-8 py-5 flex items-center justify-center gap-3 font-bold text-lg transition-all shadow-2xl shadow-orange-500/50 active:scale-95"
              >
                <Rocket size={24} />
                <span>Start</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Navigation - Optional, less prominent */}
        <div className="absolute bottom-6 left-0 right-0 z-20">
          <div className="flex items-center justify-center gap-4 max-w-md mx-auto px-6">
            {/* Left Arrow Button */}
            <button
              onClick={handlePrev}
              className="w-10 h-10 rounded-full bg-black/30 hover:bg-black/40 flex items-center justify-center transition active:scale-95"
              aria-label="Previous"
            >
              <ChevronLeft size={18} className="text-white" />
            </button>

            {/* Page Indicator Dots */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white"></div>
              <div className="w-2 h-2 rounded-full bg-white/30"></div>
              <div className="w-2 h-2 rounded-full bg-white/30"></div>
            </div>

            {/* Right Arrows Button */}
            <button
              onClick={handleNext}
              className="w-10 h-10 rounded-full bg-black/30 hover:bg-black/40 flex items-center justify-center transition active:scale-95"
              aria-label="Next"
            >
              <div className="flex items-center gap-0.5">
                <ChevronRight size={12} className="text-white" />
                <ChevronRight size={12} className="text-white -ml-1" />
                <ChevronRight size={12} className="text-white -ml-1" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

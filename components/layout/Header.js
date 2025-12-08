'use client'

import Link from 'next/link'
import { ArrowLeft } from '@/components/icons'
import NotificationBell from '@/components/ui/NotificationBell'

export default function Header({ title, showBack = false, showNotifications = false }) {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
      <div className="flex items-center gap-3">
        {showBack && (
          <Link href="/" className="p-1">
            <ArrowLeft size={20} className="text-gray-700" />
          </Link>
        )}
        {!showBack && (
          <h1 className="text-xl font-bold text-red-500">Euro-Link</h1>
        )}
        {title && <h2 className="text-lg font-semibold text-gray-800">{title}</h2>}
      </div>
      {showNotifications && <NotificationBell />}
    </header>
  )
}


'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Package, FileText, User, QrCode } from '@/components/icons'

export default function BottomNav() {
  const pathname = usePathname()

  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Home' },
    { href: '/track', icon: Package, label: 'Track' },
    { href: '/history', icon: FileText, label: 'History' },
    { href: '/profile', icon: User, label: 'Profile' },
    { href: '/scan', icon: QrCode, label: 'Scan' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-800/95 backdrop-blur-sm border-t border-gray-700 z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href === '/dashboard' && pathname === '/')
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full relative ${
                isActive ? 'text-orange-500' : 'text-gray-400'
              }`}
            >
              {isActive && (
                <div className="absolute top-0 w-12 h-1 bg-orange-500 rounded-b-full"></div>
              )}
              <div className={`${isActive ? 'bg-orange-500/20' : ''} rounded-full p-2 transition`}>
                <Icon size={22} />
              </div>
              <span className={`text-xs font-medium ${isActive ? 'text-orange-500' : 'text-gray-400'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

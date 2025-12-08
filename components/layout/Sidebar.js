'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Home, Users, Package, Clock, Plus, LogOut
} from '@/components/icons'

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, signOut } = useAuth()

  const navItems = [
    { href: '/admin/dashboard', icon: Home, label: 'Admin Panel' },
  ]

  const isActive = (href) => pathname === href

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full bg-gray-900 text-white z-50
        transform transition-transform duration-300 ease-in-out
        w-64 lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* User Profile */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {profile?.full_name || 'User'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {user?.email || ''}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            {navItems.map((item, index) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={index}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-6 py-3 transition
                    ${active ? 'bg-blue-600 text-white' : 'hover:bg-gray-800'}
                  `}
                  onClick={onClose}
                >
                  <Icon size={20} />
                  <span className="text-sm">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Actions */}
          <div className="p-4 border-t border-gray-800 space-y-2">
            <button 
              onClick={() => {
                router.push('/create-shipment')
                onClose()
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              <span>Create Shipment</span>
            </button>
            <button 
              onClick={async () => {
                await signOut()
                router.push('/')
                onClose()
              }}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition flex items-center justify-center gap-2"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}


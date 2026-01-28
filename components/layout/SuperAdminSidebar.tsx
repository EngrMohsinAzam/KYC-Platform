'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavItem = {
  label: string
  href: string
  icon: React.ReactNode
}

const NavIcon = ({ children }: { children: React.ReactNode }) => (
  <span className="w-7 h-7 flex items-center justify-center">{children}</span>
)

type SuperAdminSidebarProps = {
  isOpen?: boolean
  onClose?: () => void
}

export function SuperAdminSidebar({ isOpen = false, onClose }: SuperAdminSidebarProps) {
  const pathname = usePathname()

  const items: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/super-admin/dashboard',
      icon: (
        <NavIcon>
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7m-9 9V9m0 10H7a2 2 0 01-2-2v-5m14 7h-4m4 0a2 2 0 002-2v-5m-2 7a2 2 0 01-2 2h-3" />
          </svg>
        </NavIcon>
      ),
    },
    {
      label: 'Companies',
      href: '/super-admin/companies',
      icon: (
        <NavIcon>
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </NavIcon>
      ),
    },
    {
      label: 'Financial record',
      href: '/super-admin/financial',
      icon: (
        <NavIcon>
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </NavIcon>
      ),
    },
    {
      label: 'Pause / Unpause',
      href: '/super-admin/pause-kyc',
      icon: (
        <NavIcon>
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6M5 7a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V7z" />
          </svg>
        </NavIcon>
      ),
    },
    {
      label: 'Profile',
      href: '/super-admin/profile',
      icon: (
        <NavIcon>
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          </svg>
        </NavIcon>
      ),
    },
    {
      label: 'Customer support',
      href: '/super-admin/support',
      icon: (
        <NavIcon>
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-1.414 1.414A7.5 7.5 0 105.05 16.95l-1.414 1.414A9.5 9.5 0 1118.364 5.636z" />
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 11v5m0 0h-3m3 0h3" />
          </svg>
        </NavIcon>
      ),
    },
  ]

  const handleLinkClick = () => {
    // Close sidebar on mobile when a menu item is clicked
    if (onClose) {
      onClose()
    }
  }

  return (
    <>
      {/* Mobile Sidebar */}
      <aside
        className={[
          'md:hidden fixed top-0 left-0 z-50 flex flex-col w-[260px] bg-white border-r border-gray-200 h-screen transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Brand */}
        <div className="h-[76px] px-5 flex items-center gap-3 border-b border-gray-200">
          <div className="w-11 h-11 rounded-2xl bg-black flex items-center justify-center text-white font-bold shadow-sm">
            SA
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 truncate">Super Admin</p>
            <p className="text-xs text-gray-500 truncate">KYC Platform</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="px-3 py-4 space-y-1 flex-1 overflow-y-auto">
          {items.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={[
                  'flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors',
                  active ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100',
                ].join(' ')}
              >
                <span className={active ? 'text-white' : 'text-gray-600'}>{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="px-3 py-4 border-t border-gray-200">
          <Link
            href="/super-admin/logout"
            onClick={handleLinkClick}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <NavIcon>
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </NavIcon>
            <span className="text-sm font-medium">Logout</span>
          </Link>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col w-[260px] bg-white border-r border-gray-200 h-screen sticky top-0">
        {/* Brand */}
        <div className="h-[76px] px-5 flex items-center gap-3 border-b border-gray-200">
          <div className="w-11 h-11 rounded-2xl bg-black flex items-center justify-center text-white font-bold shadow-sm">
            SA
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">Super Admin</p>
            <p className="text-xs text-gray-500 truncate">KYC Platform</p>
          </div>
        </div>

      <nav className="px-3 py-4 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors',
                active ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100',
              ].join(' ')}
            >
              <span className={active ? 'text-white' : 'text-gray-600'}>{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

        <div className="mt-auto px-3 py-4 border-t border-gray-200">
          <Link
            href="/super-admin/logout"
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <NavIcon>
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </NavIcon>
            <span className="text-sm font-medium">Logout</span>
          </Link>
        </div>
      </aside>
    </>
  )
}



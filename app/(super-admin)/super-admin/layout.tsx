'use client'

import { useState } from 'react'
import { SuperAdminSidebar } from '@/components/layout/SuperAdminSidebar'
import { SuperAdminWalletGate } from '@/components/wallet/SuperAdminWalletGate'
import { usePathname } from 'next/navigation'

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Don't show the protected chrome (sidebar etc.) on the Super Admin login route.
  if (pathname === '/super-admin') {
    return <>{children}</>
  }

  // Only enable wallet gate on profile page
  const isProfilePage = pathname === '/super-admin/profile'
  const walletGateEnabled = isProfilePage

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex">
      <SuperAdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Mobile Header with Hamburger Button */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 h-16 flex items-center px-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Open menu"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 min-w-0 md:pt-0 pt-16">
        <SuperAdminWalletGate enabled={walletGateEnabled}>{children}</SuperAdminWalletGate>
      </div>
    </div>
  )
}



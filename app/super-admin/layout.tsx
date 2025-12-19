'use client'

import { SuperAdminSidebar } from '@/components/layout/SuperAdminSidebar'
import { SuperAdminWalletGate } from '@/components/wallet/SuperAdminWalletGate'
import { usePathname } from 'next/navigation'

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Don't show the protected chrome (sidebar etc.) on the Super Admin login route.
  if (pathname === '/super-admin') {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex">
      <SuperAdminSidebar />
      <div className="flex-1 min-w-0">
        <SuperAdminWalletGate enabled={true}>{children}</SuperAdminWalletGate>
      </div>
    </div>
  )
}



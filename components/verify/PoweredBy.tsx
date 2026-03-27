'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { getCompanyContext } from '@/app/(public)/utils/kyc-company-context'

export function PoweredBy() {
  const pathname = usePathname()
  const [company, setCompany] = useState<{ companyName: string } | null>(null)

  useEffect(() => {
    const ctx = getCompanyContext()
    setCompany(ctx?.companyName ? { companyName: ctx.companyName } : null)
  }, [pathname])

  const companyName = company?.companyName || 'Blockchain'

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-0 border-t border-gray-200 bg-white py-1.5 text-center md:static md:flex-shrink-0 md:py-3">
      <p className="text-xs text-gray-500">
        Powered by <span className="font-semibold text-gray-700">{companyName}</span>
      </p>
    </footer>
  )
}

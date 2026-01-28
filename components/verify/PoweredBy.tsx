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

  if (!company) return null

  return (
    <footer className="py-3 text-center border-t border-gray-200 bg-white">
      <p className="text-xs text-gray-500">
        Powered by <span className="font-semibold text-gray-700">{company.companyName}</span>
      </p>
    </footer>
  )
}

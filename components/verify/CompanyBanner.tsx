'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { getCompanyContext } from '@/app/(public)/utils/kyc-company-context'

export function CompanyBanner() {
  const pathname = usePathname()
  const [company, setCompany] = useState<{ companyName: string } | null>(null)

  useEffect(() => {
    const ctx = getCompanyContext()
    setCompany(ctx?.companyName ? { companyName: ctx.companyName } : null)
  }, [pathname])

  if (!company) return null

  return (
    <div className="py-2 px-4 text-center bg-gray-100 border-b border-gray-200">
      <p className="text-sm text-gray-600">
        Verifying for <span className="font-semibold text-gray-900">{company.companyName}</span>
      </p>
    </div>
  )
}

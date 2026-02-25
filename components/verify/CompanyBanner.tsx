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

  // Optional: show a compact top bar with company name (set to return null to remove top gap entirely)
  return null
}

'use client'

import { PoweredBy } from '@/components/verify/PoweredBy'
import { CompanyBanner } from '@/components/verify/CompanyBanner'

export default function VerifyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      <CompanyBanner />
      <main className="flex-1 min-h-0 overflow-y-auto">
        {children}
      </main>
      <PoweredBy />
      {/* Spacer so "Powered by" stays visible above fixed mobile CTAs */}
      <div className="h-12 flex-shrink-0 md:hidden" aria-hidden="true" />
    </div>
  )
}

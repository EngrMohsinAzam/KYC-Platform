'use client'

import { PoweredBy } from '@/components/verify/PoweredBy'

export default function VerifyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
      <PoweredBy />
      {/* Spacer so "Powered by" stays visible above fixed mobile CTAs */}
      <div className="h-16 md:hidden" aria-hidden="true" />
    </div>
  )
}

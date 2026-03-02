'use client'

import { CompanyBanner } from '@/components/verify/CompanyBanner'

export default function VerifyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFFFFF]">
      <CompanyBanner />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  )
}

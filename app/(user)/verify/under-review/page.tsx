'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Header } from '@/components/layout/Header'
import { PoweredBy } from '@/components/verify/PoweredBy'
import { VerifyMobileBackRow } from '@/components/verify/VerifyMobileBackRow'

export default function UnderReview() {
  const router = useRouter()

  return (
    <div className="h-full min-h-0 md:h-screen flex flex-col overflow-hidden bg-[#FFFFFF]">
      {/* Mobile: back only (no X) — matches other verify flows */}
      <VerifyMobileBackRow
        variant="muted"
        className="!pt-2 !pb-0 flex-shrink-0"
        onBack={() => router.push('/')}
      />
      {/* Desktop: back + title, no close */}
      <div className="hidden md:block flex-shrink-0">
        <Header showBack title="Under Review" onBack={() => router.push('/')} />
      </div>

      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 md:px-0 pt-1 pb-[calc(140px+env(safe-area-inset-bottom,0px))] md:pb-10 md:flex md:items-center md:justify-center">
        <div className="w-full max-w-md md:bg-white p-3 md:p-8 rounded-2xl md:shadow-lg md:my-8 border-[1.5px] border-[#E8E8E9] mx-auto">
          <div className="text-center mb-4 md:mb-8">
            <div className="w-[72px] h-[72px] md:w-24 md:h-24 mx-auto mb-3 md:mb-6 bg-green-50 rounded-full flex items-center justify-center">
              <svg className="w-9 h-9 md:w-12 md:h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-text-primary mb-2 md:mb-4">
              Under Review
            </h1>
            <p className="text-sm text-text-secondary leading-relaxed mb-2 md:mb-4">
              Your KYC verification has been submitted successfully!
            </p>
            <p className="text-sm text-text-secondary leading-relaxed mb-0 md:mb-2">
              Your application is now under review. You will be notified once the verification is complete.
            </p>
          </div>

          {/* In-flow buttons + footer padding so Contact Support is never clipped by PoweredBy */}
          <div className="w-full max-w-[341px] md:max-w-none mx-auto space-y-2.5 md:space-y-3">
            <Button
              onClick={() => router.push('/')}
              className="w-full h-[52px] md:h-[54px] !rounded-[12px] !bg-[#A7D80D] hover:!bg-[#9BC90C] !text-black font-semibold focus:!ring-2 focus:!ring-[#A7D80D] focus:!ring-offset-2"
            >
              Go to Home
            </Button>
            <Link href="/support" className="block w-full">
              <Button variant="secondary" className="w-full h-[52px] md:h-[54px] !rounded-[12px]">
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <PoweredBy />
    </div>
  )
}

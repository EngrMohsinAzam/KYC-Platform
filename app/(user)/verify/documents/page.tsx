'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PoweredBy } from '@/components/verify/PoweredBy'
import { VerifyMobileBackRow } from '@/components/verify/VerifyMobileBackRow'
import { SpinnerIcon } from '@/components/verify/SpinnerIcon'

export default function DocumentsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const prevHtml = document.documentElement.style.overflowY
    const prevBody = document.body.style.overflowY
    document.documentElement.style.overflowY = 'hidden'
    document.body.style.overflowY = 'hidden'
    return () => {
      document.documentElement.style.overflowY = prevHtml
      document.body.style.overflowY = prevBody
    }
  }, [])

  const handleContinue = () => {
    setLoading(true)
    router.push('/verify/id-issuing-country')
  }

  return (
    <div className="h-full md:h-screen bg-[#FFFFFF] flex flex-col overflow-hidden">
      <VerifyMobileBackRow onBack={() => router.push('/verify/former-name')} className="flex-shrink-0" />

      <main className="flex-1 flex flex-col items-center md:justify-center px-4 pt-3 pb-[170px] md:pb-6 md:pt-6 md:min-h-0 min-h-0 overflow-hidden">
        {/* Card: flex column so illustration can sit in center, consent at bottom */}
        <div className="w-full max-w-[760px] md:max-w-[680px] h-full md:h-auto md:min-h-0 flex flex-col md:justify-start md:bg-[#FFFFFF] md:border-[1.5px] md:border-[#E8E8E9] md:rounded-[14px] md:px-5 md:py-4 md:flex-shrink-0">
          {/* Heading - Inter 20px bold */}
          <h1 className="font-sans text-[20px] font-bold leading-[100%] tracking-[0%] text-[#000000] mb-2 text-left md:text-center w-full flex-shrink-0">
            Submit Identity Verification
          </h1>
          {/* Subtitle - Inter 18px regular */}
          <p className="font-sans text-[18px] font-normal leading-[100%] tracking-[0%] text-[#545454] mb-4 md:mb-5 text-left md:text-center w-full flex-shrink-0">
            A valid, government-issued photo ID is required to verify your identity.
          </p>

          {/* PNG image - centered in the middle of the page */}
          <div className="flex-1 flex items-center justify-center min-h-[200px] md:min-h-[220px] w-full flex-shrink-0">
            <div className="relative w-full max-w-[280px] md:max-w-[320px] aspect-[320/240]">
              <Image
                src="/Documents-first-page.png"
                alt="Identity verification - secure document submission"
                fill
                className="object-contain object-center"
                priority
                sizes="(max-width: 768px) 280px, 320px"
              />
            </div>
          </div>

          {/* Consent text - at bottom, above button; Inter 12px, 117% line-height */}
          <p className="font-sans text-[12px] font-normal leading-[117%] tracking-[0%] text-[#545454] mb-8 text-left w-full flex-shrink-0 md:max-w-none max-w-[95%] mx-auto">
            By clicking the button below, you consent to Persona, our vendor, collecting, using, and
            utilizing its service providers to process your biometric information to verify your
            identity, identify fraud, and improve Persona&apos;s platform in accordance with its{' '}
            <Link
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#A7D80D] font-normal underline hover:opacity-90 transition-opacity"
            >
              Privacy Policy
            </Link>
            . Your biometric information will be stored for no more than 3 years.
          </p>

          {/* Desktop: Continue + Back to Previous */}
          <div className="hidden md:block flex-shrink-0">
            <button
              type="button"
              onClick={handleContinue}
              disabled={loading}
              className="w-full h-[54px] rounded-[12px] bg-[#A7D80D] hover:opacity-95 active:opacity-90 text-black text-[16px] font-semibold transition-opacity focus:outline-none focus:ring-2 focus:ring-[#A7D80D] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <SpinnerIcon color="#000000" /> : 'Continue'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/verify/former-name')}
              className="flex items-center justify-center gap-2 text-[#545454] text-[14px] leading-none font-normal mt-4 mx-auto hover:text-[#000000] transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
              </svg>
              Back to Previous
            </button>
          </div>
        </div>
      </main>

      <PoweredBy />

      {/* Mobile: fixed Continue at bottom - lime, black text */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 px-4 pb-8 pt-2 bg-gradient-to-t from-[#FFFFFF] to-transparent">
        <button
          type="button"
          onClick={handleContinue}
          disabled={loading}
          className="w-full h-[54px] rounded-[12px] bg-[#A7D80D] hover:opacity-95 active:opacity-90 text-black text-[16px] font-semibold transition-opacity focus:outline-none focus:ring-2 focus:ring-[#A7D80D] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <SpinnerIcon color="#000000" /> : 'Continue'}
        </button>
      </div>
    </div>
  )
}

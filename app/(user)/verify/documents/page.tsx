'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { PoweredBy } from '@/components/verify/PoweredBy'

/** Inline illustration: ID card (left) + passport (right), purple style - compact so all fits in viewport */
function DocumentsIllustration() {
  return (
    <div className="flex justify-center items-center w-full h-[64px] md:h-[100px] flex-shrink-0">
      <svg
        viewBox="0 0 200 140"
        className="max-w-[180px] md:max-w-[220px] w-full h-full object-contain"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse cx="100" cy="75" rx="85" ry="55" fill="#EDE7F6" opacity="0.6" />
        <ellipse cx="70" cy="70" rx="35" ry="25" fill="#D1C4E9" opacity="0.4" />
        <ellipse cx="130" cy="80" rx="40" ry="28" fill="#D1C4E9" opacity="0.4" />
        <rect x="108" y="25" width="72" height="100" rx="6" ry="6" fill="#7E57C2" />
        <rect x="112" y="32" width="64" height="86" rx="4" ry="4" fill="#9575CD" />
        <rect x="118" y="38" width="52" height="4" rx="2" fill="#B39DDB" />
        <circle cx="144" cy="72" r="18" stroke="#FFC107" strokeWidth="2.5" fill="none" />
        <ellipse cx="144" cy="72" rx="18" ry="9" stroke="#FFC107" strokeWidth="1.5" fill="none" />
        <path d="M126 72h36M144 54v36" stroke="#FFC107" strokeWidth="1.5" />
        <path d="M132 58 Q144 65 156 58 M132 86 Q144 79 156 86" stroke="#FFC107" strokeWidth="1.2" fill="none" />
        <rect x="118" y="98" width="40" height="3" rx="1.5" fill="#B39DDB" />
        <rect x="118" y="105" width="52" height="3" rx="1.5" fill="#B39DDB" />
        <rect x="118" y="112" width="35" height="3" rx="1.5" fill="#B39DDB" />
        <rect x="20" y="45" width="100" height="65" rx="8" ry="8" fill="#9575CD" />
        <rect x="24" y="49" width="92" height="57" rx="6" ry="6" fill="#B39DDB" />
        <circle cx="52" cy="77" r="18" fill="#7E57C2" />
        <ellipse cx="52" cy="72" rx="10" ry="11" fill="#5E35B1" />
        <path d="M42 82 Q52 92 62 82 Q58 88 52 90 Q46 88 42 82" fill="#5E35B1" />
        <rect x="78" y="55" width="32" height="4" rx="2" fill="#7E57C2" />
        <rect x="78" y="64" width="28" height="4" rx="2" fill="#7E57C2" />
        <rect x="78" y="73" width="35" height="4" rx="2" fill="#7E57C2" />
        <rect x="78" y="82" width="30" height="4" rx="2" fill="#7E57C2" />
        <path d="M95 98 L105 98 L100 106 Z" fill="#5E35B1" />
        <ellipse cx="110" cy="102" rx="5" ry="4" fill="#FFC107" opacity="0.9" />
      </svg>
    </div>
  )
}

export default function DocumentsPage() {
  const router = useRouter()

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
    router.push('/verify/upload-id-type')
  }

  return (
    <div className="min-h-screen h-[100dvh] md:h-screen bg-[#F5F5F5] flex flex-col overflow-hidden">
      <div className="md:hidden flex-shrink-0 px-4 pt-1.5 pb-0">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => router.push('/verify/enter-address')}
          className="h-8 w-8 inline-flex items-center justify-center text-[#828282] hover:text-[#000000] transition-colors"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      {/* Mobile: scrollable area with padding so content is not hidden under fixed button */}
      <main className="flex-1 flex flex-col items-center justify-start md:justify-center min-h-0 overflow-y-auto overflow-x-hidden px-4 pt-0 pb-[88px] md:pb-4 md:py-4">
        {/* White card: compact on mobile, aligned to top */}
        <div className="w-full max-w-[500px] flex flex-col items-start md:items-center md:bg-white md:rounded-[14px] md:shadow-md md:border md:border-[#E8E8E9] md:pt-5 md:px-6 md:pb-5 flex-shrink-0 pt-0">
          <h1 className="text-[20px] md:text-[24px] leading-tight font-bold text-[#000000] mb-1 md:mb-1.5 text-left md:text-center w-full">
            Upload a photo ID
          </h1>
          <p className="text-[13px] md:text-[15px] leading-[1.4] font-normal text-[#828282] mb-2 md:mb-3 text-left md:text-center w-full">
            A valid, government-issued photo ID is required to verify your identity.
          </p>

          <div className="flex justify-center w-full mb-2 md:mb-4 self-center">
            <DocumentsIllustration />
          </div>

          <div className="w-full mb-2 md:mb-4">
            <p className="text-[11px] md:text-[12px] leading-[1.45] font-normal text-[#828282] text-left max-w-full break-words">
              By clicking the button below, you consent to Persona, our vendor, collecting, using, and
              utilizing its service providers to process your biometric information to verify your
              identity, identify fraud, and improve Persona&apos;s platform in accordance with its{' '}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#6D3CCC] font-semibold underline hover:text-[#8558D9] transition-colors"
              >
                Privacy Policy
              </a>
              . Your biometric information will be stored for no more than 3 years.
            </p>
          </div>

          <div className="hidden md:flex flex-col items-center w-full">
            <Button
              onClick={handleContinue}
              className="w-full h-[48px] !rounded-[12px] !bg-[#6D3CCC] hover:!bg-[#8558D9] focus:!ring-0 focus:!ring-offset-0 !text-white text-[16px] font-semibold"
            >
              Continue
            </Button>
            <button
              type="button"
              onClick={() => router.push('/verify/enter-address')}
              className="flex items-center justify-center gap-2 text-[#828282] text-[14px] font-normal mt-4 w-full hover:text-[#000000] transition-colors"
            >
              <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
              </svg>
              Back to Previous
            </button>
          </div>
        </div>
      </main>
      <PoweredBy />
      {/* Mobile: fixed to bottom so Continue is always visible on real devices */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 px-4 pb-4 pt-3 bg-[#F5F5F5] border-t border-[#E8E8E9] z-10">
        <Button
          onClick={handleContinue}
          className="h-[52px] !rounded-[14px] !bg-[#6D3CCC] hover:!bg-[#8558D9] focus:!ring-0 focus:!ring-offset-0 !text-white font-semibold text-[16px] w-full"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}

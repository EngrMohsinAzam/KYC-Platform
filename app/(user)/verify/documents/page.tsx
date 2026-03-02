'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { PoweredBy } from '@/components/verify/PoweredBy'

/** Illustration: upload document graphic from Upload-Doc.svg */
function DocumentsIllustration() {
  return (
    <div className="flex justify-center items-center w-full h-[64px] md:h-[100px] flex-shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/Upload-Doc.svg"
        alt=""
        className="max-w-[180px] md:max-w-[280px] w-full h-full object-contain"
      />
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
    <div className="min-h-screen h-[100dvh] md:h-screen bg-[#FFFFFF] flex flex-col overflow-hidden">
      <div className="md:hidden flex-shrink-0 pl-1 pr-4 pt-5 pb-0">
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
      <main className="flex-1 flex flex-col items-center justify-start md:justify-center min-h-0 overflow-hidden md:overflow-visible px-4 pt-0 pb-[88px] md:pb-4 md:py-4">
        {/* White card: ~60% width on desktop, full width on mobile */}
        <div className="w-full md:w-[60%] md:max-w-[800px] md:min-w-[400px] flex flex-col items-start md:items-center md:bg-white md:rounded-[14px] md:shadow-md md:border-[1.5px] md:border-[#E8E8E9] md:pt-6 md:px-8 md:pb-6 flex-shrink-0 pt-0">
          <h1 className="text-[20px] md:text-[26px] leading-tight font-bold text-[#000000] mb-1 md:mb-2 text-left md:text-center w-full">
            Upload a photo ID
          </h1>
          <p className="text-[13px] md:text-[16px] leading-[1.4] font-normal text-[#828282] mb-2 md:mb-4 text-left md:text-center w-full">
            A valid, government-issued photo ID is required to verify your identity.
          </p>

          <div className="flex justify-center w-full mb-2 md:mb-5 self-center">
            <DocumentsIllustration />
          </div>

          <div className="w-full mb-2 md:mb-5 max-w-[90%] md:max-w-[85%] mx-auto">
            <p className="text-[11px] md:text-[13px] leading-[1.45] font-normal text-[#828282] text-left md:text-center break-words">
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

          <div className="hidden md:flex flex-col items-center w-full gap-1">
            <Button
              onClick={handleContinue}
              className="w-full max-w-[670px] h-[54px] !rounded-[12px] !bg-[#6D3CCC] hover:!bg-[#8558D9] focus:!ring-0 focus:!ring-offset-0 !text-white text-[16px] font-semibold"
            >
              Continue
            </Button>
            <button
              type="button"
              onClick={() => router.push('/verify/enter-address')}
              className="flex items-center justify-center gap-2 text-[#828282] text-[14px] font-normal mt-5 w-full hover:text-[#000000] transition-colors"
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 px-4 pb-4 pt-3 bg-[#FFFFFF] border-t border-[#E8E8E9] z-10 flex justify-center">
        <Button
          onClick={handleContinue}
          className="w-full max-w-[341px] h-[54px] !rounded-[14px] !bg-[#6D3CCC] hover:!bg-[#8558D9] focus:!ring-0 focus:!ring-offset-0 !text-white font-semibold text-[16px]"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}

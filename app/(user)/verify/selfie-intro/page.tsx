'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'

export default function SelfieIntroPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isUpdateMode = searchParams.get('update') === 'true'
  const updateEmail = searchParams.get('email') || ''

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
    if (isUpdateMode && updateEmail) {
      router.push(`/verify/upload-selfie?update=true&email=${encodeURIComponent(updateEmail)}`)
    } else {
      router.push('/verify/upload-selfie')
    }
  }

  const handleBack = () => {
    if (isUpdateMode && updateEmail) {
      router.push(`/verify/upload-document?update=true&email=${encodeURIComponent(updateEmail)}`)
    } else {
      router.push('/verify/upload-document')
    }
  }

  return (
    <div className="h-screen min-h-screen max-h-screen bg-[#F5F5F5] flex flex-col overflow-hidden">
      {/* Mobile: back arrow */}
      <div className="md:hidden flex-shrink-0 px-4 pt-2 pb-1">
        <button
          type="button"
          aria-label="Go back"
          onClick={handleBack}
          className="h-8 w-8 inline-flex items-center justify-center text-[#828282] hover:text-[#000000] transition-colors"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center min-h-0 overflow-hidden px-4 pt-2 pb-20 md:py-4 md:pb-4">
        {/* White card: carbon copy of documents page layout and styles */}
        <div className="w-full max-w-[500px] flex flex-col items-start md:items-center md:bg-white md:rounded-[14px] md:shadow-md md:border md:border-[#E8E8E9] md:pt-5 md:px-6 md:pb-5 flex-shrink-0">
          <h1 className="text-[20px] md:text-[24px] leading-tight font-bold text-[#000000] mb-1 md:mb-1.5 text-left md:text-center w-full">
            Let&apos;s make sure you&apos;re you
          </h1>
          <p className="text-[13px] md:text-[15px] leading-[1.4] font-normal text-[#828282] mb-3 md:mb-3 text-left md:text-center w-full">
            A live photo of your face is required to verify your identity.
          </p>

          <div className="flex justify-center w-full mb-3 md:mb-4 self-center">
            <img
              src="/selfei.png"
              alt=""
              className="max-w-[180px] md:max-w-[220px] max-h-[100px] md:max-h-[120px] w-auto h-auto object-contain"
            />
          </div>

          <div className="w-full mb-3 md:mb-4">
            <p className="text-[11px] md:text-[12px] leading-[1.45] font-normal text-[#828282] text-left max-w-full break-words">
              By clicking the button below, you consent to Persona, our vendor, collecting, using, and
              utilizing its service providers to process your biometric information to verify your
              identity, identify fraud, and improve Persona&apos;s platform in accordance with its{' '}
              <a
                href="https://withpersona.com/legal/privacy-policy"
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
              onClick={handleBack}
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

      {/* Mobile: fixed Continue at bottom - same as documents page (color, radius, height) */}
      <div className="md:hidden flex-shrink-0 px-4 pb-6 pt-4 bg-[#F5F5F5] border-t border-[#E8E8E9]">
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

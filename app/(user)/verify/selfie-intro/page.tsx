'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/Button'
import { PoweredBy } from '@/components/verify/PoweredBy'
import { VerifyMobileBackRow } from '@/components/verify/VerifyMobileBackRow'
import { SpinnerIcon } from '@/components/verify/SpinnerIcon'

const Lottie = dynamic(() => import('lottie-react'), { ssr: false })
const FACE_SCAN_ANIMATION_PATH = '/animations/selfei/Face%20scan%20animation%20(1).json'

export default function SelfieIntroPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isUpdateMode = searchParams.get('update') === 'true'
  const updateEmail = searchParams.get('email') || ''
  const [animationData, setAnimationData] = useState<object | null>(null)
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

  useEffect(() => {
    fetch(FACE_SCAN_ANIMATION_PATH)
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch(() => {})
  }, [])

  const handleContinue = () => {
    setLoading(true)
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
    <div className="h-full md:h-screen bg-[#FFFFFF] flex flex-col overflow-hidden">
      <VerifyMobileBackRow onBack={handleBack} className="!pt-3 !pb-0" />

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden px-4 pt-2 pb-[92px] md:pb-6 md:px-6 md:pt-6">
        {/* Desktop card wrapper */}
        <div className="w-full md:max-w-[680px] md:mx-auto md:bg-white md:rounded-[14px] md:border-[1.5px] md:border-[#E8E8E9] md:shadow-md md:px-6 md:py-6 flex flex-col min-h-0">
          {/* Title + subtitle */}
          <div className="w-full">
            <h1 className="text-[26px] md:text-[26px] font-bold leading-[110%] tracking-[0%] text-[#000000] text-left md:text-center">
              Let&apos;s make sure you&apos;re you
            </h1>
            <p className="mt-2 text-[16px] font-normal leading-[125%] tracking-[0%] text-[#545454] text-left md:text-center">
              A live photo of your face is required to verify your identity.
            </p>
          </div>

          {/* Center animation (mobile size per provided layout) */}
          <div className="flex-1 min-h-0 flex items-center justify-center pt-4 pb-6 md:py-8">
            {animationData ? (
              <div className="w-[168px] h-[197px] md:w-[320px] md:h-[320px]">
                <Lottie animationData={animationData} loop className="w-full h-full" />
              </div>
            ) : (
              <div className="w-[168px] h-[197px] md:w-[320px] md:h-[320px] rounded-2xl bg-[#F5F5F5]" />
            )}
          </div>

          {/* Consent text */}
          <p className="text-[12px] md:text-[12px] font-normal leading-[140%] tracking-[0%] text-[#545454] text-left md:text-center">
            By clicking the button below, you consent to Persona, our vendor, collecting, using, and utilizing its service
            providers to process your biometric information to verify your identity, identify fraud, and improve
            Persona&apos;s platform in accordance with its{' '}
            <a
              href="https://withpersona.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#545454] underline font-medium"
            >
              Privacy Policy
            </a>
            . Your biometric information will be stored for no more than 3 years.
          </p>

          {/* Mobile Continue (in-flow, near text like reference) */}
          <div className="md:hidden w-full mt-5">
            <button
              type="button"
              onClick={handleContinue}
              disabled={loading}
              className="w-full h-[56px] rounded-[14px] bg-[#A7D80D] hover:bg-[#9BC90C] text-black text-[16px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <SpinnerIcon color="#000000" /> : 'Continue'}
            </button>
          </div>

          {/* Desktop buttons */}
          <div className="hidden md:flex flex-col items-center w-full mt-6">
            <button
              type="button"
              onClick={handleContinue}
              disabled={loading}
              className="w-full h-[56px] rounded-[14px] bg-[#A7D80D] hover:bg-[#9BC90C] text-black text-[16px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <SpinnerIcon color="#000000" /> : 'Continue'}
            </button>
            <button
              type="button"
              onClick={handleBack}
              className="mt-5 text-[#545454] text-[14px] font-normal hover:text-[#000000] transition-colors"
            >
              ← Back to Previous
            </button>
          </div>
        </div>
      </main>

      <PoweredBy />

      {/* Mobile fixed CTA removed (in-flow button used) */}
    </div>
  )
}

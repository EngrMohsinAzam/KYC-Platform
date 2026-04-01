'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getKycPausedStatus } from '@/app/api/api'
import { clearCompanyContext, setCompanyContext } from '@/app/(public)/utils/kyc-company-context'
import { clearAllKYCCaches } from '@/app/(public)/utils/kyc-cache'
import { useAppContext } from '@/context/useAppContext'
import { PoweredBy } from '@/components/verify/PoweredBy'
import { SpinnerIcon } from '@/components/verify/SpinnerIcon'

function StartContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { dispatch } = useAppContext()
  const slug = searchParams.get('slug')?.trim()
  const id = searchParams.get('id')?.trim()
  const hasCompanyLink = !!(slug && id)

  const [paused, setPaused] = useState(false)
  const [pausedMessage, setPausedMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(hasCompanyLink)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)

  // When user lands on start (or refreshes here), clear all KYC data so a new run has empty fields, selfie, and document
  useEffect(() => {
    dispatch({ type: 'CLEAR_KYC_DATA' })
    clearAllKYCCaches().catch(() => {})
  }, [dispatch])

  useEffect(() => {
    if (!hasCompanyLink) {
      clearCompanyContext()
      return
    }
    const validate = async () => {
      setError('')
      try {
        const res = await fetch(
          `/api/company/validate/${encodeURIComponent(slug!)}/${encodeURIComponent(id!)}`
        )
        const data = await res.json()
        if (data?.success && data?.data?.valid) {
          const name = data.data.companyName || 'Company'
          setCompanyContext({ companyId: id!, companySlug: slug!, companyName: name })
          setLoading(false)
          return
        }
        setError(data?.message || 'Invalid or inactive company.')
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Validation failed.')
      } finally {
        setLoading(false)
      }
    }
    validate()
  }, [hasCompanyLink, slug, id, router])

  useEffect(() => {
    const check = async () => {
      try {
        const res = await getKycPausedStatus()
        const isPaused = !!(res?.data?.kycPaused ?? (res as { kycPaused?: boolean })?.kycPaused)
        setPaused(isPaused)
        if (isPaused) setPausedMessage('KYC verification is temporarily paused. Please try again later.')
      } catch {
        /* ignore */
      }
    }
    check()
  }, [])

  const handleStart = () => {
    setStarting(true)
    router.push('/verify/enter-email')
  }

  if (hasCompanyLink && loading) {
    return (
      <div className="h-full md:h-screen overflow-hidden bg-[#FFFFFF] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-primary" />
      </div>
    )
  }

  if (hasCompanyLink && error) {
    return (
      <div className="h-full md:h-screen overflow-hidden bg-[#FFFFFF] flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-[640px] w-full text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/" className="text-sm text-[#6B7280] hover:underline">X Close</Link>
        </div>
        <PoweredBy />
      </div>
    )
  }

  return (
    <div className="h-full md:h-screen overflow-hidden bg-[#FFFFFF] flex flex-col">
      {/* Mobile: top-right X close */}
      <div className="md:hidden flex-shrink-0 flex justify-end pt-3 pr-4 pb-1">
        <button
          type="button"
          aria-label="Close"
          // onClick={() => router.push('/')}
          className="h-8 w-5 flex items-center justify-center text-[#111] hover:opacity-80 transition-opacity"
        >
      
        </button>
      </div>

      {/* Main: mobile = center illustration in middle; desktop = card 723×623, top 96px, left 279px */}
      <main className="flex-1 w-full overflow-hidden flex flex-col items-center justify-center px-4 pt-2 pb-32 md:py-8 min-h-0">
        <div
          className="w-full max-w-[680px] md:w-[723px] md:max-w-[min(723px,calc(100vw-80px))] md:max-h-[min(623px,calc(100dvh-128px))] md:min-h-0 flex flex-col items-center md:bg-white md:rounded-[14px]  md:border-2 md:border-[#D3D3D3]  md:px-8 md:py-[37px]  md:flex md:overflow-hidden flex-1 md:flex-initial min-h-0"
          style={{ opacity: 1 }}
        >
          {/* Title + Subtitle - centered: Inter 24px/700 #000, 16px/400 #545454 */}
          <section className="w-full flex-shrink-0 text-center mb-3 md:mb-4">
            <h1 className="font-sans text-[24px] font-bold leading-[100%] tracking-[0%] text-[#000000] mb-1.5 md:mb-2">
              Let&apos;s Get You Verified
            </h1>
            <p className="font-sans text-[16px] font-normal leading-[100%] tracking-[0%] text-[#545454]">
              Fast, encrypted identity verification.
            </p>
          </section>

          {/* Illustration - vertically centered on mobile; flexible on desktop */}
          <div className="w-full flex-1 min-h-0 flex items-center justify-center overflow-hidden py-4 md:py-0">
            <div className="relative w-full max-w-[320px] aspect-[320/240] md:max-w-[340px] md:aspect-[340/255]">
              <Image
                src="/Start-page.png"
                alt="Identity verification - padlock, shield and form"
                fill
                className="object-contain object-center"
                priority
                sizes="(max-width: 768px) 320px, 340px"
              />
            </div>
          </div>

          {/* Desktop: button 670x54, 12px radius, #A7D80D + X Close */}
          <div className="hidden md:flex flex-col flex-shrink-0 w-full items-center mt-4">
            {paused && pausedMessage ? (
              <div className="w-full max-w-[670px] p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm text-center">
                {pausedMessage}
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleStart}
                  disabled={starting}
                  className="w-full max-w-[670px] h-[50px] rounded-[12px] bg-[#A7D80D] hover:opacity-95 active:opacity-90 text-black text-base font-semibold transition-opacity focus:outline-none focus:ring-2 focus:ring-[#A7D80D] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {starting ? <SpinnerIcon color="#000000" /> : 'Start KYC'}
                </button>
                <Link
                  href="/"
                  className="mt-4 text-sm text-[#6B7280] hover:text-[#374151] transition-colors"
                >
           
                </Link>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Mobile: fixed bottom - button 341px width, 50px height, 17px horizontal padding; raised a bit from bottom */}
      {!paused && !pausedMessage && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 px-[17px] pb-8 pt-2 bg-gradient-to-t from-[#FFFFFF] to-transparent flex justify-center">
          <button
            type="button"
            onClick={handleStart}
            disabled={starting}
            className="w-full h-[50px] rounded-[12px] bg-[#A7D80D] hover:opacity-95 active:opacity-90 text-black text-[16px] font-semibold transition-opacity focus:outline-none focus:ring-2 focus:ring-[#A7D80D] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {starting ? <SpinnerIcon color="#000000" /> : 'Start KYC'}
          </button>
        </div>
      )}
      {paused && pausedMessage && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 px-4 pb-4 pt-2 bg-gradient-to-t from-[#FFFFFF] to-transparent">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm text-center">
            {pausedMessage}
          </div>
        </div>
      )}

      <PoweredBy />
    </div>
  )
}

export default function StartVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full md:h-screen overflow-hidden bg-[#FFFFFF] flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-primary" />
        </div>
      }
    >
      <StartContent />
    </Suspense>
  )
}

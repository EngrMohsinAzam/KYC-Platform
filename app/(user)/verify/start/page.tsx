'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getKycPausedStatus } from '@/app/api/api'
import { clearCompanyContext, setCompanyContext } from '@/app/(public)/utils/kyc-company-context'
import { clearAllKYCCaches } from '@/app/(public)/utils/kyc-cache'
import { useAppContext } from '@/context/useAppContext'
import { Button } from '@/components/ui/Button'
import { PoweredBy } from '@/components/verify/PoweredBy'

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
    router.push('/verify/enter-email')
  }

  if (hasCompanyLink && loading) {
    return (
      <div className="min-h-screen h-[100dvh] md:h-screen overflow-hidden bg-[#FFFFFF] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-primary" />
      </div>
    )
  }

  if (hasCompanyLink && error) {
    return (
      <div className="min-h-screen h-[100dvh] md:h-screen overflow-hidden bg-[#FFFFFF] flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-[640px] w-full text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/" className="text-sm text-[#6B7280] hover:underline">X Close</Link>
        </div>
        <PoweredBy />
      </div>
    )
  }

  return (
    <div className="min-h-screen h-[100dvh] md:h-screen overflow-hidden bg-[#FFFFFF] flex flex-col">
      {/* Mobile: top-right close (X), desktop handled by layout header if needed */}
      {/* <div className="md:hidden flex-shrink-0 flex justify-end pt-3 pr-4 pb-1">
        <button
          type="button"
          aria-label="Close"
          onClick={() => router.push('/')}
          className="h-8 w-8 flex items-center justify-center text-[#4B5563] hover:text-[#111] transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div> */}

      {/* Main: full-width on mobile, card container only on desktop */}
      <main className="flex-1 w-full overflow-hidden md:overflow-y-auto flex flex-col items-center justify-center px-4 pt-1 pb-28 md:pt-6 md:pb-6 md:py-8 min-h-0">
        <div className="w-full max-w-[680px] md:border-[1.5px] md:border-[#E8E8E9] md:rounded-[14px] md:bg-white md:px-5 md:py-4">
          {/* 1. Title + Subtitle - top, centered */}
          <div className="flex-shrink-0 w-full text-center">
            <h1 className="text-2xl md:text-[28px] font-bold text-[#212121] mb-3">
              Let&apos;s Get You Verified
            </h1>
            <p className="text-sm md:text-base text-[#6B7280] font-normal">
              Fast, encrypted identity verification.
            </p>
          </div>

          {/* 2. Illustration - mobile: slightly zoomed and centered; desktop: same */}
          <div className="flex-shrink-0 w-full flex items-center justify-center py-4 md:py-6 overflow-hidden">
            <div className="relative w-[160px] h-[180px] md:w-[160px] md:h-[180px] mx-auto">
              <Image
                src="/Start-Page.gif"
                alt="Identity verification"
                fill
                className="object-contain object-center"
                unoptimized
                priority
                sizes="(max-width: 768px) 160px, 160px"
              />
            </div>
          </div>

          {/* 3. Button - desktop only (mobile uses fixed bottom bar below) */}
          <div className="hidden md:flex flex-shrink-0 w-full flex-col items-center mt-4">
            {paused && pausedMessage ? (
              <div className="w-full p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm mb-4 text-center">
                {pausedMessage}
              </div>
            ) : (
              <Button
                onClick={handleStart}
                variant="primary"
                className="w-full max-w-[670px] h-[54px] !rounded-[14px] !bg-[#6D3CCC] hover:!bg-[#8558D9] focus:!bg-[#6D3CCC] focus:!ring-0 focus:!ring-offset-0 !text-white text-[16px] font-semibold"
              >
                Start KYC
              </Button>
            )}
          </div>
        </div>
      </main>

      {/* Mobile: fixed bottom bar with Start KYC button (same as other verify pages) */}
      {!paused && !pausedMessage && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 px-4 pb-4 pt-2 bg-gradient-to-t from-[#FFFFFF] to-transparent flex justify-center">
          <Button
            onClick={handleStart}
            variant="primary"
            className="w-full max-w-[341px] h-[54px] !rounded-[14px] !bg-[#6D3CCC] hover:!bg-[#8558D9] focus:!bg-[#6D3CCC] focus:!ring-0 focus:!ring-offset-0 !text-white text-[16px] font-semibold"
          >
            Start KYC
          </Button>
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
        <div className="min-h-screen h-[100dvh] md:h-screen overflow-hidden bg-[#FFFFFF] flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-primary" />
        </div>
      }
    >
      <StartContent />
    </Suspense>
  )
}

'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { getKycPausedStatus } from '@/app/api/api'
import { clearCompanyContext, setCompanyContext, getCompanyContext } from '@/app/(public)/utils/kyc-company-context'

function StartContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const slug = searchParams.get('slug')?.trim()
  const id = searchParams.get('id')?.trim()
  const hasCompanyLink = !!(slug && id)

  const [paused, setPaused] = useState(false)
  const [pausedMessage, setPausedMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(hasCompanyLink)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!hasCompanyLink) {
      clearCompanyContext()
      return
    }
    let redirected = false
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
          router.replace('/verify/enter-email')
          redirected = true
          return
        }
        setError(data?.message || 'Invalid or inactive company.')
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Validation failed.')
      } finally {
        if (!redirected) setLoading(false)
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
    if (getCompanyContext()) {
      router.push('/verify/enter-email')
    } else {
      router.push('/verify/select-id-type')
    }
  }

  if (hasCompanyLink && loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header showBack onBack={() => router.push('/')} title="Start verification" />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-gray-900" />
        </main>
        <Footer />
      </div>
    )
  }

  if (hasCompanyLink && error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header showBack onBack={() => router.push('/')} title="Start verification" />
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <div className="text-center max-w-md">
            <p className="text-red-600 mb-4">{error}</p>
            <Link href="/" className="text-sm text-gray-600 hover:underline">Back to home</Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header showBack onBack={() => router.push('/')} title="Start verification" />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 md:py-12">
        <div className="w-full max-w-lg mx-auto text-center">
          <div className="flex justify-center mb-6">
            <Image src="/Logo.png" alt="DigiPort" width={140} height={48} className="h-10 w-auto" />
          </div>

          <h1 className="text-xl md:text-2xl font-semibold text-gray-900 mb-3">
            Start KYC verification
          </h1>
          <p className="text-sm md:text-base text-gray-600 mb-8">
            Verify your identity in a few steps. You&apos;ll need a government-issued ID and a selfie.
          </p>

          {paused && pausedMessage ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              {pausedMessage}
            </div>
          ) : (
            <>
              <ProgressBar currentStep={0} totalSteps={1} />
              <div className="mt-8">
                <button
                  onClick={handleStart}
                  className="w-full md:w-auto min-w-[200px] px-6 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 mx-auto"
                >
                  Start verification
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <p className="mt-4 text-xs text-gray-500 space-x-4">
                <Link href="/" className="text-gray-600 hover:underline">Back to home</Link>
                <Link href="/support" className="text-gray-600 hover:underline">Contact support</Link>
              </p>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function StartVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <StartContent />
    </Suspense>
  )
}

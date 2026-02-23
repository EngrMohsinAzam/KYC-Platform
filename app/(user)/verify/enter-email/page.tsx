'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAppContext } from '@/context/useAppContext'
import { getCompanyContext } from '@/app/(public)/utils/kyc-company-context'
import { checkStatusByEmail } from '@/app/api/api'

const validateEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export default function EnterEmailPage() {
  const router = useRouter()
  const { dispatch } = useAppContext()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const ctx = getCompanyContext()
    const isLocalPreviewHost =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

    if (!ctx?.companyId || !ctx?.companySlug) {
      if (!isLocalPreviewHost) {
        router.replace('/verify/start')
        return
      }
    }
    setChecking(false)
  }, [router])

  const handleContinue = async () => {
    setError(null)
    const trimmed = email.trim()
    if (!trimmed) {
      setError('Please enter your email address')
      return
    }
    if (!validateEmail(trimmed)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    const ctx = getCompanyContext()
    const companyId = ctx?.companyId ?? null

    try {
      const result = await checkStatusByEmail(trimmed, companyId ?? undefined)
      if (!result.success || !result.data) {
        setError(result.message ?? 'Could not check status. Please try again.')
        setLoading(false)
        return
      }

      const status = result.data.verificationStatus ?? result.data.kycStatus

      if (status === 'approved') {
        router.push('/decentralized-id/complete')
        return
      }
      if (status === 'pending' || status === 'submitted' || status === 'under_review' || status === 'underReview') {
        router.push('/verify/under-review')
        return
      }
      if (status === 'cancelled' || status === 'rejected') {
        router.push(`/verify/rejected?email=${encodeURIComponent(trimmed)}`)
        return
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not verify your email. Please try again.'
      setError(msg)
      setLoading(false)
      return
    }

    dispatch({
      type: 'SET_PERSONAL_INFO',
      payload: {
        firstName: '',
        lastName: '',
        fatherName: '',
        idNumber: '',
        email: trimmed,
        phone: '',
        address: '',
      },
    })
    setLoading(false)
    router.push('/verify/select-id-type')
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex flex-col">
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-gray-900" />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col">
      <div className="md:hidden flex justify-end px-4 pt-3">
        <button
          type="button"
          aria-label="Close"
          onClick={() => router.push('/verify/start')}
          className="h-8 w-8 inline-flex items-center justify-center text-[#828282] hover:text-[#000000] transition-colors"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <main className="flex-1 flex flex-col items-center md:justify-center px-4 pt-6 pb-24 md:py-12">
        <section className="hidden md:block text-center mb-7">
          <h1 className="text-[34px] leading-[1.2] font-bold text-[#000000]">Tell us about yourself</h1>
          <p className="mt-2 text-[16px] leading-[1.5] font-normal text-[#828282]">
            We&apos;re required to collect this verify your identity.
          </p>
        </section>

        <div className="w-full max-w-[760px] md:bg-transparent md:border-2 md:border-[#E8E8E9] md:rounded-[14px] md:px-5 md:py-6">
          <div className="mb-4">
            <label className="block text-[16px] md:text-[18px] leading-[1.4] font-semibold text-[#000000] mb-2">
              Email
            </label>
            <p className="text-[14px] md:text-[16px] leading-[1.4] font-normal text-[#828282] mb-3">
              Enter the email address you&apos;d like to use
            </p>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading && email.trim()) {
                  void handleContinue()
                }
              }}
              disabled={loading}
              className="w-full h-[48px] md:h-[52px] rounded-[12px] md:rounded-[10px] border-[#6D3CCC] bg-[#E8E8E9] md:bg-[#E8E8E9] placeholder:text-[#828282] text-[#000000] text-[14px] md:text-[16px] px-4 focus:ring-[#6D3CCC]/20 focus:border-[#6D3CCC]"
            />
          </div>

          {error && (
            <div className="mb-4">
              <p className="text-sm md:text-base text-red-600">{error}</p>
            </div>
          )}

          <Button
            onClick={() => void handleContinue()}
            disabled={loading || !email.trim()}
            className="hidden md:block h-[52px] !rounded-[12px] bg-[#6D3CCC] hover:bg-[#6D3CCC] disabled:bg-[#6D3CCC] disabled:opacity-100 text-white disabled:text-white text-[16px] font-semibold"
          >
            {loading ? 'Checking...' : 'Continue'}
          </Button>

          <button
            type="button"
            onClick={() => router.push('/verify/start')}
            className="hidden md:flex items-center justify-center gap-2 text-[#828282] text-[14px] leading-none font-normal mt-7 mx-auto hover:text-[#000000] transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
            </svg>
            Back to Previous
          </button>
        </div>
      </main>

      <div className="md:hidden fixed bottom-0 left-0 right-0 px-4 pb-4 pt-2 bg-gradient-to-t from-[#FFFFFF] to-transparent">
        <Button
          onClick={() => void handleContinue()}
          disabled={loading || !email.trim()}
          className="h-[48px] !rounded-[14px] bg-[#6D3CCC] hover:bg-[#6D3CCC] disabled:bg-[#6D3CCC] disabled:opacity-100 text-white disabled:text-white font-semibold text-[16px]"
        >
          {loading ? 'Checking...' : 'Continue'}
        </Button>
      </div>
    </div>
  )
}

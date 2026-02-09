'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Header } from '@/components/layout/Header'
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
    if (!ctx?.companyId || !ctx?.companySlug) {
      router.replace('/verify/start')
      return
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
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header showBack onBack={() => router.push('/')} title="Enter your email" />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-gray-900" />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header showBack onBack={() => router.push('/verify/start')} title="Enter your email" />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 md:py-12">
        <div className="w-full max-w-md mx-auto">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2 text-center">
            Give us your email
          </h1>
          <p className="text-sm text-gray-600 mb-6 text-center">
            Enter your email. We&apos;ll check if you&apos;ve already verified with this company, then continue.
          </p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email address
            </label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError(null)
              }}
              disabled={loading}
              className="w-full"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button
            onClick={() => void handleContinue()}
            disabled={loading || !email.trim()}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl py-3"
          >
            {loading ? 'Checking…' : 'Continue'}
          </Button>
        </div>
      </main>
    </div>
  )
}

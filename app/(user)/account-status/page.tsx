'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Footer } from '@/components/layout/Footer'
import { getSignupEmailCookie } from '@/app/(public)/utils/signup-cookie'
import { getCompanyToken } from '@/app/api/company-api'
import { APP_BASE_URL } from '@/app/(public)/config'

type StatusData = {
  email: string
  status: 'pending' | 'approved' | 'rejected'
  companyName?: string
  submittedAt?: string
  companyId?: string
  companySlug?: string
  kycUrl?: string
  approvedAt?: string
  rejectionReason?: string
}

async function checkStatus(email: string): Promise<{ success: boolean; data?: StatusData; message?: string }> {
  const res = await fetch('/api/company/check-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  return res.json()
}

function AccountStatusContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<StatusData | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [emailInput, setEmailInput] = useState('')
  const [signedIn, setSignedIn] = useState(false)

  const base = typeof window !== 'undefined' ? window.location.origin : (APP_BASE_URL || 'https://www.digiportid.com')
  const kycUrl = data?.kycUrl || (data?.companySlug && data?.companyId
    ? `${base}/verify/start/${data.companySlug}/${data.companyId}`
    : '')

  const copy = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    })
  }, [])

  const fetchStatus = useCallback(async (e?: string) => {
    const em = (e ?? email).trim()
    if (!em) return
    setError('')
    setFetching(true)
    try {
      const r = await checkStatus(em)
      if (!r.success) {
        setError(r.message || 'Failed to fetch status')
        setData(null)
        return
      }
      setData(r.data ?? null)
      setEmail(em)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setData(null)
    } finally {
      setFetching(false)
      setLoading(false)
    }
  }, [email])

  useEffect(() => {
    setSignedIn(!!getSignupEmailCookie() || !!getCompanyToken())
  }, [])

  useEffect(() => {
    const fromUrl = searchParams.get('email')?.trim()
    const fromCookie = getSignupEmailCookie()?.trim()
    const em = fromUrl || fromCookie || ''
    if (em) {
      setEmail(em)
      fetchStatus(em)
    } else {
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading && !data && !error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-gray-900" />
      </div>
    )
  }

  const showEmailForm = !email && !data
  const isPending = data?.status === 'pending'
  const isApproved = data?.status === 'approved'
  const isRejected = data?.status === 'rejected'

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 md:h-16">
            <div className="flex items-center gap-2 md:gap-3">
              <Image src="/kyclogo.svg" alt="DigiPort" width={120} height={40} className="h-6 md:h-8 w-auto" priority />
              <span className="text-base md:text-xl font-bold text-gray-900">DigiPort</span>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/#features" className="text-sm text-gray-600 hover:text-gray-900">Products</Link>
              <Link href="/#solutions" className="text-sm text-gray-600 hover:text-gray-900">Solutions</Link>
              <Link href="/#pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</Link>
              <Link href="/company/register" className="text-sm text-gray-600 hover:text-gray-900">Company registration</Link>
            </nav>
            <div className="flex items-center gap-2">
              {signedIn ? (
                <>
                  <Link href="/account-status" className="text-sm text-gray-900 hover:text-gray-700 font-medium">Account</Link>
                  <Link href="/dashboard" className="bg-gray-900 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium hover:bg-gray-800">
                    Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/signin" className="text-sm text-gray-900 hover:text-gray-700 font-medium">Sign in</Link>
                  <Link href="/verify/start" className="bg-gray-900 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium hover:bg-gray-800">
                    Get started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {showEmailForm && (
          <div className="space-y-6">
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Check registration status</h1>
            <p className="text-sm text-gray-600">Enter your company email to see your application status.</p>
            <form
              onSubmit={(e) => { e.preventDefault(); fetchStatus(emailInput) }}
              className="space-y-4"
            >
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="company@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                required
              />
              <button
                type="submit"
                disabled={fetching}
                className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-semibold py-3 rounded-xl"
              >
                {fetching ? 'Checking…' : 'Check status'}
              </button>
            </form>
            <p className="text-sm text-gray-500">
              Just signed up? <Link href="/signup" className="text-gray-900 font-medium hover:underline">Sign up</Link> or{' '}
              <Link href="/signin" className="text-gray-900 font-medium hover:underline">sign in</Link>.
            </p>
          </div>
        )}

        {error && !showEmailForm && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        {data && isPending && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">Account pending</h1>
              <p className="text-sm text-gray-600">Your application is under review. We&apos;ll notify you once it&apos;s approved.</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center w-full">
                {[
                  { n: 1, label: 'Submitted', status: 'completed' as const },
                  { n: 2, label: 'Under review', status: 'active' as const },
                  { n: 3, label: 'Review complete', status: 'pending' as const },
                  { n: 4, label: 'Account active', status: 'locked' as const },
                ].map((s, idx) => (
                  <div key={s.n} className="flex items-center flex-1 min-w-0">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${
                          s.status === 'completed'
                            ? 'bg-black border-2 border-gray-900 text-white'
                            : s.status === 'active'
                            ? 'bg-gray-900 border-2 border-gray-900 text-white'
                            : 'bg-gray-100 border border-gray-300 text-gray-500'
                        }`}
                      >
                        {s.status === 'completed' ? (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : s.status === 'locked' ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        ) : (
                          <span className="text-base font-semibold">{s.n}</span>
                        )}
                      </div>
                      <span className={`text-xs mt-2 font-medium ${
                        s.status === 'locked' ? 'text-gray-400' : 'text-gray-900'
                      }`}>
                        {s.label}
                      </span>
                    </div>
                    {idx < 3 && (
                      <div className={`flex-1 mx-1 min-w-[16px] ${
                        s.status === 'completed' ? 'bg-gray-900 h-1' : 'bg-gray-200 h-0.5'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="flex flex-col items-center justify-center py-4">
                <p className="text-sm text-gray-600 mb-1"><strong>{data.companyName || 'Your company'}</strong></p>
                <p className="text-xs text-gray-500">{data.email}</p>
                {data.submittedAt && (
                  <p className="text-xs text-gray-500 mt-1">Submitted {new Date(data.submittedAt).toLocaleDateString()}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => fetchStatus()} disabled={fetching} className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50">
                {fetching ? 'Checking…' : 'Check again'}
              </button>
              <Link href="/" className="px-6 py-2.5 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 text-center">
                Back to home
              </Link>
            </div>
          </div>
        )}

        {data && isRejected && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">Application not approved</h1>
              <p className="text-sm text-gray-600">Your company application was not approved.</p>
            </div>
            <div className="bg-red-50 rounded-xl p-6 border border-red-200">
              <p className="text-sm font-medium text-gray-900">{data.companyName}</p>
              <p className="text-xs text-gray-600 mt-1">{data.email}</p>
              {data.rejectionReason && (
                <p className="text-sm text-gray-700 mt-3 p-3 bg-white rounded-lg border border-red-100">{data.rejectionReason}</p>
              )}
            </div>
            <div className="flex justify-center">
              <Link href="/" className="px-6 py-2.5 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800">
                Back to home
              </Link>
            </div>
          </div>
        )}

        {data && isApproved && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">Welcome to DigiPort</h1>
              <p className="text-sm text-gray-600">Your account has been approved.</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-yellow-800">
                Use your login email and the password we sent you to access the dashboard.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Company</label>
                <div className="flex gap-2">
                  <input readOnly value={data.companyName || ''} className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm" />
                  <button type="button" onClick={() => copy(data.companyName || '', 'company')} className="px-3 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800">
                    {copied === 'company' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
              {kycUrl && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">KYC URL</label>
                  <div className="flex gap-2">
                    <input readOnly value={kycUrl} className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-mono truncate" />
                    <button type="button" onClick={() => copy(kycUrl, 'kyc')} className="px-3 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800">
                      {copied === 'kyc' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}
              {data.approvedAt && (
                <p className="text-xs text-gray-500">Approved {new Date(data.approvedAt).toLocaleString()}</p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/dashboard" className="px-6 py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 text-center">
                Go to Dashboard
              </Link>
              <Link href="/signin" className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 text-center">
                Sign in
              </Link>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

export default function AccountStatusPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-gray-900" />
      </div>
    }>
      <AccountStatusContent />
    </Suspense>
  )
}

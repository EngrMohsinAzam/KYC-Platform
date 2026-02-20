'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

function PendingContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  const steps = [
    { n: 1, label: 'Submitted', status: 'completed' as const },
    { n: 2, label: 'Under review', status: 'active' as const },
    { n: 3, label: 'Review complete', status: 'pending' as const },
    { n: 4, label: 'Account active', status: 'locked' as const },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2">
            <Image src="/kyclogo.svg" alt="DigiPort" width={32} height={32} className="h-8 w-auto" />
            <span className="font-bold text-gray-900">DigiPort</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <h1 className="text-xl font-semibold text-gray-900 mb-2 text-center">Application pending</h1>
          <p className="text-gray-600 mb-6 text-center text-sm">
            Your company registration has been submitted. We&apos;ll review it and get back to you soon. You&apos;ll receive an email at {email ? <strong>{email}</strong> : 'your registered email'} once approved.
          </p>

          <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
            <div className="flex items-center w-full">
              {steps.map((s, idx) => (
                <div key={s.n} className="flex items-center flex-1 min-w-0">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${
                        s.status === 'completed'
                          ? 'bg-green-500 border-2 border-gray-900 text-white'
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
                  {idx < steps.length - 1 && (
                    <div className={`flex-1 mx-1 min-w-[16px] ${
                      s.status === 'completed' ? 'bg-gray-900 h-1' : 'bg-gray-200 h-0.5'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/company/register" className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 text-center">
              Submit another
            </Link>
            <Link href="/" className="px-4 py-2 rounded-xl bg-gray-900 text-white font-medium hover:bg-gray-800 text-center">
              Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function CompanyRegisterPendingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading…</div>}>
      <PendingContent />
    </Suspense>
  )
}

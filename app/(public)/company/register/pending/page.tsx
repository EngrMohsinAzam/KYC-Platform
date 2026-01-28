'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

function PendingContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2">
            <Image src="/Logo.png" alt="DigiPort" width={32} height={32} className="h-8 w-auto" />
            <span className="font-bold text-gray-900">DigiPort</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 text-amber-600 mb-6">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Application pending</h1>
          <p className="text-gray-600 mb-6">
            Your company registration has been submitted. We&apos;ll review it and get back to you soon. You&apos;ll receive an email at {email ? <strong>{email}</strong> : 'your registered email'} once approved.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/company/register" className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50">
              Submit another
            </Link>
            <Link href="/" className="px-4 py-2 rounded-xl bg-gray-900 text-white font-medium hover:bg-gray-800">
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

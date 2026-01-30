'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Header } from '@/components/layout/Header'

export default function UnderReview() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white md:bg-surface-gray flex flex-col">
      <Header showClose />
      <main className="flex-1 px-4 md:px-0 pt-8 pb-24 md:flex md:items-center md:justify-center">
        <div className="w-full max-w-md md:bg-white p-4 rounded-2xl md:shadow-lg md:p-8 md:my-8 border-[2px] border-grey-400">
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-6 bg-green-50 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-4">
              Under Review
            </h1>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              Your KYC verification has been submitted successfully!
            </p>
            <p className="text-sm text-text-secondary leading-relaxed mb-6">
              Your application is now under review. You will be notified once the verification is complete.
            </p>
          </div>

          <div className="md:block fixed md:relative bottom-0 left-0 right-0 p-4 bg-white md:bg-transparent border-t md:border-t-0 border-surface-light space-y-3">
            <Button
              onClick={() => router.push('/')}
              className="w-full"
            >
              Go to Home
            </Button>
            <Link href="/support" className="block w-full">
              <Button variant="secondary" className="w-full">
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}


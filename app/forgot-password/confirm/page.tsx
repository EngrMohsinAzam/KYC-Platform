'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect } from 'react'

export default function ForgotPasswordConfirmPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get('email') || ''

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Blurred Landing Page Background */}
      <div className="fixed inset-0 overflow-y-auto pointer-events-none">
        <div className="min-h-screen bg-white blur-lg scale-105">
          {/* Header */}
          <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-14 md:h-16">
                <div className="flex items-center gap-2 md:gap-3">
                  <Image
                    src="/Logo.png"
                    alt="DigiPort Logo"
                    width={120}
                    height={40}
                    className="h-6 md:h-8 w-auto"
                    priority
                  />
                  <span className="text-base md:text-xl font-bold text-gray-900">DigiPort</span>
                </div>
                <nav className="hidden md:flex items-center space-x-6">
                  <a href="#features" className="text-sm text-gray-600">Products</a>
                  <a href="#solutions" className="text-sm text-gray-600">Solutions</a>
                  <a href="#resources" className="text-sm text-gray-600">Resources</a>
                  <a href="#company" className="text-sm text-gray-600">Company</a>
                  <a href="#pricing" className="text-sm text-gray-600">Pricing</a>
                </nav>
                <div className="flex items-center gap-2 md:space-x-4">
                  <button className="hidden md:block text-sm text-gray-900">Sign In</button>
                  <button className="bg-gray-900 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium">
                    Get started
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Hero Section Preview */}
          <section className="pt-8 md:pt-12 pb-12 md:pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="grid md:grid-cols-2 gap-6 md:gap-12 items-center">
                <div>
                  <h1 className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-semibold text-gray-900 mb-3 md:mb-4">
                    Fast KYC, full compliance, and high pass rates—all in one platform
                  </h1>
                  <p className="text-xs md:text-sm lg:text-base text-gray-600 mb-5 md:mb-6">
                    Maximize pass rates, stop fraud in its tracks, and stay compliant worldwide with customizable User Verification.
                  </p>
                </div>
                <div className="relative flex items-center justify-center">
                  <div className="w-full max-w-full md:max-w-[75%]">
                    <Image
                      src="/Hero.png"
                      alt="DigiPort Dashboard"
                      width={600}
                      height={450}
                      className="rounded-lg shadow-2xl w-full h-auto object-contain"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Additional sections for visual depth */}
          <section className="py-8 md:py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-6 h-32"></div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Dark Overlay for better card visibility */}
      <div className="fixed inset-0 bg-black/20 pointer-events-none z-[5]"></div>

      {/* Form Overlay */}
      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Confirmation Card */}
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-8">
            {/* Logo */}
            <div className="flex items-center justify-center mb-6">
              <Image
                src="/Logo.png"
                alt="DigiPort Logo"
                width={40}
                height={40}
                className="h-10 w-auto"
                priority
              />
            </div>

            {/* Success Icon */}
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <h1 className="text-2xl font-semibold text-gray-900 mb-2 text-center">Check your email</h1>
            <p className="text-sm text-gray-600 mb-6 text-center">
              We&apos;ve sent a password reset link to <span className="font-medium text-gray-900">{email || 'your email address'}</span>. Please check your inbox and follow the instructions to reset your password.
            </p>

            <div className="space-y-4">
              <p className="text-xs text-gray-500 text-center">
                Didn&apos;t receive the email? Check your spam folder or{' '}
                <button
                  onClick={() => router.push('/forgot-password')}
                  className="text-gray-900 font-medium hover:underline"
                >
                  try again
                </button>
              </p>

              {/* Return to Login Link */}
              <div className="pt-4 text-center">
                <Link
                  href="/signin"
                  className="text-sm text-gray-900 font-medium hover:underline inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Return to login
                </Link>
              </div>
            </div>
          </div>

          {/* Footer Copyright */}
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>DigiPort Ltd, {new Date().getFullYear()}. All rights reserved.</p>
            <div className="mt-2 space-x-3">
              <Link href="#" className="hover:text-gray-700">
                Cookie preferences
              </Link>
              <span>•</span>
              <Link href="#" className="hover:text-gray-700">
                Privacy
              </Link>
              <span>•</span>
              <Link href="#" className="hover:text-gray-700">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

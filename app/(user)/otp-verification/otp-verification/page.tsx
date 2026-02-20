'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

// Backend removed - UI only

export default function OTPVerificationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const type = searchParams.get('type') || 'signup' // 'signup' or 'forgot-password'
  
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sendingOTP, setSendingOTP] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const hasAutoSentRef = useRef(false)

  useEffect(() => {
    // Auto-send OTP when component mounts (only once)
    if (email && !otpSent && !hasAutoSentRef.current) {
      hasAutoSentRef.current = true
      handleSendOTP()
    }
  }, [email])

  useEffect(() => {
    // Resend timer countdown
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  const handleSendOTP = async () => {
    if (!email) {
      setError('Email address is required')
      return
    }

    setSendingOTP(true)
    setError(null)

    // Simulate sending OTP (UI only, no backend)
    setTimeout(() => {
      setOtpSent(true)
      setResendTimer(60) // 60 seconds cooldown
      setSendingOTP(false)
    }, 500)
  }

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setError(null)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '')
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split('')
      setOtp(newOtp)
      inputRefs.current[5]?.focus()
    }
  }

  const handleVerify = async () => {
    const otpString = otp.join('')
    
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit OTP code')
      return
    }

    setLoading(true)
    setError(null)

    // Simulate verification (UI only, no backend)
    setTimeout(() => {
      // OTP verified, redirect based on type
      if (type === 'forgot-password') {
        console.log('✅ OTP verified, redirecting to reset password page')
        router.push(`/reset-password?email=${encodeURIComponent(email)}`)
      } else {
        console.log('✅ OTP verified, redirecting to account status pending')
        router.push('/account-status?status=pending')
      }
      setLoading(false)
    }, 500)
  }

  const getTitle = () => {
    if (type === 'forgot-password') {
      return 'Verify your email'
    }
    return 'Enter verification code'
  }

  const getDescription = () => {
    if (type === 'forgot-password') {
      return 'We\'ve sent a 6-digit verification code to verify your email address before resetting your password.'
    }
    return 'We\'ve sent a 6-digit verification code to verify your email address.'
  }

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
                    src="/kyclogo.svg"
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
          {/* OTP Verification Card */}
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-8 relative">
            {/* Back Button */}
            <button
              onClick={() => {
                if (type === 'forgot-password') {
                  router.push('/forgot-password')
                } else {
                  router.push('/signup')
                }
              }}
              className="absolute top-6 left-6 w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Go back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Logo */}
            <div className="flex items-center justify-center mb-6">
              <Image
                src="/kyclogo.svg"
                alt="DigiPort Logo"
                width={40}
                height={40}
                className="h-10 w-auto"
                priority
              />
            </div>

            <div className="mb-2">
              <p className="text-sm text-gray-500 text-center">Check your email</p>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-center">
                {getTitle()}
              </h2>
              <p className="text-sm text-gray-600 mb-6 text-center">
                {getDescription()} <span className="font-semibold text-gray-900">{email}</span>
              </p>

              {/* OTP Input Boxes */}
              <div className="mb-6">
                <div className="flex gap-2 md:gap-3 justify-center" onPaste={handlePaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      disabled={loading}
                      className="w-11 h-12 md:w-12 md:h-14 text-center text-xl md:text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-gray-900 focus:outline-none transition-colors disabled:bg-gray-100"
                    />
                  ))}
                </div>
                {error && (
                  <p className="text-sm text-red-600 mt-3 text-center">{error}</p>
                )}
              </div>

              {/* Resend OTP */}
              <div className="text-center mb-6">
                <p className="text-sm text-gray-600 mb-2">
                  Didn&apos;t receive the code?
                </p>
                <button
                  onClick={handleSendOTP}
                  disabled={sendingOTP || resendTimer > 0 || loading}
                  className="text-sm text-gray-900 font-medium hover:underline disabled:text-gray-400 disabled:no-underline"
                >
                  {sendingOTP
                    ? 'Sending...'
                    : resendTimer > 0
                    ? `Resend code in ${resendTimer}s`
                    : 'Resend code'}
                </button>
              </div>
            </div>

            {/* Verify Button */}
            <button
              onClick={handleVerify}
              disabled={loading || otp.join('').length !== 6}
              className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>
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

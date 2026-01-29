'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { setSignupEmailCookie } from '@/app/(public)/utils/signup-cookie'

const INDUSTRIES = [
  'FinTech', 'Payments', 'Trading', 'Crypto', 'Banking', 'Insurance', 'Real Estate', 'Healthcare',
  'E-commerce', 'Marketplace', 'iGaming', 'Mobility', 'SaaS', 'Telecommunications', 'Education',
  'Legal Services', 'Accounting', 'Consulting', 'Manufacturing', 'Retail', 'Hospitality', 'Travel',
  'Media & Entertainment', 'Non-profit', 'Government', 'Other',
]

type FormData = {
  companyName: string
  ownerName: string
  ownerPhone: string
  email: string
  companyWebsite: string
  companyAddress: string
  industry: string
}

const initialForm: FormData = {
  companyName: '',
  ownerName: '',
  ownerPhone: '',
  email: '',
  companyWebsite: '',
  companyAddress: '',
  industry: '',
}

async function sendOTP(email: string) {
  const res = await fetch('/api/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  return res.json()
}

async function verifyOTP(email: string, otp: string) {
  const res = await fetch('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  })
  return res.json()
}

async function registerCompany(payload: {
  companyName: string
  ownerName: string
  email: string
  phone: string
  address: string
  industry: string
  website?: string
}) {
  const res = await fetch('/api/company/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return res.json()
}

export default function SignUpPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [form, setForm] = useState<FormData>(initialForm)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [resendTimer, setResendTimer] = useState(0)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  const [addressSuggestions, setAddressSuggestions] = useState<Array<{ display_name: string }>>([])
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false)
  const [searchingAddress, setSearchingAddress] = useState(false)

  const searchAddressSuggestions = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setAddressSuggestions([])
      setShowAddressSuggestions(false)
      return
    }
    setSearchingAddress(true)
    try {
      const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      if (data?.error || !Array.isArray(data)) {
        setAddressSuggestions([])
        setShowAddressSuggestions(false)
        return
      }
      setAddressSuggestions(data)
      setShowAddressSuggestions(true)
    } catch {
      setAddressSuggestions([])
      setShowAddressSuggestions(false)
    } finally {
      setSearchingAddress(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      if (form.companyAddress.trim().length >= 2) searchAddressSuggestions(form.companyAddress)
      else {
        setAddressSuggestions([])
        setShowAddressSuggestions(false)
      }
    }, 200)
    return () => clearTimeout(t)
  }, [form.companyAddress])

  useEffect(() => {
    if (resendTimer <= 0) return
    const id = setInterval(() => setResendTimer((x) => (x <= 1 ? 0 : x - 1)), 1000)
    return () => clearInterval(id)
  }, [resendTimer])

  const validateStep1 = (): boolean => {
    if (!form.companyName.trim()) {
      setError('Company name is required')
      return false
    }
    if (!form.ownerName.trim()) {
      setError('Company owner name is required')
      return false
    }
    if (!form.ownerPhone.trim()) {
      setError('Owner phone number is required')
      return false
    }
    if (!form.email.trim()) {
      setError('Email is required')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Please enter a valid email address')
      return false
    }
    if (!form.companyWebsite.trim()) {
      setError('Company website is required')
      return false
    }
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/
    const url = form.companyWebsite.startsWith('http') ? form.companyWebsite : 'https://' + form.companyWebsite
    if (!urlPattern.test(url)) {
      setError('Please enter a valid website URL')
      return false
    }
    if (!form.companyAddress.trim()) {
      setError('Company address is required')
      return false
    }
    if (!form.industry) {
      setError('Industry is required')
      return false
    }
    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy')
      return false
    }
    setError('')
    return true
  }

  const handleContinue = async () => {
    if (!validateStep1()) return
    setError('')
    setLoading(true)
    try {
      const r = await sendOTP(form.email.trim())
      if (!r?.success) {
        setError(r?.message || 'Failed to send verification code')
        return
      }
      setResendTimer(60)
      setStep(2)
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to send verification code')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    setError('')
    setStep(1)
  }

  const handleOtpChange = (i: number, v: string) => {
    if (!/^\d*$/.test(v)) return
    const next = [...otp]
    next[i] = v.slice(-1)
    setOtp(next)
    setError('')
    if (v && i < 5) otpRefs.current[i + 1]?.focus()
  }

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus()
  }

  const handleResend = async () => {
    if (resendTimer > 0) return
    setError('')
    setLoading(true)
    try {
      const r = await sendOTP(form.email.trim())
      if (r?.success) {
        setResendTimer(60)
        setOtp(['', '', '', '', '', ''])
        otpRefs.current[0]?.focus()
      } else setError(r?.message || 'Failed to resend code')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyAndSubmit = async () => {
    const code = otp.join('')
    if (code.length !== 6) {
      setError('Enter the 6-digit code')
      return
    }
    setError('')
    setLoading(true)
    try {
      const r = await verifyOTP(form.email.trim(), code)
      if (!r?.success) {
        setError(r?.message || 'Invalid or expired code')
        return
      }
      const website = form.companyWebsite.trim().startsWith('http')
        ? form.companyWebsite.trim()
        : 'https://' + form.companyWebsite.trim()
      const reg = await registerCompany({
        companyName: form.companyName.trim(),
        ownerName: form.ownerName.trim(),
        email: form.email.trim(),
        phone: form.ownerPhone.trim(),
        address: form.companyAddress.trim(),
        industry: form.industry,
        website,
      })
      if (!reg?.success) {
        setError(reg?.message || 'Registration failed')
        return
      }
      const email = form.email.trim()
      setSignupEmailCookie(email)
      router.push('/account-status?email=' + encodeURIComponent(email))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const selectAddress = (s: { display_name: string }) => {
    setForm((f) => ({ ...f, companyAddress: s.display_name }))
    setShowAddressSuggestions(false)
    setAddressSuggestions([])
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/Logo.png" alt="DigiPort" width={32} height={32} className="h-8 w-auto" />
              <span className="font-bold text-gray-900">DigiPort</span>
            </Link>
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
              Back to home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content - Centered */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-3xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h1>
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link href="/signin" className="text-gray-900 font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          {/* Progress Bar */}
          <div className="flex gap-2 mb-8">
            <div
              className={`flex-1 h-1.5 rounded-full transition-colors ${step >= 1 ? 'bg-gray-900' : 'bg-gray-200'}`}
              aria-hidden
            />
            <div
              className={`flex-1 h-1.5 rounded-full transition-colors ${step >= 2 ? 'bg-gray-900' : 'bg-gray-200'}`}
              aria-hidden
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Step 1: Form */}
          {step === 1 && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleContinue()
              }}
              className="space-y-5"
            >
              {/* Company Name - Full Width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company name *</label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  placeholder="Enter your company name"
                />
              </div>

              {/* Two Column Layout for Desktop */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Owner name *</label>
                  <input
                    type="text"
                    value={form.ownerName}
                    onChange={(e) => setForm((f) => ({ ...f, ownerName: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                    placeholder="Enter owner full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Owner phone *</label>
                  <input
                    type="tel"
                    value={form.ownerPhone}
                    onChange={(e) => setForm((f) => ({ ...f, ownerPhone: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Work email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                    placeholder="company@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company website *</label>
                  <input
                    type="url"
                    value={form.companyWebsite}
                    onChange={(e) => setForm((f) => ({ ...f, companyWebsite: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                    placeholder="www.company.com"
                  />
                </div>
              </div>

              {/* Address - Full Width with Autocomplete */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">Company address *</label>
                <input
                  type="text"
                  value={form.companyAddress}
                  onChange={(e) => setForm((f) => ({ ...f, companyAddress: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  placeholder="Search for address"
                />
                {searchingAddress && (
                  <div className="absolute right-4 top-11">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-gray-900" />
                  </div>
                )}
                {showAddressSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {addressSuggestions.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => selectAddress(s)}
                        className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        {s.display_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Industry - Full Width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Industry *</label>
                <select
                  value={form.industry}
                  onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white transition-all"
                >
                  <option value="">Select industry</option>
                  {INDUSTRIES.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Terms Checkbox */}
              <div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                  <span className="text-sm text-gray-600">
                    I agree to the{' '}
                    <Link href="/terms" className="text-gray-900 underline hover:no-underline font-medium">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-gray-900 underline hover:no-underline font-medium">
                      Privacy Policy
                    </Link>
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3.5 px-4 rounded-xl transition-colors shadow-sm"
              >
                {loading ? 'Sending code…' : 'Continue'}
              </button>

              {/* Sign In Link */}
              <div className="text-center pt-4">
                <Link href="/signin" className="text-sm text-gray-600 hover:text-gray-900">
                  Already have an account? <span className="font-semibold">Sign in</span>
                </Link>
              </div>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <div className="space-y-6 max-w-md mx-auto">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Verify your email</h2>
                <p className="text-sm text-gray-600">
                  We sent a 6-digit code to <strong>{form.email}</strong>
                </p>
              </div>

              {/* OTP Input */}
              <div className="flex gap-3 justify-center">
                {otp.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-12 h-14 text-center text-xl font-semibold rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  />
                ))}
              </div>

              {/* Resend and Back Links */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-sm">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendTimer > 0 || loading}
                  className="text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend code'}
                </button>
                <span className="hidden sm:inline text-gray-300">•</span>
                <button
                  type="button"
                  onClick={handleBack}
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Back to form
                </button>
              </div>

              {/* Verify Button */}
              <button
                onClick={handleVerifyAndSubmit}
                disabled={loading}
                className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3.5 px-4 rounded-xl transition-colors shadow-sm"
              >
                {loading ? 'Verifying…' : 'Verify and sign up'}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-gray-500 border-t border-gray-200">
        <p className="mb-2">DigiPort Ltd, {new Date().getFullYear()}. All rights reserved.</p>
        <div className="space-x-3">
          <Link href="/privacy" className="hover:text-gray-700">Privacy</Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-gray-700">Terms</Link>
        </div>
      </footer>
    </div>
  )
}
'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { setSignupEmailCookie } from '@/app/(public)/utils/signup-cookie'

const INDUSTRIES = [
  'FinTech', 'Payments', 'Trading', 'Crypto', 'Banking', 'Insurance', 'Real Estate', 'Healthcare',
  'E-commerce', 'Marketplace', 'iGaming', 'SaaS', 'Telecommunications', 'Education', 'Legal Services',
  'Consulting', 'Manufacturing', 'Retail', 'Hospitality', 'Travel', 'Media & Entertainment', 'Other',
]

type FormData = {
  companyName: string
  ownerName: string
  email: string
  phone: string
  address: string
  industry: string
  website: string
  description: string
}

const initialForm: FormData = {
  companyName: '',
  ownerName: '',
  email: '',
  phone: '',
  address: '',
  industry: '',
  website: '',
  description: '',
}

async function sendOTP(email: string) {
  const res = await fetch('/api/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  const data = await res.json()
  return data
}

async function verifyOTP(email: string, otp: string) {
  const res = await fetch('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  })
  const data = await res.json()
  return data
}

export default function CompanyRegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [form, setForm] = useState<FormData>(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [otpSent, setOtpSent] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  const steps = [
    { n: 1, label: 'Company & contact' },
    { n: 2, label: 'Address & industry' },
    { n: 3, label: 'Verify email' },
  ]

  useEffect(() => {
    if (step !== 3 || otpSent) return
    const email = form.email?.trim()
    if (!email) return
    let cancelled = false
    setError('')
    sendOTP(email).then((r) => {
      if (cancelled) return
      if (r?.success) setOtpSent(true)
      else setError(r?.message || 'Failed to send OTP')
    })
    return () => { cancelled = true }
  }, [step, otpSent, form.email])

  useEffect(() => {
    if (resendTimer <= 0) return
    const t = setInterval(() => setResendTimer((x) => (x <= 1 ? 0 : x - 1)), 1000)
    return () => clearInterval(t)
  }, [resendTimer])

  const validateStep1 = () => {
    if (!form.companyName?.trim()) { setError('Company name is required'); return false }
    if (!form.ownerName?.trim()) { setError('Company owner name is required'); return false }
    if (!form.email?.trim()) { setError('Email is required'); return false }
    if (!form.phone?.trim()) { setError('Phone is required'); return false }
    setError('')
    return true
  }

  const validateStep2 = () => {
    if (!form.address?.trim()) { setError('Address is required'); return false }
    if (!form.industry?.trim()) { setError('Industry is required'); return false }
    setError('')
    return true
  }

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    setError('')
    if (step < 3) setStep((s) => (s + 1) as 1 | 2 | 3)
  }

  const handleBack = () => {
    setError('')
    if (step > 1) setStep((s) => (s - 1) as 1 | 2 | 3)
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
      } else setError(r?.message || 'Failed to resend OTP')
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
        setError(r?.message || 'Invalid OTP')
        return
      }
      const res = await fetch('/api/company/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: form.companyName.trim(),
          ownerName: form.ownerName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          industry: form.industry.trim(),
          ...(form.website?.trim() && { website: form.website.trim() }),
          ...(form.description?.trim() && { description: form.description.trim() }),
        }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.message || 'Registration failed')
        return
      }
      const em = form.email.trim()
      setSignupEmailCookie(em)
      router.push('/account-status?email=' + encodeURIComponent(em))
    } catch (e: any) {
      setError(e?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image src="/Logo.png" alt="DigiPort" width={32} height={32} className="h-8 w-auto" />
              <span className="font-bold text-gray-900">DigiPort</span>
            </div>
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">Back to home</Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 md:py-12">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-10">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900 mb-1">Company registration</h1>
          <p className="text-sm text-gray-600 mb-6">
            Apply for an API key. Complete the steps below and we&apos;ll review your application.
          </p>

          <div className="flex gap-2 mb-8">
            {steps.map((s) => (
              <div
                key={s.n}
                className={`flex-1 h-1 rounded-full ${step >= s.n ? 'bg-gray-900' : 'bg-gray-200'}`}
                aria-hidden
              />
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company name *</label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="ABC Corporation"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company owner name *</label>
                <input
                  type="text"
                  value={form.ownerName}
                  onChange={(e) => setForm((f) => ({ ...f, ownerName: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="john@abccorp.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="+1234567890"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-medium"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="123 Business Street, City, Country"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry *</label>
                <select
                  value={form.industry}
                  onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="">Select industry</option>
                  {INDUSTRIES.map((i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website (optional)</label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="https://abccorp.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="Brief description of your business"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-medium"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <p className="text-sm text-gray-600">
                We sent a 6-digit code to <strong>{form.email}</strong>. Enter it below.
              </p>
              <div className="flex justify-center gap-2">
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
                    className="w-11 h-12 text-center text-lg font-semibold rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendTimer > 0 || loading}
                  className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend code'}
                </button>
                <button
                  type="button"
                  onClick={handleVerifyAndSubmit}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-medium disabled:opacity-50"
                >
                  {loading ? 'Submitting…' : 'Verify & submit'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

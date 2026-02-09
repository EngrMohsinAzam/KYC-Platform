'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { setSignupEmailCookie } from '@/app/(public)/utils/signup-cookie'
import { svg } from 'leaflet'

const INDUSTRIES = [
  'FinTech', 'Payments', 'Trading', 'Crypto', 'Banking', 'Insurance', 'Real Estate', 'Healthcare',
  'E-commerce', 'Marketplace', 'iGaming', 'SaaS', 'Telecommunications', 'Education', 'Legal Services',
  'Consulting', 'Manufacturing', 'Retail', 'Hospitality', 'Travel', 'Media & Entertainment', 'Other',
]

const PACKAGES = [
  {
    id: 'pay-as-you-go',
    name: 'Pay as you go',
    tagline: 'Flexible, no commitment',
    perUser: 2,
    monthly: 0,
    features: ['Full security', 'CNIC, License & Passport verification', 'No monthly fee'],
    icon: 'credit-card',
    color: 'slate',
    accent: 'from-slate-500 to-slate-700',
  },
  {
    id: 'basic',
    name: 'Basic',
    tagline: 'Perfect for small teams',
    perUser: 1.7,
    monthly: 100,
    features: ['CNIC & License verification', 'Full security', 'Dual Support', 'Up to 1,000 verifications/mo'],
    icon: 'box',
    color: 'blue',
    accent: 'from-blue-500 to-blue-600',
  },
  {
    id: 'standard',
    name: 'Standard',
    tagline: 'Most popular',
    perUser: 1.2,
    monthly: 350,
    features: ['CNIC & License verification', 'Full security', 'Dual Support', 'Up to 5,000 verifications/mo'],
    icon: 'star',
    color: 'emerald',
    accent: 'from-emerald-500 to-emerald-600',
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    tagline: 'Best value at scale',
    perUser: 0.7,
    monthly: 600,
    features: ['CNIC, License & Passport verification', 'Full security', 'Dual Support', 'Unlimited verifications'],
    icon: 'crown',
    color: 'amber',
    accent: 'from-amber-500 to-amber-600',
  },
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

type StepNum = 1 | 2 | 3 | 4 | 5

export default function CompanyRegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<StepNum>(1)
  const [form, setForm] = useState<FormData>(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [otpSent, setOtpSent] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const [selectedPackage, setSelectedPackage] = useState<typeof PACKAGES[0] | null>(null)
  const [extraCharge, setExtraCharge] = useState('')
  const [addressSuggestions, setAddressSuggestions] = useState<Array<{ display_name: string }>>([])
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false)
  const [searchingAddress, setSearchingAddress] = useState(false)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  const steps = [
    { n: 1, icon: 'building' as const, label: 'Company & contact' },
    { n: 2, icon: 'location' as const, label: 'Address & industry' },
    { n: 3, icon: 'mail' as const, label: 'Verify email' },
    { n: 4, icon: 'package' as const, label: 'Package' },
    { n: 5, icon: 'currency' as const, label: 'Extra charge' },
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
      if (form.address.trim().length >= 2) searchAddressSuggestions(form.address)
      else {
        setAddressSuggestions([])
        setShowAddressSuggestions(false)
      }
    }, 200)
    return () => clearTimeout(t)
  }, [form.address])

  const selectAddress = (s: { display_name: string }) => {
    setForm((f) => ({ ...f, address: s.display_name }))
    setShowAddressSuggestions(false)
    setAddressSuggestions([])
  }

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
    if (step === 4 && !selectedPackage) {
      setError('Please select a package')
      return
    }
    setError('')
    if (step < 5) setStep((s) => (s + 1) as StepNum)
  }

  const handleBack = () => {
    setError('')
    if (step > 1) setStep((s) => (s - 1) as StepNum)
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

  const handleVerifyOtp = async () => {
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
      setStep(4)
    } catch (e: any) {
      setError(e?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const toApiPackageId = (id: string) => id === 'pay-as-you-go' ? 'pay_as_you_go' : id

  const handleSubmitRegistration = async (skipExtra = false) => {
    setError('')
    setLoading(true)
    try {
      const extra = !skipExtra ? parseFloat(extraCharge) : 0
      const payload: Record<string, unknown> = {
        companyName: form.companyName.trim(),
        ownerName: form.ownerName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        industry: form.industry.trim(),
        selectedPackage: selectedPackage ? toApiPackageId(selectedPackage.id) : undefined,
        extraChargePerUser: Number.isNaN(extra) || extra < 0 ? 0 : extra,
        ...(form.website?.trim() && { website: form.website.trim() }),
        ...(form.description?.trim() && { description: form.description.trim() }),
      }
      const res = await fetch('/api/company/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

      <main className={`mx-auto px-4 py-8 md:py-12 ${step === 4 ? 'max-w-7xl' : 'max-w-2xl'}`}>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-10">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900 mb-3 ">Company registration</h1>
        
          <div className="flex items-center w-full mb-8">
            {steps.map((s, idx) => {
              const isCompleted = step > s.n
              const isCurrent = step === s.n
              return (
                <div key={s.n} className="flex items-center flex-1 min-w-0">
                  <div className="flex items-center justify-center flex-shrink-0">
                  <div
  className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${
    isCompleted
      ? "bg-black border-2 border-gray-900 text-white"
      : isCurrent
      ? "bg-gray-900 border-2 border-gray-900 text-white"
      : "bg-gray-100 border border-gray-300 text-gray-500"
  }`}
  title={s.label}
>
  {isCompleted ? (
    // Completed step — checkmark
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  ) : s.icon === "building" ? (
    // Step 1 — Company & Contact
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 21V7a2 2 0 012-2h2a2 2 0 012 2v14m6 0V9a2 2 0 012-2h2a2 2 0 012 2v12"
      />
    </svg>
  ) : s.icon === "location" ? (
    // Step 2 — Address & Industry
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21c4.418 0 8-4.03 8-9 0-4.418-3.582-8-8-8s-8 3.582-8 8c0 4.97 3.582 9 8 9Z"
      />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : s.icon === "mail" ? (
    // Step 3 — Email Verification (Mail + Check)
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 7l9 6 9-6"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 13l2 2 4-4"
      />
    </svg>
  ) : s.icon === "package" ? (
    // Step 4 — Plan / Package Selection (Layers)
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3l9 5-9 5-9-5 9-5z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12l9 5 9-5"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 17l9 5 9-5"
      />
    </svg>
  ) : (
    // Step 5 — Payment / Charges (Credit Card)
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2 10h20"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 15h4"
      />
    </svg>
  )}
</div>

                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`flex-1 mx-1 min-w-[16px] ${
                      isCompleted ? 'bg-gray-900 h-1' : 'bg-gray-200 h-0.5'
                    }`} />
                  )}
                </div>
              )
            })}
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
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 150)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="Search for address (start typing)"
                  autoComplete="off"
                />
                {searchingAddress && (
                  <div className="absolute right-3 top-10">
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
                        className="w-full px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors first:rounded-t-xl last:rounded-b-xl"
                      >
                        {s.display_name}
                      </button>
                    ))}
                  </div>
                )}
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
                  onClick={handleVerifyOtp}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-medium disabled:opacity-50"
                >
                  {loading ? 'Verifying…' : 'Verify & continue'}
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8">
              <div className="text-center max-w-2xl mx-auto">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Select a plan that will empower your business growth
                </h2>
                <p className="text-gray-500 mt-2">
                  Each package includes personalized consultation and revisions to guarantee your satisfaction.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {PACKAGES.map((pkg) => {
                  const isSelected = selectedPackage?.id === pkg.id
                  const isPopular = 'popular' in pkg && pkg.popular
                  const isHighlighted = isSelected
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => { setSelectedPackage(pkg); setError('') }}
                      className={`relative rounded-2xl text-left transition-all duration-200 p-6 border-2 flex flex-col ${
                        isHighlighted
                          ? 'bg-gray-900 border-gray-900 text-white'
                          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                      } ${isPopular && !isSelected ? 'ring-2 ring-black' : ''}`}
                    >
                      {isPopular && !isSelected && (
                        <span className="absolute top-3 right-3 text-[10px] font-semibold uppercase tracking-wider text-white bg-black px-2 py-0.5 rounded">
                          Popular
                        </span>
                      )}
                      <h3 className={`text-lg font-semibold ${isHighlighted ? 'text-white' : 'text-gray-900'}`}>
                        {pkg.name}
                      </h3>
                      <p className={`text-sm mt-1 ${isHighlighted ? 'text-gray-300' : 'text-gray-500'}`}>
                        {pkg.tagline}
                      </p>
                      <div className="mt-5 flex items-baseline gap-1">
                        <span className={`text-2xl font-bold ${isHighlighted ? 'text-white' : 'text-gray-900'}`}>
                          ${pkg.perUser}
                        </span>
                        <span className={isHighlighted ? 'text-gray-400' : 'text-gray-500'}>/user</span>
                        {pkg.monthly > 0 && (
                          <span className={`text-sm ml-2 ${isHighlighted ? 'text-gray-400' : 'text-gray-500'}`}>
                            + ${pkg.monthly}/mo
                          </span>
                        )}
                      </div>
                      <ul className="mt-5 space-y-3 flex-1">
                        {pkg.features.map((f) => (
                          <li key={f} className="flex items-start gap-2.5 text-sm">
                            <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                              isHighlighted ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700'
                            }`}>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                            <span className={isHighlighted ? 'text-gray-200' : 'text-gray-600'}>{f}</span>
                          </li>
                        ))}
                      </ul>
                      <div className={`mt-6 py-2.5 rounded-xl text-center text-sm font-semibold ${
                        isHighlighted
                          ? 'bg-white text-gray-900'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        Select This Plan
                      </div>
                    </button>
                  )
                })}
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
                  disabled={!selectedPackage}
                  className="flex-1 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white font-medium"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Extra charge to your users (optional)</h2>
              <p className="text-sm text-gray-600">
                Our fee for your selected package is {selectedPackage ? `$${selectedPackage.perUser}` : '—'} per user.
                You can add an extra amount that your users will pay—your extra goes to your account, our fee goes to DigiPort.
                Example: If our fee is $2 and you charge $4, $2 goes to DigiPort and $2 goes to you.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Extra amount per user ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={extraCharge}
                  onChange={(e) => setExtraCharge(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="0"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
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
                  onClick={() => handleSubmitRegistration(true)}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmitRegistration(false)}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-medium disabled:opacity-50"
                >
                  {loading ? 'Submitting…' : 'Submit'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

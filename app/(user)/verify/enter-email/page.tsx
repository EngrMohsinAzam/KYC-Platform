'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAppContext } from '@/context/useAppContext'
import { getCompanyContext } from '@/app/(public)/utils/kyc-company-context'
import { checkStatusByEmail } from '@/app/api/api'
import { PoweredBy } from '@/components/verify/PoweredBy'
import { API_BASE_URL } from '@/app/(public)/config'

const validateEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const sendOTP = async (email: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
    if (response.status === 429) {
      const errorData = await response.json().catch(() => ({ message: 'Too many requests.' }))
      return { success: false, message: errorData.message || 'Too many requests. Please wait.' }
    }
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to send OTP' }))
      return { success: false, message: errorData.message || 'Failed to send OTP' }
    }
    const data = await response.json()
    return data
  } catch (error: unknown) {
    return { success: false, message: 'Failed to send OTP. Please try again.' }
  }
}

const verifyOTP = async (email: string, otp: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Invalid OTP' }))
      return { success: false, message: errorData.message || 'Invalid OTP code' }
    }
    const data = await response.json()
    return data
  } catch {
    return { success: false, message: 'Failed to verify OTP. Please try again.' }
  }
}

export default function EnterEmailPage() {
  const router = useRouter()
  const { dispatch } = useAppContext()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [otpLoading, setOtpLoading] = useState(false)
  const [sendingOTP, setSendingOTP] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    const ctx = getCompanyContext()
    const isLocalPreviewHost =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

    if (!ctx?.companyId || !ctx?.companySlug) {
      if (!isLocalPreviewHost) {
        router.replace('/verify/start')
        return
      }
    }
    setChecking(false)
  }, [router])

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [resendTimer])

  const handleSendOTP = async () => {
    const trimmed = email.trim()
    if (!trimmed) { setError('Email address is required'); return }
    setSendingOTP(true)
    setError(null)
    try {
      const result = await sendOTP(trimmed)
      if (result.success) setResendTimer(60)
      else setError(result.message || 'Failed to send OTP')
    } catch {
      setError('Failed to send OTP')
    } finally {
      setSendingOTP(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setError(null)
    if (value && index < 5) inputRefs.current[index + 1]?.focus()
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus()
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').trim()
    if (/^\d{6}$/.test(pasted)) {
      setOtp(pasted.split(''))
      setError(null)
      inputRefs.current[5]?.focus()
    }
  }

  const handlePasteFromClipboard = async () => {
    try {
      const pasted = (await navigator.clipboard.readText()).trim()
      if (/^\d{6}$/.test(pasted)) {
        setOtp(pasted.split(''))
        setError(null)
        inputRefs.current[5]?.focus()
      } else if (pasted.length > 0) setError('Clipboard must contain a 6-digit code')
    } catch {
      setError('Could not access clipboard')
    }
  }

  const handleVerifyOtp = async () => {
    const otpString = otp.join('')
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit code')
      return
    }
    setOtpLoading(true)
    setError(null)
    try {
      const result = await verifyOTP(email.trim(), otpString)
      if (result.success) {
        sessionStorage.setItem('justCompletedOTP', 'true')
        router.push('/verify/select-id-type')
        return
      }
      setError(result.message || 'Invalid OTP. Please try again.')
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } catch {
      setError('Failed to verify OTP.')
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setOtpLoading(false)
    }
  }

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
    const sendResult = await sendOTP(trimmed)
    if (sendResult.success) {
      setResendTimer(60)
      setStep('otp')
      setError(null)
    } else {
      setError(sendResult.message ?? 'Failed to send verification code. Please try again.')
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex flex-col">
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-gray-900" />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col">
      <div className="md:hidden flex justify-end px-4 pt-3">
        <button
          type="button"
          aria-label="Close"
          onClick={() => router.push('/verify/start')}
          className="h-8 w-8 inline-flex items-center justify-center text-[#828282] hover:text-[#000000] transition-colors"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <main className="flex-1 flex flex-col items-center md:justify-start px-4 pt-6 pb-24 md:pt-6 md:pb-6 md:min-h-0">
        <section className="hidden md:block text-center mb-4">
          <h1 className="text-[34px] leading-[1.2] font-bold text-[#000000]">Tell us about yourself</h1>
          <p className="mt-2 text-[16px] leading-[1.5] font-normal text-[#828282]">
            We&apos;re required to collect this verify your identity.
          </p>
        </section>

        <div className="w-full max-w-[760px] md:max-w-[680px] md:bg-transparent md:border-2 md:border-[#E8E8E9] md:rounded-[14px] md:px-5 md:py-6 md:scale-[0.97] md:origin-center">
          {step === 'email' ? (
            <>
              <div className="mb-4">
                <label className="block text-[16px] md:text-[18px] leading-[1.4] font-semibold text-[#000000] mb-2">
                  Email
                </label>
                <p className="text-[14px] md:text-[16px] leading-[1.4] font-normal text-[#828282] mb-3">
                  Enter the email address you&apos;d like to use
                </p>
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !loading && email.trim()) {
                      void handleContinue()
                    }
                  }}
                  disabled={loading}
                  className="w-full h-[48px] md:h-[52px] rounded-[12px] md:rounded-[10px] border-[#6D3CCC] bg-[#E8E8E9] md:bg-[#E8E8E9] placeholder:text-[#828282] text-[#000000] text-[14px] md:text-[16px] px-4 focus:ring-[#6D3CCC]/20 focus:border-[#6D3CCC]"
                />
              </div>

              {error && (
                <div className="mb-4">
                  <p className="text-sm md:text-base text-red-600">{error}</p>
                </div>
              )}

              <Button
                onClick={() => void handleContinue()}
                disabled={loading || !email.trim()}
                className="hidden md:block h-[52px] !rounded-[12px] !bg-[#6D3CCC] hover:!bg-[#8558D9] focus:!bg-[#6D3CCC] focus:!ring-0 focus:!ring-offset-0 active:!bg-[#6D3CCC] disabled:!bg-[#6D3CCC] disabled:opacity-100 !text-white disabled:!text-white text-[16px] font-semibold"
              >
                {loading ? 'Checking...' : 'Continue'}
              </Button>

              <button
                type="button"
                onClick={() => router.push('/verify/start')}
                className="hidden md:flex items-center justify-center gap-2 text-[#828282] text-[14px] leading-none font-normal mt-7 mx-auto hover:text-[#000000] transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
                </svg>
                Back to Previous
              </button>
            </>
          ) : (
            <>
              <h2 className="text-[20px] md:text-[22px] leading-tight font-bold text-[#000000] mb-1.5">
                Verify your email
              </h2>
              <p className="text-[13px] md:text-[14px] leading-[1.35] font-normal text-[#828282] mb-3 md:mb-4">
                Enter the confirmation code sent to your email. This code will expire in two hours.
              </p>

              <div className="inline-flex items-center gap-2 bg-[#E8E8E9] rounded-[12px] px-4 py-2 mb-4">
                <span className="text-[13px] md:text-[14px] leading-none font-normal text-[#000000] truncate max-w-[200px] md:max-w-[280px]">{email.trim()}</span>
              </div>

              <div className="mb-3">
                <div className="flex items-center gap-1.5 md:gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      disabled={otpLoading}
                      className={`w-[42px] h-[52px] md:w-[44px] md:h-[48px] text-center text-[20px] md:text-[18px] font-semibold rounded-[10px] md:rounded-[8px] border-2 transition-colors focus:outline-none focus:border-[#6D3CCC] ${
                        index === 0 ? 'border-[#6D3CCC] bg-[#E8E8E9] text-[#000000]' : 'border-[#E0E0E0] bg-[#E8E8E9] text-[#000000]'
                      }`}
                    />
                  ))}
                </div>
                {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
              </div>

              <button
                type="button"
                onClick={() => void handlePasteFromClipboard()}
                className="text-[13px] md:text-[14px] font-normal text-[#000000] hover:text-[#6D3CCC] transition-colors"
              >
                Paste from clipboard
              </button>

              <div className="hidden md:flex flex-col mt-4 space-y-2">
                <Button
                  onClick={() => void handleVerifyOtp()}
                  disabled={otpLoading || otp.join('').length !== 6}
                  className="h-[44px] !rounded-[10px] !bg-[#6D3CCC] hover:!bg-[#8558D9] !text-white text-[14px] font-semibold"
                >
                  {otpLoading ? 'Verifying...' : 'Continue'}
                </Button>
                <Button
                  onClick={() => void handleSendOTP()}
                  disabled={sendingOTP || resendTimer > 0 || otpLoading}
                  className="h-[44px] !rounded-[10px] !bg-[#E8E8E9] hover:!bg-[#E0E0E0] !text-[#000000] text-[14px] font-semibold"
                >
                  {resendTimer > 0 ? `Resend code (${resendTimer}s)` : 'Resend code'}
                </Button>
                <button
                  type="button"
                  onClick={() => { setStep('email'); setError(null); setOtp(['', '', '', '', '', '']) }}
                  className="flex items-center justify-center gap-2 text-[#828282] text-[13px] font-normal mt-4 hover:text-[#000000] transition-colors"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
                  </svg>
                  Back to Previous
                </button>
              </div>
            </>
          )}
        </div>
      </main>
      <PoweredBy />
      {step === 'email' ? (
        <div className="md:hidden fixed bottom-0 left-0 right-0 px-4 pb-4 pt-2 bg-gradient-to-t from-[#FFFFFF] to-transparent">
          <Button
            onClick={() => void handleContinue()}
            disabled={loading || !email.trim()}
            className="h-[48px] !rounded-[14px] !bg-[#6D3CCC] hover:!bg-[#8558D9] focus:!bg-[#6D3CCC] focus:!ring-0 focus:!ring-offset-0 active:!bg-[#6D3CCC] disabled:!bg-[#6D3CCC] disabled:opacity-100 !text-white disabled:!text-white font-semibold text-[16px]"
          >
            {loading ? 'Checking...' : 'Continue'}
          </Button>
        </div>
      ) : (
        <div className="md:hidden fixed bottom-0 left-0 right-0 px-4 pb-4 pt-2 bg-white border-t border-[#E8E8E9]">
          <div className="space-y-2">
            <Button
              onClick={() => void handleVerifyOtp()}
              disabled={otpLoading || otp.join('').length !== 6}
              className="h-[52px] !rounded-[14px] !bg-[#6D3CCC] hover:!bg-[#8558D9] !text-white text-[15px] font-semibold"
            >
              {otpLoading ? 'Verifying...' : 'Continue'}
            </Button>
            <Button
              onClick={() => void handleSendOTP()}
              disabled={sendingOTP || resendTimer > 0 || otpLoading}
              className="h-[48px] !rounded-[14px] !bg-[#E8E8E9] hover:!bg-[#E0E0E0] !text-[#000000] text-[14px] font-medium"
            >
              {resendTimer > 0 ? `Resend code (${resendTimer}s)` : 'Resend code'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

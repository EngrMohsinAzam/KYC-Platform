'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { useAppContext } from '@/context/useAppContext'
import { PoweredBy } from '@/components/verify/PoweredBy'
import { VerifyMobileBackRow } from '@/components/verify/VerifyMobileBackRow'
import { SpinnerIcon } from '@/components/verify/SpinnerIcon'
import {
  PHONE_COUNTRY_CODES,
  getCountryCode,
  getMinPhoneLength,
  getMaxPhoneLength,
  validatePhoneByCountry,
  formatByCountry,
} from '@/app/(public)/utils/phone-country-codes'

export default function EnterPhonePage() {
  const router = useRouter()
  const { state, dispatch } = useAppContext()
  // Derive country from previous step (select-id-type); default 'us' if not in phone list
  const resolvedCountryKey = (() => {
    const fromState = (state.selectedCountry || '').toLowerCase().trim()
    if (fromState && PHONE_COUNTRY_CODES.some((c) => c.value === fromState)) return fromState
    return 'us'
  })()
  const [phoneDigits, setPhoneDigits] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const dialCode = getCountryCode(resolvedCountryKey)
  const maxLen = getMaxPhoneLength(resolvedCountryKey)
  const displayValue = formatByCountry(phoneDigits, resolvedCountryKey)

  const phoneCountryLabel = PHONE_COUNTRY_CODES.find((c) => c.value === resolvedCountryKey)?.label ?? `+${dialCode.replace('+', '')}`

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia('(min-width: 768px)')
    const prevHtml = document.documentElement.style.overflowY
    const prevBody = document.body.style.overflowY
    const apply = () => {
      if (mql.matches) {
        document.documentElement.style.overflowY = 'hidden'
        document.body.style.overflowY = 'hidden'
      } else {
        document.documentElement.style.overflowY = prevHtml
        document.body.style.overflowY = prevBody
      }
    }
    apply()
    mql.addEventListener?.('change', apply)
    return () => {
      mql.removeEventListener?.('change', apply)
      document.documentElement.style.overflowY = prevHtml
      document.body.style.overflowY = prevBody
    }
  }, [])

  const handleContinue = () => {
    setError(null)
    if (!phoneDigits.trim()) {
      setError('Please enter your phone number')
      return
    }
    const validationError = validatePhoneByCountry(phoneDigits, resolvedCountryKey, dialCode)
    if (validationError) {
      setError(validationError)
      return
    }
    setLoading(true)
    const fullPhone = dialCode + phoneDigits.replace(/\D/g, '')
    const current = state.personalInfo || {
      firstName: '',
      lastName: '',
      fatherName: '',
      idNumber: '',
      email: '',
      phone: '',
      address: '',
    }
    dispatch({
      type: 'SET_PERSONAL_INFO',
      payload: {
        ...current,
        phone: fullPhone,
      },
    })
    setLoading(false)
    router.push('/verify/enter-name')
  }

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, maxLen)
    setPhoneDigits(digits)
    setError(null)
  }

  const canProceed = phoneDigits.length >= getMinPhoneLength(resolvedCountryKey) && phoneDigits.length <= maxLen

  return (
    <div className="min-h-screen h-[100dvh] md:h-screen overflow-hidden bg-[#FFFFFF] flex flex-col">
      <VerifyMobileBackRow onBack={() => router.push('/verify/resident-selection')} />

      <main className="flex-1 flex flex-col items-start md:items-center md:justify-center px-4 pt-3 pb-28 md:pt-6 md:pb-6 md:min-h-0 min-h-0 overflow-hidden md:overflow-visible">
        {/* Desktop heading */}
        <section className="hidden md:block text-center mb-7">
          <h1 className="font-sans text-[28px] font-bold leading-[100%] tracking-[0%] text-[#000000]">Tell us about yourself</h1>
          <p className="mt-2 font-sans text-[16px] leading-[100%] font-normal text-[#545454]">
            We&apos;re required to collect this verify your identity.
          </p>
        </section>

        <div className="w-full max-w-[760px] md:mt-2 md:border-[1.5px] md:border-[#D3D3D3] md:rounded-[14px] md:px-7 md:py-9">
          {/* Mobile heading inside card */}
          <h2 className="md:hidden font-sans text-[24px] leading-[1.3] font-bold text-[#000000] mb-2">
            Phone number
          </h2>
          {/* Desktop label */}
          <label className="hidden md:block font-sans text-[20px] font-bold leading-[100%] tracking-[0%] text-[#000000] mb-2">
            Phone number
          </label>
          

          {/* Combined country code + phone field, styled like other inputs */}
          <div className="w-full h-[50px] md:mt-3 flex items-stretch gap-px">
            <div
              aria-label={`Country code ${phoneCountryLabel}`}
              className="flex-shrink-0 w-[120px] md:w-[140px] flex items-center justify-between pl-4 pr-3 rounded-tl-[12px] rounded-tr-[5px] rounded-br-[5px] rounded-bl-[12px] bg-[#EBEBEB] border-0 md:border-r-0 md:rounded-tl-[12px] md:rounded-tr-[5px] md:rounded-br-[5px] md:rounded-bl-[12px] font-sans text-[16px] font-normal leading-[100%] tracking-[0%] text-[#000000] cursor-default select-none"
            >
              <span className="truncate">{phoneCountryLabel}</span>
              <svg
                className="w-4 h-4 text-[#545454]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <div className="flex-1 min-w-0 flex items-center pl-4 pr-4 rounded-tl-[5px] rounded-tr-[12px] rounded-br-[12px] rounded-bl-[5px] bg-[#EBEBEB] border border-[#A7D80D] md:rounded-tl-[5px] md:rounded-tr-[12px] md:rounded-br-[12px] md:rounded-bl-[5px] md:border-[1.5px] md:border-[#E8E8E9]">
              <input
                type="tel"
                inputMode="numeric"
                placeholder="Phone number"
                value={displayValue}
                onChange={(e) => handlePhoneChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !loading) handleContinue()
                }}
                maxLength={maxLen + 8}
                className="w-full bg-transparent border-0 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:border-0 focus-visible:border-0 font-sans text-[16px] font-normal leading-[100%] tracking-[0%] text-[#000000] placeholder:text-[#545454]"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 mt-1">{error}</p>}

          {/* Desktop Continue + Back */}
          <div className="hidden md:block mt-6">
            <Button
              onClick={() => void handleContinue()}
              disabled={loading || !canProceed}
              className="w-full  h-[54px] !rounded-[12px] !bg-[#A7D80D] hover:!opacity-95 active:!opacity-90 focus:!ring-2 focus:!ring-[#A7D80D] focus:!ring-offset-2 !text-black text-[16px] font-semibold disabled:opacity-50"
            >
              {loading ? <SpinnerIcon color="#000000" /> : 'Continue'}
            </Button>
            <button
              type="button"
              onClick={() => router.push('/verify/resident-selection')}
              className="flex items-center justify-center gap-2 text-[#545454] text-[14px] leading-none font-normal mt-7 mx-auto hover:text-[#000000] transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
              </svg>
              Back to Previous
            </button>
          </div>
        </div>
      </main>
      <PoweredBy />
      {/* Mobile: helper text + bottom Continue button, lime with black text, same width as input */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 px-4 pb-8 pt-2 bg-gradient-to-t from-[#FFFFFF] to-transparent flex flex-col">
        <p className="mb-3 font-sans text-[14px] leading-[1.4] font-normal text-center text-[#545454]">
          We&apos;re required to collect this verify your identity.
        </p>
        <button
          type="button"
          onClick={() => void handleContinue()}
          disabled={loading || !canProceed}
          className="w-full h-[54px] rounded-[12px] bg-[#A7D80D] hover:opacity-95 active:opacity-90 text-black text-[16px] font-semibold transition-opacity focus:outline-none focus:ring-2 focus:ring-[#A7D80D] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <SpinnerIcon color="#000000" /> : 'Continue'}
        </button>
      </div>
    </div>
  )
}

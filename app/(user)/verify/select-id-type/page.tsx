'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAppContext } from '@/context/useAppContext'
import { PoweredBy } from '@/components/verify/PoweredBy'
import { VerifyMobileBackRow } from '@/components/verify/VerifyMobileBackRow'
import { SpinnerIcon } from '@/components/verify/SpinnerIcon'
import { getCountryOptions, getCitiesForCountry } from '@/app/(public)/utils/countries'
import { getKycPausedStatus } from '@/app/api/api'

export default function SelectIdType() {
  const router = useRouter()
  const { dispatch } = useAppContext()
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [pausedMessage, setPausedMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const countryOptions = getCountryOptions()
  const cityOptions = country ? getCitiesForCountry(country) : []

  useEffect(() => {
    const checkPaused = async () => {
      try {
        const res = await getKycPausedStatus()
        const paused = !!(res?.data?.kycPaused ?? (res as any)?.kycPaused)
        if (paused) {
          setPausedMessage("KYC process has been stopped for a specific reason. We'll let you know when you can come back.")
        }
      } catch {
        // don't hard-block on network error
      }
    }
    checkPaused()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia('(min-width: 768px)')
    const prevHtmlOverflow = document.documentElement.style.overflowY
    const prevBodyOverflow = document.body.style.overflowY
    const applyDesktopScrollLock = () => {
      if (mql.matches) {
        document.documentElement.style.overflowY = 'hidden'
        document.body.style.overflowY = 'hidden'
      } else {
        document.documentElement.style.overflowY = prevHtmlOverflow
        document.body.style.overflowY = prevBodyOverflow
      }
    }
    applyDesktopScrollLock()
    if (mql.addEventListener) {
      mql.addEventListener('change', applyDesktopScrollLock)
      return () => {
        mql.removeEventListener('change', applyDesktopScrollLock)
        document.documentElement.style.overflowY = prevHtmlOverflow
        document.body.style.overflowY = prevBodyOverflow
      }
    }
    return () => {
      document.documentElement.style.overflowY = prevHtmlOverflow
      document.body.style.overflowY = prevBodyOverflow
    }
  }, [])

  useEffect(() => {
    if (country) {
      setCity('')
      dispatch({ type: 'SET_COUNTRY', payload: country })
      const opts = getCitiesForCountry(country)
      if (opts.length === 0) {
        dispatch({ type: 'SET_CITY', payload: '' })
      }
    }
  }, [country, dispatch])

  useEffect(() => {
    if (city) {
      dispatch({ type: 'SET_CITY', payload: city })
    }
  }, [city, dispatch])

  const handleNext = () => {
    if (pausedMessage) return
    setLoading(true)
    dispatch({ type: 'SET_COUNTRY', payload: country })
    if (cityOptions.length > 0 && city) {
      dispatch({ type: 'SET_CITY', payload: city })
    } else if (cityOptions.length === 0) {
      dispatch({ type: 'SET_CITY', payload: '' })
    }
    router.push('/verify/resident-selection')
  }

  const hasStates = cityOptions.length > 0
  const canProceed = Boolean(country && (!hasStates || city))

  return (
    <div className="min-h-screen h-[100dvh] md:h-screen overflow-hidden bg-[#FFFFFF] flex flex-col">
      <VerifyMobileBackRow onBack={() => router.back()} />

      <main className="flex-1 w-full overflow-hidden flex flex-col items-start md:items-center md:justify-center px-4 pt-4 md:pt-6 pb-32 md:pb-6">
        {/* Desktop: Tell us about yourself */}
        <section className="hidden md:block text-center mb-4">
          <h1 className="font-sans text-[20px] font-bold leading-[100%] tracking-[0%] text-[#000000]">
            Tell us about yourself
          </h1>
          <p className="mt-2 font-sans text-[16px] font-normal leading-[100%] text-[#545454]">
            Local regulation requires us to ask
          </p>
        </section>

        {/* Card - mobile: exact layout from second screen */}
        <div className="w-full max-w-[680px] md:bg-white md:border-[1.5px] md:border-[#E8E8E9] md:rounded-[14px] md:px-5 md:py-6">
          {pausedMessage && (
            <div className="mb-5 bg-amber-50 border border-amber-200 rounded-[10px] p-3">
              <p className="text-sm text-amber-800">{pausedMessage}</p>
            </div>
          )}

          {/* Heading: Country of residence - bold black, large */}
          <h2 className="font-sans text-[20px] font-bold leading-[100%] tracking-[0%] text-[#000000] mb-1.5">
            Country of residence
          </h2>
          {/* Subtitle: dark grey, just under heading */}
          <p className="font-sans text-[16px] font-normal leading-[1.4] text-[#545454] mb-4">
            Select the country recorded on your legal documents
          </p>

          {/* Input fields - mobile: light gray, very small gap; desktop: keep existing */}
          <div className="space-y-1">
            {/* Country: light gray bg, top rounded 12px, bottom rounded 5px */}
            <div className="relative w-full h-[51px] rounded-tl-[12px] rounded-tr-[12px] rounded-br-[5px] rounded-bl-[5px] md:rounded-tl-[12px] md:rounded-tr-[12px] md:rounded-br-[5px] md:rounded-bl-[5px] bg-[#EBEBEB] md:bg-[#14111C1A] border border-[#E5E5E5] pl-4 pr-10 flex items-center focus-within:border-[#A7D80D] focus-within:ring-2 focus-within:ring-[#A7D80D]/20 transition-colors">
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-transparent border-0 p-0 font-sans text-[16px] font-normal leading-[100%] tracking-[0%] text-[#000000] appearance-none focus:outline-none focus:ring-0 cursor-pointer [color-scheme:light]"
                style={{ color: country ? '#000000' : '#545454' }}
              >
                <option value="" className="text-[#545454]">
                  Country
                </option>
                {countryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#545454] pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {hasStates && (
              /* State: opposite radii from spec (top 5, bottom 12) */
              <div className="relative w-full h-[51px] rounded-tl-[5px] rounded-tr-[5px] rounded-br-[12px] rounded-bl-[12px] bg-[#EBEBEB] md:bg-[#14111C1A] border border-[#E5E5E5] pl-4 pr-10 flex items-center focus-within:border-[#A7D80D] focus-within:ring-2 focus-within:ring-[#A7D80D]/20 transition-colors">
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-transparent border-0 p-0 font-sans text-[16px] font-normal leading-[100%] tracking-[0%] text-[#000000] appearance-none focus:outline-none focus:ring-0 cursor-pointer [color-scheme:light]"
                  style={{ color: city ? '#000000' : '#545454' }}
                >
                  <option value="" className="text-[#545454]">
                    State
                  </option>
                  {cityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#545454] pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            )}
          </div>

          {/* Desktop: Continue (black button) */}
          <div className="hidden md:block">
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed || !!pausedMessage || loading}
              className="w-full h-[54px] rounded-[12px] bg-[#000000] hover:opacity-90 active:opacity-80 text-white text-[16px] font-semibold transition-opacity focus:outline-none focus:ring-2 focus:ring-[#000000] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <SpinnerIcon color="#ffffff" /> : 'Continue'}
            </button>
          </div>
        </div>
      </main>

      <PoweredBy />

      {/* Mobile: legal text + Continue (same width as input, px-4) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 px-4 pb-8 pt-2 bg-gradient-to-t from-[#FFFFFF] to-transparent flex flex-col">
        <p className="font-sans text-[14px] font-normal leading-[100%] tracking-[0] text-[#545454] mb-3 text-center">
          By continuing, you agree to the{' '}
          <Link href="/terms" className="text-[#A7D80D] font-medium hover:underline">
            Terms of Service
          </Link>
          ,{' '}
          <Link href="/privacy" className="text-[#A7D80D] font-medium hover:underline">
            Privacy Policy
          </Link>
          , and{' '}
          <Link href="/privacy#biometrics" className="text-[#A7D80D] font-medium hover:underline">
            Biometrics Policy
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={handleNext}
          disabled={!canProceed || !!pausedMessage || loading}
          className="w-full h-[54px] rounded-[12px] bg-[#A7D80D] hover:opacity-95 active:opacity-90 text-black text-[16px] font-semibold transition-opacity focus:outline-none focus:ring-2 focus:ring-[#A7D80D] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <SpinnerIcon color="#000000" /> : 'Continue'}
        </button>
      </div>
    </div>
  )
}

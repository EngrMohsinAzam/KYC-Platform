'use client'

import { useState, useEffect, useRef } from 'react'
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
  const { state, dispatch } = useAppContext()
  const [country, setCountry] = useState(state.selectedCountry || '')
  const [city, setCity] = useState(state.selectedCity || '')
  const [pausedMessage, setPausedMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [openPanel, setOpenPanel] = useState<'country' | 'state' | null>(null)
  const countryPickerRef = useRef<HTMLDivElement>(null)
  const statePickerRef = useRef<HTMLDivElement>(null)

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
    if (!openPanel) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (countryPickerRef.current?.contains(t)) return
      if (statePickerRef.current?.contains(t)) return
      setOpenPanel(null)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [openPanel])

  useEffect(() => {
    if (!openPanel) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenPanel(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openPanel])

  useEffect(() => {
    if (openPanel === 'state' && cityOptions.length === 0) {
      setOpenPanel(null)
    }
  }, [cityOptions.length, openPanel])

  useEffect(() => {
    if (country && country !== state.selectedCountry) {
      dispatch({ type: 'SET_COUNTRY', payload: country })
    }
    if (country) {
      const opts = getCitiesForCountry(country)
      if (opts.length === 0 && state.selectedCity) {
        dispatch({ type: 'SET_CITY', payload: '' })
      }
    }
  }, [country, dispatch, state.selectedCountry, state.selectedCity])

  useEffect(() => {
    if (city && city !== state.selectedCity) {
      dispatch({ type: 'SET_CITY', payload: city })
    }
  }, [city, dispatch, state.selectedCity])

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

  const countryLabel =
    countryOptions.find((o) => o.value === country)?.label ?? ''
  const stateLabel =
    cityOptions.find((o) => o.value === city)?.label ?? ''

  return (
    <div className="h-full md:h-screen overflow-hidden bg-[#FFFFFF] flex flex-col">
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
            {/* Country — custom list (same pattern as verify/id-issuing-country for mobile) */}
            <div
              ref={countryPickerRef}
              className="relative z-30 w-full"
            >
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={openPanel === 'country'}
                onClick={() =>
                  setOpenPanel((p) => (p === 'country' ? null : 'country'))
                }
                className={`relative flex h-[54px] w-full min-h-[54px] items-center rounded-tl-[12px] rounded-tr-[12px] rounded-br-[5px] rounded-bl-[5px] bg-[#EBEBEB] pl-4 pr-10 text-left font-sans transition-colors md:bg-[#14111C1A] ${
                  openPanel === 'country'
                    ? 'border border-[#A7D80D] ring-2 ring-[#A7D80D]/20'
                    : 'border border-[#E5E5E5] focus:outline-none focus-visible:border-[#A7D80D] focus-visible:ring-2 focus-visible:ring-[#A7D80D]/20'
                }`}
              >
                <span
                  className={`line-clamp-2 w-full text-[16px] font-normal leading-[1.35] ${
                    countryLabel ? 'text-[#000000]' : 'text-[#545454]'
                  }`}
                >
                  {countryLabel || 'Country'}
                </span>
                <svg
                  className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#545454] transition-transform ${openPanel === 'country' ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {openPanel === 'country' && (
                <ul
                  role="listbox"
                  className="absolute left-0 right-0 top-[calc(100%+6px)] z-[100] max-h-[min(240px,42vh)] overflow-y-auto overscroll-y-contain rounded-[10px] border border-[#E8E8E9] bg-white py-1 shadow-lg md:max-h-[280px]"
                >
                  <li role="none">
                    <button
                      type="button"
                      role="option"
                      aria-selected={!country}
                      className="w-full border-b border-[#E8E8E9] px-3 py-2.5 text-left font-sans text-[13px] font-normal leading-[1.35] text-[#545454] hover:bg-[#E8E8E9] md:text-[14px]"
                      onClick={() => {
                        setCountry('')
                        setCity('')
                        setOpenPanel(null)
                      }}
                    >
                      Country
                    </button>
                  </li>
                  {countryOptions.map((option) => (
                    <li key={option.value} role="none">
                      <button
                        type="button"
                        role="option"
                        aria-selected={country === option.value}
                        className="w-full border-b border-[#E8E8E9] px-3 py-2 text-left font-sans text-[13px] font-normal leading-[1.35] text-[#000000] last:border-b-0 hover:bg-[#E8E8E9] md:py-2.5 md:text-[14px]"
                        onClick={() => {
                          setCountry(option.value)
                          setCity('')
                          setOpenPanel(null)
                        }}
                      >
                        {option.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {hasStates && (
              <div
                ref={statePickerRef}
                className="relative z-20 w-full"
              >
                <button
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={openPanel === 'state'}
                  onClick={() =>
                    setOpenPanel((p) => (p === 'state' ? null : 'state'))
                  }
                  className={`relative flex h-[54px] w-full min-h-[54px] items-center rounded-tl-[5px] rounded-tr-[5px] rounded-br-[12px] rounded-bl-[12px] bg-[#EBEBEB] pl-4 pr-10 text-left font-sans transition-colors md:bg-[#14111C1A] ${
                    openPanel === 'state'
                      ? 'border border-[#A7D80D] ring-2 ring-[#A7D80D]/20'
                      : 'border border-[#E5E5E5] focus:outline-none focus-visible:border-[#A7D80D] focus-visible:ring-2 focus-visible:ring-[#A7D80D]/20'
                  }`}
                >
                  <span
                    className={`line-clamp-2 w-full text-[16px] font-normal leading-[1.35] ${
                      stateLabel ? 'text-[#000000]' : 'text-[#545454]'
                    }`}
                  >
                    {stateLabel || 'State'}
                  </span>
                  <svg
                    className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#545454] transition-transform ${openPanel === 'state' ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {openPanel === 'state' && (
                  <ul
                    role="listbox"
                    className="absolute left-0 right-0 top-[calc(100%+6px)] z-[100] max-h-[min(240px,42vh)] overflow-y-auto overscroll-y-contain rounded-[10px] border border-[#E8E8E9] bg-white py-1 shadow-lg md:max-h-[280px]"
                  >
                    <li role="none">
                      <button
                        type="button"
                        role="option"
                        aria-selected={!city}
                        className="w-full border-b border-[#E8E8E9] px-3 py-2.5 text-left font-sans text-[13px] font-normal leading-[1.35] text-[#545454] hover:bg-[#E8E8E9] md:text-[14px]"
                        onClick={() => {
                          setCity('')
                          setOpenPanel(null)
                        }}
                      >
                        State
                      </button>
                    </li>
                    {cityOptions.map((option) => (
                      <li key={option.value} role="none">
                        <button
                          type="button"
                          role="option"
                          aria-selected={city === option.value}
                          className="w-full border-b border-[#E8E8E9] px-3 py-2 text-left font-sans text-[13px] font-normal leading-[1.35] text-[#000000] last:border-b-0 hover:bg-[#E8E8E9] md:py-2.5 md:text-[14px]"
                          onClick={() => {
                            setCity(option.value)
                            setOpenPanel(null)
                          }}
                        >
                          {option.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
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
              {loading ? <SpinnerIcon color="#000000" /> : 'Continue'}
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

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { useAppContext } from '@/context/useAppContext'
import { PoweredBy } from '@/components/verify/PoweredBy'
import { getCountryOptions, getCitiesForCountry } from '@/app/(public)/utils/countries'
import { getKycPausedStatus } from '@/app/api/api'

export default function SelectIdType() {
  const router = useRouter()
  const { dispatch } = useAppContext()
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [pausedMessage, setPausedMessage] = useState<string | null>(null)

  const countryOptions = getCountryOptions()
  const cityOptions = country ? getCitiesForCountry(country) : []

  // Guard: prevent entering KYC flow if paused
  useEffect(() => {
    const checkPaused = async () => {
      try {
        const res = await getKycPausedStatus()
        const paused = !!(res?.data?.kycPaused ?? (res as any)?.kycPaused)
        if (paused) {
          setPausedMessage('KYC process has been stopped for a specific reason. We’ll let you know when you can come back.')
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

  // Reset city when country changes; clear selectedCity if new country has no states
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

  // Update city in context when it changes
  useEffect(() => {
    if (city) {
      dispatch({ type: 'SET_CITY', payload: city })
    }
  }, [city, dispatch])

  const handleNext = () => {
    if (pausedMessage) return
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
      <div className="md:hidden pl-1 pr-4 pt-5">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => router.back()}
          className="h-8 w-8 inline-flex items-center justify-center text-[#828282] hover:text-[#000000] transition-colors"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>
      <main className="flex-1 w-full overflow-hidden md:overflow-y-auto flex flex-col items-center md:justify-center md:justify-center px-4 pt-3 pb-36 md:pt-2 md:pb-2">
        <section className="hidden md:block text-center mb-4">
          <h1 className="text-[34px] leading-[1.2] font-bold text-[#000000]">Tell us about yourself</h1>
          <p className="mt-2 text-[16px] leading-[1.5] font-normal text-[#828282]">
            We&apos;re required to collect this verify your identity.
          </p>
        </section>

        <div className="w-full max-w-[680px] px-4 py-4 md:bg-white md:border-[1.5px] md:border-[#E8E8E9] md:rounded-[14px] md:px-5 md:py-5">
          {pausedMessage && (
            <div className="mb-5 bg-yellow-50 border border-yellow-200 rounded-[10px] p-3">
              <p className="text-sm text-yellow-800">{pausedMessage}</p>
            </div>
          )}

          <h2 className="text-[16px] md:text-[18px] leading-[1.35] font-semibold text-[#000000] mb-2">
            Country of residence
          </h2>
          <p className="text-[14px] md:text-[16px] leading-[1.4] font-normal text-[#828282] mb-3 md:mb-6">
            Select the country you primarily reside in
          </p>

          <div className="space-y-1 md:space-y-4">
            <div className="relative">
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full h-[48px] md:h-[52px] pl-3 pr-10 rounded-[12px] md:rounded-[10px] bg-[#14111C1A] border-[1.5px] border-transparent text-[#000000] text-[14px] md:text-[16px] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6D3CCC]/20 focus:border-[#6D3CCC]"
              >
                <option value="" disabled>
                  Country
                </option>
                {countryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#828282] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {hasStates && (
              <div className="relative">
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full h-[48px] md:h-[52px] pl-3 pr-10 rounded-[12px] md:rounded-[10px] bg-[#14111C1A] border-[1.5px] border-transparent text-[#000000] text-[14px] md:text-[16px] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6D3CCC]/20 focus:border-[#6D3CCC]"
                >
                  <option value="" disabled>
                    State
                  </option>
                  {cityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#828282] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            )}
          </div>

          <div className="hidden md:block mt-12 md:mt-16">
            <p className="text-[14px] text-[#828282] mb-3 md:mb-4">
              By continuing, you agree to the <a href="#" className="text-[#6D3CCC]">Terms of Service</a>, <a href="#" className="text-[#6D3CCC]">Privacy Policy</a>, and <a href="#" className="text-[#6D3CCC]">Biometrics Policy</a>
            </p>

            <Button
              onClick={handleNext}
              disabled={!canProceed || !!pausedMessage}
              className="w-full max-w-[670px] h-[54px] !rounded-[12px] !bg-[#6D3CCC] hover:!bg-[#8558D9] focus:!bg-[#6D3CCC] focus:!ring-0 focus:!ring-offset-0 active:!bg-[#6D3CCC] disabled:!bg-[#6D3CCC] disabled:opacity-100 !text-white disabled:!text-white text-[16px] font-semibold"
            >
              Continue
            </Button>

            <button
              type="button"
              onClick={() => router.push('/verify/enter-email')}
              className="flex items-center justify-center gap-2 text-[#828282] text-[14px] leading-none font-normal mt-4 md:mt-5 mx-auto hover:text-[#000000] transition-colors"
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 px-4 pb-4 pt-2 bg-gradient-to-t from-[#FFFFFF] to-transparent flex flex-col items-center">
        <p className="text-[12px] text-[#828282] mb-3 text-center max-w-[341px]">
          By continuing, you agree to the <a href="#" className="text-[#6D3CCC]">Terms of Service</a>, <a href="#" className="text-[#6D3CCC]">Privacy Policy</a>, and <a href="#" className="text-[#6D3CCC]">Biometrics Policy</a>
        </p>
        <Button
          onClick={handleNext}
          disabled={!canProceed || !!pausedMessage}
          className="w-full max-w-[341px] h-[54px] !rounded-[14px] !bg-[#6D3CCC] hover:!bg-[#8558D9] focus:!bg-[#6D3CCC] focus:!ring-0 focus:!ring-offset-0 active:!bg-[#6D3CCC] disabled:!bg-[#6D3CCC] disabled:opacity-100 !text-white disabled:!text-white text-[16px] font-semibold"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { useAppContext } from '@/context/useAppContext'
import { PoweredBy } from '@/components/verify/PoweredBy'
import { VerifyMobileBackRow } from '@/components/verify/VerifyMobileBackRow'
import { SpinnerIcon } from '@/components/verify/SpinnerIcon'

export default function ResidentSelection() {
  const router = useRouter()
  const { state, dispatch } = useAppContext()
  
  const [selected, setSelected] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleContinue = () => {
    if (!selected) {
      setError('Please select where you reside')
      return
    }
    setError(null)
    setLoading(true)
    dispatch({ type: 'SET_RESIDENT_USA', payload: selected === 'usa' })
    router.push('/verify/enter-phone')
  }

  // Default selection from previous page: if user chose USA on select-id-type, pre-select "United States of America"; otherwise "All countries except USA"
  useEffect(() => {
    const countryFromPrevious = (state.selectedCountry || '').toLowerCase().trim()
    const isUSA = countryFromPrevious === 'us' || countryFromPrevious === 'usa'
    setSelected(isUSA ? 'usa' : 'other')
  }, [state.selectedCountry])

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

  const handleSelect = (value: string) => {
    setSelected(value)
    setError(null)
  }

  return (
    <div className="h-full md:h-screen overflow-hidden bg-[#FFFFFF] flex flex-col">
      <VerifyMobileBackRow onBack={() => router.back()} />

      <main className="flex-1 w-full overflow-hidden flex flex-col items-start md:items-center md:justify-center px-4 pt-4 pb-32 md:pt-6 md:pb-6 md:min-h-0">
        {/* Desktop heading, match previous screens */}
        <section className="hidden md:block text-center mb-4">
          <h1 className="font-sans text-[20px] font-bold leading-[100%] tracking-[0%] text-[#000000]">Tell us about yourself</h1>
          <p className="mt-2 font-sans text-[16px] font-normal leading-[100%] text-[#545454]">
            Local regulation requires us to ask
          </p>
        </section>

        {/* Card / content */}
        <div className="w-full max-w-[680px] md:border-[1.5px] md:border-[#E8E8E9] md:rounded-[14px] md:px-5 md:py-4">
          <h2 className="font-sans text-[20px] font-bold leading-[100%] tracking-[0%] text-[#000000] mb-1.5">
            Country residency
          </h2>
          <p className="font-sans text-[16px] md:text-[16px] leading-[1.4] font-normal text-[#545454] mb-4">
            Select where you currently reside
          </p>

          {/* Options styled like select-id-type inputs (light grey, radii 12/5) */}
          <div className="space-y-1">
            <button
              onClick={() => handleSelect('other')}
              className={`w-full h-[51px] px-4 rounded-tl-[12px] rounded-tr-[12px] rounded-br-[5px] rounded-bl-[5px] md:rounded-[12px] border border-[#E5E5E5] text-left flex items-center justify-between bg-[#EBEBEB] transition-colors ${
                selected === 'other'
                  ? 'border-[#A7D80D]'
                  : 'border-[#E5E5E5]'
              } cursor-pointer`}
            >
              <span className="font-sans text-[16px] font-normal leading-[100%] tracking-[0%] text-[#000000]">
                All countries except USA
              </span>
              <span className={`w-5 h-5 rounded-full border ${selected === 'other' ? 'border-[#A7D80D] bg-[#A7D80D]' : 'border-[#828282]'}`}>
                <span className={`block w-2 h-2 rounded-full bg-[#A7D80D] mx-auto mt-[5px] ${selected === 'other' ? 'opacity-100' : 'opacity-0'}`} />
              </span>
            </button>

            <button
              onClick={() => handleSelect('usa')}
              className={`w-full h-[51px] px-4 rounded-tl-[5px] rounded-tr-[5px] rounded-br-[12px] rounded-bl-[12px] md:rounded-[12px] border border-[#E5E5E5] text-left flex items-center justify-between bg-[#EBEBEB] transition-colors ${
                selected === 'usa'
                  ? 'border-[#A7D80D]'
                  : 'border-[#E5E5E5]'
              } cursor-pointer`}
            >
              <span className="font-sans text-[16px] font-normal leading-[100%] tracking-[0%] text-[#000000]">
                United States of America
              </span>
              <span className={`w-5 h-5 rounded-full border ${selected === 'usa' ? 'border-[#A7D80D] bg-[#A7D80D]' : 'border-[#828282]'}`}>
                <span className={`block w-2 h-2 rounded-full bg-[#A7D80D] mx-auto mt-[5px] ${selected === 'usa' ? 'opacity-100' : 'opacity-0'}`} />
              </span>
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}

          <div className="hidden md:block mt-6">
            <Button
              onClick={handleContinue}
              disabled={!selected || loading}
              className="w-full max-w-[670px] h-[54px] !rounded-[12px] !bg-[#000000] hover:!opacity-90 active:!opacity-80 focus:!ring-2 focus:!ring-[#000000] focus:!ring-offset-2 disabled:opacity-50 !text-white text-[16px] font-semibold"
            >
              {loading ? <SpinnerIcon color="#000000" /> : 'Continue'}
            </Button>

            <button
              type="button"
              onClick={() => router.push('/verify/select-id-type')}
              className="flex items-center justify-center gap-2 text-[#828282] text-[14px] leading-none font-normal mt-6 mx-auto hover:text-[#000000] transition-colors"
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
      {/* Mobile: bottom Continue button, lime with black text (like other screens) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 px-4 pb-8 pt-2 bg-gradient-to-t from-[#FFFFFF] to-transparent flex justify-center">
        <Button
          onClick={handleContinue}
          disabled={!selected || loading}
          className="w-full max-w-[341px] h-[54px] !rounded-[12px] !bg-[#A7D80D] hover:!opacity-95 active:!opacity-90 focus:!ring-2 focus:!ring-[#A7D80D] focus:!ring-offset-2 !text-black text-[16px] font-semibold"
        >
          {loading ? <SpinnerIcon color="#000000" /> : 'Continue'}
        </Button>
      </div>
    </div>
  )
}
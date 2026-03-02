'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { useAppContext } from '@/context/useAppContext'
import { PoweredBy } from '@/components/verify/PoweredBy'

export default function ResidentSelection() {
  const router = useRouter()
  const { state, dispatch } = useAppContext()
  
  const [selected, setSelected] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const handleContinue = () => {
    if (!selected) {
      setError('Please select where you reside')
      return
    }
    setError(null)
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

      <main className="flex-1 w-full overflow-hidden md:overflow-y-auto flex flex-col items-center md:justify-center md:justify-center px-4 pt-3 pb-32 md:pt-6 md:pb-6 md:min-h-0">
        <section className="hidden md:block text-center mb-4">
          <h1 className="text-[34px] leading-[1.2] font-bold text-[#000000]">Tell us about yourself</h1>
          <p className="mt-2 text-[16px] leading-[1.5] font-normal text-[#828282]">
            We&apos;re required to collect this verify your identity.
          </p>
        </section>

        <div className="w-full max-w-[680px] md:border-[1.5px] md:border-[#E8E8E9] md:rounded-[14px] md:px-5 md:py-4">
          <h2 className="text-[16px] md:text-[18px] leading-[1.35] font-semibold text-[#000000] mb-2">
            Country residency
          </h2>
          <p className="text-[14px] md:text-[16px] leading-[1.4] font-normal text-[#828282] mb-4">
            Select where you currently reside
          </p>

          <div className="space-y-2">
            <button
              onClick={() => handleSelect('other')}
              className={`w-full h-[52px] px-4 rounded-[12px] md:rounded-[10px] border text-left flex items-center justify-between transition-colors ${
                selected === 'other'
                  ? 'border-[#6D3CCC] bg-[#E8E8E9]'
                  : 'border-transparent bg-[#E8E8E9]'
              } cursor-pointer`}
            >
              <span className="text-[14px] md:text-[16px] font-normal text-[#000000]">All countries except USA</span>
              <span className={`w-5 h-5 rounded-full border ${selected === 'other' ? 'border-[#6D3CCC] bg-[#6D3CCC]' : 'border-[#828282]'}`}>
                <span className={`block w-2 h-2 rounded-full bg-white mx-auto mt-[5px] ${selected === 'other' ? 'opacity-100' : 'opacity-0'}`} />
              </span>
            </button>

            <button
              onClick={() => handleSelect('usa')}
              className={`w-full h-[52px] px-4 rounded-[12px] md:rounded-[10px] border text-left flex items-center justify-between transition-colors ${
                selected === 'usa'
                  ? 'border-[#6D3CCC] bg-[#E8E8E9]'
                  : 'border-transparent bg-[#E8E8E9]'
              } cursor-pointer`}
            >
              <span className="text-[14px] md:text-[16px] font-normal text-[#000000]">United States of America</span>
              <span className={`w-5 h-5 rounded-full border ${selected === 'usa' ? 'border-[#6D3CCC] bg-[#6D3CCC]' : 'border-[#828282]'}`}>
                <span className={`block w-2 h-2 rounded-full bg-white mx-auto mt-[5px] ${selected === 'usa' ? 'opacity-100' : 'opacity-0'}`} />
              </span>
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}

          <div className="hidden md:block mt-6">
            <Button
              onClick={handleContinue}
              disabled={false}
              className="w-full max-w-[670px] h-[54px] !rounded-[12px] !bg-[#6D3CCC] hover:!bg-[#8558D9] focus:!bg-[#6D3CCC] focus:!ring-0 focus:!ring-offset-0 active:!bg-[#6D3CCC] disabled:!bg-[#6D3CCC] disabled:opacity-100 !text-white disabled:!text-white text-[16px] font-semibold"
            >
              Continue
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 px-4 pb-4 pt-2 bg-gradient-to-t from-[#FFFFFF] to-transparent flex justify-center">
        <Button
          onClick={handleContinue}
          disabled={false}
          className="w-full max-w-[341px] h-[54px] !rounded-[14px] !bg-[#6D3CCC] hover:!bg-[#8558D9] focus:!bg-[#6D3CCC] focus:!ring-0 focus:!ring-offset-0 active:!bg-[#6D3CCC] disabled:!bg-[#6D3CCC] disabled:opacity-100 !text-white disabled:!text-white text-[16px] font-semibold"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
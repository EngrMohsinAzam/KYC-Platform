'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PoweredBy } from '@/components/verify/PoweredBy'
import { getCountryOptions } from '@/app/(public)/utils/countries'

export default function IdIssuingCountryPage() {
  const router = useRouter()
  const [country, setCountry] = useState('')
  const countryOptions = getCountryOptions()

  const canProceed = !!country

  const handleContinue = () => {
    if (!country) return
    router.push('/verify/upload-id-type')
  }

  return (
    <div className="min-h-screen h-[100dvh] md:h-screen overflow-hidden bg-[#FFFFFF] flex flex-col">
      {/* Mobile: back arrow only (left) */}
      <div className="md:hidden pl-4 pt-5 pb-1">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => router.push('/verify/documents')}
          className="h-8 w-8 inline-flex items-center justify-center text-[#000000] hover:opacity-80 transition-opacity"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      <main className="flex-1 flex flex-col items-start md:items-center md:justify-center px-4 pt-3 pb-6 md:pt-6 md:min-h-0 min-h-0 overflow-y-auto md:overflow-visible">
        {/* Desktop heading */}
        <section className="hidden md:block text-center mb-3 md:mb-4">
          <h1 className="font-sans text-[20px] font-bold leading-[100%] tracking-[0%] text-[#000000]">
            Tell us about yourself
          </h1>
          <p className="mt-1 font-sans text-[18px] font-normal leading-[100%] tracking-[0%] text-[#545454]">
            We&apos;re required to collect this verify your identity.
          </p>
        </section>

        <div className="w-full max-w-[760px] md:max-w-[680px] md:bg-[#FFFFFF] md:border-[1.5px] md:border-[#E8E8E9] md:rounded-[14px] md:px-5 md:py-4 md:flex md:flex-col md:flex-shrink-0">
          {/* Mobile heading */}
          <h2 className="md:hidden font-sans text-[20px] font-bold leading-[100%] tracking-[0%] text-[#000000] mb-2">
            What country is your government ID from?
          </h2>
          {/* Desktop label */}
          <label className="hidden md:block font-sans text-[20px] font-bold leading-[100%] tracking-[0%] text-[#000000] mb-1">
            What country is your government ID from?
          </label>
          <p className="font-sans text-[18px] font-normal leading-[100%] tracking-[0%] text-[#545454] mb-4">
            Enter your country name
          </p>

          {/* Country dropdown - same styling as other verify inputs */}
          <div className="relative w-full h-[51px] rounded-[12px] bg-[#EBEBEB] border-2 border-transparent focus-within:border-[#A7D80D] focus-within:ring-2 focus-within:ring-[#A7D80D]/20 pl-4 pr-10 flex items-center transition-colors">
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-transparent border-0 p-0 font-sans text-[16px] font-normal leading-[100%] tracking-[0%] text-[#000000] appearance-none focus:outline-none focus:ring-0 cursor-pointer [color-scheme:light]"
              style={{ color: country ? '#000000' : '#545454' }}
            >
              <option value="" className="text-[#545454]">
                Select country
              </option>
              {countryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
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

          {/* Mobile: Continue in flow, 12px gap above button (match reference) */}
          <div className="md:hidden mt-[12px]">
            <button
              type="button"
              onClick={handleContinue}
              disabled={!canProceed}
              className="w-full h-[54px] rounded-[12px] bg-[#A7D80D] hover:opacity-95 active:opacity-90 text-black text-[16px] font-semibold transition-opacity focus:outline-none focus:ring-2 focus:ring-[#A7D80D] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>

          {/* Desktop: Continue + X Close - 23px gap above button */}
          <div className="hidden md:block mt-[23px]">
            <button
              type="button"
              onClick={handleContinue}
              disabled={!canProceed}
              className="w-full h-[54px] rounded-[12px] bg-[#A7D80D] hover:opacity-95 active:opacity-90 text-black text-[16px] font-semibold transition-opacity focus:outline-none focus:ring-2 focus:ring-[#A7D80D] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="block w-full text-center mt-4 text-[#545454] text-[14px] font-normal hover:text-[#000000] transition-colors"
            >
              X Close
            </button>
          </div>
        </div>

      </main>

      <PoweredBy />

      {/* Mobile: disclaimer fixed at bottom of screen */}
      <p className="md:hidden px-4 py-4 font-sans text-[12px] font-normal leading-[117%] tracking-[0%] text-[#545454] text-left w-full bg-[#FFFFFF]">
        Please do not exit the flow before you are finished. If you leave the ID verification process, you will not be able to access it again & will need to start over.
      </p>
    </div>
  )
}

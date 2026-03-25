'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PoweredBy } from '@/components/verify/PoweredBy'
import { SpinnerIcon } from '@/components/verify/SpinnerIcon'

export default function FormerNamePage() {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)

  const handleContinue = () => {
    setLoading(true)
    router.push('/verify/documents')
  }

  return (
    <div className="min-h-screen h-[100dvh] md:h-screen overflow-hidden bg-[#FFFFFF] flex flex-col">
      {/* Mobile: back arrow only (left) */}
      <div className="md:hidden pl-4 pt-5 pb-1">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => router.push('/verify/source-of-wealth')}
          className="h-8 w-5 inline-flex items-center justify-center text-[#000000] hover:opacity-80 transition-opacity"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      <main className="flex-1 flex flex-col items-start md:items-center md:justify-center px-4 pt-3 pb-28 md:pt-6 md:pb-6 md:min-h-0 min-h-0 overflow-hidden md:overflow-visible">
        {/* Desktop heading */}
        <section className="hidden md:block text-center mb-3 md:mb-4">
          <h1 className="font-sans text-[20px] font-bold leading-[100%] tracking-[0%] text-[#000000]">
            Tell us about yourself
          </h1>
          <p className="mt-1 font-sans text-[18px] font-normal leading-[100%] tracking-[0%] text-[#545454]">
            We&apos;re required to collect this verify your identity.
          </p>
        </section>

        <div className="w-full max-w-[760px] md:max-w-[680px] md:bg-[#FFFFFF] md:border-[1.5px] md:border-[#E8E8E9] md:rounded-[14px] md:px-5 md:py-4 md:flex md:flex-col">
          {/* Mobile heading */}
          <h2 className="md:hidden font-sans text-[20px] font-bold leading-[100%] tracking-[0%] text-[#000000] mb-2">
            Former first name or alias
          </h2>
          {/* Desktop label */}
          <label className="hidden md:block font-sans text-[20px] font-bold leading-[100%] tracking-[0%] text-[#000000] mb-1">
            Former first name or alias
          </label>
          <p className="font-sans text-[18px] font-normal leading-[100%] tracking-[0%] text-[#545454] mb-3">
            Enter your name
          </p>

          {/* Input with Optional on the right inside field */}
          <div className="relative w-full">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder=""
              className="w-full h-[51px] rounded-[12px] bg-[#EBEBEB] border-2 border-transparent focus:border-[#A7D80D] focus:outline-none focus:ring-2 focus:ring-[#A7D80D]/20 pl-4 pr-20 font-sans text-[16px] font-normal leading-[100%] tracking-[0%] text-[#000000] placeholder:text-[#545454] transition-colors"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none font-sans text-[16px] font-normal leading-[100%] tracking-[0%] text-[#545454]">
              Optional
            </span>
          </div>

          {/* Desktop Continue + X Close */}
          <div className="hidden md:block mt-6">
            <button
              type="button"
              onClick={handleContinue}
              disabled={loading}
              className="w-full h-[54px] rounded-[12px] bg-[#A7D80D] hover:opacity-95 active:opacity-90 text-black text-[16px] font-semibold transition-opacity focus:outline-none focus:ring-2 focus:ring-[#A7D80D] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <SpinnerIcon color="#000000" /> : 'Continue'}
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

      {/* Mobile: Continue button at bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 px-4 pb-8 pt-2 bg-gradient-to-t from-[#FFFFFF] to-transparent">
        <button
          type="button"
          onClick={handleContinue}
          disabled={loading}
          className="w-full h-[54px] rounded-[12px] bg-[#A7D80D] hover:opacity-95 active:opacity-90 text-black text-[16px] font-semibold transition-opacity focus:outline-none focus:ring-2 focus:ring-[#A7D80D] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <SpinnerIcon color="#000000" /> : 'Continue'}
        </button>
      </div>
    </div>
  )
}

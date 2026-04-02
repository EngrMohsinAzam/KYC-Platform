'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PoweredBy } from '@/components/verify/PoweredBy'
import { VerifyMobileBackRow } from '@/components/verify/VerifyMobileBackRow'
import { SpinnerIcon } from '@/components/verify/SpinnerIcon'
import { getCountryOptions } from '@/app/(public)/utils/countries'

export default function IdIssuingCountryPage() {
  const router = useRouter()
  const [country, setCountry] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const countryOptions = getCountryOptions()

  const canProceed = !!country
  const selectedLabel =
    countryOptions.find((o) => o.value === country)?.label ?? ''

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const handleContinue = () => {
    if (!country) return
    setLoading(true)
    router.push('/verify/upload-id-type')
  }

  return (
    <div className="h-full md:h-screen overflow-hidden bg-[#FFFFFF] flex flex-col">
      <VerifyMobileBackRow onBack={() => router.push('/verify/documents')} />

      <main className="flex-1 flex flex-col items-start md:items-center md:justify-center px-4 pt-3 pb-6 md:pt-6 md:min-h-0 min-h-0 overflow-hidden">
        {/* Desktop heading */}
        <section className="hidden md:block text-center mb-3 md:mb-4">
          <h1 className="font-sans text-[20px] font-bold leading-[100%] tracking-[0%] text-[#000000]">
            Tell us about yourself
          </h1>
          <p className="mt-1 font-sans text-[18px] font-normal leading-[100%] tracking-[0%] text-[#545454]">
            Local regulation requires us to ask
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

          {/* Custom dropdown: native select options cannot be sized on mobile; list uses smaller type + scroll */}
          <div ref={rootRef} className="relative z-10 w-full">
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className={`relative flex h-[54px] w-full min-h-[54px] items-center rounded-[12px] bg-[#EBEBEB] pl-4 pr-10 text-left font-sans transition-colors md:bg-[#14111C1A] ${
                open
                  ? 'border border-[#A7D80D] ring-2 ring-[#A7D80D]/20'
                  : 'border border-[#E5E5E5] focus:outline-none focus-visible:border-[#A7D80D] focus-visible:ring-2 focus-visible:ring-[#A7D80D]/20'
              }`}
            >
              <span
                className={`line-clamp-2 w-full text-[16px] font-normal leading-[1.35] ${
                  selectedLabel ? 'text-[#000000]' : 'text-[#545454]'
                }`}
              >
                {selectedLabel || 'Select country'}
              </span>
              <svg
                className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#545454] transition-transform ${open ? 'rotate-180' : ''}`}
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

            {open && (
              <ul
                role="listbox"
                className="absolute left-0 right-0 top-[calc(100%+6px)] z-[100] max-h-[min(240px,42vh)] overflow-y-auto overscroll-y-contain rounded-[10px] border border-[#E8E8E9] bg-white py-1 shadow-lg md:max-h-[280px]"
              >
                <li role="none">
                  <button
                    type="button"
                    role="option"
                    aria-selected={!country}
                    className="w-full border-b border-[#E8E8E9] px-3 py-2.5 text-left font-sans text-[13px] font-normal leading-[1.35] text-[#545454] last:border-b-0 hover:bg-[#E8E8E9] md:text-[14px]"
                    onClick={() => {
                      setCountry('')
                      setOpen(false)
                    }}
                  >
                    Select country
                  </button>
                </li>
                {countryOptions.map((opt) => (
                  <li key={opt.value} role="none">
                    <button
                      type="button"
                      role="option"
                      aria-selected={country === opt.value}
                      className="w-full border-b border-[#E8E8E9] px-3 py-2 text-left font-sans text-[13px] font-normal leading-[1.35] text-[#000000] last:border-b-0 hover:bg-[#E8E8E9] md:py-2.5 md:text-[14px]"
                      onClick={() => {
                        setCountry(opt.value)
                        setOpen(false)
                      }}
                    >
                      {opt.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Mobile: Continue in flow, 12px gap above button (match reference) */}
          <div className="md:hidden mt-[12px]">
            <button
              type="button"
              onClick={handleContinue}
              disabled={!canProceed || loading}
              className="w-full h-[54px] rounded-[12px] bg-[#A7D80D] hover:opacity-95 active:opacity-90 text-black text-[16px] font-semibold transition-opacity focus:outline-none focus:ring-2 focus:ring-[#A7D80D] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <SpinnerIcon color="#000000" /> : 'Continue'}
            </button>
          </div>

          {/* Desktop: Continue + X Close - 23px gap above button */}
          <div className="hidden md:block mt-[23px]">
            <button
              type="button"
              onClick={handleContinue}
              disabled={!canProceed || loading}
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

      {/* Mobile: disclaimer fixed at bottom of screen */}
      <p className="md:hidden px-4 py-4 font-sans text-[12px] font-normal leading-[117%] tracking-[0%] text-[#545454] text-left w-full bg-[#FFFFFF]">
        Please do not exit the flow before you are finished. If you leave the ID verification process, you will not be able to access it again & will need to start over.
      </p>
    </div>
  )
}

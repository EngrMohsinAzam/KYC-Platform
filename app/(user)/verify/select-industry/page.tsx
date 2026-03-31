'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PoweredBy } from '@/components/verify/PoweredBy'
import { VerifyMobileBackRow } from '@/components/verify/VerifyMobileBackRow'
import { SpinnerIcon } from '@/components/verify/SpinnerIcon'

type Industry =
  | 'agriculture'
  | 'business'
  | 'computer'
  | 'construction'
  | 'education'
  | 'finance'
  | 'government'
  | 'healthcare'

const INDUSTRY_OPTIONS: { id: Industry; label: string; icon: string }[] = [
  { id: 'agriculture', label: 'Agriculture', icon: '/industry-type/agriculture.svg' },
  { id: 'business', label: 'Business management', icon: '/industry-type/business.svg' },
  { id: 'computer', label: 'Computers and IT', icon: '/industry-type/computer.svg' },
  { id: 'construction', label: 'Construction', icon: '/industry-type/construction.svg' },
  { id: 'education', label: 'Education', icon: '/industry-type/education.svg' },
  { id: 'finance', label: 'Finance', icon: '/industry-type/finance.svg' },
  { id: 'government', label: 'Government', icon: '/industry-type/government.svg' },
  { id: 'healthcare', label: 'Healthcare', icon: '/industry-type/healthcare.svg' },
]

export default function SelectIndustryPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<Industry | ''>('')
  const [loading, setLoading] = useState(false)

  const canProceed = !!selected

  const optionBase =
    'inline-flex h-[44px] px-4 rounded-[12px] bg-[#EBEBEB] items-center gap-2.5 text-left font-sans text-[15px] font-normal leading-[100%] tracking-[0%] text-[#000000] transition-colors'

  const handleContinue = () => {
    if (!selected) return
    setLoading(true)
    router.push('/verify/monthly-activity')
  }

  return (
    <div className="min-h-screen h-[100dvh] md:h-screen overflow-hidden bg-[#FFFFFF] flex flex-col">
      <VerifyMobileBackRow onBack={() => router.push('/verify/employment-status')} />

      <main className="flex-1 flex flex-col items-start md:items-center md:justify-center px-4 pt-2 pb-[170px] md:pt-6 md:pb-6 md:min-h-0 min-h-0 overflow-hidden">
        {/* Desktop heading */}
        <section className="hidden md:block text-center mb-3 md:mb-4">
          <h1 className="font-sans text-[20px] font-bold leading-[100%] tracking-[0%] text-[#000000]">
            Tell us about yourself
          </h1>
          <p className="mt-1 font-sans text-[16px] leading-[100%] font-normal text-[#545454]">
            Local regulation requires us to ask
          </p>
        </section>

        {/* Desktop card */}
        <div className="w-full max-w-[760px] md:max-w-[680px] md:bg-[#FFFFFF] md:border-[1.5px] md:border-[#E8E8E9] md:rounded-[14px] md:px-5 md:py-4 md:flex md:flex-col md:max-h-[623px]">
          {/* Mobile heading */}
          <h2 className="md:hidden font-sans text-[20px] font-bold leading-[100%] tracking-[0%] text-[#000000] mb-2">
            Which industry best matches your line of work?
          </h2>
          {/* Desktop label */}
          <label className="hidden md:block font-sans text-[20px] font-bold leading-[100%] tracking-[0%] text-[#000000] mb-1">
            Which industry best matches your line of work?
          </label>
          <p className="font-sans text-[16px] leading-[1.4] font-normal text-[#545454] mb-4">
            Pick the closest fit. If you&apos;re unemployed, pick your previous line of work.
          </p>

          {/* Scrollable options area on desktop to mirror design */}
          <div className="md:flex-1 md:overflow-hidden md:pr-2">
            <div className="flex flex-col items-start gap-1">
              {INDUSTRY_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelected(opt.id)}
                  className={`${optionBase} ${
                    selected === opt.id ? 'border-[2px] border-[#A7D80D]' : ''
                  }`}
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center">
                    <Image src={opt.icon} alt={opt.label} width={24} height={24} />
                  </span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Desktop Continue + Back inside card */}
          <div className="hidden md:block mt-6">
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
              onClick={() => router.push('/verify/employment-status')}
              className="flex items-center justify-center gap-2 text-[#545454] text-[14px] leading-none font-normal mt-4 mx-auto hover:text-[#000000] transition-colors"
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

      {/* Mobile: helper text + bottom Continue button, lime with black text */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 px-4 pb-8 pt-2 bg-gradient-to-t from-[#FFFFFF] to-transparent flex flex-col">
        <p className="mb-3 font-sans text-[14px] leading-[1.4] font-normal text-center text-[#545454]">
          Local regulation requires us to ask
        </p>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!canProceed || loading}
          className="w-full h-[54px] rounded-[12px] bg-[#A7D80D] hover:opacity-95 active:opacity-90 text-black text-[16px] font-semibold transition-opacity focus:outline-none focus:ring-2 focus:ring-[#A7D80D] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <SpinnerIcon color="#000000" /> : 'Continue'}
        </button>
      </div>
    </div>
  )
}


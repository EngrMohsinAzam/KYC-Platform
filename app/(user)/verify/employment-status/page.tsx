'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PoweredBy } from '@/components/verify/PoweredBy'
import { SpinnerIcon } from '@/components/verify/SpinnerIcon'

type EmploymentStatus = 'employed' | 'unemployed' | 'retired' | 'student'

export default function EmploymentStatusPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<EmploymentStatus | ''>('')
  const [loading, setLoading] = useState(false)

  const handleSelect = (value: EmploymentStatus) => {
    setSelected(value)
  }

  const handleContinue = () => {
    if (!selected) return
    setLoading(true)
    router.push('/verify/select-industry')
  }

  const canProceed = !!selected

  const optionBase =
    'inline-flex h-[51px] px-4 rounded-[12px] bg-[#EBEBEB] items-center gap-3 text-left font-sans text-[16px] font-normal leading-[100%] tracking-[0%] text-[#000000] transition-colors'

  return (
    <div className="min-h-screen h-[100dvh] md:h-screen overflow-hidden bg-[#FFFFFF] flex flex-col">
      <main className="flex-1 flex flex-col items-start md:items-center md:justify-center px-4 pt-3 pb-28 md:pt-6 md:pb-6 md:min-h-0 min-h-0 overflow-hidden md:overflow-visible">
        {/* Mobile: back arrow — same px-4 context as all content */}
        <div className="md:hidden w-full pt-2 pb-3">
          <button
            type="button"
            aria-label="Go back"
            onClick={() => router.push('/verify/enter-address')}
            className="inline-flex items-center justify-center text-[#000000] hover:opacity-80 transition-opacity"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>
        {/* Desktop heading */}
        <section className="hidden md:block text-center mb-3 md:mb-4">
          <h1 className="font-sans text-[20px] font-bold leading-[100%] tracking-[0%] text-[#000000]">
            Tell us about yourself
          </h1>
          <p className="mt-1 font-sans text-[16px] leading-[100%] font-normal text-[#545454]">
            We&apos;re required to collect this verify your identity.
          </p>
        </section>

        <div className="w-full max-w-[760px] md:max-w-[680px] md:bg-transparent md:border-[1.5px] md:border-[#E8E8E9] md:rounded-[14px] md:px-5 md:py-4">
          {/* Mobile heading */}
          <h2 className="md:hidden font-sans text-[24px] leading-[1.3] font-bold text-[#000000] mb-2">
            What is your employment status?
          </h2>
          {/* Desktop label */}
          <label className="hidden md:block font-sans text-[20px] font-bold leading-[100%] tracking-[0%] text-[#000000] mb-1">
            What is your employment status?
          </label>
          <p className="font-sans text-[16px] leading-[1.4] font-normal text-[#545454] mb-4">
            If you&apos;re unsure, pick the closest fit.
          </p>

          {/* Options - compact pills sized to content, one per line */}
          <div className="flex flex-col items-start gap-2">
            <button
              type="button"
              onClick={() => handleSelect('employed')}
              className={`${optionBase} ${
                selected === 'employed' ? 'border-[2px] border-[#A7D80D]' : ''
              }`}
            >
              <span className="inline-flex h-7 w-7 items-center justify-center">
                <Image src="/employment-status/employed.svg" alt="Employed" width={24} height={24} />
              </span>
              <span>Employed</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelect('unemployed')}
              className={`${optionBase} ${
                selected === 'unemployed' ? 'border-[2px] border-[#A7D80D]' : ''
              }`}
            >
              <span className="inline-flex h-7 w-7 items-center justify-center">
                <Image src="/employment-status/unemployed.svg" alt="Unemployed" width={24} height={24} />
              </span>
              <span>Unemployed</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelect('retired')}
              className={`${optionBase} ${
                selected === 'retired' ? 'border-[2px] border-[#A7D80D]' : ''
              }`}
            >
              <span className="inline-flex h-7 w-7 items-center justify-center">
                <Image src="/employment-status/retired.svg" alt="Retired" width={24} height={24} />
              </span>
              <span>Retired</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelect('student')}
              className={`${optionBase} ${
                selected === 'student' ? 'border-[2px] border-[#A7D80D]' : ''
              }`}
            >
              <span className="inline-flex h-7 w-7 items-center justify-center">
                <Image src="/employment-status/student.svg" alt="Student" width={24} height={24} />
              </span>
              <span>Student</span>
            </button>
          </div>

          {/* Desktop Continue + Back */}
          <div className="hidden md:block mt-6">
            <button
              type="button"
              onClick={handleContinue}
              disabled={!canProceed || loading}
              className="w-full max-w-[670px] h-[54px] rounded-[12px] bg-[#000000] hover:opacity-90 active:opacity-80 focus:outline-none focus:ring-2 focus:ring-[#000000] focus:ring-offset-2 text-white text-[16px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <SpinnerIcon color="#ffffff" /> : 'Continue'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/verify/enter-address')}
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

      {/* Mobile: helper text + bottom Continue button, lime with black text */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 px-4 pb-8 pt-2 bg-gradient-to-t from-[#FFFFFF] to-transparent flex flex-col">
        <p className="mb-3 font-sans text-[14px] leading-[1.4] font-normal text-center text-[#545454]">
          We&apos;re required to collect this verify your identity.
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


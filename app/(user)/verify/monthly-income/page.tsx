'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PoweredBy } from '@/components/verify/PoweredBy'

type IncomeRange = 'fewer_10' | '10_99' | '100_999' | '1000_plus'

const INCOME_OPTIONS: { id: IncomeRange; label: string }[] = [
  { id: 'fewer_10', label: 'Fewer than 10' },
  { id: '10_99', label: '10 - 99' },
  { id: '100_999', label: '100 - 999' },
  { id: '1000_plus', label: '1,000 or more' },
]

export default function MonthlyIncomePage() {
  const router = useRouter()
  const [selected, setSelected] = useState<IncomeRange | ''>('')

  const canProceed = !!selected

  const handleContinue = () => {
    if (!selected) return
    router.push('/verify/plan-use')
  }

  return (
    <div className="min-h-screen h-[100dvh] md:h-screen overflow-hidden bg-[#FFFFFF] flex flex-col">
      {/* Mobile: back arrow only (left) */}
      <div className="md:hidden pl-4 pt-5 pb-1">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => router.push('/verify/monthly-activity')}
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
            How much money do you think you&apos;ll make in a month?
          </h2>
          {/* Desktop label */}
          <label className="hidden md:block font-sans text-[20px] font-bold leading-[100%] tracking-[0%] text-[#000000] mb-1">
            How much money do you think you&apos;ll make in a month?
          </label>
          <p className="hidden md:block font-sans text-[16px] leading-[1.4] font-normal text-[#545454] mb-2">
            Choose your range below.
          </p>
          <p className="font-sans text-[18px] font-normal leading-[100%] tracking-[0%] text-[#545454] mb-4">
            Your response will not impact your trading limits.
          </p>

          {/* Options - full-width rows, 1px gap, radii like previous stacked inputs */}
          <div className="flex flex-col gap-[1px]">
            {INCOME_OPTIONS.map((opt, index) => {
              const isSelected = selected === opt.id
              const isFirst = index === 0
              const isLast = index === INCOME_OPTIONS.length - 1
              const radiusClass = isFirst
                ? 'rounded-tl-[12px] rounded-tr-[12px] rounded-br-[5px] rounded-bl-[5px]'
                : isLast
                  ? 'rounded-tl-[5px] rounded-tr-[5px] rounded-br-[12px] rounded-bl-[12px]'
                  : 'rounded-tl-[5px] rounded-tr-[5px] rounded-br-[5px] rounded-bl-[5px]'
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelected(opt.id)}
                  className={`w-full flex items-center justify-between h-[51px] px-4 ${radiusClass} text-left font-sans text-[16px] font-normal leading-[100%] tracking-[0%] text-[#000000] transition-colors border-2 ${
                    isSelected
                      ? 'bg-[#ECF9E3] border-[#A7D80D]'
                      : 'bg-[#EBEBEB] border-transparent'
                  }`}
                >
                  <span>{opt.label}</span>
                  <span
                    className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center ${
                      isSelected ? 'bg-[#A7D80D]' : 'bg-[#E0E0E0]'
                    }`}
                  >
                    {isSelected ? (
                      <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : null}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Desktop Continue + Back */}
          <div className="hidden md:block mt-6">
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
              onClick={() => router.push('/verify/monthly-activity')}
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

      {/* Mobile: helper text (14px) above Continue button only */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 px-4 pb-8 pt-2 bg-gradient-to-t from-[#FFFFFF] to-transparent flex flex-col">
        <p className="mb-3 font-sans text-[14px] font-normal leading-[100%] tracking-[0%] text-center text-[#545454]">
          We&apos;re required to collect this verify your identity.
        </p>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!canProceed}
          className="w-full h-[54px] rounded-[12px] bg-[#A7D80D] hover:opacity-95 active:opacity-90 text-black text-[16px] font-semibold transition-opacity focus:outline-none focus:ring-2 focus:ring-[#A7D80D] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  )
}

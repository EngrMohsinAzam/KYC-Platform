'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { useAppContext } from '@/context/useAppContext'
import { PoweredBy } from '@/components/verify/PoweredBy'
import { VerifyMobileBackRow } from '@/components/verify/VerifyMobileBackRow'
import { SpinnerIcon } from '@/components/verify/SpinnerIcon'

const allowNameChar = (value: string) => value.replace(/[^a-zA-Z\-']/g, '')

export default function EnterNamePage() {
  const router = useRouter()
  const { state, dispatch } = useAppContext()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [errorFirst, setErrorFirst] = useState<string | null>(null)
  const [errorLast, setErrorLast] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleContinue = () => {
    setErrorFirst(null)
    setErrorLast(null)
    const first = firstName.trim()
    const last = lastName.trim()
    if (!first) {
      setErrorFirst('Please enter your legal first name')
      return
    }
    if (!last) {
      setErrorLast('Please enter your legal last name (surname)')
      return
    }
    setLoading(true)
    const current = state.personalInfo || {
      firstName: '',
      lastName: '',
      fatherName: '',
      idNumber: '',
      email: '',
      phone: '',
      address: '',
    }
    dispatch({
      type: 'SET_PERSONAL_INFO',
      payload: {
        ...current,
        firstName: first,
        lastName: last,
        fatherName: current.fatherName || '',
      },
    })
    router.push('/verify/enter-dob')
  }

  const canProceed = firstName.trim().length > 0 && lastName.trim().length > 0

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia('(min-width: 768px)')
    const prevHtml = document.documentElement.style.overflowY
    const prevBody = document.body.style.overflowY
    const apply = () => {
      if (mql.matches) {
        document.documentElement.style.overflowY = 'hidden'
        document.body.style.overflowY = 'hidden'
      } else {
        document.documentElement.style.overflowY = prevHtml
        document.body.style.overflowY = prevBody
      }
    }
    apply()
    mql.addEventListener?.('change', apply)
    return () => {
      mql.removeEventListener?.('change', apply)
      document.documentElement.style.overflowY = prevHtml
      document.body.style.overflowY = prevBody
    }
  }, [])

  return (
    <div className="min-h-screen h-[100dvh] md:h-screen overflow-hidden bg-[#FFFFFF] flex flex-col">
      <VerifyMobileBackRow onBack={() => router.push('/verify/enter-phone')} />

      <main className="flex-1 flex flex-col items-start md:items-center md:justify-center px-4 pt-3 pb-28 md:pt-6 md:pb-6 md:min-h-0 min-h-0 overflow-hidden md:overflow-visible">
        {/* Desktop heading */}
        <section className="hidden md:block text-center mb-7">
          <h1 className="font-sans text-[20px] font-bold leading-[100%] tracking-[0%] text-[#000000]">Tell us about yourself</h1>
          <p className="mt-2 font-sans text-[16px] leading-[100%] font-normal text-[#545454]">
            Local regulation requires us to ask
          </p>
        </section>

        <div className="w-full max-w-[760px] md:max-w-[680px] md:bg-transparent md:border-[1.5px] md:border-[#E8E8E9] md:rounded-[14px] md:px-5 md:py-6">
          {/* Mobile heading */}
          <h2 className="md:hidden font-sans text-[20px] font-bold leading-[100%] tracking-[0%] text-[#000000] mb-2">
            Legal name
          </h2>
          {/* Desktop label */}
          <label className="hidden md:block font-sans text-[20px] font-bold leading-[100%] tracking-[0%] text-[#000000] mb-2">
            Legal name
          </label>
          <p className="font-sans text-[16px] md:text-[16px] leading-[1.4] font-normal text-[#545454] mb-4">
            Make sure your name matches what&apos;s on your government-issued ID.
          </p>

          {/* Inputs styled like select-id-type (stacked, light gray, radii 12/5 and 5/12, lime border only on focus) */}
          <div className="space-y-1">
            {/* First name: top 12, bottom 5 */}
            <div className="relative w-full h-[51px] rounded-tl-[12px] rounded-tr-[12px] rounded-br-[5px] rounded-bl-[5px] bg-[#EBEBEB] md:bg-[#14111C1A] border border-transparent focus-within:border-[#A7D80D] focus-within:ring-2 focus-within:ring-[#A7D80D]/20 flex items-center px-4 transition-colors">
              <input
                type="text"
                placeholder="Legal first name"
                value={firstName}
                onChange={(e) => {
                  setFirstName(allowNameChar(e.target.value))
                  setErrorFirst(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === ' ') {
                    e.preventDefault()
                    return
                  }
                  if (e.key === 'Enter' && !loading) handleContinue()
                }}
                className="w-full bg-transparent border-0 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:border-0 focus-visible:border-0 font-sans text-[16px] font-normal leading-[100%] tracking-[0%] text-[#000000] placeholder:text-[#545454]"
              />
            </div>
            {errorFirst && <p className="text-sm text-red-600 mt-1">{errorFirst}</p>}

            {/* Last name: top 5, bottom 12 (opposite radii) */}
            <div className="relative w-full h-[51px] rounded-tl-[5px] rounded-tr-[5px] rounded-br-[12px] rounded-bl-[12px] bg-[#EBEBEB] md:bg-[#14111C1A] border border-transparent focus-within:border-[#A7D80D] focus-within:ring-2 focus-within:ring-[#A7D80D]/20 flex items-center px-4 transition-colors">
              <input
                type="text"
                placeholder="Legal last name (surname)"
                value={lastName}
                onChange={(e) => {
                  setLastName(allowNameChar(e.target.value))
                  setErrorLast(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === ' ') {
                    e.preventDefault()
                    return
                  }
                  if (e.key === 'Enter' && !loading) handleContinue()
                }}
                className="w-full bg-transparent border-0 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:border-0 focus-visible:border-0 font-sans text-[16px] font-normal leading-[100%] tracking-[0%] text-[#000000] placeholder:text-[#545454]"
              />
            </div>
            {errorLast && <p className="text-sm text-red-600 mt-1">{errorLast}</p>}
          </div>

          {/* Desktop Continue + Back */}
          <div className="hidden md:block mt-6">
            <Button
              onClick={() => void handleContinue()}
              disabled={loading || !canProceed}
              className="w-full max-w-[670px] h-[54px] !rounded-[12px] !bg-[#000000] hover:!opacity-90 active:!opacity-80 focus:!ring-2 focus:!ring-[#000000] focus:!ring-offset-2 !text-white text-[16px] font-semibold disabled:opacity-50"
            >
              {loading ? <SpinnerIcon color="#ffffff" /> : 'Continue'}
            </Button>
            <button
              type="button"
              onClick={() => router.push('/verify/enter-phone')}
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
          Local regulation requires us to ask
        </p>
        <button
          type="button"
          onClick={() => void handleContinue()}
          disabled={loading || !canProceed}
          className="w-full h-[54px] rounded-[12px] bg-[#A7D80D] hover:opacity-95 active:opacity-90 text-black text-[16px] font-semibold transition-opacity focus:outline-none focus:ring-2 focus:ring-[#A7D80D] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <SpinnerIcon color="#000000" /> : 'Continue'}
        </button>
      </div>
    </div>
  )
}

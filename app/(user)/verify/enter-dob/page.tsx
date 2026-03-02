'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { useAppContext } from '@/context/useAppContext'
import { PoweredBy } from '@/components/verify/PoweredBy'

export default function EnterDobPage() {
  const router = useRouter()
  const { state, dispatch } = useAppContext()
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  /** Returns age in full years as of today; null if date invalid. */
  const getAge = (dateStr: string): number | null => {
    const date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) return null
    const today = new Date()
    let age = today.getFullYear() - date.getFullYear()
    const monthDiff = today.getMonth() - date.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) age -= 1
    return age
  }

  const handleContinue = () => {
    setError(null)
    const trimmed = dateOfBirth.trim()
    if (!trimmed) {
      setError('Please enter your date of birth')
      return
    }
    const date = new Date(trimmed)
    if (Number.isNaN(date.getTime())) {
      setError('Please enter a valid date of birth')
      return
    }
    const age = getAge(trimmed)
    if (age !== null && age < 18) {
      setError('You must be at least 18 years old to continue.')
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
        dateOfBirth: trimmed,
      },
    })
    setLoading(false)
    router.push('/verify/enter-address')
  }

  const canProceed = dateOfBirth.trim().length > 0

  useEffect(() => {
    const fromState = state.personalInfo?.dateOfBirth || ''
    if (fromState) setDateOfBirth(fromState)
  }, [state.personalInfo?.dateOfBirth])

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
      <div className="md:hidden pl-1 pr-4 pt-5">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => router.push('/verify/enter-name')}
          className="h-8 w-8 inline-flex items-center justify-center text-[#828282] hover:text-[#000000] transition-colors"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      <main className="flex-1 flex flex-col items-center md:justify-center md:justify-center px-4 pt-3 pb-28 md:pt-6 md:pb-6 md:min-h-0 min-h-0 overflow-hidden md:overflow-visible">
        <section className="hidden md:block text-center mb-7">
          <h1 className="text-[34px] leading-[1.2] font-bold text-[#000000]">Tell us about yourself</h1>
          <p className="mt-2 text-[16px] leading-[1.5] font-normal text-[#828282]">
            We&apos;re required to collect this verify your identity.
          </p>
        </section>

        <div className="w-full max-w-[760px] md:max-w-[680px] md:bg-transparent md:border-[1.5px] md:border-[#E8E8E9] md:rounded-[14px] md:px-5 md:py-6">
          <h2 className="md:hidden text-[24px] leading-[1.3] font-bold text-[#000000] mb-2">
            Date of birth
          </h2>
          <label className="hidden md:block text-[16px] md:text-[18px] leading-[1.4] font-semibold text-[#000000] mb-2">
            Date of birth
          </label>
          <p className="text-[14px] md:text-[16px] leading-[1.4] font-normal text-[#828282] mb-4">
            What is your date of birth?
          </p>

          <div className="relative">
            <input
              ref={inputRef}
              type="date"
              value={dateOfBirth}
              onChange={(e) => {
                setDateOfBirth(e.target.value)
                setError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canProceed && !loading) handleContinue()
              }}
              className={`w-full h-[48px] md:h-[52px] rounded-[12px] md:rounded-[10px] border pl-4 pr-12 focus:outline-none focus:ring-0 bg-[#14111C1A] text-[#000000] text-[14px] md:text-[16px] [color-scheme:light] appearance-none md:[&::-webkit-calendar-picker-indicator]:opacity-0 md:[&::-webkit-calendar-picker-indicator]:absolute md:[&::-webkit-calendar-picker-indicator]:inset-0 md:[&::-webkit-calendar-picker-indicator]:w-full md:[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:cursor-pointer max-md:[&::-webkit-calendar-picker-indicator]:!w-0 max-md:[&::-webkit-calendar-picker-indicator]:!h-0 max-md:[&::-webkit-calendar-picker-indicator]:!min-w-0 max-md:[&::-webkit-calendar-picker-indicator]:!overflow-hidden ${
                error ? 'border-red-500' : 'border-transparent'
              }`}
            />
            <button
              type="button"
              aria-label="Open date picker"
              onClick={() => {
                inputRef.current?.focus()
                if (typeof inputRef.current?.showPicker === 'function') {
                  inputRef.current.showPicker()
                } else {
                  inputRef.current?.click()
                }
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-[#828282] hover:text-[#000000] transition-colors rounded focus:outline-none focus:ring-0"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" x2="16" y1="2" y2="6" />
                <line x1="8" x2="8" y1="2" y2="6" />
                <line x1="3" x2="21" y1="10" y2="10" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mt-2">
              <p className="text-sm md:text-base text-red-600">{error}</p>
            </div>
          )}

          <div className="md:hidden mt-6">
            <p className="text-[14px] leading-[1.5] font-normal text-[#828282]">
              We&apos;re required to collect this verify your identity.
            </p>
          </div>

          <div className="hidden md:block mt-6">
            <Button
              onClick={() => void handleContinue()}
              disabled={loading}
              className="w-full max-w-[670px] h-[54px] !rounded-[12px] !bg-[#6D3CCC] hover:!bg-[#8558D9] focus:!bg-[#6D3CCC] focus:!ring-0 focus:!ring-offset-0 active:!bg-[#6D3CCC] disabled:!bg-[#6D3CCC] disabled:opacity-100 !text-white disabled:!text-white text-[16px] font-semibold"
            >
              {loading ? 'Saving...' : 'Continue'}
            </Button>
            <button
              type="button"
              onClick={() => router.push('/verify/enter-name')}
              className="flex items-center justify-center gap-2 text-[#828282] text-[14px] leading-none font-normal mt-7 mx-auto hover:text-[#000000] transition-colors"
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
          onClick={() => void handleContinue()}
          disabled={loading || !canProceed}
          className="w-full max-w-[341px] h-[54px] !rounded-[14px] !bg-[#6D3CCC] hover:!bg-[#8558D9] focus:!bg-[#6D3CCC] focus:!ring-0 focus:!ring-offset-0 active:!bg-[#6D3CCC] disabled:!bg-[#6D3CCC] disabled:opacity-100 !text-white disabled:!text-white font-semibold text-[16px]"
        >
          {loading ? 'Saving...' : 'Continue'}
        </Button>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { useAppContext } from '@/context/useAppContext'
import { PoweredBy } from '@/components/verify/PoweredBy'

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
    setLoading(false)
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
      <div className="md:hidden pl-1 pr-4 pt-5">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => router.push('/verify/enter-phone')}
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
            Legal name
          </h2>
          <label className="hidden md:block text-[16px] md:text-[18px] leading-[1.4] font-semibold text-[#000000] mb-2">
            Legal name
          </label>
          <p className="text-[14px] md:text-[16px] leading-[1.4] font-normal text-[#828282] mb-4">
            Make sure your name matches what&apos;s on your government-issued ID.
          </p>

          <div className="space-y-3">
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
              className={`w-full h-[48px] md:h-[52px] rounded-[12px] md:rounded-[10px] border px-4 focus:outline-none focus:ring-0 bg-[#14111C1A] placeholder:text-[#828282] text-[#000000] text-[14px] md:text-[16px] ${
                errorFirst ? 'border-red-500' : 'border-transparent'
              }`}
            />
            {errorFirst && <p className="text-sm text-red-600 mt-1">{errorFirst}</p>}
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
              className={`w-full h-[48px] md:h-[52px] rounded-[12px] md:rounded-[10px] border px-4 focus:outline-none focus:ring-0 bg-[#14111C1A] placeholder:text-[#828282] text-[#000000] text-[14px] md:text-[16px] ${
                errorLast ? 'border-red-500' : 'border-transparent'
              }`}
            />
            {errorLast && <p className="text-sm text-red-600 mt-1">{errorLast}</p>}
          </div>

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
              onClick={() => router.push('/verify/enter-phone')}
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

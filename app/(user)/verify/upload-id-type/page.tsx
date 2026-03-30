'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAppContext } from '@/context/useAppContext'
import { PoweredBy } from '@/components/verify/PoweredBy'
import { VerifyMobileBackRow } from '@/components/verify/VerifyMobileBackRow'

/* White card wrapper for each icon (per reference design) - icons from id-type-select */
function IconCard({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex-shrink-0 w-10 h-10 rounded-lg bg-white border border-[#E8E8E9] flex items-center justify-center shadow-sm">
      {children}
    </span>
  )
}

export default function UploadIdTypePage() {
  const router = useRouter()
  const { state, dispatch } = useAppContext()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const prevHtml = document.documentElement.style.overflowY
    const prevBody = document.body.style.overflowY
    document.documentElement.style.overflowY = 'hidden'
    document.body.style.overflowY = 'hidden'
    return () => {
      document.documentElement.style.overflowY = prevHtml
      document.body.style.overflowY = prevBody
    }
  }, [])

  useEffect(() => {
    // Do not pre-select an ID type when landing here (state may be restored from storage).
    if (state.selectedIdType) {
      dispatch({ type: 'SET_ID_TYPE', payload: '' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSelect = (idType: 'national-id' | 'passport' | 'drivers-license') => {
    dispatch({ type: 'SET_ID_TYPE', payload: idType })
    router.push('/verify/upload-document?openCamera=1')
  }

  return (
    <div className="h-screen min-h-[100dvh] md:min-h-screen max-h-screen bg-[#FFFFFF] flex flex-col overflow-hidden">
      <VerifyMobileBackRow
        variant="muted"
        padX="pl-[25px] pr-4"
        onBack={() => router.push('/verify/id-issuing-country')}
      />

      <main className="flex-1 flex flex-col items-center md:justify-center min-h-0 overflow-hidden pl-[25px] pr-4 pt-2 pb-6 md:px-4 md:py-4 md:pt-4">
        {/* Desktop: Tell us about yourself + subtitle (centered on page) */}
        <section className="hidden md:block text-center mb-4 flex-shrink-0 w-full max-w-[680px]">
          <h1 className="text-[28px] md:text-[30px] leading-tight font-bold text-[#000000]">Tell us about yourself</h1>
          <p className="mt-1 text-[14px] md:text-[15px] leading-[1.5] font-normal text-[#828282]">
            Local regulation requires us to ask
          </p>
        </section>

        {/* Card - wider, slightly reduced height, unzoomed */}
        <div className="w-full max-w-[680px] flex flex-col md:bg-white md:rounded-[14px] md:border-[1.5px] md:border-[#E8E8E9] md:shadow-md md:px-5 md:py-4 flex-shrink min-h-0 md:scale-[0.97] md:origin-center">
          <h2 className="text-[20px] md:text-[22px] leading-tight font-bold text-[#000000] mb-1 md:mb-1.5 text-left w-full">
            Upload a photo ID
          </h2>
          <p className="font-sans font-normal text-[16px] leading-[100%] tracking-[0%] text-[#828282] mb-4 text-left w-full">
            We require a photo of a government ID to verify your identity
          </p>

          {/* Options: Passport, National ID, Driving License - layout width 325px, left 25px, row height 71px, border-bottom 1px */}
          <div className="w-[325px] md:w-full border-t border-[#E0E0E0]">
            <button
              type="button"
              onClick={() => handleSelect('passport')}
              className="w-full h-[71px] flex items-center justify-between gap-3 text-left hover:bg-[#FAFAFA] active:bg-[#F0F0F0] transition-colors cursor-pointer border-b border-[#E0E0E0] opacity-100"
            >
              <div className="flex items-center gap-3 min-w-0">
                <IconCard>
                  <Image src="/id-type-select/passport.png" alt="" width={24} height={24} className="w-6 h-6 object-contain invert" />
                </IconCard>
                <span className="text-[14px] md:text-[15px] font-normal text-[#000000]">Passport</span>
              </div>
              <span className="flex-shrink-0 text-[#BDBDBD] text-xl leading-none">&rsaquo;</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelect('national-id')}
              className="w-full h-[71px] flex items-center justify-between gap-3 text-left hover:bg-[#FAFAFA] active:bg-[#F0F0F0] transition-colors cursor-pointer border-b border-[#E0E0E0] opacity-100"
            >
              <div className="flex items-center gap-3 min-w-0">
                <IconCard>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/id-type-select/national-id.svg" alt="" className="w-6 h-6 object-contain invert" />
                </IconCard>
                <span className="text-[14px] md:text-[15px] font-normal text-[#000000]">National ID</span>
              </div>
              <span className="flex-shrink-0 text-[#BDBDBD] text-xl leading-none">&rsaquo;</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelect('drivers-license')}
              className="w-full h-[71px] flex items-center justify-between gap-3 text-left hover:bg-[#FAFAFA] active:bg-[#F0F0F0] transition-colors cursor-pointer opacity-100"
            >
              <div className="flex items-center gap-3 min-w-0">
                <IconCard>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/id-type-select/driving-license.svg" alt="" className="w-6 h-6 object-contain invert" />
                </IconCard>
                <span className="text-[14px] md:text-[15px] font-normal text-[#000000]">Driving License</span>
              </div>
              <span className="flex-shrink-0 text-[#BDBDBD] text-xl leading-none">&rsaquo;</span>
            </button>
          </div>

          {/* Back to Previous - desktop only; mobile uses top back arrow */}
          <button
            type="button"
            onClick={() => router.push('/verify/id-issuing-country')}
            className="hidden md:flex items-center justify-center gap-2 text-[#828282] text-[13px] font-normal mt-4 w-full hover:text-[#000000] transition-colors"
          >
            <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
            </svg>
            Back to Previous
          </button>
        </div>
      </main>
      <PoweredBy />
    </div>
  )
}

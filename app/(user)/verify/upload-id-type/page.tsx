'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAppContext } from '@/context/useAppContext'
import { PoweredBy } from '@/components/verify/PoweredBy'

export default function UploadIdTypePage() {
  const router = useRouter()
  const { dispatch } = useAppContext()

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

  const handleSelect = (idType: 'national-id' | 'passport' | 'drivers-license') => {
    dispatch({ type: 'SET_ID_TYPE', payload: idType })
    router.push('/verify/upload-document?openCamera=1')
  }

  return (
    <div className="h-screen min-h-[100dvh] md:min-h-screen max-h-screen bg-[#FFFFFF] flex flex-col overflow-hidden">
      {/* Mobile: back chevron - tight to top */}
      <div className="md:hidden flex-shrink-0 pl-1 pr-4 pt-5 pb-1">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => router.push('/verify/documents')}
          className="h-8 w-8 inline-flex items-center justify-center text-[#828282] hover:text-[#000000] transition-colors"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      <main className="flex-1 flex flex-col items-center md:justify-center md:justify-center min-h-0 overflow-hidden px-4 pt-2 pb-6 md:py-4 md:pt-4">
        {/* Desktop: Tell us about yourself + subtitle (centered on page) */}
        <section className="hidden md:block text-center mb-4 flex-shrink-0 w-full max-w-[680px]">
          <h1 className="text-[28px] md:text-[30px] leading-tight font-bold text-[#000000]">Tell us about yourself</h1>
          <p className="mt-1 text-[14px] md:text-[15px] leading-[1.5] font-normal text-[#828282]">
            We&apos;re required to collect this to verify your identity.
          </p>
        </section>

        {/* Card - wider, slightly reduced height, unzoomed */}
        <div className="w-full max-w-[680px] flex flex-col md:bg-white md:rounded-[14px] md:border-[1.5px] md:border-[#E8E8E9] md:shadow-md md:px-5 md:py-4 flex-shrink min-h-0 md:scale-[0.97] md:origin-center">
          <h2 className="text-[20px] md:text-[22px] leading-tight font-bold text-[#000000] mb-1 md:mb-1.5 text-left w-full">
            Upload a photo ID
          </h2>
          <p className="text-[12px] md:text-[14px] leading-[1.5] font-normal text-[#828282] mb-4 text-left w-full">
            We require a photo of a government ID to verify your identity
          </p>

          {/* Options: Passport, National ID, Driving License - order per reference */}
          <div className="w-full border-t border-[#E8E8E9]">
            <button
              type="button"
              onClick={() => handleSelect('passport')}
              className="w-full flex items-center justify-between gap-3 px-3 py-4 text-left hover:bg-[#FAFAFA] active:bg-[#F0F0F0] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex-shrink-0 w-9 h-9 rounded-full bg-[#6D3CCC] flex items-center justify-center overflow-hidden p-1.5">
                  <Image src="/Doc-icon2.png" alt="" width={36} height={36} className="w-full h-full object-contain" />
                </span>
                <span className="text-[14px] md:text-[15px] font-normal text-[#000000]">Passport</span>
              </div>
              <span className="flex-shrink-0 text-[#828282] text-lg leading-none">&rsaquo;</span>
            </button>
            <div className="border-t border-[#E8E8E9] w-full" aria-hidden />
            <button
              type="button"
              onClick={() => handleSelect('national-id')}
              className="w-full flex items-center justify-between gap-3 px-3 py-4 text-left hover:bg-[#FAFAFA] active:bg-[#F0F0F0] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex-shrink-0 w-9 h-9 rounded-full bg-[#6D3CCC] flex items-center justify-center overflow-hidden p-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/Doc-icon1.svg" alt="" className="w-full h-full object-contain object-center" />
                </span>
                <span className="text-[14px] md:text-[15px] font-normal text-[#000000]">National ID</span>
              </div>
              <span className="flex-shrink-0 text-[#828282] text-lg leading-none">&rsaquo;</span>
            </button>
            <div className="border-t border-[#E8E8E9] w-full" aria-hidden />
            <button
              type="button"
              onClick={() => handleSelect('drivers-license')}
              className="w-full flex items-center justify-between gap-3 px-3 py-4 text-left hover:bg-[#FAFAFA] active:bg-[#F0F0F0] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex-shrink-0 w-9 h-9 rounded-full bg-[#6D3CCC] flex items-center justify-center overflow-hidden p-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/Doc-icon3.svg" alt="" className="w-full h-full object-contain object-center" />
                </span>
                <span className="text-[14px] md:text-[15px] font-normal text-[#000000]">Driving License</span>
              </div>
              <span className="flex-shrink-0 text-[#828282] text-lg leading-none">&rsaquo;</span>
            </button>
          </div>

          {/* Back to Previous - desktop only; mobile uses top back arrow */}
          <button
            type="button"
            onClick={() => router.push('/verify/documents')}
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

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

  const handleSelect = (idType: 'national-id' | 'passport') => {
    dispatch({ type: 'SET_ID_TYPE', payload: idType })
    router.push('/verify/upload-document?openCamera=1')
  }

  return (
    <div className="h-screen min-h-screen max-h-screen bg-[#FFFFFF] flex flex-col overflow-hidden">
      {/* Mobile: back chevron - tight to top */}
      <div className="md:hidden flex-shrink-0 px-4 pt-2 pb-1">
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

      <main className="flex-1 flex flex-col items-center justify-start md:justify-center min-h-0 overflow-hidden px-4 pt-2 pb-6 md:py-5 md:pt-5">
        {/* Desktop: Tell us about yourself + subtitle (centered on page) */}
        <section className="hidden md:block text-center mb-6 flex-shrink-0 w-full max-w-[560px]">
          <h1 className="text-[34px] leading-tight font-bold text-[#000000]">Tell us about yourself</h1>
          <p className="mt-1.5 text-[16px] leading-[1.5] font-normal text-[#828282]">
            We&apos;re required to collect this verify your identity.
          </p>
        </section>

        {/* Card - all content left-aligned per reference */}
        <div className="w-full max-w-[560px] flex flex-col md:bg-white md:rounded-[14px] md:border md:border-[#E8E8E9] md:shadow-md md:px-6 md:py-6 flex-shrink min-h-0">
          <h2 className="text-[22px] md:text-[24px] leading-tight font-bold text-[#000000] mb-1.5 md:mb-2 text-left w-full">
            Upload a photo ID
          </h2>
          <p className="text-[13px] md:text-[15px] leading-[1.5] font-normal text-[#828282] mb-5 text-left w-full">
            We require a photo of a government ID to verify your identity
          </p>

          <div className="border-t border-[#E8E8E9] w-full mb-3" />
          <p className="text-[13px] md:text-[14px] font-normal text-[#828282] mb-3 w-full text-left">
            Choose 1 of the following options
          </p>
          <div className="border-t border-[#E8E8E9] w-full" />

          {/* Options: thin divider lines between rows and below, per reference */}
          <div className="w-full">
            <button
              type="button"
              onClick={() => handleSelect('national-id')}
              className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left hover:bg-[#FAFAFA] active:bg-[#F0F0F0] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-[#6D3CCC] flex items-center justify-center overflow-hidden p-1.5">
                  <Image src="/Doc-icon1.png" alt="" width={40} height={40} className="w-full h-full object-contain object-center scale-150" />
                </span>
                <span className="text-[15px] md:text-[16px] font-normal text-[#000000]">National ID</span>
              </div>
              <span className="flex-shrink-0 text-[#828282] text-xl leading-none">&rsaquo;</span>
            </button>
            <div className="border-t border-[#E8E8E9] w-full" aria-hidden />
            <button
              type="button"
              onClick={() => handleSelect('passport')}
              className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left hover:bg-[#FAFAFA] active:bg-[#F0F0F0] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-[#6D3CCC] flex items-center justify-center overflow-hidden p-1.5">
                  <Image src="/Doc-icon2.png" alt="" width={40} height={40} className="w-full h-full object-contain" />
                </span>
                <span className="text-[15px] md:text-[16px] font-normal text-[#000000]">Passport</span>
              </div>
              <span className="flex-shrink-0 text-[#828282] text-xl leading-none">&rsaquo;</span>
            </button>
            <div className="border-t border-[#E8E8E9] w-full" aria-hidden />
          </div>

          {/* Back to Previous - desktop only; mobile uses top back arrow */}
          <button
            type="button"
            onClick={() => router.push('/verify/documents')}
            className="hidden md:flex items-center justify-center gap-2 text-[#828282] text-[14px] font-normal mt-6 w-full hover:text-[#000000] transition-colors"
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

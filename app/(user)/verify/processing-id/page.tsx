'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'

const Lottie = dynamic(() => import('lottie-react'), { ssr: false })
const PROCESSING_ANIMATION_PATH = '/animations/digiport%20animations/processing%20animation.json'

export default function ProcessingIdPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [animationData, setAnimationData] = useState<object | null>(null)

  useEffect(() => {
    fetch(PROCESSING_ANIMATION_PATH)
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      const update = searchParams.get('update')
      const email = searchParams.get('email')

      if (update === 'true' && email) {
        router.push(`/verify/selfie-intro?update=true&email=${encodeURIComponent(email)}`)
        return
      }

      router.push('/verify/selfie-intro')
    }, 5000)

    return () => clearTimeout(timer)
  }, [router, searchParams])

  return (
    <div className="min-h-screen h-[100dvh] md:h-screen bg-[#FFFFFF] flex flex-col overflow-hidden">
      <main className="flex-1 w-full px-6 pt-24 md:pt-16 md:flex md:flex-col md:items-center md:justify-center">
        <div className="w-full max-w-[680px]">
          <h1 className="text-[#000000] text-[48px] md:text-[28px] font-bold leading-[100%] tracking-[0%] text-left md:text-center">
            Processing ID
          </h1>
          <p className="mt-3 text-[#545454] text-[16px] md:text-[14px] font-normal leading-[140%] text-left md:text-center max-w-[520px]">
            Please wait as we process your uploads. This may take a few seconds.
          </p>
        </div>

        <div className="w-full flex justify-center mt-24 md:mt-10">
          {animationData ? (
            <div className="w-full max-w-[600px] md:max-w-[480px] h-[250px] md:h-[210px]">
              <Lottie animationData={animationData} loop className="w-full h-full" />
            </div>
          ) : (
            <div className="w-full max-w-[600px] md:max-w-[480px] h-[250px] md:h-[210px] bg-[#F4F4F4] rounded-[16px]" />
          )}
        </div>

        <div className="w-full max-w-[680px] mx-auto mt-2 md:mt-1">
          <div className="h-[8px] bg-[#A7D80D]" />
        </div>
      </main>
    </div>
  )
}

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
    <div className="h-full md:h-screen bg-[#FFFFFF] flex flex-col overflow-hidden">
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden px-6 pt-24 md:pt-16 md:items-center">
        <div className="w-full max-w-[680px]">
          <h1 className="text-[#000000] text-[26px] md:text-[26px] font-bold leading-[100%] tracking-[0%] text-left md:text-center">
            Processing ID
          </h1>
          <p className="mt-2 text-[#545454] text-[13px] md:text-[13px] font-normal leading-[140%] text-left md:text-center max-w-[520px]">
            Please wait as we process your uploads. This may take a few seconds.
          </p>
        </div>

        <div className="flex-1 w-full flex items-start md:items-center justify-center pt-20 md:pt-0">
          {animationData ? (
            <div className="w-full max-w-[320px] md:max-w-[360px] h-[180px] md:h-[210px]">
              <Lottie animationData={animationData} loop className="w-full h-full" />
            </div>
          ) : (
            <div className="w-full max-w-[320px] md:max-w-[360px] h-[180px] md:h-[210px] bg-[#F4F4F4] rounded-[16px]" />
          )}
        </div>

        
      </main>
    </div>
  )
}

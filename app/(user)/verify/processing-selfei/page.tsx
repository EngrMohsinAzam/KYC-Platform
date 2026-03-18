'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const Lottie = dynamic(() => import('lottie-react'), { ssr: false })
const CIRCULAR_MOTION_PATH = '/animations/digiport%20animations/Circular%20motion.json'

export default function ProcessingSelfeiPage() {
  const [animationData, setAnimationData] = useState<object | null>(null)

  useEffect(() => {
    fetch(CIRCULAR_MOTION_PATH)
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen h-[100dvh] md:h-screen bg-black flex flex-col overflow-hidden">
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden px-6 pt-24 md:pt-16 md:items-center">
        <h1 className="text-white text-[26px] md:text-[26px] font-bold text-left md:text-center">
          Processing selfie
        </h1>
        <p className="mt-2 text-white/45 text-[13px] md:text-[13px] font-normal text-left md:text-center max-w-[520px]">
          Please wait as we process your uploads. This may take a few seconds.
        </p>

        <div className="flex-1 w-full flex items-start md:items-center justify-center pt-20 md:pt-0">
          {animationData ? (
            <div className="relative w-[360px] h-[360px] md:w-[260px] md:h-[260px]">
              {/* Glow is behind the animation (keep Lottie sharp) */}
              <div
                className="absolute -inset-10 rounded-full opacity-60"
                style={{
                  background:
                    'radial-gradient(circle, rgba(167,216,13,0.35) 0%, rgba(167,216,13,0.14) 35%, rgba(0,0,0,0) 70%)',
                  filter: 'blur(18px)',
                }}
                aria-hidden
              />
              <Lottie animationData={animationData} loop className="relative z-10 w-full h-full" />
            </div>
          ) : (
            <div className="w-[360px] h-[360px] md:w-[260px] md:h-[260px] rounded-full bg-white/5" />
          )}
        </div>
      </main>
    </div>
  )
}


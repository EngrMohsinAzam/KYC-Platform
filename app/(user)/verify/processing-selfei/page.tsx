

'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'

const DotLottie = dynamic(
  () => import('@lottiefiles/dotlottie-react').then((m) => ({ default: m.DotLottieReact })),
  { ssr: false }
)

const ANIMATION_SRC = '/animations/digiport animations/Circular motion.json'

export default function ProcessingSelfeiPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const timer = setTimeout(() => {
      const update = searchParams.get('update')
      const email = searchParams.get('email')

      if (update === 'true' && email) {
        router.push(`/verify/review?update=true&email=${encodeURIComponent(email)}`)
        return
      }

      router.push('/verify/review')
    }, 5000)

    return () => clearTimeout(timer)
  }, [router, searchParams])

  return (
    <div className="h-full md:h-screen bg-black flex flex-col overflow-hidden">
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden px-6 pt-24 md:pt-16 md:items-center">
        <h1 className="text-white text-[26px] md:text-[26px] font-bold text-left md:text-center">
          Processing selfie
        </h1>
        <p className="mt-2 text-white/45 text-[13px] md:text-[13px] font-normal text-left md:text-center max-w-[520px]">
          Please wait as we process your uploads. This may take a few seconds.
        </p>

        <div className="flex-1 w-full flex items-start md:items-center justify-center pt-20 md:pt-0">
          <div className="relative w-[280px] h-[240px] md:w-[240px] md:h-[240px]">
            <div
              className="absolute -inset-10 rounded-full opacity-60"
              style={{
                background:
                  'radial-gradient(circle, rgba(167,216,13,0.35) 0%, rgba(167,216,13,0.14) 35%, rgba(0,0,0,0) 70%)',
                filter: 'blur(18px)',
              }}
              aria-hidden
            />
            <DotLottie
              src={ANIMATION_SRC}
              loop
              autoplay
              speed={1.8}
              className="relative z-10 w-full h-full"
            />
          </div>
        </div>
      </main>
    </div>
  )
}
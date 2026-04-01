import { CompanyBanner } from '@/components/verify/CompanyBanner'
import { VerifyScrollLock } from '@/components/verify/VerifyScrollLock'
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export default function VerifyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${inter.className} h-[100dvh] overflow-hidden flex flex-col bg-[#FFFFFF]`}>
      <VerifyScrollLock />
      <CompanyBanner />
      <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  )
}

import { CompanyBanner } from '@/components/verify/CompanyBanner'
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
    <div className={`${inter.className} min-h-screen flex flex-col bg-[#FFFFFF]`}>
      <CompanyBanner />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  )
}

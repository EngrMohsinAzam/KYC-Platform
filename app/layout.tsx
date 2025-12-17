import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppProvider } from '@/context/AppProvider'
import dynamic from 'next/dynamic'

// Lazy load WagmiProvider - only load when wallet features are needed
// This defers loading wagmi, viem, and all blockchain libraries
const WagmiProvider = dynamic(
  () => import('@/components/providers/WagmiProvider').then(mod => ({ default: mod.WagmiProvider })),
  { 
    ssr: false,
    loading: () => null, // Don't show loading state to avoid layout shift
  }
)

// Optimize font loading for mobile - only load Latin subset, use swap, reduce weight
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
  adjustFontFallback: true,
  fallback: ['system-ui', 'arial'],
  // Only load regular weight initially - other weights load on demand
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'KYC Platform - Identity Verification',
  description: 'Complete identity verification and decentralized ID creation',
  icons: {
    icon: [
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
    ],
    shortcut: '/favicon-32x32.png',
    apple: '/favicon-32x32.png',
  },
  // Performance optimizations
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://data-seed-prebsc-1-s1.binance.org" />
        {/* Preconnect to critical domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} ${inter.variable}`}>
        <WagmiProvider>
          <AppProvider>
            {children}
          </AppProvider>
        </WagmiProvider>
      </body>
    </html>
  )
}


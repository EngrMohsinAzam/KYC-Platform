import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppProvider } from '@/context/AppProvider'
import { WagmiProvider } from '@/components/providers/WagmiProvider'

// Optimize font loading for mobile - only load Latin subset, use swap
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
  adjustFontFallback: true,
  fallback: ['system-ui', 'arial'],
})

export const metadata: Metadata = {
  title: 'KYX Platform - Identity Verification',
  description: 'Complete identity verification and decentralized ID creation',
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


'use client'

import { WagmiProvider as WagmiProviderBase } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiConfig } from '@/lib/wallet/wagmi-config'
import { ReactNode, useState, useMemo } from 'react'

// Optimized QueryClient configuration for mobile performance
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      // Reduce refetch frequency on mobile to save battery and data
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
      // Cache for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry only once on mobile for faster error handling
      retry: 1,
      retryDelay: 1000,
    },
    mutations: {
      retry: 1,
    },
  },
})

interface WagmiProviderProps {
  children: ReactNode
}

// Function to check if an error is a WalletConnect extension selection error
function isWalletConnectExtensionError(error: any): boolean {
  if (!error) return false
  
  const errorString = String(error)
  const errorMessage = error?.message || ''
  const errorStack = error?.stack || ''
  
  return (
    errorString.includes('evmAsk.js') ||
    errorString.includes('selectExtension') ||
    errorMessage.includes('evmAsk.js') ||
    errorMessage.includes('selectExtension') ||
    errorStack.includes('evmAsk.js') ||
    errorStack.includes('selectExtension') ||
    (errorString.includes('Oe:') && errorString.includes('Unexpected error')) ||
    (errorMessage.includes('Oe:') && errorMessage.includes('Unexpected error'))
  )
}

// Set up error suppression immediately (before component mount)
if (typeof window !== 'undefined') {
  const originalError = window.console.error
  const originalWarn = window.console.warn

  window.console.error = (...args: any[]) => {
    const combinedString = args.map(String).join(' ')
    const hasWalletConnectError = args.some(arg => {
      if (typeof arg === 'string') {
        return isWalletConnectExtensionError(arg)
      }
      if (arg && typeof arg === 'object') {
        return isWalletConnectExtensionError(arg)
      }
      return false
    }) || isWalletConnectExtensionError(combinedString)
    
    if (hasWalletConnectError) {
      return // Suppress silently
    }
    originalError.apply(window.console, args)
  }

  window.console.warn = (...args: any[]) => {
    const combinedString = args.map(String).join(' ')
    const hasWalletConnectWarning = args.some(arg => {
      if (typeof arg === 'string') {
        return isWalletConnectExtensionError(arg) || 
               arg.includes('WalletConnect Core is already initialized') ||
               arg.includes('Init() was called')
      }
      if (arg && typeof arg === 'object') {
        return isWalletConnectExtensionError(arg)
      }
      return false
    }) || isWalletConnectExtensionError(combinedString) ||
         combinedString.includes('WalletConnect Core is already initialized') ||
         combinedString.includes('Init() was called')
    
    if (hasWalletConnectWarning) {
      return // Suppress silently
    }
    originalWarn.apply(window.console, args)
  }

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    if (isWalletConnectExtensionError(event.reason)) {
      event.preventDefault()
    }
  })

  // Handle uncaught errors
  window.addEventListener('error', (event: ErrorEvent) => {
    if (isWalletConnectExtensionError(event.error) || isWalletConnectExtensionError(event.message)) {
      event.preventDefault()
    }
  })
}

export function WagmiProvider({ children }: WagmiProviderProps) {
  // Create queryClient only once per app instance
  const [queryClient] = useState(() => createQueryClient())
  
  return (
    <WagmiProviderBase config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProviderBase>
  )
}



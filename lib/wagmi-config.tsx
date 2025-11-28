'use client'

import { createConfig, http, type Config } from 'wagmi'
import { bscTestnet } from 'wagmi/chains'
import { injected, metaMask, walletConnect, coinbaseWallet } from 'wagmi/connectors'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'dac575710eb8362c0d28c55d2dcf73dc'

const chains = [bscTestnet] as const

// Store MetaMask provider reference globally so connector can access it
let metaMaskProviderRef: any = null

// Function to set MetaMask provider reference (called before connecting)
export function setMetaMaskProvider(provider: any) {
  metaMaskProviderRef = provider
  console.log('✅ MetaMask provider reference set:', provider?.isMetaMask)
}

// Singleton pattern using global window object to persist across hot reloads
// This prevents "WalletConnect Core is already initialized" warnings
declare global {
  interface Window {
    __WAGMI_CONFIG__?: Config
  }
}

function getOrCreateWagmiConfig(): Config {
  // Check if config exists in global scope (persists across hot reloads)
  if (typeof window !== 'undefined' && window.__WAGMI_CONFIG__) {
    console.log('♻️ Reusing existing wagmi config from global scope')
    return window.__WAGMI_CONFIG__
  }

  console.log('🆕 Creating new wagmi config instance')
  const config = createConfig({
    chains,
    connectors: [
      // CRITICAL FIX: MetaMask connector MUST come FIRST before injected()
      // This ensures MetaMask is prioritized when multiple wallets are installed
      // When window.ethereum is set to MetaMask provider (in ReviewContent.tsx),
      // the metaMask() connector will use it
      metaMask(),
      // Standard injected connector for other wallets (Trust Wallet, etc.)
      // This comes after MetaMask so MetaMask is tried first
      injected(),
      coinbaseWallet({
        appName: 'MiraKYC',
        appLogoUrl: typeof window !== 'undefined' ? `${window.location.origin}/favicon.ico` : 'https://mirakyc.com/favicon.ico',
      }),
      walletConnect({
        projectId,
        metadata: {
          name: 'MiraKYC',
          description: 'KYC Verification Platform',
          url: typeof window !== 'undefined' ? window.location.origin : 'https://mirakyc.com',
          icons: [`${typeof window !== 'undefined' ? window.location.origin : 'https://mirakyc.com'}/favicon.ico`]
        },
      }),
    ],
    transports: {
      [bscTestnet.id]: http('https://data-seed-prebsc-1-s1.binance.org:8545/'),
    },
  })

  // Store in global scope for persistence across hot reloads
  if (typeof window !== 'undefined') {
    window.__WAGMI_CONFIG__ = config
  }

  return config
}

// Export the singleton config instance
export const wagmiConfig = getOrCreateWagmiConfig()


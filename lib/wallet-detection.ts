/**
 * Wallet Detection Utility
 * Detects installed browser extension wallets that support BSC
 */

export interface DetectedWallet {
  id: string
  name: string
  icon: string
  iconUrl?: string
  isInstalled: boolean
  provider?: any
  connectorId?: string
}

// Wallet icon URLs - using official wallet logos from WalletConnect registry
const WALLET_ICONS: Record<string, string> = {
  metamask: 'https://registry.walletconnect.com/api/v1/logo/sm/metamask',
  trustwallet: 'https://registry.walletconnect.com/api/v1/logo/sm/trust',
  coinbase: 'https://registry.walletconnect.com/api/v1/logo/sm/coinbase-wallet',
  brave: 'https://registry.walletconnect.com/api/v1/logo/sm/brave',
  binance: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png',
}

// Fallback SVG icons if images fail to load
const WALLET_ICON_FALLBACKS: Record<string, string> = {
  metamask: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="6" fill="#E2761B"/>
    <path d="M23.5 9.5L18 15L20.5 10.5L23.5 9.5Z" fill="#E4761B" stroke="#E4761B" stroke-width="0.5"/>
    <path d="M8.5 9.5L14 15L11.5 10.5L8.5 9.5Z" fill="#E4761B" stroke="#E4761B" stroke-width="0.5"/>
    <path d="M20.5 20.5L18.5 23.5L23 22L20.5 20.5Z" fill="#E4761B" stroke="#E4761B" stroke-width="0.5"/>
    <path d="M11.5 20.5L9 22L13.5 23.5L11.5 20.5Z" fill="#E4761B" stroke="#E4761B" stroke-width="0.5"/>
    <path d="M16 16L14 18.5L16 19.5L18 18.5L16 16Z" fill="#E4761B" stroke="#E4761B" stroke-width="0.5"/>
  </svg>`,
  trustwallet: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="6" fill="#3375BB"/>
    <path d="M16 6L8 12V20L16 26L24 20V12L16 6Z" fill="white"/>
    <path d="M16 8L10 12V19L16 23L22 19V12L16 8Z" fill="#3375BB"/>
  </svg>`,
  coinbase: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="6" fill="#0052FF"/>
    <circle cx="16" cy="16" r="8" fill="white"/>
    <path d="M12 16H20" stroke="#0052FF" stroke-width="2" stroke-linecap="round"/>
  </svg>`,
  brave: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="6" fill="#FB542B"/>
    <path d="M16 8C11.6 8 8 11.6 8 16C8 20.4 11.6 24 16 24C20.4 24 24 20.4 24 16C24 11.6 20.4 8 16 8Z" fill="white"/>
    <path d="M16 10C19.3 10 22 12.7 22 16C22 19.3 19.3 22 16 22C12.7 22 10 19.3 10 16C10 12.7 12.7 10 16 10Z" fill="#FB542B"/>
  </svg>`,
  binance: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="6" fill="#F3BA2F"/>
    <path d="M16 8L10 13L13 16L16 13L19 16L22 13L16 8Z" fill="white"/>
    <path d="M8 16L13 21L16 18L10 12L8 16Z" fill="white"/>
    <path d="M16 19L19 22L24 16L22 13L19 16L16 19Z" fill="white"/>
    <path d="M16 13L13 10L10 13L13 16L16 13Z" fill="#F3BA2F"/>
  </svg>`,
}

// Wallet configurations
const WALLET_CONFIGS: Omit<DetectedWallet, 'isInstalled' | 'provider'>[] = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: WALLET_ICON_FALLBACKS.metamask,
    iconUrl: WALLET_ICONS.metamask,
    connectorId: 'metaMask',
  },
  {
    id: 'trustwallet',
    name: 'Trust Wallet',
    icon: WALLET_ICON_FALLBACKS.trustwallet,
    iconUrl: 'https://registry.walletconnect.com/api/v1/logo/sm/trust',
    connectorId: 'injected',
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: WALLET_ICON_FALLBACKS.coinbase,
    iconUrl: 'https://registry.walletconnect.com/api/v1/logo/sm/coinbase-wallet',
    connectorId: 'coinbaseWallet',
  },
  {
    id: 'brave',
    name: 'Brave Wallet',
    icon: WALLET_ICON_FALLBACKS.brave,
    iconUrl: 'https://registry.walletconnect.com/api/v1/logo/sm/brave',
    connectorId: 'injected',
  },
  {
    id: 'binance',
    name: 'Binance Wallet',
    icon: WALLET_ICON_FALLBACKS.binance,
    iconUrl: 'https://assets.binance.com/static-assets/images/binance-logo.svg',
    connectorId: 'injected',
  },
]

/**
 * Check if device is mobile
 */
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

/**
 * Check if MetaMask mobile app is installed (iOS/Android)
 */
function isMetaMaskMobileInstalled(): boolean {
  if (typeof window === 'undefined') return false
  
  // On mobile, MetaMask can be detected via:
  // 1. window.ethereum (if browser has MetaMask extension or mobile browser integration)
  // 2. User agent check (less reliable)
  // 3. Try to detect if MetaMask deep link would work
  
  const win = window as any
  
  // Check if ethereum provider exists
  if (win.ethereum) {
    // Check if it's MetaMask
    if (win.ethereum.isMetaMask) {
      return true
    }
    // Check providers array
    if (Array.isArray(win.ethereum.providers)) {
      const hasMetaMask = win.ethereum.providers.some((p: any) => p.isMetaMask)
      if (hasMetaMask) return true
    }
  }
  
  // On mobile, if we have any ethereum provider, assume MetaMask mobile might be available
  // The deep link will handle the actual connection
  if (isMobileDevice() && win.ethereum) {
    return true
  }
  
  return false
}

/**
 * Detect installed wallets from browser extensions and mobile apps
 */
export function detectInstalledWallets(): DetectedWallet[] {
  if (typeof window === 'undefined') {
    return []
  }

  const win = window as any
  const detectedWallets: DetectedWallet[] = []
  const providers: any[] = []
  const isMobile = isMobileDevice()

  // Get all providers
  if (win.ethereum) {
    if (Array.isArray(win.ethereum.providers)) {
      providers.push(...win.ethereum.providers)
    } else {
      providers.push(win.ethereum)
    }
  }

  // Check each wallet configuration
  for (const walletConfig of WALLET_CONFIGS) {
    let provider: any = null
    let isInstalled = false

    switch (walletConfig.id) {
      case 'metamask':
        // Check for MetaMask - enhanced for mobile
        if (isMobile) {
          // On mobile, check if MetaMask mobile app might be available
          // Even if window.ethereum doesn't have isMetaMask, the mobile app can be opened via deep link
          provider = providers.find((p: any) => p.isMetaMask) || win.ethereum
          isInstalled = isMetaMaskMobileInstalled() || !!provider
        } else {
          // Desktop: check for browser extension
          provider = providers.find((p: any) => p.isMetaMask)
          isInstalled = !!provider
        }
        break

      case 'trustwallet':
        // Check for Trust Wallet
        provider = providers.find((p: any) => p.isTrust || p.isTrustWallet)
        isInstalled = !!provider
        break

      case 'coinbase':
        // Check for Coinbase Wallet
        provider = providers.find((p: any) => p.isCoinbaseWallet)
        isInstalled = !!provider
        break

      case 'brave':
        // Check for Brave Wallet (usually desktop only)
        if (!isMobile) {
          provider = providers.find((p: any) => p.isBraveWallet)
          isInstalled = !!provider
        }
        break

      case 'binance':
        // Check for Binance Wallet
        provider = providers.find((p: any) => p.isBinance || p.isBinanceWallet)
        isInstalled = !!provider
        break
    }

    detectedWallets.push({
      ...walletConfig,
      isInstalled,
      provider,
    })
  }

  // On mobile, always show MetaMask as available (can use deep link)
  if (isMobile) {
    const metaMaskWallet = detectedWallets.find(w => w.id === 'metamask')
    if (metaMaskWallet && !metaMaskWallet.isInstalled) {
      // On mobile, assume MetaMask mobile app might be available
      metaMaskWallet.isInstalled = true
      metaMaskWallet.provider = win.ethereum || null
    }
  }

  // Prioritize MetaMask first, then sort by installed status
  return detectedWallets.sort((a, b) => {
    // PRIORITY 1: MetaMask always first (whether installed or not)
    if (a.id === 'metamask') return -1
    if (b.id === 'metamask') return 1
    
    // PRIORITY 2: Then installed wallets (non-MetaMask)
    if (a.isInstalled && !b.isInstalled) return -1
    if (!a.isInstalled && b.isInstalled) return 1
    
    // PRIORITY 3: Keep original order for same status
    return 0
  })
}

/**
 * Get wallet by ID
 */
export function getWalletById(walletId: string): DetectedWallet | undefined {
  const wallets = detectInstalledWallets()
  return wallets.find(w => w.id === walletId)
}


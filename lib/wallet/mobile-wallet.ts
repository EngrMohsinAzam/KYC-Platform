/**
 * Mobile Wallet Deep Link Utilities
 * Handles deep linking to mobile wallet apps
 */

/**
 * Check if device is mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

/**
 * Check if device is iOS
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

/**
 * Check if device is Android
 */
export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false
  return /Android/i.test(navigator.userAgent)
}

/**
 * Open MetaMask mobile app via deep link
 */
export function openMetaMaskMobile(): void {
  const isIOSDevice = isIOS()
  const isAndroidDevice = isAndroid()
  
  if (isIOSDevice) {
    // iOS MetaMask deep link
    const metamaskUrl = 'https://metamask.app.link/dapp/' + encodeURIComponent(window.location.href)
    window.location.href = metamaskUrl
  } else if (isAndroidDevice) {
    // Android MetaMask deep link
    const metamaskUrl = 'https://metamask.app.link/dapp/' + encodeURIComponent(window.location.href)
    window.location.href = metamaskUrl
  } else {
    // Fallback to universal link
    window.open('https://metamask.app.link/dapp/' + encodeURIComponent(window.location.href), '_blank')
  }
}

/**
 * Open Trust Wallet mobile app via deep link
 */
export function openTrustWalletMobile(): void {
  const isIOSDevice = isIOS()
  const isAndroidDevice = isAndroid()
  
  if (isIOSDevice) {
    // iOS Trust Wallet deep link
    const trustUrl = `trust://wc?uri=${encodeURIComponent(window.location.href)}`
    window.location.href = trustUrl
    
    // Fallback: open App Store if app not installed
    setTimeout(() => {
      window.location.href = 'https://apps.apple.com/app/trust-crypto-bitcoin-wallet/id1288339409'
    }, 2000)
  } else if (isAndroidDevice) {
    // Android Trust Wallet deep link
    const trustUrl = `trust://wc?uri=${encodeURIComponent(window.location.href)}`
    window.location.href = trustUrl
    
    // Fallback: open Play Store if app not installed
    setTimeout(() => {
      window.location.href = 'https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp'
    }, 2000)
  }
}

/**
 * Open Coinbase Wallet mobile app via deep link
 */
export function openCoinbaseWalletMobile(): void {
  const isIOSDevice = isIOS()
  const isAndroidDevice = isAndroid()
  
  if (isIOSDevice) {
    // iOS Coinbase Wallet deep link
    const coinbaseUrl = `cbwallet://wc?uri=${encodeURIComponent(window.location.href)}`
    window.location.href = coinbaseUrl
    
    // Fallback: open App Store
    setTimeout(() => {
      window.location.href = 'https://apps.apple.com/app/coinbase-wallet/id1278383455'
    }, 2000)
  } else if (isAndroidDevice) {
    // Android Coinbase Wallet deep link
    const coinbaseUrl = `cbwallet://wc?uri=${encodeURIComponent(window.location.href)}`
    window.location.href = coinbaseUrl
    
    // Fallback: open Play Store
    setTimeout(() => {
      window.location.href = 'https://play.google.com/store/apps/details?id=org.toshi'
    }, 2000)
  }
}

/**
 * Check if MetaMask mobile app is likely installed
 * (This is a best-guess based on user agent and available providers)
 */
export function isMetaMaskMobileLikelyInstalled(): boolean {
  if (typeof window === 'undefined') return false
  
  const win = window as any
  
  // Check if we're in MetaMask mobile browser
  if (win.ethereum?.isMetaMask) {
    return true
  }
  
  // Check user agent for MetaMask mobile browser
  const userAgent = navigator.userAgent.toLowerCase()
  if (userAgent.includes('metamask') || userAgent.includes('mmsdk')) {
    return true
  }
  
  return false
}

/**
 * Check if Trust Wallet mobile app is likely installed
 */
export function isTrustWalletMobileLikelyInstalled(): boolean {
  if (typeof window === 'undefined') return false
  
  const win = window as any
  
  // Check if we're in Trust Wallet mobile browser
  if (win.ethereum?.isTrust || win.ethereum?.isTrustWallet) {
    return true
  }
  
  // Check user agent
  const userAgent = navigator.userAgent.toLowerCase()
  if (userAgent.includes('trustwallet') || userAgent.includes('trust')) {
    return true
  }
  
  return false
}

/**
 * Get mobile wallet deep link URL for a specific wallet
 */
export function getMobileWalletDeepLink(walletId: string): string | null {
  const currentUrl = typeof window !== 'undefined' ? window.location.href : ''
  
  switch (walletId) {
    case 'metamask':
      return `https://metamask.app.link/dapp/${encodeURIComponent(currentUrl)}`
    case 'trustwallet':
      if (isIOS()) {
        return `trust://wc?uri=${encodeURIComponent(currentUrl)}`
      } else if (isAndroid()) {
        return `trust://wc?uri=${encodeURIComponent(currentUrl)}`
      }
      return null
    case 'coinbase':
      if (isIOS()) {
        return `cbwallet://wc?uri=${encodeURIComponent(currentUrl)}`
      } else if (isAndroid()) {
        return `cbwallet://wc?uri=${encodeURIComponent(currentUrl)}`
      }
      return null
    default:
      return null
  }
}


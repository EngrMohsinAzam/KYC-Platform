'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { LoadingDots } from '@/components/ui/LoadingDots'
import { detectInstalledWallets, DetectedWallet } from '@/lib/wallet-detection'
import { switchToBSCTestnet } from '@/lib/network-switch'
import { isMobileDevice, getMobileWalletDeepLink } from '@/lib/mobile-wallet'

interface WalletSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onWalletSelect: (wallet: DetectedWallet) => Promise<void>
  connectingWalletId?: string | null
  error?: string | null
}

export function WalletSelectionModal({
  isOpen,
  onClose,
  onWalletSelect,
  connectingWalletId,
  error,
}: WalletSelectionModalProps) {
  const [switchingNetwork, setSwitchingNetwork] = useState(false)
  const wallets = detectInstalledWallets()
  
  // Check if mobile device
  const isMobile = isMobileDevice()
  
  // Prioritize MetaMask - separate it from other wallets
  const metaMaskWallet = wallets.find(w => w.id === 'metamask')
  
  // On mobile, always show MetaMask, Trust Wallet, and Coinbase as available
  // They can use WalletConnect QR code or deep links
  if (isMobile) {
    if (metaMaskWallet && !metaMaskWallet.isInstalled) {
      metaMaskWallet.isInstalled = true
    }
    const trustWallet = wallets.find(w => w.id === 'trustwallet')
    if (trustWallet && !trustWallet.isInstalled) {
      trustWallet.isInstalled = true
    }
    const coinbaseWallet = wallets.find(w => w.id === 'coinbase')
    if (coinbaseWallet && !coinbaseWallet.isInstalled) {
      coinbaseWallet.isInstalled = true
    }
  }
  
  const installedWallets = wallets.filter(w => w.isInstalled && w.id !== 'metamask')
  const notInstalledWallets = wallets.filter(w => !w.isInstalled && w.id !== 'metamask')
  
  // Combine: MetaMask first (if exists), then other installed wallets, then not installed
  const sortedInstalledWallets = metaMaskWallet && metaMaskWallet.isInstalled 
    ? [metaMaskWallet, ...installedWallets]
    : installedWallets

  const handleWalletClick = async (wallet: DetectedWallet) => {
    const isMobile = isMobileDevice()
    
    if (!wallet.isInstalled) {
      // On mobile, try deep link first, then fallback to installation page
      if (isMobile) {
        const deepLink = getMobileWalletDeepLink(wallet.id)
        if (deepLink) {
          console.log('📱 Opening mobile wallet via deep link:', wallet.name)
          window.location.href = deepLink
          // Give user time to open the app
          setTimeout(() => {
            // If still on page after 3 seconds, show install option
            const installUrls: Record<string, string> = {
              metamask: isMobile && /iPhone|iPad|iPod/i.test(navigator.userAgent)
                ? 'https://apps.apple.com/app/metamask/id1438144202'
                : isMobile && /Android/i.test(navigator.userAgent)
                ? 'https://play.google.com/store/apps/details?id=io.metamask'
                : 'https://metamask.io/download/',
              trustwallet: isMobile && /iPhone|iPad|iPod/i.test(navigator.userAgent)
                ? 'https://apps.apple.com/app/trust-crypto-bitcoin-wallet/id1288339409'
                : isMobile && /Android/i.test(navigator.userAgent)
                ? 'https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp'
                : 'https://trustwallet.com/download',
              coinbase: isMobile && /iPhone|iPad|iPod/i.test(navigator.userAgent)
                ? 'https://apps.apple.com/app/coinbase-wallet/id1278383455'
                : isMobile && /Android/i.test(navigator.userAgent)
                ? 'https://play.google.com/store/apps/details?id=org.toshi'
                : 'https://www.coinbase.com/wallet',
            }
            const url = installUrls[wallet.id]
            if (url && confirm('Wallet app not found. Would you like to install it?')) {
              window.open(url, '_blank')
            }
          }, 3000)
          return
        }
      }
      
      // Desktop or no deep link: Open wallet installation page
      const installUrls: Record<string, string> = {
        metamask: 'https://metamask.io/download/',
        trustwallet: 'https://trustwallet.com/download',
        coinbase: 'https://www.coinbase.com/wallet',
        brave: 'https://brave.com/wallet/',
        binance: 'https://www.binance.org/en/smartChain',
      }
      
      const url = installUrls[wallet.id]
      if (url) {
        window.open(url, '_blank')
      }
      return
    }

    try {
      // On mobile, if no provider detected, try deep link first
      if (isMobile && !wallet.provider) {
        const deepLink = getMobileWalletDeepLink(wallet.id)
        if (deepLink) {
          console.log('📱 Mobile wallet detected but no provider, using deep link:', wallet.name)
          // Try to connect via WalletConnect or use deep link
          // For now, proceed with connection attempt (WalletConnect will handle it)
        }
      }
      
      // Auto-switch to BSC Testnet before connecting (if provider exists)
      if (wallet.provider) {
        try {
          setSwitchingNetwork(true)
          await switchToBSCTestnet(wallet.provider)
          setSwitchingNetwork(false)
        } catch (err: any) {
          console.error('Error switching network:', err)
          setSwitchingNetwork(false)
          // Continue with connection even if network switch fails
        }
      }
      
      // Connect wallet
      await onWalletSelect(wallet)
    } catch (err: any) {
      console.error('Error in wallet connection:', err)
      setSwitchingNetwork(false)
      // Still try to connect even if network switch fails
      await onWalletSelect(wallet)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
          Connect Wallet
        </h2>

        {/* Installed Wallets */}
        {sortedInstalledWallets.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              {metaMaskWallet && metaMaskWallet.isInstalled ? 'Recommended' : 'Installed Wallets'}
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {sortedInstalledWallets.map((wallet) => (
                <button
                  key={wallet.id}
                  onClick={() => handleWalletClick(wallet)}
                  disabled={switchingNetwork || !!connectingWalletId}
                  className={`
                    relative flex items-center justify-between p-4 rounded-lg transition-all duration-200
                    ${wallet.id === 'metamask' && wallet.isInstalled
                      ? 'bg-orange-50 border-2 border-orange-200 hover:border-orange-300 hover:bg-orange-100'
                      : connectingWalletId === wallet.id
                      ? 'bg-gray-100 border-2 border-gray-900'
                      : 'bg-gray-50 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                    }
                    ${switchingNetwork || (connectingWalletId && connectingWalletId !== wallet.id)
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer'
                    }
                  `}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg border overflow-hidden ${
                      wallet.id === 'metamask' && wallet.isInstalled 
                        ? 'bg-white border-orange-300' 
                        : 'bg-white border-gray-200'
                    }`}>
                      {wallet.iconUrl ? (
                        <img 
                          src={wallet.iconUrl} 
                          alt={wallet.name}
                          className="w-full h-full object-contain p-1"
                          onError={(e) => {
                            // Fallback to SVG if image fails to load
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent) {
                              parent.innerHTML = wallet.icon
                            }
                          }}
                        />
                      ) : (
                        <div dangerouslySetInnerHTML={{ __html: wallet.icon }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 text-sm">
                          {wallet.name}
                        </h4>
                        {wallet.id === 'metamask' && wallet.isInstalled && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-medium">
                            Recommended
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {connectingWalletId === wallet.id && (
                    <div className="flex-shrink-0">
                      <LoadingDots size="sm" color="#000000" />
                    </div>
                  )}
                  {switchingNetwork && connectingWalletId === wallet.id && (
                    <span className="text-xs text-gray-500 ml-2">Switching network...</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Not Installed Wallets */}
        {(notInstalledWallets.length > 0 || (metaMaskWallet && !metaMaskWallet.isInstalled)) && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Other Wallets
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {/* Show MetaMask in "Other" section if not installed */}
              {metaMaskWallet && !metaMaskWallet.isInstalled && (
                <button
                  key={metaMaskWallet.id}
                  onClick={() => handleWalletClick(metaMaskWallet)}
                  disabled={switchingNetwork || !!connectingWalletId}
                  className={`
                    relative flex items-center justify-between p-4 bg-gray-50 border-2 rounded-lg transition-all duration-200
                    border-gray-200 hover:border-gray-300 hover:bg-gray-100
                    ${switchingNetwork || connectingWalletId
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer'
                    }
                  `}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-white rounded-lg border border-gray-200 overflow-hidden opacity-60">
                      {metaMaskWallet.iconUrl ? (
                        <img 
                          src={metaMaskWallet.iconUrl} 
                          alt={metaMaskWallet.name}
                          className="w-full h-full object-contain p-1"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent) {
                              parent.innerHTML = metaMaskWallet.icon
                            }
                          }}
                        />
                      ) : (
                        <div dangerouslySetInnerHTML={{ __html: metaMaskWallet.icon }} />
                      )}
                    </div>
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {metaMaskWallet.name}
                    </h4>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                    Install
                  </span>
                </button>
              )}
              {notInstalledWallets.map((wallet) => (
                <button
                  key={wallet.id}
                  onClick={() => handleWalletClick(wallet)}
                  disabled={switchingNetwork || !!connectingWalletId}
                  className={`
                    relative flex items-center justify-between p-4 bg-gray-50 border-2 rounded-lg transition-all duration-200
                    border-gray-200 hover:border-gray-300 hover:bg-gray-100
                    ${switchingNetwork || connectingWalletId
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer'
                    }
                  `}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-white rounded-lg border border-gray-200 overflow-hidden opacity-60">
                      {wallet.iconUrl ? (
                        <img 
                          src={wallet.iconUrl} 
                          alt={wallet.name}
                          className="w-full h-full object-contain p-1"
                          onError={(e) => {
                            // Fallback to SVG if image fails to load
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent) {
                              parent.innerHTML = wallet.icon
                            }
                          }}
                        />
                      ) : (
                        <div dangerouslySetInnerHTML={{ __html: wallet.icon }} />
                      )}
                    </div>
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {wallet.name}
                    </h4>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                    Install
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mobile Help Message */}
        {isMobile && sortedInstalledWallets.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800 text-center">
              <strong>Mobile Tip:</strong> Tap a wallet to connect. If a QR code appears, scan it with your mobile wallet app. If the app opens, approve the connection.
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 text-center">{error}</p>
          </div>
        )}

        {/* No Wallets Installed */}
        {sortedInstalledWallets.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-600 mb-4">
              No wallets detected. Please install a wallet extension to continue.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                Install MetaMask
              </a>
              <span className="text-gray-400">•</span>
              <a
                href="https://trustwallet.com/download"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                Install Trust Wallet
              </a>
            </div>
          </div>
        )}

        <Button
          onClick={onClose}
          variant="secondary"
          className="w-full mt-6 border-gray-300"
          disabled={switchingNetwork || !!connectingWalletId}
        >
          Cancel
        </Button>
      </div>
    </Modal>
  )
}


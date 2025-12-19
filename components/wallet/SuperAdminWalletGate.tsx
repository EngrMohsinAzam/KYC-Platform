'use client'

import { useMemo, useState } from 'react'
import { useAccount, useConnect } from 'wagmi'

type Props = {
  enabled: boolean
  children: React.ReactNode
}

export function SuperAdminWalletGate({ enabled, children }: Props) {
  const { isConnected, address } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const [error, setError] = useState<string | null>(null)

  const metaMaskConnector = useMemo(
    () => connectors.find((c) => c.id === 'metaMask' || c.id === 'injected' || c.name?.toLowerCase().includes('metamask')),
    [connectors]
  )

  const walletConnectConnector = useMemo(
    () => connectors.find((c) => c.id === 'walletConnect' || c.name?.toLowerCase().includes('walletconnect')),
    [connectors]
  )

  const connectWallet = async () => {
    setError(null)
    try {
      if (metaMaskConnector) {
        await connect({ connector: metaMaskConnector })
        return
      }
      if (walletConnectConnector) {
        await connect({ connector: walletConnectConnector })
        return
      }
      if (connectors.length > 0) {
        await connect({ connector: connectors[0] })
        return
      }
      setError('No wallet connector available')
    } catch (e: any) {
      const msg = e?.message || String(e)
      // ignore user rejection; allow retry
      if (msg.toLowerCase().includes('rejected') || msg.toLowerCase().includes('denied')) {
        setError('Connection was rejected. Please try again.')
        return
      }
      setError(msg)
    }
  }

  // Gate is only for Super Admin routes (enabled=true)
  if (!enabled) return <>{children}</>

  // Once connected, show app normally - wallet connection persists automatically via wagmi
  if (isConnected && address) return <>{children}</>

  // STRICT: While not connected, show full-screen gate (cannot be dismissed)
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
      <div className="max-w-lg w-full mx-auto px-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-black flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Wallet Connection Required</h1>
            <p className="text-sm text-gray-600">
              Super Admin must connect a wallet to access the dashboard and financial records.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Your wallet connection will persist across sessions.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={connectWallet}
            disabled={isPending}
            className="w-full bg-black hover:bg-black/80 text-white rounded-xl py-3 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Connecting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Connect Wallet
              </>
            )}
          </button>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center mb-3">Supported Wallets:</p>
            <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>MetaMask</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                </svg>
                <span>WalletConnect</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



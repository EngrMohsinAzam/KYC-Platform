'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { getSuperAdminInfo, getSuperAdminToken, superAdminListWallets, superAdminAddWallet, superAdminRemoveWallet } from '@/lib/api/super-admin-api'
import { LoadingDots } from '@/components/ui/LoadingDots'
import { ShimmerCard } from '@/components/ui/Shimmer'

export default function SuperAdminProfilePage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending: isConnecting } = useConnect()
  const { disconnect } = useDisconnect()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [wallets, setWallets] = useState<any[]>([])
  const [error, setError] = useState('')
  const [addWalletOpen, setAddWalletOpen] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [walletLabel, setWalletLabel] = useState('')
  const [addingWallet, setAddingWallet] = useState(false)

  const token = getSuperAdminToken()
  const info = getSuperAdminInfo()

  useEffect(() => {
    if (!token) router.replace('/super-admin')
  }, [router, token])

  useEffect(() => {
    loadWallets()
  }, [])

  const loadWallets = async () => {
    try {
      setLoading(true)
      setError('')
      const result = await superAdminListWallets({ page: 1, limit: 100 })
      if (result.success) {
        const list = result.data?.wallets || result.data?.items || result.data?.results || result.data || []
        setWallets(Array.isArray(list) ? list : [])
      } else {
        setError(result.message || 'Failed to load wallets')
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load wallets')
    } finally {
      setLoading(false)
    }
  }

  const connectWallet = async () => {
    try {
      setError('')
      const metaMaskConnector = connectors.find(
        (c) => c.id === 'metaMask' || c.id === 'injected' || c.name?.toLowerCase().includes('metamask')
      )
      const walletConnectConnector = connectors.find(
        (c) => c.id === 'walletConnect' || c.name?.toLowerCase().includes('walletconnect')
      )

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
      if (!msg.toLowerCase().includes('rejected') && !msg.toLowerCase().includes('denied')) {
        setError(msg)
      }
    }
  }

  const addConnectedWallet = async () => {
    if (!address) return
    try {
      setAddingWallet(true)
      setError('')
      const result = await superAdminAddWallet({
        address,
        walletAddress: address,
        label: walletLabel.trim() || 'Connected Wallet',
      })
      if (!result.success) {
        throw new Error(result.message || 'Failed to add wallet')
      }
      setWalletLabel('')
      setAddWalletOpen(false)
      await loadWallets()
    } catch (e: any) {
      setError(e.message || 'Failed to add wallet')
    } finally {
      setAddingWallet(false)
    }
  }

  const addManualWallet = async () => {
    if (!walletAddress.trim()) {
      setError('Wallet address is required')
      return
    }
    // Basic validation for Ethereum address
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress.trim())) {
      setError('Invalid wallet address format')
      return
    }
    try {
      setAddingWallet(true)
      setError('')
      const result = await superAdminAddWallet({
        address: walletAddress.trim(),
        walletAddress: walletAddress.trim(),
        label: walletLabel.trim() || 'Manual Wallet',
      })
      if (!result.success) {
        throw new Error(result.message || 'Failed to add wallet')
      }
      setWalletAddress('')
      setWalletLabel('')
      setAddWalletOpen(false)
      await loadWallets()
    } catch (e: any) {
      setError(e.message || 'Failed to add wallet')
    } finally {
      setAddingWallet(false)
    }
  }

  const removeWallet = async (id: string) => {
    const ok = confirm('Remove this wallet?')
    if (!ok) return
    try {
      const result = await superAdminRemoveWallet(id)
      if (!result.success) {
        alert(result.message || 'Failed to remove wallet')
        return
      }
      await loadWallets()
    } catch (e: any) {
      alert(e.message || 'Failed to remove wallet')
    }
  }

  const isWalletInList = (addr: string) => {
    return wallets.some(
      (w) => (w.address || w.walletAddress || '').toLowerCase() === addr.toLowerCase()
    )
  }

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-600 mt-1">Manage your account and connected wallets</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profile Info */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 lg:col-span-1">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Account Information</h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{info?.email || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Username</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{info?.username || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Role</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{info?.role || 'super_admin'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Last login</p>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {info?.lastLogin ? new Date(info.lastLogin).toLocaleString() : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Wallet Connection & Management */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Wallet Management</h2>
            <button
              onClick={() => setAddWalletOpen(true)}
              className="px-4 py-2 rounded-xl bg-black hover:bg-black/80 text-white text-sm font-medium"
            >
              Add Wallet
            </button>
          </div>

          {/* Connected Wallet Status */}
          <div className="mb-6 p-4 rounded-xl border border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 mb-1">Current Connection</p>
                {isConnected && address ? (
                  <div>
                    <p className="text-sm font-medium text-gray-900 font-mono break-all">
                      {address.slice(0, 6)}...{address.slice(-4)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 font-mono break-all">{address}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">Not connected</p>
                )}
              </div>
              <div className="ml-4 flex gap-2">
                {isConnected ? (
                  <>
                    {address && !isWalletInList(address) && (
                      <button
                        onClick={addConnectedWallet}
                        disabled={addingWallet}
                        className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium disabled:opacity-50"
                      >
                        {addingWallet ? 'Adding...' : 'Save'}
                      </button>
                    )}
                    <button
                      onClick={() => disconnect()}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    onClick={connectWallet}
                    disabled={isConnecting}
                    className="px-4 py-2 rounded-xl bg-black hover:bg-black/80 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isConnecting ? (
                      <>
                        <LoadingDots size="sm" color="#ffffff" />
                        Connecting...
                      </>
                    ) : (
                      'Connect Wallet'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Saved Wallets List */}
          <div>
            <p className="text-xs text-gray-500 mb-3">Saved Wallets</p>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <ShimmerCard key={i} />
                ))}
              </div>
            ) : wallets.length === 0 ? (
              <p className="text-sm text-gray-600 p-4 text-center">No saved wallets</p>
            ) : (
              <div className="space-y-3">
                {wallets.map((w) => {
                  const addr = w.address || w.walletAddress || '—'
                  const isCurrent = isConnected && address && addr.toLowerCase() === address.toLowerCase()
                  return (
                    <div
                      key={String(w.id || w._id || addr)}
                      className="p-4 rounded-xl border border-gray-200 flex items-center justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-900">{w.label || 'Wallet'}</p>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Connected
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 font-mono break-all">{addr}</p>
                        {w.createdAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            Added {new Date(w.createdAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => removeWallet(String(w.id || w._id))}
                        className="ml-4 px-3 py-1.5 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 text-xs font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Wallet Modal */}
      {addWalletOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-gray-200 shadow-xl">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Add Wallet</h3>
              <button
                onClick={() => {
                  setAddWalletOpen(false)
                  setWalletAddress('')
                  setWalletLabel('')
                  setError('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-4">
              {isConnected && address && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-xs text-blue-800 mb-2">Quick add connected wallet:</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-mono text-blue-900 break-all">{address}</p>
                    <button
                      onClick={addConnectedWallet}
                      disabled={addingWallet || isWalletInList(address)}
                      className="ml-3 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {addingWallet ? 'Adding...' : 'Add This'}
                    </button>
                  </div>
                </div>
              )}

              <div className="border-t border-gray-200 pt-4">
                <p className="text-xs text-gray-500 mb-3">Or add manually:</p>
                <div>
                  <label className="text-xs font-medium text-gray-700">Wallet Address</label>
                  <input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="0x..."
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-black outline-none text-sm font-mono"
                  />
                </div>
                <div className="mt-3">
                  <label className="text-xs font-medium text-gray-700">Label (optional)</label>
                  <input
                    type="text"
                    value={walletLabel}
                    onChange={(e) => setWalletLabel(e.target.value)}
                    placeholder="My Wallet"
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-black outline-none text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setAddWalletOpen(false)
                    setWalletAddress('')
                    setWalletLabel('')
                    setError('')
                  }}
                  className="flex-1 px-4 py-2 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-sm font-medium"
                  disabled={addingWallet}
                >
                  Cancel
                </button>
                <button
                  onClick={addManualWallet}
                  disabled={addingWallet || !walletAddress.trim()}
                  className="flex-1 px-4 py-2 rounded-xl bg-black hover:bg-black/80 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {addingWallet ? (
                    <>
                      <LoadingDots size="sm" color="#ffffff" />
                      Adding...
                    </>
                  ) : (
                    'Add Wallet'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

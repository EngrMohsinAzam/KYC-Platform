'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { getSuperAdminInfo, getSuperAdminToken } from '@/lib/api/super-admin-api'
import { LoadingDots } from '@/components/ui/LoadingDots'
import { ShimmerCard } from '@/components/ui/Shimmer'

// Lazy load blockchain functions
let blockchainFunctions: any = null
const loadBlockchainFunctions = async () => {
  if (!blockchainFunctions) {
    blockchainFunctions = await import('@/lib/wallet/web3')
  }
  return blockchainFunctions
}

export default function SuperAdminProfilePage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending: isConnecting } = useConnect()
  const { disconnect } = useDisconnect()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [addWalletOpen, setAddWalletOpen] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [owners, setOwners] = useState<string[]>([])
  const [loadingOwners, setLoadingOwners] = useState(false)
  const [currentUserIsOwner, setCurrentUserIsOwner] = useState<boolean | null>(null)

  const token = getSuperAdminToken()
  const info = getSuperAdminInfo()

  useEffect(() => {
    if (!token) router.replace('/super-admin')
  }, [router, token])

  // Load owners from smart contract when wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      loadOwners()
      checkCurrentUserIsOwner()
    } else {
      setOwners([])
      setCurrentUserIsOwner(null)
    }
  }, [isConnected, address])

  // Verify owner when wallet connects - disconnect if not owner
  useEffect(() => {
    const verifyAndDisconnectIfNotOwner = async () => {
      if (isConnected && address) {
        try {
          const blockchain = await loadBlockchainFunctions()
          const { verifyOwner } = blockchain
          const isOwner = await verifyOwner(address)
          
          if (!isOwner) {
            // Disconnect non-owner wallet
            disconnect()
            alert('🔒 Access Denied\nOnly owner wallets can connect to this page.')
            setError('Only owner wallets can connect to this page.')
          }
        } catch (error: any) {
          console.error('Error verifying owner on connect:', error)
        }
      }
    }

    verifyAndDisconnectIfNotOwner()
  }, [isConnected, address, disconnect])

  // Verify owner when wallet connects - disconnect if not owner
  useEffect(() => {
    const verifyAndDisconnectIfNotOwner = async () => {
      if (isConnected && address) {
        try {
          const blockchain = await loadBlockchainFunctions()
          const { verifyOwner } = blockchain
          const isOwner = await verifyOwner(address)
          
          if (!isOwner) {
            // Disconnect non-owner wallet
            disconnect()
            alert('🔒 Access Denied\nOnly owner wallets can connect to this page.')
            setError('Only owner wallets can connect to this page.')
          }
        } catch (error: any) {
          console.error('Error verifying owner on connect:', error)
        }
      }
    }

    verifyAndDisconnectIfNotOwner()
  }, [isConnected, address, disconnect])

  // Load owners from smart contract
  const loadOwners = async () => {
    try {
      setLoadingOwners(true)
      setError('')
      
      // Lazy load blockchain functions and contracts
      const blockchain = await loadBlockchainFunctions()
      const { getProviderAndSigner } = blockchain
      const ethers = await import('ethers')
      const { CONTRACT_ADDRESSES, KYC_ABI } = await import('@/lib/wallet/contracts')
      
      // Try to get provider (works even without wallet connection)
      let provider
      try {
        const providerAndSigner = await getProviderAndSigner()
        provider = providerAndSigner.provider
      } catch (error) {
        // If no wallet connected, use public RPC
        provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/')
      }
      
      const kycContract = new ethers.Contract(CONTRACT_ADDRESSES.KYC, KYC_ABI, provider)
      
      // Get all authorized owners from contract
      const authorizedOwners = await kycContract.getAuthorizedOwners()
      setOwners(Array.isArray(authorizedOwners) ? authorizedOwners : [])
      console.log('✅ Loaded owners from contract:', authorizedOwners)
    } catch (e: any) {
      console.error('Error loading owners:', e)
      setError(e.message || 'Failed to load owners from contract')
      setOwners([])
    } finally {
      setLoadingOwners(false)
    }
  }

  // Check if current user is an owner
  const checkCurrentUserIsOwner = async () => {
    if (!address) {
      setCurrentUserIsOwner(null)
      return
    }
    
    try {
      const blockchain = await loadBlockchainFunctions()
      const { verifyOwner } = blockchain
      const isOwner = await verifyOwner(address)
      setCurrentUserIsOwner(isOwner)
      console.log('🔐 Current user is owner:', isOwner)
    } catch (e: any) {
      console.error('Error checking current user owner status:', e)
      setCurrentUserIsOwner(false)
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

  const openWallet = async () => {
    // Try to connect to MetaMask first if available
    const isMetaMaskAvailable = typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined'
    const metaMaskConnector = connectors.find(
      (connector) => 
        connector.id === 'metaMask' || connector.id === 'injected' || connector.name?.toLowerCase().includes('metamask')
    )
    
    if (isMetaMaskAvailable && metaMaskConnector) {
      try {
        await connect({ connector: metaMaskConnector })
        return // Successfully connected to MetaMask
      } catch (error: any) {
        const errorMessage = error?.message || error?.toString() || ''
        // If user rejected MetaMask, don't fall back
        if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
          console.log('User rejected MetaMask connection')
          return
        }
        // If MetaMask connection failed for other reasons, fall back to WalletConnect
        console.log('MetaMask connection failed, trying WalletConnect')
      }
    }
    
    // Fall back to WalletConnect if MetaMask is not available or connection failed
    const walletConnectConnector = connectors.find(
      (connector) => connector.id === 'walletConnect'
    )
    
    if (walletConnectConnector) {
      try {
        await connect({ connector: walletConnectConnector })
      } catch (error: any) {
        const errorMessage = error?.message || error?.toString() || 'Unknown error'
        if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
          console.log('User rejected wallet connection')
          return
        }
        console.warn('Wallet connection error:', errorMessage)
      }
    } else {
      // If no connectors available, try the first one
      if (connectors.length > 0) {
        try {
          await connect({ connector: connectors[0] })
        } catch (error: any) {
          const errorMessage = error?.message || error?.toString() || 'Unknown error'
          if (!errorMessage.includes('User rejected') && !errorMessage.includes('User denied')) {
            console.warn('Wallet connection error:', errorMessage)
          }
        }
      } else {
        console.error('No wallet connectors available')
      }
    }
  }


  // Function to add owner to contract
  const addOwnerToContract = async (ownerAddress: string) => {
    try {
      setError('')
      
      // Lazy load blockchain functions
      const blockchain = await loadBlockchainFunctions()
      const { getKYCContract } = blockchain
      const kycContract = await getKYCContract()
      
      // Call addOwner function
      const tx = await kycContract.addOwner(ownerAddress)
      console.log('📝 Adding owner transaction:', tx.hash)
      
      // Wait for transaction confirmation
      await tx.wait()
      console.log('✅ Owner added successfully!')
      
      alert(`Owner added successfully! Transaction hash: ${tx.hash}`)
      
      // Reload owners list
      await loadOwners()
      return tx.hash
    } catch (error: any) {
      console.error('Error adding owner:', error)
      throw new Error(error.message || 'Failed to add owner to contract')
    }
  }

  // Function to remove owner from contract
  const removeOwnerFromContract = async (ownerAddress: string) => {
    try {
      setError('')
      
      // Lazy load blockchain functions
      const blockchain = await loadBlockchainFunctions()
      const { getKYCContract } = blockchain
      const kycContract = await getKYCContract()
      
      // Call removeOwner function
      const tx = await kycContract.removeOwner(ownerAddress)
      console.log('📝 Removing owner transaction:', tx.hash)
      
      // Wait for transaction confirmation
      await tx.wait()
      console.log('✅ Owner removed successfully!')
      
      alert(`Owner removed successfully! Transaction hash: ${tx.hash}`)
      
      // Reload owners list
      await loadOwners()
      return tx.hash
    } catch (error: any) {
      console.error('Error removing owner:', error)
      throw new Error(error.message || 'Failed to remove owner from contract')
    }
  }

  // Show connect wallet screen if not connected
  if (!isConnected || !address) {
    return (
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md w-full text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h1>
            <p className="text-sm text-gray-600 mb-6">
              Please connect your wallet to access the profile page and manage contract owners.
            </p>
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="w-full px-4 py-3 rounded-xl bg-black hover:bg-black/80 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 mb-6 -mx-4 md:-mx-8 px-4 md:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Profile</h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-0.5 sm:mt-1 hidden sm:block">Manage contract owners</p>
          </div>
          <div className="flex gap-2 sm:gap-3 flex-shrink-0 ml-2">
            <button
              onClick={async () => {
                // Connect wallet if not connected, then show modal
                if (!isConnected) {
                  try {
                    await openWallet()
                  } catch (error) {
                    // Error already handled in openWallet
                    console.log('Wallet connection attempt completed')
                  }
                }
                // Show modal even if connection failed - user can retry
                setShowWithdrawModal(true)
              }}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-black text-white rounded-lg transition-colors text-xs sm:text-sm md:text-base flex items-center gap-1.5 sm:gap-2"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="hidden sm:inline">Withdraw</span>
            </button>
          </div>
        </div>
      </header>

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
              <p className="text-xs text-gray-500">Connected Wallet</p>
              <p className="text-sm font-medium text-gray-900 mt-1 font-mono break-all">
                {address.slice(0, 6)}...{address.slice(-4)}
              </p>
              <p className="text-xs text-gray-500 mt-1 font-mono break-all">{address}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Owner Status</p>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {currentUserIsOwner === true ? (
                  <span className="text-green-600">✅ Owner</span>
                ) : currentUserIsOwner === false ? (
                  <span className="text-red-600">❌ Not Owner</span>
                ) : (
                  '—'
                )}
              </p>
            </div>
            <button
              onClick={() => disconnect()}
              className="text-xs text-red-600 hover:text-red-700 font-medium underline"
            >
              Disconnect
            </button>
          </div>
        </div>

        {/* Owner Management - Only show if connected wallet is an owner */}
        {currentUserIsOwner === true && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Contract Owners</h2>
              <button
                onClick={() => setAddWalletOpen(true)}
                className="px-4 py-2 rounded-xl bg-black hover:bg-black/80 text-white text-sm font-medium"
              >
                Add Owner
              </button>
            </div>

            {/* Owners List */}
            <div>
              <p className="text-xs text-gray-500 mb-3">Authorized Owners (from Smart Contract)</p>
              {loadingOwners ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <ShimmerCard key={i} />
                  ))}
                </div>
              ) : owners.length === 0 ? (
                <p className="text-sm text-gray-600 p-4 text-center">No owners found in contract</p>
              ) : (
                <div className="space-y-3">
                  {owners.map((ownerAddr) => {
                    const isCurrent = address && ownerAddr.toLowerCase() === address.toLowerCase()
                    return (
                      <div
                        key={ownerAddr}
                        className="p-4 rounded-xl border border-gray-200 flex items-center justify-between"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-gray-900 font-mono">Owner</p>
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 font-mono break-all">{ownerAddr}</p>
                        </div>
                        {!isCurrent && (
                          <button
                            onClick={async () => {
                              const ok = confirm(`Remove ${ownerAddr.slice(0, 6)}...${ownerAddr.slice(-4)} as an owner?`)
                              if (!ok) return
                              try {
                                await removeOwnerFromContract(ownerAddr)
                              } catch (error: any) {
                                alert(error.message || 'Failed to remove owner')
                              }
                            }}
                            className="ml-4 px-3 py-1.5 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 text-xs font-medium"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Owner Modal */}
      {addWalletOpen && (
        <AddOwnerModal
          onClose={() => {
            setAddWalletOpen(false)
            setError('')
          }}
          onAddOwner={addOwnerToContract}
          existingAddress={address}
          existingIsConnected={isConnected}
          currentUserIsOwner={currentUserIsOwner}
        />
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <WithdrawModal 
          onClose={() => setShowWithdrawModal(false)}
          onWithdrawSuccess={() => {
            // Modal will handle success internally
            setShowWithdrawModal(false)
          }}
        />
      )}
    </main>
  )
}

// Withdraw Modal Component
function WithdrawModal({ onClose, onWithdrawSuccess }: { onClose: () => void; onWithdrawSuccess?: () => void }) {
  const [amount, setAmount] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const [contractBalance, setContractBalance] = useState<number | null>(null)
  const [loadingBalance, setLoadingBalance] = useState(false)
  const [isOwner, setIsOwner] = useState<boolean | null>(null)
  const [verifyingOwner, setVerifyingOwner] = useState(false)
  const [error, setError] = useState<string>('')

  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  
  // Check if MetaMask is available
  const isMetaMaskAvailable = typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined'
  
  // Find MetaMask connector
  const metaMaskConnector = connectors.find((connector) => 
    connector.id === 'metaMask' || connector.id === 'injected' || connector.name?.toLowerCase().includes('metamask')
  )
  
  const connectToMetaMask = async () => {
    if (metaMaskConnector) {
      try {
        await connect({ connector: metaMaskConnector })
      } catch (error: any) {
        const errorMessage = error?.message || error?.toString() || 'Unknown error'
        if (!errorMessage.includes('User rejected') && !errorMessage.includes('User denied')) {
          console.error('MetaMask connection error:', errorMessage)
        }
        throw error
      }
    } else {
      throw new Error('MetaMask not found')
    }
  }
  
  const openWallet = async () => {
    // Try to connect to MetaMask first if available
    if (isMetaMaskAvailable && metaMaskConnector) {
      try {
        await connectToMetaMask()
        return // Successfully connected to MetaMask
      } catch (error: any) {
        const errorMessage = error?.message || error?.toString() || ''
        // If user rejected MetaMask, don't fall back
        if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
          console.log('User rejected MetaMask connection')
          return
        }
        // If MetaMask connection failed for other reasons, fall back to WalletConnect
        console.log('MetaMask connection failed, trying WalletConnect')
      }
    }
    
    // Fall back to WalletConnect if MetaMask is not available or connection failed
    const walletConnectConnector = connectors.find(
      (connector) => connector.id === 'walletConnect'
    )
    
    if (walletConnectConnector) {
      try {
        await connect({ connector: walletConnectConnector })
      } catch (error: any) {
        const errorMessage = error?.message || error?.toString() || 'Unknown error'
        if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
          console.log('User rejected wallet connection')
          return
        }
        console.warn('Wallet connection error:', errorMessage)
      }
    } else {
      // If no connectors available, try the first one
      if (connectors.length > 0) {
        try {
          await connect({ connector: connectors[0] })
        } catch (error: any) {
          const errorMessage = error?.message || error?.toString() || 'Unknown error'
          if (!errorMessage.includes('User rejected') && !errorMessage.includes('User denied')) {
            console.warn('Wallet connection error:', errorMessage)
          }
        }
      } else {
        console.error('No wallet connectors available')
      }
    }
  }

  // Fetch contract balance immediately when modal opens (works without wallet)
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        setLoadingBalance(true)
        // Lazy load blockchain functions
        const blockchain = await loadBlockchainFunctions()
        const balance = await blockchain.getContractBalance()
        setContractBalance(parseFloat(balance))
        console.log('✅ Contract balance fetched:', balance, 'BNB')
      } catch (error: any) {
        console.error('Error fetching contract balance:', error)
        // Don't set error here - just log it, balance will show as unavailable
        setContractBalance(null)
      } finally {
        setLoadingBalance(false)
      }
    }

    // Fetch balance immediately when modal opens
    fetchBalance()
  }, []) // Empty dependency array - only run once when modal opens

  // Verify owner when wallet is connected - disconnect if not owner
  useEffect(() => {
    const checkOwner = async () => {
      if (isConnected && address) {
        try {
          setError('')
          setVerifyingOwner(true)
          
          // Lazy load blockchain functions
          const blockchain = await loadBlockchainFunctions()
          const { verifyOwner, getContractBalance } = blockchain
          
          // Verify if the connected wallet is the owner
          const ownerStatus = await verifyOwner(address)
          
          if (!ownerStatus) {
            // Disconnect non-owner wallet
            disconnect()
            alert('🔒 Access Denied\nOnly owner wallets can connect to withdraw funds.')
            setError('Only owner wallets can connect to withdraw funds.')
            setIsOwner(false)
            return
          }
          
          setIsOwner(ownerStatus)
          
          // If owner, refresh contract balance to ensure it's up to date
          const balance = await getContractBalance()
          setContractBalance(parseFloat(balance))
        } catch (error: any) {
          console.error('Error verifying owner:', error)
          setError(error.message || 'Failed to verify ownership')
          setIsOwner(false)
        } finally {
          setVerifyingOwner(false)
        }
      } else {
        setIsOwner(null)
        setError('')
      }
    }

    checkOwner()
  }, [isConnected, address, disconnect])

  const handleConnectWallet = async () => {
    try {
      setConnecting(true)
      setError('')
      await openWallet()
      // Verification and balance will be fetched automatically by useEffect when address becomes available
    } catch (error: any) {
      console.error('Error connecting wallet:', error)
      // Errors are already handled in openWallet - don't show duplicate alerts
      // Only show alert for unexpected errors
      const errorMessage = error?.message || error?.toString() || ''
      if (!errorMessage.includes('User rejected') && !errorMessage.includes('Failed to connect')) {
        setError('Failed to connect wallet. Please try again.')
      }
    } finally {
      setConnecting(false)
    }
  }

  const handleWithdraw = async () => {
    if (!isConnected || !amount || !isOwner) return

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount greater than 0')
      return
    }

    if (contractBalance !== null && amountNum > contractBalance) {
      setError(`Insufficient contract balance. Available: ${contractBalance.toFixed(8)} BNB`)
      return
    }

    try {
      setWithdrawing(true)
      setError('')
      
      // Lazy load blockchain functions
      const blockchain = await loadBlockchainFunctions()
      const txHash = await blockchain.withdrawContractFunds(amount)
      
      // Show success message
      alert(`Withdrawal successful! Transaction hash: ${txHash}`)
      
      // Update local balance immediately (optimistic update)
      if (contractBalance !== null) {
        const withdrawalAmount = parseFloat(amount)
        const newBalance = Math.max(0, contractBalance - withdrawalAmount)
        setContractBalance(newBalance)
        console.log(`✅ Updated contract balance: ${contractBalance} - ${withdrawalAmount} = ${newBalance}`)
      }
      
      // Instantly update parent component with the withdrawal amount
      if (onWithdrawSuccess) {
        onWithdrawSuccess()
      }
      
      // Reset form and close modal
      setAmount('')
      onClose()
    } catch (error: any) {
      console.error('Error withdrawing:', error)
      setError(error.message || 'Withdrawal failed. Please try again.')
    } finally {
      setWithdrawing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Withdraw Funds</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6">Withdraw funds from the contract. Only authorized owners can withdraw.</p>

        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {isConnected && address && (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-blue-800">
                    Connected: {address.slice(0, 6)}...{address.slice(-4)}
                  </p>
                  <button
                    onClick={() => {
                      disconnect()
                      setIsOwner(null)
                      setError('')
                    }}
                    className="text-xs text-red-600 hover:text-red-700 font-medium underline"
                  >
                    Disconnect
                  </button>
                </div>
              </div>

              {verifyingOwner && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-600">Verifying ownership...</p>
                </div>
              )}

              {!verifyingOwner && isOwner === false && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 font-semibold">
                    ⚠️ Access Denied: Only authorized owners can withdraw funds. Please connect with an authorized owner wallet.
                  </p>
                </div>
              )}

             
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contract Balance
            </label>
            <div className="text-lg font-semibold text-gray-900">
              {loadingBalance ? (
                <span className="text-gray-400">Loading...</span>
              ) : contractBalance !== null ? (
                `${contractBalance.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 8 })} BNB`
              ) : (
                <span className="text-gray-400">
                  Unable to fetch balance
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Withdrawal Amount (BNB)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.00000001"
                min="0"
                value={amount}
                onChange={(e) => {
                  const inputValue = e.target.value
                  // Prevent negative values
                  if (inputValue === '' || inputValue === '-') {
                    setAmount('')
                    setError('')
                    return
                  }
                  const numValue = parseFloat(inputValue)
                  // Only allow positive numbers or zero
                  if (!isNaN(numValue) && numValue >= 0) {
                    setAmount(inputValue)
                    setError('')
                  } else {
                    // If negative, don't update the value
                    setError('Amount must be greater than or equal to 0')
                  }
                }}
                onKeyDown={(e) => {
                  // Prevent typing minus sign
                  if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                    e.preventDefault()
                  }
                }}
                placeholder="0.00000000"
                disabled={!isConnected || !isOwner}
                className="w-full px-4 py-2 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => {
                  if (contractBalance !== null && contractBalance > 0) {
                    setAmount(contractBalance.toFixed(8))
                    setError('')
                  }
                }}
                disabled={!isConnected || !isOwner || contractBalance === null || contractBalance <= 0}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-blue-600 disabled:hover:bg-blue-50"
              >
                Max
              </button>
            </div>
            {contractBalance !== null && amount && parseFloat(amount) > contractBalance && (
              <p className="mt-1 text-sm text-red-600">
                Amount exceeds contract balance
              </p>
            )}
          </div>

          {!isConnected && (
            <button
              onClick={handleConnectWallet}
              disabled={connecting}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {connecting ? 'Connecting...' : isMetaMaskAvailable ? 'Connect Wallet (MetaMask)' : 'Connect Wallet'}
            </button>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleWithdraw}
              disabled={
                !isConnected || 
                !amount || 
                !isOwner || 
                withdrawing || 
                contractBalance === null ||
                verifyingOwner ||
                (amount ? parseFloat(amount) <= 0 : true) ||
                (amount && contractBalance !== null ? parseFloat(amount) > contractBalance : false)
              }
              className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-black/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {withdrawing ? 'Processing...' : 'Withdraw Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Add Owner Modal Component
function AddOwnerModal({ 
  onClose, 
  onAddOwner,
  existingAddress,
  existingIsConnected,
  currentUserIsOwner
}: { 
  onClose: () => void
  onAddOwner: (address: string) => Promise<string>
  existingAddress?: string
  existingIsConnected?: boolean
  currentUserIsOwner?: boolean | null
}) {
  const [error, setError] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [isOwner, setIsOwner] = useState<boolean | null>(null)
  const [verifyingOwner, setVerifyingOwner] = useState(false)
  const [addingOwner, setAddingOwner] = useState(false)

  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  // Check if current user is owner - if not, show popup
  useEffect(() => {
    if (currentUserIsOwner === false) {
      // Show popup message
      setTimeout(() => {
        alert('🔒 Access Denied\nThis is not an owner wallet.')
        onClose()
      }, 100)
    }
  }, [currentUserIsOwner, onClose])

  // Auto-connect wallet when modal opens (to get the wallet address to add as owner)
  useEffect(() => {
    let mounted = true
    
    const autoConnect = async () => {
      // If already connected, use existing connection
      if (existingIsConnected && existingAddress) {
        if (mounted) setConnecting(false)
        return
      }

      // If not connected, try to connect
      if (!isConnected && connectors.length > 0) {
        try {
          if (mounted) {
            setConnecting(true)
            setError('')
          }
          
          const isMetaMaskAvailable = typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined'
          const metaMaskConnector = connectors.find(
            (connector) => 
              connector.id === 'metaMask' || connector.id === 'injected' || connector.name?.toLowerCase().includes('metamask')
          )
          
          if (isMetaMaskAvailable && metaMaskConnector) {
            await connect({ connector: metaMaskConnector })
          } else {
            const walletConnectConnector = connectors.find(
              (connector) => connector.id === 'walletConnect'
            )
            if (walletConnectConnector) {
              await connect({ connector: walletConnectConnector })
            } else if (connectors.length > 0) {
              await connect({ connector: connectors[0] })
            }
          }
        } catch (error: any) {
          const errorMessage = error?.message || error?.toString() || ''
          if (mounted && !errorMessage.includes('User rejected') && !errorMessage.includes('User denied')) {
            setError('Failed to connect wallet. Please try again.')
          }
        } finally {
          if (mounted) setConnecting(false)
        }
      }
    }

    // Small delay to ensure modal is fully rendered
    const timer = setTimeout(() => {
      autoConnect()
    }, 100)

    return () => {
      mounted = false
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once when modal opens

  // Verify owner when wallet is connected (the wallet being added)
  useEffect(() => {
    const checkOwner = async () => {
      const currentAddress = address || existingAddress
      if (currentAddress) {
        try {
          setError('')
          setVerifyingOwner(true)
          
          // Lazy load blockchain functions
          const blockchain = await loadBlockchainFunctions()
          const { verifyOwner } = blockchain
          
          // Verify if the connected wallet is an owner
          const ownerStatus = await verifyOwner(currentAddress)
          setIsOwner(ownerStatus)
          console.log('🔐 Owner verification result:', { address: currentAddress, isOwner: ownerStatus })
        } catch (error: any) {
          console.error('Error verifying owner:', error)
          setError(error.message || 'Failed to verify ownership')
          setIsOwner(false)
        } finally {
          setVerifyingOwner(false)
        }
      } else {
        setIsOwner(null)
      }
    }

    checkOwner()
  }, [address, existingAddress])

  const handleConnectWallet = async () => {
    try {
      setConnecting(true)
      setError('')
      
      const isMetaMaskAvailable = typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined'
      const metaMaskConnector = connectors.find(
        (connector) => 
          connector.id === 'metaMask' || connector.id === 'injected' || connector.name?.toLowerCase().includes('metamask')
      )
      
      if (isMetaMaskAvailable && metaMaskConnector) {
        await connect({ connector: metaMaskConnector })
      } else {
        const walletConnectConnector = connectors.find(
          (connector) => connector.id === 'walletConnect'
        )
        if (walletConnectConnector) {
          await connect({ connector: walletConnectConnector })
        } else if (connectors.length > 0) {
          await connect({ connector: connectors[0] })
        }
      }
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || ''
      if (!errorMessage.includes('User rejected') && !errorMessage.includes('User denied')) {
        setError('Failed to connect wallet. Please try again.')
      }
    } finally {
      setConnecting(false)
    }
  }

  const handleAddAsOwner = async () => {
    const currentAddress = address || existingAddress
    if (!currentAddress) return

    // Double check: Only allow if current user is an owner
    if (currentUserIsOwner !== true) {
      alert('🔒 Access Denied\nThis is not an owner wallet.')
      onClose()
      return
    }

    try {
      setAddingOwner(true)
      setError('')
      await onAddOwner(currentAddress)
      onClose()
    } catch (error: any) {
      setError(error.message || 'Failed to add owner')
    } finally {
      setAddingOwner(false)
    }
  }

  const currentAddress = address || existingAddress
  const currentIsConnected = isConnected || existingIsConnected

  // If current user is not an owner, don't show the modal content
  if (currentUserIsOwner === false) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl border border-gray-200 shadow-xl">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Add Owner</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Check if current user is owner first */}
          {currentUserIsOwner !== true ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-800 font-semibold mb-2">
                🔒 Access Denied
              </p>
              <p className="text-xs text-red-700 mb-3">
                This is not an owner wallet.
              </p>
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              {/* Wallet Connection Status */}
              {!(isConnected || existingIsConnected) ? (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <p className="text-sm text-yellow-800 mb-3">
                    Please connect the wallet you want to add as an owner.
                  </p>
                  <button
                    onClick={handleConnectWallet}
                    disabled={connecting}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {connecting ? (
                      <>
                        <LoadingDots size="sm" color="#ffffff" />
                        Connecting...
                      </>
                    ) : (
                      'Connect Wallet'
                    )}
                  </button>
                </div>
              ) : (address || existingAddress) ? (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-blue-800 mb-1">Connected Wallet</p>
                        <p className="text-sm font-mono text-blue-900 break-all">
                          {(address || existingAddress)?.slice(0, 6)}...{(address || existingAddress)?.slice(-4)}
                        </p>
                        <p className="text-xs font-mono text-blue-700 break-all mt-1">{address || existingAddress}</p>
                      </div>
                      <button
                        onClick={() => {
                          disconnect()
                          setIsOwner(null)
                          setError('')
                        }}
                        className="text-xs text-red-600 hover:text-red-700 font-medium underline"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>

                  {/* Owner Verification Status */}
                  {verifyingOwner && (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                      <p className="text-sm text-gray-600">Verifying ownership...</p>
                    </div>
                  )}

                  {!verifyingOwner && isOwner === true && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                      <p className="text-sm text-green-800 font-semibold">
                        ✅ This wallet is already an owner
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        This wallet already has owner permissions on the smart contract.
                      </p>
                    </div>
                  )}

                  {!verifyingOwner && isOwner === false && (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl">
                      <p className="text-sm text-orange-800 font-semibold mb-2">
                        ⚠️ This is not an owner wallet
                      </p>
                      <p className="text-xs text-orange-700 mb-3">
                        You can add this wallet as an owner to the smart contract.
                      </p>
                      <button
                        onClick={handleAddAsOwner}
                        disabled={addingOwner}
                        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {addingOwner ? 'Adding...' : 'Add as Owner'}
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-sm font-medium"
              disabled={addingOwner}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

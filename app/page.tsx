
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/Button'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { useAppContext } from '@/context/useAppContext'
import { Input } from '@/components/ui/Input'

// Lazy load heavy components - only load when needed
const HelpModal = dynamic(() => import('@/components/ui/HelpModal').then(mod => ({ default: mod.HelpModal })), {
  ssr: false,
  loading: () => null,
})

// Lazy load blockchain functions - defer until wallet connection is needed
let blockchainFunctions: any = null
const loadBlockchainFunctions = async () => {
  if (!blockchainFunctions) {
    blockchainFunctions = await import('@/lib/web3')
  }
  return blockchainFunctions
}

// Lazy load API functions
let apiFunctions: any = null
const loadApiFunctions = async () => {
  if (!apiFunctions) {
    apiFunctions = await import('@/lib/api')
  }
  return apiFunctions
}

declare global {
  interface Window {
    ethereum?: any
  }
}

// Validate email format
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export default function Home() {
  const router = useRouter()
  const { state, dispatch } = useAppContext()
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [checkingWallet, setCheckingWallet] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [email, setEmail] = useState('')
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [emailChecked, setEmailChecked] = useState(false)
  const [emailStatus, setEmailStatus] = useState<any>(null)
  const [showEmailInput, setShowEmailInput] = useState(false)

  // Defer wallet check - only run if wallet is connected
  useEffect(() => {
    if (!state.connectedWallet) {
      setCheckingWallet(false)
      return
    }
    
    setCheckingWallet(true)
    
    const checkExistingWallet = async () => {
      try {
        // Lazy load blockchain functions only when needed
        const { isMetaMaskInstalled } = await loadBlockchainFunctions()
        
        if (isMetaMaskInstalled() && window.ethereum && state.connectedWallet) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' })
          if (accounts && accounts.length > 0 && accounts[0].toLowerCase() === state.connectedWallet.toLowerCase()) {
            setCheckingWallet(false)
            return
          }
        }
      } catch (err) {
        console.warn('Error checking existing wallet:', err)
      }
      setCheckingWallet(false)
    }
    
    checkExistingWallet()
  }, [state.connectedWallet])
  
  const handleEmailSubmit = useCallback(async () => {
    if (!email) {
      setEmailError('Please enter your email address')
      return
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address')
      return
    }

    setCheckingEmail(true)
    setEmailError(null)

    try {
      // Lazy load API functions only when submitting
      const { checkStatusByEmail } = await loadApiFunctions()
      const result = await checkStatusByEmail(email)
      
      if (result.success && result.data) {
        setEmailStatus(result.data)
        setEmailChecked(true)
        
        // Save email to context - store it temporarily
        // We'll use it to pre-fill in personal-info page
        if (state.personalInfo) {
          dispatch({ 
            type: 'SET_PERSONAL_INFO', 
            payload: { 
              ...state.personalInfo, 
              email 
            } 
          })
        } else {
          // If no personalInfo yet, create a temporary one with just email
          // This will be used to pre-fill the email field in personal-info page
          dispatch({ 
            type: 'SET_PERSONAL_INFO', 
            payload: { 
              firstName: '',
              lastName: '',
              fatherName: '',
              idNumber: '',
              email: email,
              phone: ''
            } 
          })
        }
        
        // Check both verificationStatus and kycStatus
        const status = result.data.verificationStatus || result.data.kycStatus
        
        console.log('📊 Status check result:', {
          verificationStatus: result.data.verificationStatus,
          kycStatus: result.data.kycStatus,
          finalStatus: status,
          fullData: result.data
        })
        
        // Handle different statuses
        if (status === 'approved') {
          // Redirect to complete screen
          setTimeout(() => {
            router.push('/decentralized-id/complete')
          }, 1500)
        } else if (status === 'pending' || status === 'submitted' || status === 'under_review' || status === 'underReview') {
          // Redirect to under review screen - prioritize pending/under_review over rejected
          setTimeout(() => {
            router.push('/verify/under-review')
          }, 1500)
        } else if (status === 'cancelled' || status === 'rejected') {
          // Redirect to rejected screen
          setTimeout(() => {
            router.push('/verify/rejected')
          }, 1500)
        } else if (status === 'not_found') {
          // Email doesn't exist - allow KYC, proceed to verification
          setEmailChecked(true)
          setTimeout(() => {
            router.push('/verify/select-id-type')
          }, 500)
        } else if (status) {
          // Unknown status - default to under review
          console.warn('⚠️ Unknown status, defaulting to under review:', status)
          setTimeout(() => {
            router.push('/verify/under-review')
          }, 1500)
        }
      } else {
        // Email not found - allow KYC, proceed to verification
        setEmailChecked(true)
        setEmailStatus({ verificationStatus: 'not_found' })
        setTimeout(() => {
          router.push('/verify/select-id-type')
        }, 500)
      }
    } catch (err: any) {
      setEmailError(err instanceof Error ? err.message : 'Failed to check email status. Please try again.')
    } finally {
      setCheckingEmail(false)
    }
  }, [email, state.personalInfo, dispatch, router])

  const handleConnectWallet = useCallback(async () => {
    // Lazy load blockchain functions only when connecting wallet
    const blockchain = await loadBlockchainFunctions()
    const { isMetaMaskInstalled, connectWallet, getNetworkInfo, getKYCStatusFromContract } = blockchain
    
    if (!isMetaMaskInstalled()) {
      alert('MetaMask is not installed. Please install MetaMask to continue.')
      return
    }

    setConnecting(true)

    try {
      const network = await getNetworkInfo()
      if (network && network.chainId !== '97') {
        const switchToBSC = confirm('You need to be on Binance Smart Chain Testnet. Would you like to switch now?')
        if (switchToBSC) {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x61' }],
            })
            await new Promise(resolve => setTimeout(resolve, 1000))
          } catch (switchError: any) {
            if (switchError.code === 4902) {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0x61',
                  chainName: 'Binance Smart Chain Testnet',
                  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
                  rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
                  blockExplorerUrls: ['https://testnet.bscscan.com/']
                }]
              })
              await new Promise(resolve => setTimeout(resolve, 1000))
            }
          }
        }
      }

      const walletAddress = await connectWallet()
      if (walletAddress) {
        dispatch({ type: 'SET_WALLET', payload: walletAddress })
        
        try {
          const contractStatus = await getKYCStatusFromContract(walletAddress)
          console.log('Contract KYC Status:', contractStatus)
          
          if (contractStatus.hasApplied) {
            if (contractStatus.status === 'approved') {
              router.push('/decentralized-id/complete')
              return
            } else if (contractStatus.status === 'pending') {
              router.push('/verify/under-review')
              return
            }
          }
        } catch (err) {
          console.warn('Could not check contract status:', err)
        }
      }
    } catch (error: any) {
      if (error.code !== 4001) {
        alert(error.message || 'Failed to connect wallet. Please try again.')
      }
    } finally {
      setConnecting(false)
    }
  }, [dispatch, router])

  return (
    <div className="min-h-screen h-screen bg-white flex flex-col overflow-hidden">
      {/* Mobile Header - Simple with help icon */}
      <div className="md:hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <button onClick={() => router.back()} className="p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-medium">Identity verification</h1>
          </div>
          <button onClick={() => setShowHelpModal(true)} className="p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Desktop Header */}
      {/* <div className="hidden md:block">
        <Header title="Identity verification" />
      </div> */}
      
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full md:flex md:items-center md:justify-center md:py-8">
          {/* Mobile Design - Full screen clean layout */}
          <div className="md:hidden h-full flex flex-col px-4 pt-6 pb-32">
            {!showEmailInput ? (
              <>
                {/* Unverified Badge */}
                <div className="mb-8">
                  <span className="inline-block px-3 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full">
                    Unverified
                  </span>
                </div>

                {/* Main Title */}
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Complete identity verification in five minutes
                </h2>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-8 leading-relaxed">
                  In accordance with local laws and regulations identity verification is required to access deposit and withdrawal functions. Institutional users must complete the process via the official MIRA website.
                </p>

                {/* Requirements Section */}
                <div className="space-y-4 mb-auto">
                  {/* Requirements */}
                  <div className="flex items-center gap-3">
                    <div className="mt-1">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Requirements</h3>
                      <p className="text-sm text-gray-600">Government-issued documents</p>
                    </div>
                  </div>

                  {/* Face Recognition */}
                  <div className="flex items-center gap-3">
                    <div className="mt-1">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Selfie</h3>
                      <p className="text-sm text-gray-600">Face recognition verification</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Email Input Section */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Start Verification
                  </h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Enter your email address to check your verification status
                  </p>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      placeholder="user@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        setEmailError(null)
                      }}
                      disabled={checkingEmail}
                      className="w-full"
                    />
                    {emailError && (
                      <p className="text-xs text-red-600 mt-1">{emailError}</p>
                    )}
                  </div>
                  
                  <Button
                    onClick={handleEmailSubmit}
                    disabled={checkingEmail || !email}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-full py-3"
                  >
                    {checkingEmail ? 'Checking...' : 'Continue'}
                  </Button>
                  
                  {emailStatus && emailStatus.verificationStatus !== 'not_found' && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        {emailStatus.verificationStatus === 'approved' && 'Your verification is approved. Redirecting...'}
                        {emailStatus.verificationStatus === 'pending' && 'Your verification is pending review. Redirecting...'}
                        {emailStatus.verificationStatus === 'cancelled' && 'Your verification was cancelled. Redirecting...'}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Desktop Design - Card layout */}
          <div className="hidden md:block w-full max-w-2xl px-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200">
              {!showEmailInput ? (
                <>
                  <div className="text-left mb-6 relative">
                    <span className="absolute top-0 left-0 text-sm text-gray-500">
                      Unverified
                    </span>
                    <div className="flex gap-2 absolute top-0 right-0">
                      <button
                        onClick={() => setShowHelpModal(true)}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                      >
                        <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="mb-8 mt-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      Complete identity verification in five minutes
                    </h2>
                    <p className="text-base text-gray-600 mb-6 leading-relaxed">
                      In accordance with local laws and regulations identity verification is required to access deposit and withdrawal functions. Institutional users must complete the process via the official MIRA website.
                    </p>

                    <div className="space-y-4 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="mt-1">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">Requirements</h3>
                          <p className="text-sm text-gray-600">Government-issued documents</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="mt-1">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">Selfie</h3>
                          <p className="text-sm text-gray-600">Face recognition verification</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Button 
                      onClick={() => setShowEmailInput(true)} 
                      disabled={false}
                      className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-full py-3"
                    >
                      Start Verification
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Email Input Section */}
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Start Verification
                    </h2>
                    <p className="text-sm text-gray-600 mb-6">
                      Enter your email address to check your verification status
                    </p>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Email Address
                      </label>
                      <Input
                        type="email"
                        placeholder="user@example.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          setEmailError(null)
                        }}
                        disabled={checkingEmail}
                        className="w-full"
                      />
                      {emailError && (
                        <p className="text-xs text-red-600 mt-1">{emailError}</p>
                      )}
                    </div>
                    
                    <Button
                      onClick={handleEmailSubmit}
                      disabled={checkingEmail || !email}
                      className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-full py-3"
                    >
                      {checkingEmail ? 'Checking...' : 'Continue'}
                    </Button>
                    
                    {emailStatus && emailStatus.verificationStatus !== 'not_found' && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          {emailStatus.verificationStatus === 'approved' && 'Your verification is approved. Redirecting...'}
                          {emailStatus.verificationStatus === 'pending' && 'Your verification is pending review. Redirecting...'}
                          {emailStatus.verificationStatus === 'cancelled' && 'Your verification was cancelled. Redirecting...'}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Fixed Button - Elevated from bottom with bigger height */}
      {!showEmailInput && (
        <div className="md:hidden fixed bottom-6 left-0 right-0 px-4 pb-8">
          <Button 
            onClick={() => setShowEmailInput(true)} 
            disabled={false}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-full py-4 text-base shadow-xl"
          >
            Start Verification
          </Button>
        </div>
      )}

      <Footer />
      <HelpModal 
        isOpen={showHelpModal} 
        onClose={() => setShowHelpModal(false)}
      />
    </div>
  )
}
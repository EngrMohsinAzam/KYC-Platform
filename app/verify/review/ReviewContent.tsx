'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Header } from '@/components/layout/Header'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useAppContext } from '@/context/useAppContext'
import { LoadingDots } from '@/components/ui/LoadingDots'
import { HelpModal } from '@/components/ui/HelpModal'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { getNetworkInfo, submitKYCVerification, checkBNBBalance } from '@/lib/web3'
import { submitKYCData } from '@/lib/api'
import { formatWalletAddress } from '@/lib/utils'
import { ethers } from 'ethers'
import { switchToBSCMainnet } from '@/lib/network-switch'
import { setMetaMaskProvider } from '@/lib/wagmi-config'
import { DetectedWallet, detectInstalledWallets } from '@/lib/wallet-detection'
import { isMobileDevice } from '@/lib/mobile-wallet'
import '@/lib/wagmi-config'

export default function ReviewContent() {
  const router = useRouter()
  const { state, dispatch } = useAppContext()
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [connectingWalletId, setConnectingWalletId] = useState<string | null>(null)
  const [networkError, setNetworkError] = useState<string | null>(null)
  const [walletError, setWalletError] = useState<string | null>(null)
  const [kycSubmitted, setKycSubmitted] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [submittingToBackend, setSubmittingToBackend] = useState(false)
  const [transactionHash, setTransactionHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [bnbBalance, setBnbBalance] = useState<string | null>(null)
  const [estimatedGasFee, setEstimatedGasFee] = useState<string>('0.0012 BNB')
  const [blockchainName, setBlockchainName] = useState<string>('Binance Chain')
  const [loadingTransactionData, setLoadingTransactionData] = useState(false)

  // Auto-reconnect wallet on page refresh
  useEffect(() => {
    const reconnectWallet = async () => {
      const lastWalletId = localStorage.getItem('lastConnectedWallet')
      const lastConnectorId = localStorage.getItem('lastConnectorId')
      
      if (lastWalletId && lastConnectorId && !isConnected) {
        try {
          const connector = connectors.find(c => c.id === lastConnectorId)
          if (connector) {
            console.log('🔄 Auto-reconnecting to wallet:', lastWalletId)
            await connect({ connector })
          }
        } catch (err) {
          console.log('⚠️ Auto-reconnect failed:', err)
          // Clear stored wallet if reconnect fails
          localStorage.removeItem('lastConnectedWallet')
          localStorage.removeItem('lastConnectorId')
        }
      }
    }

    reconnectWallet()
  }, [connectors, connect, isConnected])

  // Check if already submitted - but only if we have transaction hash
  // Also check if user just came from OTP (should always show wallet connection first)
  useEffect(() => {
    // Check if user just completed OTP verification (they should connect wallet now)
    const justFromOTP = sessionStorage.getItem('justCompletedOTP') === 'true'
    if (justFromOTP) {
      // Clear the OTP flag
      sessionStorage.removeItem('justCompletedOTP')
      // Clear any old submission flags to ensure fresh start
      localStorage.removeItem('kycSubmitted')
      localStorage.removeItem('kycTransactionHash')
      return // Always show wallet connection screen
    }

    // Only show under review if we have both the flag AND a transaction hash
    const kycJustSubmitted = localStorage.getItem('kycSubmitted') === 'true'
    const storedTxHash = localStorage.getItem('kycTransactionHash')
    if (kycJustSubmitted && storedTxHash) {
      setKycSubmitted(true)
      setTransactionHash(storedTxHash)
      return
    }
    // Clear the flag if there's no transaction hash (incomplete submission)
    if (kycJustSubmitted && !storedTxHash) {
      localStorage.removeItem('kycSubmitted')
    }
  }, [])

  // Update wallet address in context when connected
  useEffect(() => {
    if (isConnected && address) {
      dispatch({ type: 'SET_WALLET', payload: address })
    }
  }, [isConnected, address, dispatch])

  // Check network and balance when wallet is connected
  useEffect(() => {
    console.log('🔍 Wallet connection status changed:', { isConnected, address })
    if (isConnected && address) {
      console.log('✅ Wallet connected, checking network and balance...')
      checkNetworkAndBalance()
    } else {
      console.log('⚠️ Wallet not connected yet')
      // Reset data when wallet disconnects
      setBnbBalance(null)
      setEstimatedGasFee('0.0012 BNB')
      setBlockchainName('Binance Chain')
      setLoadingTransactionData(false)
    }
  }, [isConnected, address])

  const checkNetworkAndBalance = async () => {
    try {
      console.log('🌐 checkNetworkAndBalance called')
      setNetworkError(null)
      setLoadingTransactionData(true)
      
      console.log('🌐 Getting network info...')
      const networkInfo = await getNetworkInfo()
      console.log('🌐 Network info:', networkInfo)
      
      if (!networkInfo) {
        console.error('❌ Network not detected')
        setNetworkError('Unable to detect network. Please ensure your wallet is connected.')
        setLoadingTransactionData(false)
        return
      }
      if (!networkInfo.isCorrectNetwork) {
        console.error('❌ Wrong network:', networkInfo.name)
        setNetworkError(`Please switch to ${networkInfo.requiredNetworkName}`)
        setLoadingTransactionData(false)
        return
      }
      
      // Set blockchain name
      const blockchainNameValue = networkInfo.name || 'Binance Smart Chain'
      setBlockchainName(blockchainNameValue)
      console.log('✅ Blockchain name set to:', blockchainNameValue)
      
      // Check BNB balance
      if (address) {
        console.log('💰 Checking BNB balance for address:', address)
        try {
          const balance = await checkBNBBalance(address)
          setBnbBalance(balance)
          console.log('✅ BNB Balance:', balance)
        } catch (balanceError: any) {
          console.error('❌ Error checking balance:', balanceError)
          // Don't fail the whole process if balance check fails
        }
      }
      
      // Estimate gas fee for the transaction
      console.log('⛽ Estimating gas fee...')
      try {
        await estimateTransactionGas()
        console.log('✅ Gas fee estimated')
      } catch (gasError) {
        console.warn('⚠️ Could not estimate gas, using default:', gasError)
        // Keep default value
      }
      
      setLoadingTransactionData(false)
      console.log('✅ Network and balance check completed')
    } catch (err: any) {
      console.error('❌ Error checking network/balance:', err)
      setNetworkError(err.message || 'Error checking network')
      setLoadingTransactionData(false)
    }
  }

  const estimateTransactionGas = async () => {
    try {
      console.log('⛽ estimateTransactionGas called')
      if (!address || typeof window === 'undefined' || !(window as any).ethereum) {
        console.warn('⚠️ Cannot estimate gas - missing address or ethereum provider')
        return
      }
      
      console.log('⛽ Creating provider and getting fee data...')
      // Create provider from window.ethereum
      const provider = new ethers.BrowserProvider((window as any).ethereum)
      
      // Get current gas price
      const feeData = await provider.getFeeData()
      const gasPrice = feeData.gasPrice || BigInt(3000000000) // 3 gwei default
      console.log('⛽ Gas price:', gasPrice.toString())
      
      // Estimate gas limit for submitKYC transaction (approximate: 150000-200000)
      // This includes: approve (if needed) + submitKYC
      const estimatedGasLimit = BigInt(200000) // Conservative estimate
      console.log('⛽ Estimated gas limit:', estimatedGasLimit.toString())
      
      // Calculate total gas cost in BNB
      const gasCostWei = gasPrice * estimatedGasLimit
      const gasCostBNB = parseFloat(ethers.formatEther(gasCostWei))
      
      // Format to 4 decimal places
      const formattedGas = gasCostBNB.toFixed(4)
      const gasFeeString = `${formattedGas} BNB`
      setEstimatedGasFee(gasFeeString)
      console.log('✅ Gas fee estimated and set to:', gasFeeString)
    } catch (err) {
      console.error('❌ Error estimating gas:', err)
      // Keep default value
    }
  }

  const handleOpenWalletModal = async () => {
    // Directly connect to wallet without showing modal
    setError(null)
    setNetworkError(null)
    setWalletError(null)
    setConnecting(true)
    
    try {
      const isMobile = isMobileDevice()
      const wallets = detectInstalledWallets()
      
      // Prioritize MetaMask, then first installed wallet
      const metaMaskWallet = wallets.find(w => w.id === 'metamask' && w.isInstalled)
      const walletToConnect = metaMaskWallet || wallets.find(w => w.isInstalled) || wallets[0]
      
      if (walletToConnect) {
        // Directly call handleWalletSelect to connect without showing modal
        await handleWalletSelect(walletToConnect)
      } else {
        // If no wallet found, show error
        setError('No wallet found. Please install a wallet extension to continue.')
        setConnecting(false)
      }
    } catch (err: any) {
      console.error('Error connecting wallet:', err)
      setError(err.message || 'Failed to connect wallet. Please try again.')
      setConnecting(false)
    }
  }

  const handleWalletSelect = async (wallet: DetectedWallet) => {
    try {
      console.log('🔗 Connecting to wallet:', wallet.name)
      setConnecting(true)
      setConnectingWalletId(wallet.id)
      setError(null)
      setNetworkError(null)
      setWalletError(null)
      
      const isMobile = isMobileDevice()
      const win = window as any
      
      // For MetaMask, handle both desktop and mobile
      if (wallet.id === 'metamask') {
        console.log('🔍 MetaMask Connection:')
        console.log('  - Is Mobile:', isMobile)
        console.log('  - Has Provider:', !!wallet.provider)
        console.log('  - Provider isMetaMask:', wallet.provider?.isMetaMask)
        console.log('  - window.ethereum exists:', !!win.ethereum)
        console.log('  - window.ethereum.isMetaMask:', win.ethereum?.isMetaMask)
        
        // On mobile, if no provider detected in wallet object, check window.ethereum
        if (isMobile && !wallet.provider && win.ethereum) {
          console.log('📱 Mobile: Using window.ethereum as MetaMask provider')
          wallet.provider = win.ethereum
        }
        
        // PRIORITY 1: If we have a provider (detected wallet), connect directly
        if (wallet.provider) {
          console.log('✅ Wallet provider detected, connecting directly...')
          const originalEthereum = win.ethereum
          const originalProviders = win.ethereum?.providers
          const wasArray = Array.isArray(originalProviders)
          
          try {
            // Store MetaMask provider reference
            setMetaMaskProvider(wallet.provider)
            
            // Set MetaMask as PRIMARY provider and REMOVE providers array
            console.log('✅ Setting window.ethereum to MetaMask and removing providers array...')
            win.ethereum = wallet.provider
            // Remove providers array to prevent picking wrong wallet
            if (win.ethereum.providers) {
              delete win.ethereum.providers
            }
            if (originalEthereum?.providers) {
              delete originalEthereum.providers
            }
            
            // Wait to ensure changes are applied
            await new Promise(resolve => setTimeout(resolve, 100))
            
            // Find and use metaMask connector
            let metaMaskConnector = connectors.find(c => c.id === 'metaMask' || c.id === 'io.metamask')
            
            if (!metaMaskConnector) {
              console.log('⚠️ MetaMask connector not found, using injected connector')
              metaMaskConnector = connectors.find(c => c.id === 'injected')
            }
            
            if (!metaMaskConnector) {
              throw new Error('No suitable connector found for MetaMask')
            }
            
            console.log('✅ Using connector:', metaMaskConnector.id)
            
            // Connect
            await connect({ connector: metaMaskConnector })
            
            localStorage.setItem('lastConnectedWallet', wallet.id)
            localStorage.setItem('lastConnectorId', metaMaskConnector.id)
            
            // Ensure we're on BSC Mainnet
            try {
              console.log('🌐 Switching to BSC Mainnet...')
              await switchToBSCMainnet(wallet.provider)
              console.log('✅ Successfully switched to BSC Mainnet')
              // Wait a moment for network switch to propagate
              await new Promise(resolve => setTimeout(resolve, 1000))
            } catch (networkErr: any) {
              console.warn('⚠️ Network switch error (non-blocking):', networkErr)
              // On mobile, network switch errors are common - don't block connection
              // User can manually switch if needed
              if (networkErr?.code !== 4001) {
                setNetworkError(`Please switch to BSC Mainnet manually in your wallet.`)
              }
            }
            
            console.log('✅ MetaMask connected successfully!')
            setConnecting(false)
            setConnectingWalletId(null)
            return
          } catch (connectErr: any) {
            console.error('❌ Error connecting MetaMask:', connectErr)
            const errorMessage = connectErr?.message || connectErr?.toString() || ''
            
            if (connectErr?.code === 4001 || errorMessage.includes('rejected') || errorMessage.includes('denied')) {
              setWalletError('MetaMask connection was rejected. Please approve the connection in MetaMask.')
              setError('MetaMask connection was rejected. Please approve the connection in MetaMask.')
              setConnecting(false)
              setConnectingWalletId(null)
              return
            }
            
            // On mobile, if direct connection fails, try WalletConnect as fallback
            if (isMobile) {
              console.log('📱 Mobile: Direct connection failed, trying WalletConnect as fallback')
              try {
                const walletConnectConnector = connectors.find(c => c.id === 'walletConnect')
                if (walletConnectConnector) {
                  await connect({ connector: walletConnectConnector })
                  localStorage.setItem('lastConnectedWallet', wallet.id)
                  localStorage.setItem('lastConnectorId', 'walletConnect')
                  
                  // Try to switch network
                  try {
                    if (win.ethereum) {
                      await switchToBSCMainnet(win.ethereum)
                    }
                  } catch (networkErr) {
                    console.warn('⚠️ Network switch error (non-blocking):', networkErr)
                    setNetworkError('Please switch to BSC Mainnet manually in your wallet.')
                  }
                  
                  setConnecting(false)
                  setConnectingWalletId(null)
                  return
                }
              } catch (fallbackErr) {
                console.error('❌ WalletConnect fallback also failed:', fallbackErr)
              }
            }
            
            throw connectErr
          } finally {
            // Restore original ethereum provider structure
            win.ethereum = originalEthereum
            if (wasArray && originalProviders) {
              win.ethereum.providers = originalProviders
            }
            setMetaMaskProvider(null)
          }
        } else {
          // PRIORITY 2: No provider detected - try WalletConnect (for mobile wallets without provider)
          if (isMobile) {
            console.log('📱 Mobile: No provider detected, trying WalletConnect...')
            const walletConnectConnector = connectors.find(c => c.id === 'walletConnect')
            if (walletConnectConnector) {
              try {
                console.log('✅ Using WalletConnect for mobile MetaMask (QR code)')
                await connect({ connector: walletConnectConnector })
                localStorage.setItem('lastConnectedWallet', wallet.id)
                localStorage.setItem('lastConnectorId', 'walletConnect')
                
                // Try to switch network
                try {
                  if (win.ethereum) {
                    await switchToBSCMainnet(win.ethereum)
                  }
                } catch (networkErr) {
                  console.warn('⚠️ Network switch error (non-blocking):', networkErr)
                  setNetworkError('Please switch to BSC Mainnet manually in your wallet.')
                }
                
                console.log('✅ MetaMask connected via WalletConnect!')
                setConnecting(false)
                setConnectingWalletId(null)
                return
              } catch (wcErr: any) {
                console.error('❌ WalletConnect failed:', wcErr)
                const wcErrorMessage = wcErr?.message || wcErr?.toString() || ''
                if (wcErr?.code === 4001 || wcErrorMessage.includes('rejected') || wcErrorMessage.includes('denied')) {
                  setError('Wallet connection was rejected. Please try again.')
                  setConnecting(false)
                  setConnectingWalletId(null)
                  return
                }
                // Fall through to try injected connector
              }
            }
          }
          
          // PRIORITY 3: Fallback - try using injected connector
          console.log('⚠️ No MetaMask provider detected, trying injected connector')
          const injectedConnector = connectors.find(c => c.id === 'injected' || c.id === 'metaMask')
          if (injectedConnector) {
            try {
              await connect({ connector: injectedConnector })
              localStorage.setItem('lastConnectedWallet', wallet.id)
              localStorage.setItem('lastConnectorId', injectedConnector.id)
              
              // Try to switch network
              try {
                if (win.ethereum) {
                  await switchToBSCMainnet(win.ethereum)
                }
              } catch (networkErr) {
                console.warn('⚠️ Network switch error (non-blocking):', networkErr)
                setNetworkError('Please switch to BSC Mainnet manually in your wallet.')
              }
              
              setConnecting(false)
              setConnectingWalletId(null)
              return
            } catch (err: any) {
              console.error('❌ Injected connector failed:', err)
              if (isMobile) {
                // On mobile, suggest using WalletConnect or opening in wallet browser
                setError('Please scan the QR code with your mobile wallet app or open this page in MetaMask mobile browser.')
              } else {
                setError('MetaMask not found. Please install MetaMask extension.')
              }
              setConnecting(false)
              setConnectingWalletId(null)
              return
            }
          } else {
            if (isMobile) {
              setError('Please scan the QR code with your mobile wallet app or open this page in MetaMask mobile browser.')
            } else {
              setError('MetaMask not found. Please install MetaMask extension.')
            }
            setConnecting(false)
            setConnectingWalletId(null)
            return
          }
        }
      }
      
      // For Trust Wallet and Coinbase on mobile
      if ((wallet.id === 'trustwallet' || wallet.id === 'coinbase') && isMobile) {
        // If provider is detected, connect directly
        if (wallet.provider) {
          console.log(`✅ ${wallet.name} provider detected, connecting directly...`)
          // Will fall through to the general connection logic below
        } else {
          // No provider - try WalletConnect
          console.log(`📱 Mobile: No ${wallet.name} provider detected, trying WalletConnect...`)
          const walletConnectConnector = connectors.find(c => c.id === 'walletConnect')
          if (walletConnectConnector) {
            try {
              await connect({ connector: walletConnectConnector })
              localStorage.setItem('lastConnectedWallet', wallet.id)
              localStorage.setItem('lastConnectorId', 'walletConnect')
              
              // Try to switch network
              try {
                if (win.ethereum) {
                  await switchToBSCMainnet(win.ethereum)
                }
              } catch (networkErr) {
                console.warn('⚠️ Network switch error (non-blocking):', networkErr)
                setNetworkError('Please switch to BSC Mainnet manually in your wallet.')
              }
              
              console.log(`✅ ${wallet.name} connected via WalletConnect!`)
              setConnecting(false)
              setConnectingWalletId(null)
              return
            } catch (wcErr: any) {
              console.warn(`⚠️ WalletConnect failed for ${wallet.name}:`, wcErr)
              const wcErrorMessage = wcErr?.message || wcErr?.toString() || ''
              if (wcErr?.code === 4001 || wcErrorMessage.includes('rejected') || wcErrorMessage.includes('denied')) {
                setError(`${wallet.name} connection was rejected. Please try again.`)
                setConnecting(false)
                setConnectingWalletId(null)
                return
              }
              // Fall through to try direct connection
            }
          }
        }
      }
      
      // For Coinbase Wallet, use coinbaseWallet connector
      if (wallet.id === 'coinbase') {
        const coinbaseConnector = connectors.find(c => c.id === 'coinbaseWallet')
        if (coinbaseConnector) {
          console.log('✅ Using Coinbase Wallet connector')
          await connect({ connector: coinbaseConnector })
          
          localStorage.setItem('lastConnectedWallet', wallet.id)
          localStorage.setItem('lastConnectorId', 'coinbaseWallet')
          
          try {
            await switchToBSCMainnet(wallet.provider)
          } catch (networkErr) {
            console.warn('⚠️ Network switch error (non-blocking):', networkErr)
          }
          
          console.log('✅ Coinbase Wallet connected')
          setConnecting(false)
          setConnectingWalletId(null)
          return
        }
      }
      
      // For other wallets (Trust Wallet, Brave, Binance), use the provider directly
      // Request accounts from the specific provider, then sync with wagmi
      if (wallet.provider) {
        console.log('✅ Connecting to wallet provider directly:', wallet.name)
        
        try {
          // Request accounts from the specific provider
          const accounts = await wallet.provider.request({
            method: 'eth_requestAccounts'
          })
          
          if (!accounts || accounts.length === 0) {
            throw new Error('No accounts returned from wallet')
          }
          
          console.log('✅ Accounts received from', wallet.name, ':', accounts[0])
          
          // Now use injected connector to sync with wagmi
          // The injected connector should detect the connected account
          const injectedConnector = connectors.find(c => c.id === 'injected')
          if (injectedConnector) {
            // Try to connect - wagmi should detect the already-connected account
            try {
              await connect({ connector: injectedConnector })
            } catch (wagmiErr: any) {
              // If wagmi connection fails but we have accounts, that's okay
              // The account is already connected via the provider
              console.warn('⚠️ Wagmi sync warning (but wallet connected):', wagmiErr)
            }
            
            localStorage.setItem('lastConnectedWallet', wallet.id)
            localStorage.setItem('lastConnectorId', 'injected')
            
            try {
              await switchToBSCMainnet(wallet.provider)
            } catch (networkErr) {
              console.warn('⚠️ Network switch error (non-blocking):', networkErr)
            }
            
            console.log('✅ Wallet connected:', wallet.name)
            setConnecting(false)
            setConnectingWalletId(null)
            return
          }
        } catch (providerErr: any) {
          console.error('❌ Error connecting via provider:', providerErr)
          // Fall through to try connector approach
        }
      }
      
      // Fallback: try to find any suitable connector
      let connector = null
      if (wallet.connectorId) {
        connector = connectors.find(c => c.id === wallet.connectorId)
      }
      
      if (!connector) {
        connector = connectors.find(c => c.id === 'injected')
      }
      
      if (!connector) {
        throw new Error(`No suitable connector found for ${wallet.name}. Please ensure your wallet extension is installed.`)
      }

      console.log('✅ Using fallback connector:', connector.id)
      await connect({ connector })
      
      localStorage.setItem('lastConnectedWallet', wallet.id)
      localStorage.setItem('lastConnectorId', connector.id)
      
      try {
        await switchToBSCMainnet(wallet.provider)
      } catch (networkErr) {
        console.warn('⚠️ Network switch error (non-blocking):', networkErr)
      }
      
      console.log('✅ Wallet connected:', wallet.name)
      setConnecting(false)
      setConnectingWalletId(null)
    } catch (err: any) {
      console.error('❌ Error connecting wallet:', err)
      const errorMessage = err?.message || err?.toString() || ''
      
      if (err?.code === 4001 || errorMessage.includes('rejected') || errorMessage.includes('denied') || errorMessage.includes('User rejected')) {
        setError('Wallet connection was rejected. Please approve the connection in your wallet.')
      } else {
        setError(err.message || `Failed to connect ${wallet.name}. Please try again.`)
      }
      
      setConnecting(false)
      setConnectingWalletId(null)
    }
  }

  // Validate all required information before blockchain submission
  const validateKYCData = (): { isValid: boolean; missingFields: string[] } => {
    const missingFields: string[] = []

    // Check documents
    if (!state.documentImageFront) {
      missingFields.push('Front document image')
    }
    
    // Check if back document is needed (not needed for passport)
    const needsBackSide = state.selectedIdType !== 'passport'
    if (needsBackSide && !state.documentImageBack) {
      missingFields.push('Back document image')
    }
    
    if (!state.selfieImage) {
      missingFields.push('Selfie image')
    }

    // Check personal information
    if (!state.personalInfo) {
      missingFields.push('Personal information')
    } else {
      if (!state.personalInfo.firstName?.trim()) {
        missingFields.push('First name')
      }
      if (!state.personalInfo.lastName?.trim()) {
        missingFields.push('Last name')
      }
      if (!state.personalInfo.fatherName?.trim()) {
        missingFields.push("Father's name")
      }
      if (!state.personalInfo.idNumber?.trim()) {
        missingFields.push('ID number')
      }
      if (!state.personalInfo.email?.trim()) {
        missingFields.push('Email address')
      }
      if (!state.personalInfo.phone?.trim()) {
        missingFields.push('Phone number')
      }
    }

    // Check location information
    if (!state.selectedCountry) {
      missingFields.push('Country')
    }
    if (!state.selectedCity) {
      missingFields.push('City')
    }

    // Check ID type
    if (!state.selectedIdType) {
      missingFields.push('ID type')
    }

    // Check USA residence status
    if (state.isResidentUSA === undefined) {
      missingFields.push('USA residence status')
    }

    return {
      isValid: missingFields.length === 0,
      missingFields
    }
  }

  const handleSubmitKYC = async () => {
    console.log('🚀 handleSubmitKYC called')
    console.log('📊 Current state:', {
      isConnected,
      address,
      hasPersonalInfo: !!state.personalInfo,
      hasEmail: !!state.personalInfo?.email,
      idNumber: state.personalInfo?.idNumber || state.idNumber,
      estimatedGasFee,
      blockchainName
    })
    
    if (!isConnected || !address) {
      console.error('❌ Wallet not connected')
      setError('Please connect your wallet first')
      return
    }

    // CRITICAL: Comprehensive validation BEFORE blockchain submission
    console.log('✅ Validating ALL KYC data before blockchain submission...')
    const validation = validateKYCData()
    
    // Additional comprehensive validation for backend submission
    const missingFields: string[] = []
    const personalInfo = state.personalInfo
    
    // Check personal information
    if (!personalInfo) {
      missingFields.push('Personal information')
    } else {
      if (!personalInfo.firstName?.trim()) missingFields.push('First name')
      if (!personalInfo.lastName?.trim()) missingFields.push('Last name')
      if (!personalInfo.fatherName?.trim()) missingFields.push("Father's name")
      if (!personalInfo.idNumber?.trim()) missingFields.push('ID number')
      if (!personalInfo.email?.trim()) missingFields.push('Email address')
      if (!personalInfo.phone?.trim()) missingFields.push('Phone number')
    }
    
    // Check documents
    if (!state.documentImageFront) missingFields.push('Front document image')
    if (!state.selfieImage) missingFields.push('Selfie image')
    // Back document is optional for passport
    if (state.selectedIdType !== 'passport' && !state.documentImageBack) {
      missingFields.push('Back document image')
    }
    
    // Check location
    if (!state.selectedCountry) missingFields.push('Country')
    if (!state.selectedCity) missingFields.push('City')
    if (!state.selectedIdType) missingFields.push('ID type')
    if (state.isResidentUSA === undefined) missingFields.push('USA residence status')
    
    // Check wallet
    if (!address) missingFields.push('Blockchain wallet address')
    
    // Combine validation results
    const allMissingFields = [...validation.missingFields, ...missingFields.filter(f => !validation.missingFields.includes(f))]
    
    if (!validation.isValid || allMissingFields.length > 0) {
      console.error('❌ Validation failed. Missing fields:', allMissingFields)
      const missingList = allMissingFields.map((field, index) => `${index + 1}. ${field}`).join('\n')
      setError(`⚠️ Missing Information\n\nPlease complete the following BEFORE submitting to blockchain:\n\n${missingList}\n\nPlease go back and complete these fields.`)
      return
    }
    
    // Validate data format and completeness
    console.log('📋 Validating data completeness...')
    const fullName = `${personalInfo?.firstName || ''} ${personalInfo?.lastName || ''}`.trim()
    if (!fullName || fullName.length < 2) {
      setError('Full name is required and must be at least 2 characters. Please check first name and last name.')
      return
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(personalInfo?.email || '')) {
      setError('Please enter a valid email address.')
      return
    }
    
    // Validate phone format (at least 10 digits)
    const phoneDigits = (personalInfo?.phone || '').replace(/\D/g, '')
    if (phoneDigits.length < 10) {
      setError('Please enter a valid phone number (at least 10 digits).')
      return
    }
    
    // Validate images are base64 and not empty
    if (state.documentImageFront && (!state.documentImageFront.startsWith('data:image') || state.documentImageFront.length < 100)) {
      setError('Front document image is invalid. Please upload a valid image.')
      return
    }
    if (state.selfieImage && (!state.selfieImage.startsWith('data:image') || state.selfieImage.length < 100)) {
      setError('Selfie image is invalid. Please upload a valid image.')
      return
    }
    
    console.log('✅ All validation passed. Data is complete and ready for blockchain submission.')

    try {
      console.log('✅ Starting KYC submission process...')
      setError(null)
      setNetworkError(null)
      setProcessingPayment(true)
      console.log('⏳ Processing payment state set to true')

      // Check network
      const networkInfo = await getNetworkInfo()
      if (!networkInfo) {
        setError('Unable to detect network. Please ensure your wallet is connected.')
        setProcessingPayment(false)
        return
      }
      if (!networkInfo.isCorrectNetwork) {
        setError(`Please switch to ${networkInfo.requiredNetworkName}`)
        setProcessingPayment(false)
        return
      }

      // Check balance with timeout
      console.log('💰 Checking BNB balance...')
      let balance: string
      try {
        const balancePromise = checkBNBBalance(address)
        const timeoutPromise = new Promise<string>((_, reject) => {
          setTimeout(() => reject(new Error('Balance check timeout. Please check your network connection.')), 30000)
        })
        balance = await Promise.race([balancePromise, timeoutPromise])
        console.log('💰 BNB Balance:', balance)
      } catch (balanceError: any) {
        console.error('❌ Error checking balance:', balanceError)
        // If balance check fails, we'll still try to proceed (the contract will validate balance)
        console.warn('⚠️ Continuing despite balance check error - contract will validate balance')
        balance = '0' // Set default, contract will check actual balance
      }
      
      // Calculate actual required BNB amount dynamically (based on current BNB price for $2 USD + gas)
      console.log('💰 Calculating required BNB amount...')
      let requiredBNBAmount: number = 0.01 // Default fallback (conservative estimate)
      let requiredBNBFormatted: string = '0.01'
      try {
        const { calculateRequiredBNB } = await import('@/lib/web3')
        const { ethers } = await import('ethers')
        
        // Try to calculate from contract (requires wallet connection)
        // If this fails on mobile, we'll use a more conservative fallback
        const requiredBNBWei = await calculateRequiredBNB()
        const requiredBNBFormattedWei = ethers.formatEther(requiredBNBWei)
        requiredBNBAmount = parseFloat(requiredBNBFormattedWei)
        requiredBNBFormatted = requiredBNBFormattedWei
        
        // Add gas reserve (~0.001-0.002 BNB for gas fees)
        // Use higher gas reserve on mobile (0.003) as mobile transactions can be more expensive
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        const gasReserve = isMobile ? 0.003 : 0.002 // Higher reserve for mobile
        const totalRequired = requiredBNBAmount + gasReserve
        requiredBNBAmount = totalRequired
        requiredBNBFormatted = totalRequired.toFixed(8)
        
        console.log('💰 Required BNB calculation:')
        console.log('  - Fee amount ($2 USD):', requiredBNBFormattedWei, 'BNB')
        console.log('  - Gas reserve:', gasReserve, 'BNB', isMobile ? '(mobile)' : '(desktop)')
        console.log('  - Total required:', requiredBNBFormatted, 'BNB')
      } catch (calcError: any) {
        console.warn('⚠️ Could not calculate required BNB from contract, using conservative fallback:', calcError.message)
        // Use more conservative fallback for mobile if calculation fails
        // $2 USD at ~$600/BNB = ~0.0033 BNB, plus gas = ~0.005-0.006 BNB total
        // But we'll use 0.01 BNB as a safe fallback to ensure users have enough
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        if (isMobile) {
          // More conservative for mobile (0.01 BNB = ~$6 at $600/BNB, which is safe)
          requiredBNBAmount = 0.01
          requiredBNBFormatted = '0.01'
          console.log('  - Using mobile fallback: 0.01 BNB (safe estimate)')
        } else {
          // Desktop fallback
          requiredBNBAmount = 0.005
          requiredBNBFormatted = '0.005'
          console.log('  - Using desktop fallback: 0.005 BNB')
        }
      }
      
      // Check if user has sufficient balance
      const balanceNum = parseFloat(balance)
      if (balanceNum < requiredBNBAmount) {
        console.error('❌ Insufficient balance:', balance, 'BNB')
        console.error('  - Required:', requiredBNBFormatted, 'BNB')
        setError(
          `Insufficient BNB balance. You need at least ${requiredBNBFormatted} BNB ` +
          `(for $2 USD fee + gas). Current balance: ${balance} BNB. Please add more BNB to your wallet.`
        )
        setProcessingPayment(false)
        return
      }
      console.log('✅ Balance check passed')
      console.log('  - Balance:', balance, 'BNB')
      console.log('  - Required:', requiredBNBFormatted, 'BNB')
      console.log('  - Sufficient:', (balanceNum - requiredBNBAmount).toFixed(8), 'BNB remaining')

      // Generate anonymous ID from user data
      const personalInfo = state.personalInfo
      if (!personalInfo?.email) {
        setError('Personal information is missing. Please go back and complete the form.')
        setProcessingPayment(false)
        return
      }

      const anonymousId = `${personalInfo.email}-${Date.now()}`
      
      // CRITICAL: Verify network before transaction
      console.log('========================================')
      console.log('🌐 STEP 0: Verifying network connection...')
      console.log('========================================')
      try {
        const networkInfo = await getNetworkInfo()
        if (!networkInfo) {
          throw new Error('Could not detect network. Please ensure your wallet is connected.')
        }
        
        console.log('📋 Network Info:')
        console.log('  - Current Chain ID:', networkInfo.chainId)
        console.log('  - Network Name:', networkInfo.name)
        console.log('  - Is Correct Network:', networkInfo.isCorrectNetwork)
        console.log('  - Required Network:', networkInfo.requiredNetworkName)
        
        if (!networkInfo.isCorrectNetwork) {
          console.log('⚠️ Wrong network detected! Attempting to switch...')
          const { switchToBSCMainnet } = await import('@/lib/network-switch')
          const ethereum = (window as any).ethereum
          if (ethereum) {
            await switchToBSCMainnet(ethereum)
            // Wait for network switch
            await new Promise(resolve => setTimeout(resolve, 2000))
            
            // Verify switch was successful
            const newNetworkInfo = await getNetworkInfo()
            if (!newNetworkInfo?.isCorrectNetwork) {
              throw new Error('Failed to switch to BSC Mainnet. Please switch manually in your wallet to Binance Smart Chain (Chain ID: 56).')
            }
            console.log('✅ Successfully switched to BSC Mainnet')
          } else {
            throw new Error('Please switch to BSC Mainnet (Chain ID: 56) in your wallet.')
          }
        } else {
          console.log('✅ Network verification passed - connected to BSC Mainnet')
        }
      } catch (networkError: any) {
        console.error('❌ Network verification failed:', networkError)
        setError(networkError.message || 'Network error. Please ensure you are connected to BSC Mainnet.')
        setProcessingPayment(false)
        return
      }
      
      // Submit to smart contract (this will handle the $2 payment)
      console.log('========================================')
      console.log('🔗 STEP 1: Submitting KYC to smart contract...')
      console.log('========================================')
      console.log('Anonymous ID:', anonymousId)
      console.log('Wallet Address:', address)
      
      let txHash: string
      try {
        console.log('⏳ Calling submitKYCVerification...')
        console.log('⏳ IMPORTANT: Check your MetaMask wallet!')
        console.log('⏳ You will need to:')
        console.log('   1. Confirm the KYC submission transaction (BNB fee will be paid)')
        console.log('⏳ This may take a moment. Please wait...')
        
        // Add timeout protection (3 minutes max for mobile, 5 minutes for desktop)
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        const timeoutDuration = isMobile ? 180000 : 300000 // 3 min mobile, 5 min desktop
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(
            isMobile 
              ? 'Transaction timeout: Please check your MetaMask mobile app and confirm the transaction. If you already confirmed, wait a moment for it to process.'
              : 'Transaction timeout: The transaction is taking too long. Please check your wallet and try again.'
          )), timeoutDuration)
        })
        
        const txPromise = submitKYCVerification(anonymousId)
        console.log('⏳ Waiting for transaction...')
        if (isMobile) {
          console.log('📱 Mobile detected: Please check your MetaMask mobile app to confirm the transaction')
        } else {
          console.log('⏳ If MetaMask popup doesn\'t appear, check if it\'s blocked by your browser')
        }
        txHash = await Promise.race([txPromise, timeoutPromise]) as string
        
        setTransactionHash(txHash)
        console.log('✅ Transaction successful!')
        console.log('Transaction Hash:', txHash)
        console.log('========================================\n')
      } catch (txError: any) {
        console.error('❌ Transaction failed:', txError)
        
        // Provide more specific error messages (mobile-friendly)
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        let errorMessage = 'Transaction failed'
        if (txError.message?.includes('timeout')) {
          errorMessage = isMobile 
            ? 'Transaction timeout: Please check your MetaMask mobile app. If you already confirmed, wait a moment.'
            : txError.message
        } else if (txError.code === 4001 || 
                   txError.message?.includes('user rejected') || 
                   txError.message?.includes('User denied') ||
                   txError.message?.includes('canceled') ||
                   txError.message?.includes('rejected') ||
                   txError.message?.includes('Transaction was canceled')) {
          errorMessage = isMobile
            ? 'Transaction was canceled. You rejected the transaction in MetaMask mobile app. Please try again and tap "Confirm" when the transaction popup appears.'
            : 'Transaction was canceled. You rejected the transaction in your wallet. Please try again and click "Confirm" when MetaMask prompts you.'
        } else if (txError.message?.includes('insufficient funds') ||
                   txError.message?.includes('insufficient balance') ||
                   txError.message?.includes('Insufficient BNB')) {
          errorMessage = 'Insufficient BNB balance. You need enough BNB for the fee (~$2 USD) plus gas fees (~0.001-0.002 BNB). Please add more BNB to your wallet.'
        } else if (txError.message?.includes('network') || 
                   txError.message?.includes('chain') ||
                   txError.message?.includes('wrong network') ||
                   txError.message?.includes('Chain ID')) {
          errorMessage = 'Network error. Please ensure you are connected to BSC Mainnet (Chain ID: 56) in your wallet. The app will try to switch automatically.'
        } else if (txError.message?.includes('not found') || 
                   txError.message?.includes('BAD_DATA') ||
                   txError.message?.includes('contract')) {
          errorMessage = 'Contract error. Please ensure you are connected to BSC Mainnet (Chain ID: 56) and try again.'
        } else if (txError.message?.includes('execution reverted') || txError.reason) {
          errorMessage = `Transaction failed: ${txError.reason || txError.message}. Please check your balance and network connection.`
        } else if (txError.message) {
          errorMessage = `Transaction failed: ${txError.message}`
        }
        
        setError(errorMessage)
        setProcessingPayment(false)
        throw new Error(errorMessage)
      }

      // Now submit to backend
      console.log('========================================')
      console.log('📤 STEP 2: Submitting to backend API...')
      console.log('========================================')
      setProcessingPayment(false)
      setSubmittingToBackend(true)

      // Map frontend ID type to backend expected format
      const mapIdTypeToBackend = (frontendIdType: string): string => {
        const idTypeMap: Record<string, string> = {
          'national-id': 'CNIC',
          'passport': 'Passport',
          'drivers-license': 'License'
        }
        return idTypeMap[frontendIdType] || frontendIdType
      }

      // Prepare submission data - ensure no empty strings for required fields
      const fullName = `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim()
      if (!fullName) {
        throw new Error('Full name is required. Please ensure first name and last name are provided.')
      }
      
      if (!address || address.trim() === '') {
        throw new Error('Blockchain wallet address is required. Please connect your wallet.')
      }
      
      if (!personalInfo.email || personalInfo.email.trim() === '') {
        throw new Error('Email address is required.')
      }
      
      if (!personalInfo.phone || personalInfo.phone.trim() === '') {
        throw new Error('Phone number is required.')
      }
      
      if (!state.selectedCountry || state.selectedCountry.trim() === '') {
        throw new Error('Country is required.')
      }
      
      if (!state.selectedCity || state.selectedCity.trim() === '') {
        throw new Error('City is required.')
      }
      
      if (!state.selectedIdType || state.selectedIdType.trim() === '') {
        throw new Error('ID type is required.')
      }
      
      const submissionData = {
        userId: personalInfo.email.trim(),
        blockchainAddressId: address.trim(),
        fullName: fullName,
        firstName: personalInfo.firstName?.trim() || '',
        lastName: personalInfo.lastName?.trim() || '',
        fatherName: personalInfo.fatherName?.trim() || '',
        email: personalInfo.email.trim(),
        phone: personalInfo.phone.trim(),
        address: personalInfo.address?.trim() || '',
        countryName: state.selectedCountry.trim(),
        cityName: state.selectedCity.trim(),
        idType: mapIdTypeToBackend(state.selectedIdType.trim()),
        usaResidence: state.isResidentUSA ? 'yes' : 'no',
        identityDocumentFront: state.documentImageFront || '',
        identityDocumentBack: state.documentImageBack || '',
        liveInImage: state.selfieImage || '',
        cnic: personalInfo.idNumber?.trim() || '',
        transactionHash: txHash,
        feeUnit: 2,
      }

      // Validate required data before submitting
      console.log('📋 Preparing backend submission...')
      console.log('📋 Submission Data Check:', {
        hasEmail: !!submissionData.email,
        hasAddress: !!submissionData.blockchainAddressId,
        hasFullName: !!submissionData.fullName,
        hasFrontImage: !!submissionData.identityDocumentFront,
        hasBackImage: !!submissionData.identityDocumentBack,
        hasSelfie: !!submissionData.liveInImage,
        hasCountry: !!submissionData.countryName,
        hasCity: !!submissionData.cityName,
        hasIdType: !!submissionData.idType,
        hasTxHash: !!submissionData.transactionHash,
      })

      if (!submissionData.identityDocumentFront) {
        throw new Error('Front document image is missing')
      }
      if (!submissionData.liveInImage) {
        throw new Error('Selfie image is missing')
      }
      if (!submissionData.email) {
        throw new Error('Email is missing')
      }

      console.log('🚀 Calling submitKYCData API function...')
      console.log('📤 Submission data summary:', {
        userId: submissionData.userId,
        email: submissionData.email,
        blockchainAddressId: submissionData.blockchainAddressId,
        transactionHash: submissionData.transactionHash,
        frontImageLength: submissionData.identityDocumentFront?.length || 0,
        backImageLength: submissionData.identityDocumentBack?.length || 0,
        selfieImageLength: submissionData.liveInImage?.length || 0,
        country: submissionData.countryName,
        city: submissionData.cityName,
        idType: submissionData.idType,
      })

      // Call the API function
      let result
      try {
        console.log('📞 Making API call to submitKYCData...')
        result = await submitKYCData(submissionData)
        console.log('✅ submitKYCData function completed')
        console.log('📥 Backend API Response:', result)
      } catch (apiError: any) {
        console.error('❌ Error calling submitKYCData:', apiError)
        console.error('Error details:', {
          message: apiError.message,
          stack: apiError.stack,
          name: apiError.name,
        })
        throw new Error(`Backend API call failed: ${apiError.message || 'Unknown error'}`)
      }

      if (!result.success) {
        // Handle validation errors
        let errorMessage = result.message || 'Backend submission failed'
        
        // Check if it's a backend connection issue
        if ((result as any).isBackendIssue) {
          errorMessage = `⚠️ Backend Server Issue\n\n${errorMessage}\n\n` +
            `The backend server may be:\n` +
            `- Down or unreachable\n` +
            `- Not properly configured\n` +
            `- Experiencing validation errors\n\n` +
            `Please contact support or check the backend server status.`
          console.error('❌ Backend server issue detected')
        } else if (result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
          // If there are specific validation errors, show them
          const validationErrors = result.errors.map((err: any) => {
            if (typeof err === 'string') return err
            if (err.field && err.message) return `${err.field}: ${err.message}`
            return JSON.stringify(err)
          }).join('\n')
          errorMessage = `Validation failed:\n${validationErrors}`
        } else if (result.message?.includes('Validation failed')) {
          // Backend returned validation failed but no specific errors
          errorMessage = '⚠️ Validation Failed\n\n' +
            'The backend rejected the submission but did not specify which fields are missing.\n\n' +
            'Please verify all required fields are filled:\n' +
            '✓ Email address\n' +
            '✓ Full name (first + last)\n' +
            '✓ Phone number\n' +
            '✓ Country and city\n' +
            '✓ ID type\n' +
            '✓ Front document image\n' +
            '✓ Selfie image\n' +
            '✓ Blockchain wallet address\n\n' +
            'If all fields are filled, this may be a backend configuration issue.'
        }
        
        console.error('❌ Backend submission failed:', errorMessage)
        console.error('📋 Data that was sent:', {
          userId: submissionData.userId,
          email: submissionData.email,
          blockchainAddressId: submissionData.blockchainAddressId,
          fullName: submissionData.fullName,
          phone: submissionData.phone,
          countryName: submissionData.countryName,
          cityName: submissionData.cityName,
          idType: submissionData.idType,
          usaResidence: submissionData.usaResidence,
          hasFrontImage: !!submissionData.identityDocumentFront,
          hasBackImage: !!submissionData.identityDocumentBack,
          hasSelfie: !!submissionData.liveInImage,
          frontImageLength: submissionData.identityDocumentFront?.length || 0,
          selfieImageLength: submissionData.liveInImage?.length || 0,
          transactionHash: submissionData.transactionHash
        })
        setError(errorMessage)
        setSubmittingToBackend(false)
        throw new Error(errorMessage)
      }

      if (result.success) {
        // Store ID details in context
        const currentIdNumber = state.personalInfo?.idNumber || state.idNumber || '6278881828373231'
        dispatch({ 
          type: 'SET_ID_DETAILS', 
          payload: {
            idNumber: currentIdNumber,
            gasFee: state.estimatedGasFee || '0.0012 BNB',
            blockchain: state.blockchain || 'Binance Chain',
          }
        })
        
        // Mark as submitted and store transaction hash
        localStorage.setItem('kycSubmitted', 'true')
        localStorage.setItem('kycTransactionHash', txHash)
        
        // Clear KYC cache after successful submission
        const { clearKYCCache } = await import('@/lib/kyc-cache')
        const email = state.personalInfo?.email
        const userId = state.personalInfo?.email // Use email as userId
        await clearKYCCache(email, userId).catch((error) => {
          console.error('Failed to clear cache after submission:', error)
          // Don't fail the submission if cache clearing fails
        })
        console.log('✅ KYC cache cleared after successful submission')
        
        setKycSubmitted(true)
        setSubmittingToBackend(false)
      } else {
        setError(result.message || 'Failed to submit KYC data')
        setSubmittingToBackend(false)
      }
    } catch (err: any) {
      console.error('Error submitting KYC:', err)
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        stack: err.stack,
        name: err.name
      })
      
      // Show user-friendly error message
      const errorMessage = err.message || 'Failed to submit KYC. Please try again.'
      setError(errorMessage)
      setProcessingPayment(false)
      setSubmittingToBackend(false)
      
      // If it's a timeout or rejection, don't show as critical error
      if (err.message?.includes('timeout') || err.message?.includes('rejected')) {
        console.log('⚠️ Transaction was cancelled or timed out - user can retry')
      }
    }
  }

  // Show under review screen if submitted
  if (kycSubmitted) {
    return (
      <div className="min-h-screen h-screen bg-white flex flex-col overflow-hidden">
        <Header showClose />
        <ProgressBar currentStep={5} totalSteps={5} />
        <main className="flex-1 overflow-y-auto">
          <div className="min-h-full md:flex md:items-center md:justify-center md:py-8">
            <div className="md:hidden h-full flex flex-col px-4 pt-12 pb-32">
              <div className="flex-1 flex flex-col justify-center items-center text-center">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  Under Review
                </h1>
                <p className="text-gray-600 mb-2">
                  Your KYC verification has been submitted successfully!
                </p>
                <p className="text-sm text-gray-500">
                  Your application is now under review. You will be notified once the verification is complete.
                </p>
                {transactionHash && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Transaction Hash:</p>
                    <p className="text-xs font-mono text-gray-800 break-all">{transactionHash}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="hidden md:block w-full max-w-md px-4">
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 text-center">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Under Review
                </h1>
                <p className="text-gray-600 mb-4">
                  Your KYC verification has been submitted successfully!
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Your application is now under review. You will be notified once the verification is complete.
                </p>
                {transactionHash && (
                  <div className="p-4 bg-gray-50 rounded-lg mb-4">
                    <p className="text-xs text-gray-600 mb-1">Transaction Hash:</p>
                    <p className="text-xs font-mono text-gray-800 break-all">{transactionHash}</p>
                  </div>
                )}
                <p className="text-xs text-gray-500">Powered by Mira</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Get ID details from state
  const idNumber = state.personalInfo?.idNumber || state.idNumber || '6278881828373231'
  const displayGasFee = isConnected && !loadingTransactionData ? estimatedGasFee : (state.estimatedGasFee || '0.0012 BNB')
  const displayBlockchain = isConnected && !loadingTransactionData ? blockchainName : (state.blockchain || 'Binance Chain')
  const displayWalletAddress = isConnected && address ? address : ''

  return (
    <div className="min-h-screen h-screen bg-white md:bg-gray-50 flex flex-col overflow-hidden">
      <Header showBack showClose />
      <ProgressBar currentStep={5} totalSteps={5} />
      
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full md:flex md:items-center md:justify-center md:py-8">
          {/* Mobile Design */}
          <div className="md:hidden h-full flex flex-col px-4 pt-8 pb-32">
            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Get your decentralised ID
            </h1>
            
            {/* Subtitle */}
            <p className="text-sm text-gray-500 mb-6">
              Verified on the Mira-20 Blockchain
            </p>

            {/* Error Messages */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-sm text-red-600 whitespace-pre-line">{error}</div>
              </div>
            )}

            {networkError && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-600">{networkError}</p>
              </div>
            )}

            {/* Main Content */}
            <div className="mb-6">
              {/* Instructional Text */}
              <h2 className="text-base font-bold text-gray-900 mb-3">
                To create your decentralised ID, you need to blockstamp it.
              </h2>
              <p className="text-sm text-gray-700 mb-6 leading-relaxed">
                In accordance with local laws and regulations, identity verification is required to access your Lumira Coins once the claim process starts. With this system, you will have a decentralised passport, in which you are recognised in the System.
              </p>

              {/* ID Details Section - Always show */}
              <div className="bg-gray-100 rounded-lg p-4 mb-6 space-y-3">
              
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Estimated gas fee</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {isConnected && loadingTransactionData ? 'Calculating...' : displayGasFee}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Blockchain</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {displayBlockchain}
                  </span>
                </div>
              </div>

              {/* Help Link */}
              <div className="mb-6 text-center">
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    setShowHelpModal(true)
                  }}
                  className="text-sm text-blue-600 hover:underline cursor-pointer bg-transparent border-none p-0 font-normal"
                >
                  Need help? Click here
                </button>
              </div>

              {/* Wallet Connection Section */}
              <div className="bg-gray-100 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-700">Connected wallet</span>
                  {isConnected && (
                    <button
                      onClick={() => {
                        disconnect()
                        dispatch({ type: 'SET_WALLET', payload: '' })
                        localStorage.removeItem('lastConnectedWallet')
                        localStorage.removeItem('lastConnectorId')
                      }}
                      className="text-xs text-red-600 hover:text-red-700 font-medium underline"
                    >
                      Disconnect
                    </button>
                  )}
                </div>
                <span className={`text-sm font-mono ${isConnected ? 'text-gray-900 break-all' : 'text-gray-500'}`}>
                  {isConnected ? displayWalletAddress : 'None'}
                </span>
                {isConnected && bnbBalance && (
                  <p className="text-xs text-gray-600 mt-2">Balance: {bnbBalance} BNB</p>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Fixed Button */}
          {!isConnected ? (
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
              <Button
                onClick={handleOpenWalletModal}
                disabled={connecting}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-lg py-3 font-medium"
              >
                {connecting ? 'Connecting...' : 'Connect wallet'}
              </Button>
            </div>
          ) : (
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
              <Button
                onClick={handleSubmitKYC}
                disabled={processingPayment || submittingToBackend || !!networkError}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-lg py-3 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processingPayment ? (
                  <>
                    <LoadingDots size="sm" color="#ffffff" />
                    <span>Processing transaction</span>
                  </>
                ) : submittingToBackend ? (
                  <>
                    <LoadingDots size="sm" color="#ffffff" />
                    <span>Submitting</span>
                  </>
                ) : (
                  'Confirm blockstamp'
                )}
              </Button>
            </div>
          )}

          {/* Desktop Design */}
          <div className="hidden md:block w-full max-w-md px-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
              {/* Title */}
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Get your decentralised ID
              </h1>
              
              {/* Subtitle */}
              <p className="text-sm text-gray-500 mb-6">
                Verified on the Mira-20 Blockchain
              </p>

              {/* Error Messages */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-sm text-red-600 whitespace-pre-line">{error}</div>
                </div>
              )}

              {networkError && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-600">{networkError}</p>
                </div>
              )}

              {/* Main Content */}
              <div className="mb-6">
                {/* Instructional Text */}
                <h2 className="text-base font-bold text-gray-900 mb-3">
                  To create your decentralised ID, you need to blockstamp it.
                </h2>
                <p className="text-sm text-gray-700 mb-6 leading-relaxed">
                  In accordance with local laws and regulations, identity verification is required to access your Lumira Coins once the claim process starts. With this system, you will have a decentralised passport, in which you are recognised in the System.
                </p>

                {/* ID Details Section - Always show */}
                <div className="bg-gray-100 rounded-lg p-4 mb-6 space-y-3">
                  {/* <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">ID Number</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {idNumber}
                    </span>
                  </div> */}
                  <div className="flex justify-between items-center">
  <span className="text-sm text-gray-700">Estimated gas fee</span>
  <span className="text-sm font-semibold text-gray-900">
    0.05 USD
  </span>
</div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Blockchain</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {displayBlockchain}
                    </span>
                  </div>
                </div>

                {/* Help Link */}
                <div className="mb-6 text-center">
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      setShowHelpModal(true)
                    }}
                    className="text-sm text-blue-600 hover:underline cursor-pointer bg-transparent border-none p-0 font-normal"
                  >
                    Need help? Click here
                  </button>
                </div>

                {/* Wallet Connection Section */}
                <div className="bg-gray-100 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-700">Connected wallet</span>
                    {isConnected && (
                      <button
                        onClick={() => {
                          disconnect()
                          dispatch({ type: 'SET_WALLET', payload: '' })
                          localStorage.removeItem('lastConnectedWallet')
                          localStorage.removeItem('lastConnectorId')
                        }}
                        className="text-xs text-red-600 hover:text-red-700 font-medium underline"
                      >
                        Disconnect
                      </button>
                    )}
                  </div>
                  <span className={`text-sm font-mono ${isConnected ? 'text-gray-900 break-all' : 'text-gray-500'}`}>
                    {isConnected ? displayWalletAddress : 'None'}
                  </span>
                  {isConnected && bnbBalance && (
                    <p className="text-xs text-gray-600 mt-2">Balance: {bnbBalance} BNB</p>
                  )}
                </div>
              </div>

              {/* Action Button */}
              {!isConnected ? (
                <Button
                  onClick={handleOpenWalletModal}
                  disabled={connecting}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-lg py-3 font-medium"
                >
                  {connecting ? 'Connecting' : 'Connect wallet'}
                </Button>
              ) : (
                <Button
                  onClick={handleSubmitKYC}
                  disabled={processingPayment || submittingToBackend || !!networkError}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-lg py-3 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processingPayment ? (
                    <>
                      <LoadingDots size="sm" color="#ffffff" />
                      <span>Processing transaction</span>
                    </>
                  ) : submittingToBackend ? (
                    <>
                      <LoadingDots size="sm" color="#ffffff" />
                      <span>Submitting</span>
                    </>
                  ) : (
                    'Confirm blockstamp'
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Help Modal */}
      <HelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
      
    </div>
  )
}



import { ethers } from 'ethers'
import { CONTRACT_ADDRESSES, KYC_ABI, CHARGE_AMOUNT_USD } from './contracts'
import { getWalletClient, getPublicClient } from '@wagmi/core'
import { wagmiConfig } from './wagmi-config'
import { createPublicClient, http as viemHttp } from 'viem'
import { bsc } from 'viem/chains'

export function isMetaMaskInstalled(): boolean {
  if (typeof window === 'undefined') return false
  
  const win = window as any
  
  // Check if ethereum provider exists
  if (!win.ethereum) {
    // On mobile, ethereum might not be available until MetaMask app is opened
    // Check if we're on mobile - if so, assume MetaMask mobile app might be available
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    if (isMobile) {
      // On mobile, return true to allow deep link flow
      return true
    }
    return false
  }
  
  // Check if it's MetaMask (desktop extension)
  if (win.ethereum.isMetaMask) return true
  
  // Check providers array (multiple wallets installed)
  if (Array.isArray(win.ethereum.providers)) {
    return win.ethereum.providers.some((p: any) => p.isMetaMask)
  }
  
  // If ethereum exists but no isMetaMask flag, assume it might be MetaMask
  // This handles cases where the flag might not be set (especially on mobile)
  return true
}

let connectionInProgress = false

export async function connectWallet(): Promise<string> {
  const isMobile = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  
  if (!isMetaMaskInstalled()) {
    if (isMobile) {
      throw new Error('MetaMask app is not available. Please install MetaMask app to continue.')
    } else {
      throw new Error('MetaMask is not installed. Please install MetaMask extension to continue.')
    }
  }

  if (connectionInProgress) {
    console.warn('⚠️ Wallet connection already in progress, waiting...')
    await new Promise(resolve => setTimeout(resolve, 500))
    try {
      const accounts = await (window as any).ethereum.request({
        method: 'eth_accounts'
      })
      if (accounts && accounts.length > 0) {
        return accounts[0]
      }
    } catch (err) {
    }
  }

  connectionInProgress = true

  try {
    console.log('🔗 Connecting to MetaMask...')
    
    try {
      const permissions = await (window as any).ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{
          eth_accounts: {}
        }]
      })
      console.log('✅ Permissions granted:', permissions)
    } catch (permError: any) {
      if (permError.code === -32002) {
        console.warn('⚠️ Permission request already pending, using eth_requestAccounts instead')
        const accounts = await (window as any).ethereum.request({
          method: 'eth_requestAccounts'
        })
        if (accounts && accounts.length > 0) {
          connectionInProgress = false
          return accounts[0]
        }
      } else if (permError.code === 4001) {
        connectionInProgress = false
        throw new Error('Connection was rejected. Please approve the connection request in MetaMask.')
      } else {
        throw permError
      }
    }

    const accounts = await (window as any).ethereum.request({
      method: 'eth_accounts'
    })
    
    if (!accounts || accounts.length === 0) {
      connectionInProgress = false
      throw new Error('No accounts found. Please unlock MetaMask and try again.')
    }

    const account = accounts[0]
    if (!account) {
      connectionInProgress = false
      throw new Error('No account returned from MetaMask. Please try again.')
    }

    console.log('✅ Wallet connected:', account)
    connectionInProgress = false
    return account
  } catch (error: any) {
    connectionInProgress = false
    if (error.code === 4001) {
      throw new Error('Connection was rejected. Please approve the connection request in MetaMask.')
    }
    throw error
  }
}

export async function connectWalletAlternative(): Promise<string> {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed. Please install MetaMask to continue.')
  }

  try {
    const accounts = await (window as any).ethereum.request({
      method: 'eth_requestAccounts'
    })
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found. Please unlock MetaMask and try again.')
    }

    const account = accounts[0]
    if (!account) {
      throw new Error('No account returned from MetaMask. Please try again.')
    }

    return account
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('Connection was rejected. Please approve the connection request in MetaMask.')
    }
    throw error
  }
}

export async function getProviderAndSigner() {
  try {
    // Try to get wallet client from wagmi (works with WalletConnect)
    const walletClient = await getWalletClient(wagmiConfig)
    
    if (!walletClient) {
      // Fallback to window.ethereum if available (for browser extensions)
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const provider = new ethers.BrowserProvider((window as any).ethereum)
        const signer = await provider.getSigner()
        return { provider, signer }
      }
      throw new Error('No wallet connected. Please connect your wallet first.')
    }

    // Get public client for read operations
    const publicClient = getPublicClient(wagmiConfig) || createPublicClient({
      chain: bsc,
      transport: viemHttp('https://bsc-dataseed.binance.org/')
    })

    // Create ethers provider from public client's RPC URL
    const rpcUrl = 'https://bsc-dataseed.binance.org/'
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    
    // Create a custom signer that uses the wallet client for transactions
    class WalletConnectSigner extends ethers.AbstractSigner {
      constructor(provider: ethers.Provider, private walletClient: any, private publicClient: any) {
        super(provider)
      }

      async getAddress(): Promise<string> {
        return this.walletClient.account.address
      }

      async signMessage(message: string | Uint8Array): Promise<string> {
        const msg = typeof message === 'string' ? message : ethers.toUtf8String(message)
        const signature = await this.walletClient.signMessage({
          message: msg,
          account: this.walletClient.account
        })
        return signature
      }

      async signTypedData(domain: ethers.TypedDataDomain, types: Record<string, ethers.TypedDataField[]>, value: Record<string, any>): Promise<string> {
        const signature = await this.walletClient.signTypedData({
          domain,
          types,
          primaryType: Object.keys(types)[0],
          message: value,
          account: this.walletClient.account
        })
        return signature
      }

      async signTransaction(tx: ethers.TransactionRequest): Promise<string> {
        const hash = await this.walletClient.sendTransaction({
          to: tx.to as `0x${string}`,
          value: tx.value ? BigInt(tx.value.toString()) : 0n,
          data: tx.data as `0x${string}` | undefined,
          account: this.walletClient.account
        })
        return hash
      }

      async sendTransaction(tx: ethers.TransactionRequest): Promise<ethers.TransactionResponse> {
        const hash = await this.walletClient.sendTransaction({
          to: tx.to as `0x${string}`,
          value: tx.value ? BigInt(tx.value.toString()) : 0n,
          data: tx.data as `0x${string}` | undefined,
          account: this.walletClient.account
        })
        
        return {
          hash,
          to: tx.to || null,
          from: this.walletClient.account.address,
          nonce: 0,
          gasLimit: tx.gasLimit || 0n,
          gasPrice: tx.gasPrice || null,
          data: tx.data || '0x',
          value: tx.value || 0n,
          chainId: tx.chainId || 56n,
          wait: async (confirmations?: number) => {
            const receipt = await this.publicClient.waitForTransactionReceipt({ hash, confirmations })
            return {
              ...receipt,
              blockNumber: receipt.blockNumber,
              blockHash: receipt.blockHash,
              transactionIndex: receipt.transactionIndex,
              confirmations: confirmations || 1,
              status: receipt.status === 'success' ? 1 : 0,
              type: 2,
              to: receipt.to,
              from: receipt.from,
              contractAddress: receipt.contractAddress || null,
              logs: receipt.logs || [],
              logsBloom: '0x',
              gasUsed: receipt.gasUsed,
              effectiveGasPrice: receipt.gasUsed,
              cumulativeGasUsed: receipt.gasUsed
            } as ethers.TransactionReceipt
          }
        } as ethers.TransactionResponse
      }

      connect(provider: ethers.Provider | null): ethers.Signer {
        return new WalletConnectSigner(provider || this.provider!, this.walletClient, this.publicClient)
      }

      async getNonce(blockTag?: ethers.BlockTag): Promise<number> {
        return await this.provider!.getTransactionCount(await this.getAddress(), blockTag)
      }

      async populateCall(tx: ethers.TransactionRequest): Promise<ethers.TransactionLike<string>> {
        const resolved = await ethers.resolveProperties(tx)
        let to: string | null = null
        if (resolved.to) {
          to = typeof resolved.to === 'string' ? resolved.to : await resolved.to.getAddress()
        }
        
        let from: string = await this.getAddress()
        if (resolved.from) {
          from = typeof resolved.from === 'string' ? resolved.from : await resolved.from.getAddress()
        }
        
        const nonce = resolved.nonce ?? await this.getNonce()
        const gasLimit = resolved.gasLimit ?? await this.provider!.estimateGas(resolved)
        const network = await this.provider!.getNetwork()
        
        return {
          to,
          from,
          nonce,
          gasLimit,
          gasPrice: resolved.gasPrice ?? null,
          data: resolved.data || '0x',
          value: resolved.value || 0n,
          chainId: resolved.chainId ?? network.chainId
        }
      }

      async populateTransaction(tx: ethers.TransactionRequest): Promise<ethers.TransactionLike<string>> {
        return await this.populateCall(tx)
      }

      async estimateGas(tx: ethers.TransactionRequest): Promise<bigint> {
        return await this.provider!.estimateGas(tx)
      }

      async call(tx: ethers.TransactionRequest): Promise<string> {
        return await this.provider!.call(tx)
      }

      async resolveName(name: string): Promise<string | null> {
        return await this.provider!.resolveName(name)
      }
    }

    const customSigner = new WalletConnectSigner(provider, walletClient, publicClient)

    return { provider, signer: customSigner }
  } catch (error: any) {
    // Fallback to window.ethereum if available
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const provider = new ethers.BrowserProvider((window as any).ethereum)
      const signer = await provider.getSigner()
      return { provider, signer }
    }
    throw new Error(`Failed to get provider: ${error.message || 'No wallet connected. Please connect your wallet first.'}`)
  }
}

export async function getKYCContract() {
  const { signer } = await getProviderAndSigner()
  return new ethers.Contract(CONTRACT_ADDRESSES.KYC, KYC_ABI, signer)
}

export async function checkContractExists(address: string): Promise<boolean> {
  try {
    const { provider } = await getProviderAndSigner()
    const code = await provider.getCode(address)
    return code !== '0x' && code !== null
  } catch (error) {
    return false
  }
}

// Helper function to detect mobile devices
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// Get BNB balance for an address
export async function checkBNBBalance(address: string): Promise<string> {
  try {
    const { provider } = await getProviderAndSigner()
    const balance = await provider.getBalance(address)
    return ethers.formatEther(balance)
  } catch (error: any) {
    throw error
  }
}

// Calculate required BNB amount from contract (for $2 USD fee)
export async function calculateRequiredBNB(): Promise<bigint> {
  try {
    // Try to get provider - this might fail on mobile if wallet not connected
    let provider: ethers.Provider
    try {
      const providerAndSigner = await getProviderAndSigner()
      provider = providerAndSigner.provider
    } catch (providerError: any) {
      // If provider fails (wallet not connected), try to create a public provider
      console.warn('⚠️ Could not get wallet provider, using public RPC:', providerError.message)
      provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/')
    }
    
    const kycContract = new ethers.Contract(CONTRACT_ADDRESSES.KYC, KYC_ABI, provider)
    const requiredBNB = await kycContract.calculateBNBAmount()
    return requiredBNB
  } catch (error: any) {
    console.error('Error calculating required BNB:', error)
    // Don't throw - let the caller handle with fallback
    throw error
  }
}

// Continue with rest of the file (checkKYCStatus, getKYCStatusFromContract, submitKYCVerification, etc.)
// The rest remains the same...

export async function checkKYCStatus(userAddress: string): Promise<{ isVerified: boolean; hasSubmitted: boolean }> {
  try {
    const { provider } = await getProviderAndSigner()
    const kycContract = new ethers.Contract(CONTRACT_ADDRESSES.KYC, KYC_ABI, provider)
    
    let hasSubmitted = false
    let isVerified = false
    
    try {
      hasSubmitted = await kycContract.hasSubmitted(userAddress)
      
      if (hasSubmitted) {
        try {
          const record = await kycContract.getKYCRecord(userAddress)
          isVerified = record && record.submissionId && record.submissionId > 0
        } catch (err) {
          console.warn('Could not get KYC record:', err)
        }
      }
    } catch (err: any) {
      console.warn('Could not check submission status:', err.message)
      hasSubmitted = false
    }
    
    return { isVerified, hasSubmitted }
  } catch (error: any) {
    console.error('Error checking KYC status:', error)
    return { isVerified: false, hasSubmitted: false }
  }
}

export async function getKYCStatusFromContract(userAddress: string): Promise<{
  hasApplied: boolean
  status: 'not_applied' | 'pending' | 'approved' | 'cancelled'
  submissionId?: number
  record?: any
}> {
  console.log('========================================')
  console.log('🔍 CHECKING KYC STATUS FROM SMART CONTRACT')
  console.log('========================================')
  console.log('📋 Contract Details:')
  console.log('  - KYC Contract Address:', CONTRACT_ADDRESSES.KYC)
  console.log('  - User Wallet Address:', userAddress)
  
  try {
    if (!isMetaMaskInstalled()) {
      console.log('❌ MetaMask not installed')
      return { hasApplied: false, status: 'not_applied' }
    }

    const { provider } = await getProviderAndSigner()
    const kycContract = new ethers.Contract(CONTRACT_ADDRESSES.KYC, KYC_ABI, provider)
    
    try {
      console.log('\n🔍 Step 1: Checking if user has submitted...')
      const hasSubmitted = await kycContract.hasSubmitted(userAddress)
      console.log('  - hasSubmitted:', hasSubmitted)
      
      if (!hasSubmitted) {
        console.log('❌ User has NOT submitted KYC')
        console.log('  Status: NOT_APPLIED')
        console.log('========================================\n')
        return { hasApplied: false, status: 'not_applied' }
      }

      console.log('✅ User HAS submitted KYC')
      console.log('\n🔍 Step 2: Getting KYC record from contract...')
      const record = await kycContract.getKYCRecord(userAddress)
      console.log('📋 KYC Record Retrieved:')
      console.log('  - submissionId:', record.submissionId?.toString() || '0')
      
      const submissionId = record.submissionId ? Number(record.submissionId) : 0
      console.log('\n🔍 Step 3: Determining approval status...')
      console.log('  - submissionId (number):', submissionId)
      
      if (submissionId > 0) {
        console.log('✅ KYC IS APPROVED!')
        console.log('========================================\n')
        return {
          hasApplied: true,
          status: 'approved',
          submissionId,
          record
        }
      } else {
        console.log('⏳ KYC IS PENDING')
        console.log('========================================\n')
        return {
          hasApplied: true,
          status: 'pending',
          submissionId: 0,
          record
        }
      }
    } catch (err: any) {
      console.error('❌ Error checking contract status:', err.message)
      console.log('========================================\n')
      return { hasApplied: false, status: 'not_applied' }
    }
  } catch (error: any) {
    console.error('❌ Error getting KYC status from contract:', error)
    console.log('========================================\n')
    return { hasApplied: false, status: 'not_applied' }
  }
}

// Verify network and switch if needed
async function verifyAndSwitchNetwork(): Promise<void> {
  if (typeof window === 'undefined') return
  
  const ethereum = (window as any).ethereum
  if (!ethereum) return

  try {
    const chainId = await ethereum.request({ method: 'eth_chainId' })
    const chainIdDecimal = parseInt(chainId, 16).toString()
    
    if (chainIdDecimal !== '56') {
      console.log('⚠️ Wrong network detected. Current:', chainIdDecimal, 'Required: 56')
      console.log('🔄 Attempting to switch to BSC Mainnet...')
      
      const { switchToBSCMainnet } = await import('@/lib/network-switch')
      await switchToBSCMainnet(ethereum)
      
      // Wait for network switch to complete
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Verify switch was successful
      const newChainId = await ethereum.request({ method: 'eth_chainId' })
      const newChainIdDecimal = parseInt(newChainId, 16).toString()
      
      if (newChainIdDecimal !== '56') {
        throw new Error('Failed to switch to BSC Mainnet. Please switch manually in your wallet.')
      }
      
      console.log('✅ Successfully switched to BSC Mainnet')
    } else {
      console.log('✅ Already on BSC Mainnet (Chain ID: 56)')
    }
  } catch (error: any) {
    console.error('❌ Network verification failed:', error)
    throw new Error(`Network error: ${error.message || 'Please ensure you are on BSC Mainnet (Chain ID: 56)'}`)
  }
}

// ✅ Submit KYC with BNB payment (contract fetches price from Chainlink)
export async function submitKYCVerification(anonymousId: string, metadataUrl: string = ''): Promise<string> {
  try {
    console.log('========================================')
    console.log('🔗 SUBMITTING TO SMART CONTRACT')
    console.log('========================================')
    
    // CRITICAL: Verify network BEFORE anything else
    console.log('\n🌐 Step 0: Verifying network connection...')
    await verifyAndSwitchNetwork()
    
    const kycContract = await getKYCContract()
    const { signer, provider } = await getProviderAndSigner()
    const userAddress = await signer.getAddress()

    console.log('📋 Smart Contract Details:')
    console.log('  - KYC Contract Address:', CONTRACT_ADDRESSES.KYC)
    console.log('  - User Wallet Address:', userAddress)
    console.log('  - Anonymous ID:', anonymousId)
    console.log('  - Fee Amount: $2 USD (paid in BNB)')

    const combinedDataHash = ethers.id(anonymousId)
    console.log('  - Combined Data Hash:', combinedDataHash)

    // Calculate required BNB amount from contract (for $2 USD)
    console.log('\n💰 Calculating required BNB amount...')
    const requiredBNB = await calculateRequiredBNB()
    const requiredBNBFormatted = ethers.formatEther(requiredBNB)
    console.log('  - Required BNB Amount:', requiredBNBFormatted, 'BNB')
    console.log('  - Required BNB (wei):', requiredBNB.toString())

    // Check BNB balance
    const bnbBalance = await provider.getBalance(userAddress)
    const bnbBalanceFormatted = ethers.formatEther(bnbBalance)
    console.log('  - Current BNB Balance:', bnbBalanceFormatted, 'BNB')
    
    // Reserve some BNB for gas (estimate 0.001 BNB for gas)
    const gasReserve = ethers.parseEther('0.001')
    const totalRequired = requiredBNB + gasReserve
    
    if (bnbBalance < totalRequired) {
      throw new Error(
        `Insufficient BNB balance. You need at least ${ethers.formatEther(totalRequired)} BNB ` +
        `(${requiredBNBFormatted} BNB for fee + ~0.001 BNB for gas). ` +
        `Current balance: ${bnbBalanceFormatted} BNB. Please add more BNB to your wallet.`
      )
    }
    console.log('✅ BNB balance check passed')

    console.log('\n🔍 Checking Contract Status...')
    try {
      const isPaused = await kycContract.paused()
      console.log('  - Contract Paused:', isPaused)
      if (isPaused) {
        throw new Error('KYC contract is currently paused. Please try again later.')
      }
    } catch (err: any) {
      if (!err.message.includes('paused')) {
        console.warn('Could not check pause status:', err)
      } else {
        throw err
      }
    }

    // Note: Contract now allows multiple submissions (resubmissions)
    // Removed the check that prevented resubmission - users can submit KYC multiple times
    console.log('\n✅ Multiple submissions allowed - proceeding with submission...')

    // Store balance for after-check
    const balanceBefore = bnbBalance

    console.log('\n📤 Submitting KYC to Smart Contract...')
    const metadataUrlToUse = metadataUrl || `https://kyx-platform.com/kyc/${userAddress}`
    
    // Gas estimation with retry logic and mobile-specific handling
    const isMobileSubmit = isMobileDevice()
    let gasLimit: bigint = BigInt(isMobileSubmit ? 400000 : 350000)
    let gasPrice: bigint | null = null
    let maxFeePerGas: bigint | null = null
    let maxPriorityFeePerGas: bigint | null = null
    let estimationSuccess = false
    let attempts = 0
    const maxAttempts = isMobileSubmit ? 2 : 3 // Fewer attempts on mobile (faster)
    
    console.log(`\n⛽ Estimating gas (${isMobileSubmit ? 'Mobile' : 'Desktop'} device)...`)
    
    while (attempts < maxAttempts && !estimationSuccess) {
      try {
        const feeData = await provider.getFeeData()
        
        // BSC uses legacy gasPrice, but check if EIP-1559 fields are available
        if (feeData.gasPrice) {
          // Use legacy gasPrice (BSC mainnet uses this)
          gasPrice = feeData.gasPrice
          // Add 20% buffer to gas price to ensure transaction goes through
          gasPrice = (gasPrice * BigInt(120)) / BigInt(100)
          console.log(`  - Attempt ${attempts + 1}/${maxAttempts}: Gas Price: ${ethers.formatUnits(gasPrice, 'gwei')} gwei (with 20% buffer)`)
        } else if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
          // EIP-1559 transaction
          maxFeePerGas = feeData.maxFeePerGas
          maxPriorityFeePerGas = feeData.maxPriorityFeePerGas
          // Add 20% buffer
          maxFeePerGas = (maxFeePerGas * BigInt(120)) / BigInt(100)
          maxPriorityFeePerGas = (maxPriorityFeePerGas * BigInt(120)) / BigInt(100)
          console.log(`  - Attempt ${attempts + 1}/${maxAttempts}: Max Fee Per Gas: ${ethers.formatUnits(maxFeePerGas, 'gwei')} gwei`)
        } else {
          // Fallback to default BSC gas price (3 gwei minimum, use 5 gwei for safety)
          gasPrice = BigInt(5000000000) // 5 gwei
          console.log(`  - Attempt ${attempts + 1}/${maxAttempts}: Using fallback Gas Price: ${ethers.formatUnits(gasPrice, 'gwei')} gwei`)
        }
        
        // Estimate gas for payable function (with value)
        // Add timeout for mobile (gas estimation can be slow)
        const estimatePromise = kycContract.submitKYC.estimateGas(combinedDataHash, metadataUrlToUse, {
          value: requiredBNB
        })
        const timeoutPromise = new Promise<bigint>((_, reject) => {
          setTimeout(() => reject(new Error('Gas estimation timeout')), isMobileSubmit ? 10000 : 15000)
        })
        
        const estimatedGas = await Promise.race([estimatePromise, timeoutPromise])
        console.log(`  - Estimated Gas Limit (raw): ${estimatedGas.toString()}`)
        
        // Use higher buffer for mobile (50%) vs desktop (30%)
        const buffer = isMobileSubmit ? 150 : 130
        gasLimit = (estimatedGas * BigInt(buffer)) / BigInt(100)
        console.log(`  - Gas Limit (with ${buffer}% buffer): ${gasLimit.toString()}`)
        
        estimationSuccess = true
        console.log('✅ Gas estimation successful!')
      } catch (gasError: any) {
        attempts++
        const isTimeout = gasError.message?.includes('timeout')
        console.warn(`  ⚠️ Gas estimation attempt ${attempts} failed:`, isTimeout ? 'Timeout' : gasError.message)
        
        if (attempts < maxAttempts && !isTimeout) {
          const delay = isMobileSubmit ? 500 : 1000 // Faster retry on mobile
          console.log(`  ⏳ Retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        } else if (isTimeout && attempts < maxAttempts) {
          // For timeout, wait a bit longer before retry
          console.log(`  ⏳ Gas estimation timeout, retrying in 2 seconds...`)
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }
    }
    
    // Use safe fallback if estimation failed
    if (!estimationSuccess) {
      console.warn('⚠️ Gas estimation failed after all attempts, using safe fallback values')
      gasLimit = BigInt(isMobileSubmit ? 450000 : 350000) // Higher limit for mobile
      // Use higher gas price for mobile to prevent cancellations (7-8 gwei for mobile, 5 gwei for desktop)
      gasPrice = BigInt(isMobileSubmit ? 8000000000 : 5000000000) // 8 gwei mobile, 5 gwei desktop
      console.log(`  - Fallback Gas Limit: ${gasLimit.toString()} (${isMobileSubmit ? 'mobile' : 'desktop'} default)`)
      console.log(`  - Fallback Gas Price: ${ethers.formatUnits(gasPrice, 'gwei')} gwei`)
      console.log('  ℹ️ Transaction will proceed with fallback values')
    }
    
    // Build transaction options
    const txOptions: any = {
      value: requiredBNB,
      gasLimit
    }
    
    // Use EIP-1559 if available, otherwise use legacy gasPrice
    if (maxFeePerGas && maxPriorityFeePerGas) {
      // Add buffer for mobile (30% vs 20% for desktop)
      const bufferPercent = isMobileSubmit ? 130 : 120
      const bufferedMaxFee = (maxFeePerGas * BigInt(bufferPercent)) / BigInt(100)
      const bufferedMaxPriority = (maxPriorityFeePerGas * BigInt(bufferPercent)) / BigInt(100)
      
      txOptions.maxFeePerGas = bufferedMaxFee
      txOptions.maxPriorityFeePerGas = bufferedMaxPriority
      console.log('📋 Transaction Parameters (EIP-1559):')
      console.log('  - Value (BNB fee):', requiredBNBFormatted, 'BNB')
      console.log('  - Gas Limit:', gasLimit.toString())
      console.log('  - Max Fee Per Gas:', ethers.formatUnits(bufferedMaxFee, 'gwei'), 'gwei', isMobileSubmit ? '(mobile +30%)' : '(desktop +20%)')
      console.log('  - Max Priority Fee Per Gas:', ethers.formatUnits(bufferedMaxPriority, 'gwei'), 'gwei')
    } else {
      // Add buffer for mobile (30% vs 20% for desktop) and ensure minimum
      const bufferPercent = isMobileSubmit ? 130 : 120
      const baseGasPrice = gasPrice || BigInt(5000000000)
      const bufferedGasPrice = (baseGasPrice * BigInt(bufferPercent)) / BigInt(100)
      
      // Ensure minimum gas price for mobile (at least 7 gwei to prevent cancellations)
      const minGasPrice = BigInt(isMobileSubmit ? 7000000000 : 5000000000) // 7 gwei mobile, 5 gwei desktop
      const finalGasPrice = bufferedGasPrice > minGasPrice ? bufferedGasPrice : minGasPrice
      
      txOptions.gasPrice = finalGasPrice
      console.log('📋 Transaction Parameters (Legacy):')
      console.log('  - Value (BNB fee):', requiredBNBFormatted, 'BNB')
      console.log('  - Gas Limit:', gasLimit.toString())
      console.log('  - Base Gas Price:', ethers.formatUnits(baseGasPrice, 'gwei'), 'gwei')
      console.log('  - Final Gas Price:', ethers.formatUnits(finalGasPrice, 'gwei'), 'gwei', isMobileSubmit ? '(mobile +30%, min 7 gwei)' : '(desktop +20%)')
    }
    
    // Submit with BNB payment (payable function)
    // Use try-catch around the transaction call to catch user cancellation
    let tx: ethers.ContractTransactionResponse
    try {
      console.log('\n📤 Sending transaction to blockchain...')
      console.log('⚠️ IMPORTANT: Please confirm the transaction in your wallet!')
      console.log('⚠️ Do NOT cancel the transaction - it will process once confirmed!')
      
      tx = await kycContract.submitKYC(combinedDataHash, metadataUrlToUse, txOptions)
      
      console.log('✅ Transaction sent!')
      console.log('  - Transaction Hash:', tx.hash)
      console.log('  - Waiting for confirmation...')
    } catch (txError: any) {
      console.error('❌ Transaction submission error:', txError)
      console.error('Error details:', {
        code: txError.code,
        message: txError.message,
        reason: txError.reason,
        data: txError.data,
        transaction: txError.transaction
      })
      
      // Handle user cancellation specifically
      if (txError.code === 4001 || 
          txError.message?.includes('user rejected') || 
          txError.message?.includes('User denied') ||
          txError.message?.includes('User rejected') ||
          txError.message?.includes('canceled') ||
          txError.message?.includes('rejected') ||
          txError.message?.includes('Transaction cancelled')) {
        const mobileMsg = isMobileSubmit
          ? 'Transaction was canceled. Please try again and tap "Confirm" in MetaMask mobile app when prompted. The app will use a higher gas price to ensure the transaction goes through.'
          : 'Transaction was canceled. You rejected the transaction in your wallet. Please try again and confirm the transaction when MetaMask prompts you.'
        throw new Error(mobileMsg)
      }
      
      // Handle gas price issues (common cause of cancellations on mobile)
      if (txError.message?.includes('gas') && 
          (txError.message?.includes('underpriced') || 
           txError.message?.includes('too low') ||
           txError.message?.includes('intrinsic gas'))) {
        const mobileMsg = isMobileSubmit
          ? 'Transaction failed due to low gas price. Please try again - the app will automatically use a higher gas price (7-8 gwei) for mobile transactions.'
          : 'Transaction failed due to gas price issues. Please try again.'
        throw new Error(mobileMsg)
      }
      
      // Handle transaction replacement/rejection
      if (txError.code === -32003 || txError.message?.includes('replacement') || txError.message?.includes('nonce')) {
        throw new Error('Transaction conflict. Please wait a moment and try again, or check if a previous transaction is pending.')
      }
      
      // Handle network errors
      if (txError.message?.includes('network') || 
          txError.message?.includes('chain') ||
          txError.message?.includes('wrong network') ||
          txError.code === -32002) {
        throw new Error('Network error. Please ensure you are connected to BSC Mainnet (Chain ID: 56) in your wallet.')
      }
      
      // Handle insufficient funds
      if (txError.message?.includes('insufficient funds') || 
          txError.message?.includes('insufficient balance') ||
          txError.message?.includes('insufficient') && txError.message?.includes('balance')) {
        throw new Error('Insufficient BNB balance. Please ensure you have enough BNB for the fee (~$2 USD) plus gas fees (~0.001-0.002 BNB).')
      }
      
      // Handle gas estimation errors
      if (txError.message?.includes('gas') || 
          txError.message?.includes('execution reverted') ||
          txError.code === -32000) {
        const revertReason = txError.reason || txError.data?.message || ''
        throw new Error(`Transaction failed: ${revertReason || txError.message}. Please check your balance and try again.`)
      }
      
      // Generic error with more details
      const errorMsg = txError.reason || txError.message || 'Unknown error'
      throw new Error(`Transaction failed: ${errorMsg}. Please check your wallet, network connection, and try again.`)
    }
    
    // Wait for transaction confirmation
    let receipt: ethers.ContractTransactionReceipt | null
    try {
      receipt = await tx.wait()
      if (!receipt) {
        // If wait() returns null, use the transaction hash
        if (tx.hash) {
          console.warn('⚠️ Transaction confirmation returned null. Using transaction hash:', tx.hash)
          return tx.hash
        }
        throw new Error('Transaction confirmation failed: receipt is null and no transaction hash available')
      }
    } catch (waitError: any) {
      // If transaction was sent but confirmation failed, still return the hash
      if (tx.hash) {
        console.warn('⚠️ Transaction sent but confirmation check failed. Transaction hash:', tx.hash)
        console.warn('  You can check the transaction status on BSCScan:', `https://bscscan.com/tx/${tx.hash}`)
        return tx.hash
      }
      throw waitError
    }
    
    console.log('\n💰 Checking BNB Balance AFTER Submission...')
    const balanceAfter = await provider.getBalance(userAddress)
    const balanceAfterFormatted = ethers.formatEther(balanceAfter)
    const balanceDiff = balanceBefore - balanceAfter
    const balanceDiffFormatted = ethers.formatEther(balanceDiff)
    console.log('  - BNB Balance After:', balanceAfterFormatted, 'BNB')
    console.log('  - Balance Difference:', balanceDiffFormatted, 'BNB')
    console.log('  ✅ Fee successfully paid in BNB!')
    
    console.log('\n✅ KYC Verification Submitted Successfully!')
    console.log('📋 Transaction Receipt:')
    console.log('  - Transaction Hash:', receipt.hash)
    console.log('  - Block Number:', receipt.blockNumber)
    console.log('  - Status:', receipt.status === 1 ? 'Success' : 'Failed')
    console.log('========================================\n')
    
    return receipt.hash
  } catch (error: any) {
    console.error('❌ Error submitting KYC:', error)
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      reason: error.reason,
      data: error.data
    })
    
    // User cancellation (most common)
    if (error.code === 4001 || 
        error.message?.includes('user rejected') || 
        error.message?.includes('User denied') ||
        error.message?.includes('canceled') ||
        error.message?.includes('rejected')) {
      throw new Error('Transaction was canceled. You rejected the transaction in your wallet. Please try again and confirm when prompted.')
    }
    
    // Network errors
    if (error.message?.includes('network') || 
        error.message?.includes('chain') ||
        error.message?.includes('wrong network') ||
        error.message?.includes('Chain ID')) {
      throw new Error('Network error: Please ensure you are connected to BSC Mainnet (Chain ID: 56) in your wallet. The app will try to switch automatically.')
    }
    
    // Insufficient funds
    if (error.message?.includes('Insufficient BNB') || 
        error.message?.includes('insufficient funds') ||
        error.message?.includes('insufficient balance')) {
      throw error // Use the detailed error message from balance check
    }
    
    // Contract not found
    if (error.message?.includes('not found') || 
        error.message?.includes('BAD_DATA') ||
        error.message?.includes('contract') && error.message?.includes('not deployed')) {
      throw new Error('Contract not found. Please ensure you are connected to BSC Mainnet (Chain ID: 56) and the contract is deployed.')
    }
    
    // Execution reverted (contract-level error)
    if (error.message?.includes('execution reverted') || error.reason) {
      const revertReason = error.reason || error.data?.message || error.message
      throw new Error(`Transaction failed: ${revertReason}. Please check your balance, network connection, and try again.`)
    }
    
    // Gas estimation errors
    if (error.message?.includes('gas') || error.message?.includes('estimation')) {
      throw new Error('Gas estimation failed. Please try again. If the problem persists, ensure you are on BSC Mainnet and have sufficient BNB.')
    }
    
    // Generic error
    throw new Error(error.message || 'Transaction failed. Please check your wallet, network connection, and try again.')
  }
}

// Rest of the functions remain the same...
export async function getTransactionDetails(txHash: string): Promise<{
  transactionHash: string
  blockNumber: string
  fromAddress: string
  toAddress: string
  amount: string
  timestamp: string
}> {
  try {
    const { provider } = await getProviderAndSigner()
    const receipt = await provider.getTransactionReceipt(txHash)
    if (!receipt) {
      throw new Error('Transaction receipt not found')
    }
    
    const tx = await provider.getTransaction(txHash)
    if (!tx) {
      throw new Error('Transaction not found')
    }
    
    const block = await provider.getBlock(receipt.blockNumber)
    if (!block) {
      throw new Error('Block not found')
    }
    
    return {
      transactionHash: txHash,
      blockNumber: receipt.blockNumber.toString(),
      fromAddress: tx.from,
      toAddress: receipt.to || CONTRACT_ADDRESSES.KYC,
      amount: CHARGE_AMOUNT_USD,
      timestamp: new Date((block.timestamp || 0) * 1000).toISOString()
    }
  } catch (error: any) {
    console.error('Error getting transaction details:', error)
    throw error
  }
}

export async function getNetworkInfo(): Promise<{ 
  chainId: string
  name: string
  isCorrectNetwork: boolean
  requiredNetworkName: string
} | null> {
  try {
    const REQUIRED_CHAIN_ID = '56'
    const REQUIRED_NETWORK_NAME = 'Binance Smart Chain (BSC Mainnet)'
    
    const publicClient = getPublicClient(wagmiConfig)
    if (publicClient) {
      const chainId = publicClient.chain?.id.toString() || '56'
      const name = publicClient.chain?.name || 'Binance Smart Chain'
      const isCorrectNetwork = chainId === REQUIRED_CHAIN_ID
      return { 
        chainId, 
        name, 
        isCorrectNetwork,
        requiredNetworkName: REQUIRED_NETWORK_NAME
      }
    }
    
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const chainId = await (window as any).ethereum.request({ method: 'eth_chainId' })
      const chainIdDecimal = parseInt(chainId, 16).toString()
      const isCorrectNetwork = chainIdDecimal === REQUIRED_CHAIN_ID
      return { 
        chainId: chainIdDecimal, 
        name: 'Unknown Network',
        isCorrectNetwork,
        requiredNetworkName: REQUIRED_NETWORK_NAME
      }
    }
    
    return null
  } catch (error) {
    console.error('Error getting network info:', error)
    return null
  }
}

export async function switchNetwork(chainId: string) {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed')
  }

  try {
    await (window as any).ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    })
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      throw new Error('Please add this network to MetaMask first')
    }
    throw switchError
  }
}

export async function getContractOwner(): Promise<string> {
  try {
    const { provider } = await getProviderAndSigner()
    const kycContract = new ethers.Contract(CONTRACT_ADDRESSES.KYC, KYC_ABI, provider)
    const owner = await kycContract.owner()
    return owner
  } catch (error: any) {
    console.error('Error getting contract owner:', error)
    throw new Error(`Failed to get contract owner: ${error.message || 'Unknown error'}`)
  }
}

// Get current contract balance (available BNB in contract)
export async function getContractBalance(): Promise<string> {
  try {
    let provider: ethers.Provider
    
    try {
      const providerAndSigner = await getProviderAndSigner()
      provider = providerAndSigner.provider
    } catch (error) {
      const rpcUrl = 'https://bsc-dataseed.binance.org/'
      provider = new ethers.JsonRpcProvider(rpcUrl)
    }
    
    const kycContract = new ethers.Contract(CONTRACT_ADDRESSES.KYC, KYC_ABI, provider)
    const balance = await kycContract.getContractBalance()
    
    // Return BNB balance (formatted to 8 decimal places for display)
    return ethers.formatEther(balance)
  } catch (error: any) {
    console.error('Error getting contract balance:', error)
    throw new Error(`Failed to get contract balance: ${error.message || 'Unknown error'}`)
  }
}

// Get total collected fees (from ABI: getStats or totalCollection)
export async function getTotalCollectedFees(): Promise<string> {
  try {
    let provider: ethers.Provider
    
    try {
      const providerAndSigner = await getProviderAndSigner()
      provider = providerAndSigner.provider
    } catch (error) {
      const rpcUrl = 'https://bsc-dataseed.binance.org/'
      provider = new ethers.JsonRpcProvider(rpcUrl)
    }
    
    const kycContract = new ethers.Contract(CONTRACT_ADDRESSES.KYC, KYC_ABI, provider)
    
    // Try getStats first (more efficient - gets all stats at once)
    try {
      const stats = await kycContract.getStats()
      // stats returns: [submissions, totalCollectionBNB, totalWithdrawnBNB, balance]
      // ethers.js v6 returns tuples as arrays, so we access by index
      const totalCollectionBNB = stats[1] // totalCollectionBNB is at index 1
      console.log('✅ getStats result - totalCollectionBNB:', totalCollectionBNB.toString())
      return ethers.formatEther(totalCollectionBNB)
    } catch (statsError: any) {
      // Fallback to totalCollection state variable if getStats fails
      console.log('⚠️ getStats failed, trying totalCollection directly:', statsError?.message || statsError)
      try {
        const totalCollected = await kycContract.totalCollection()
        console.log('✅ totalCollection result:', totalCollected.toString())
        return ethers.formatEther(totalCollected)
      } catch (fallbackError: any) {
        console.error('❌ Both getStats and totalCollection failed:', fallbackError)
        throw new Error(`Failed to get total collected fees: ${fallbackError?.message || 'Unknown error'}`)
      }
    }
  } catch (error: any) {
    console.error('Error getting total collected fees:', error)
    throw new Error(`Failed to get total collected fees: ${error.message || 'Unknown error'}`)
  }
}

export async function verifyOwner(address: string): Promise<boolean> {
  try {
    const owner = await getContractOwner()
    return owner.toLowerCase() === address.toLowerCase()
  } catch (error: any) {
    console.error('Error verifying owner:', error)
    return false
  }
}

export async function getTotalWithdrawals(): Promise<string> {
  try {
    let provider: ethers.Provider
    
    try {
      const providerAndSigner = await getProviderAndSigner()
      provider = providerAndSigner.provider
    } catch (error) {
      const rpcUrl = 'https://bsc-dataseed.binance.org/'
      provider = new ethers.JsonRpcProvider(rpcUrl)
    }
    
    const kycContract = new ethers.Contract(CONTRACT_ADDRESSES.KYC, KYC_ABI, provider)
    
    // Try getStats first (more efficient - gets all stats at once)
    try {
      const stats = await kycContract.getStats()
      // stats returns: [submissions, totalCollectionBNB, totalWithdrawnBNB, balance]
      // ethers.js v6 returns tuples as arrays, so we access by index
      const totalWithdrawnBNB = stats[2] // totalWithdrawnBNB is at index 2
      console.log('✅ getStats result - totalWithdrawnBNB:', totalWithdrawnBNB.toString())
      return ethers.formatEther(totalWithdrawnBNB)
    } catch (statsError: any) {
      // Fallback to totalWithdrawn state variable if getStats fails
      console.log('⚠️ getStats failed, trying totalWithdrawn directly:', statsError?.message || statsError)
      try {
        const totalWithdrawn = await kycContract.totalWithdrawn()
        console.log('✅ totalWithdrawn result:', totalWithdrawn.toString())
        return ethers.formatEther(totalWithdrawn)
      } catch (fallbackError: any) {
        console.error('❌ Both getStats and totalWithdrawn failed:', fallbackError)
        throw new Error(`Failed to get total withdrawals: ${fallbackError?.message || 'Unknown error'}`)
      }
    }
  } catch (error: any) {
    console.error('Error getting total withdrawals:', error)
    throw new Error(`Failed to get total withdrawals: ${error.message || 'Unknown error'}`)
  }
}

export async function withdrawContractFunds(amount: string): Promise<string> {
  try {
    console.log('========================================')
    console.log('💰 WITHDRAWING FUNDS FROM CONTRACT')
    console.log('========================================')
    
    const kycContract = await getKYCContract()
    const { signer, provider } = await getProviderAndSigner()
    const userAddress = await signer.getAddress()
    
    console.log('📋 Withdrawal Details:')
    console.log('  - User Address:', userAddress)
    console.log('  - Contract Address:', CONTRACT_ADDRESSES.KYC)
    console.log('  - Requested Amount (BNB):', amount)
    
    // Validate amount (amount is now in BNB)
    const amountBNB = parseFloat(amount)
    if (isNaN(amountBNB) || amountBNB <= 0) {
      throw new Error('Invalid withdrawal amount. Amount must be greater than 0.')
    }
    
    // Convert BNB amount to Wei
    const amountBNBWei = ethers.parseEther(amountBNB.toFixed(18))
    
    console.log('  - Amount (BNB):', amountBNB.toFixed(8))
    console.log('  - Amount (Wei):', amountBNBWei.toString())
    
    // Check contract balance in BNB
    console.log('\n💰 Checking contract balance...')
    const contractBalanceBNB = await kycContract.getContractBalance()
    const contractBalanceBNBFormatted = ethers.formatEther(contractBalanceBNB)
    console.log('  - Contract Balance (BNB):', contractBalanceBNBFormatted)
    console.log('  - Contract Balance (Wei):', contractBalanceBNB.toString())
    
    // Validate that we have enough balance
    if (contractBalanceBNB < amountBNBWei) {
      throw new Error(
        `Insufficient contract balance. ` +
        `Requested: ${amountBNB.toFixed(8)} BNB, ` +
        `Available: ${contractBalanceBNBFormatted} BNB`
      )
    }
    
    // Ensure amount is not zero after conversion
    if (amountBNBWei === BigInt(0)) {
      throw new Error('Withdrawal amount is too small. Please enter a larger amount.')
    }
    
    // Verify owner
    console.log('\n🔐 Verifying ownership...')
    const owner = await kycContract.owner()
    const isOwner = owner.toLowerCase() === userAddress.toLowerCase()
    console.log('  - Contract Owner:', owner)
    console.log('  - Is Owner:', isOwner)
    
    if (!isOwner) {
      throw new Error('Only the contract owner can withdraw funds.')
    }
    
    // Estimate gas
    console.log('\n⛽ Estimating gas...')
    let gasLimit: bigint
    try {
      gasLimit = await kycContract.withdrawBNB.estimateGas(amountBNBWei)
      console.log('  - Estimated Gas Limit:', gasLimit.toString())
    } catch (gasError: any) {
      console.error('  - Gas estimation failed:', gasError)
      // Use fallback gas limit
      gasLimit = BigInt(100000)
      console.log('  - Using fallback Gas Limit:', gasLimit.toString())
    }
    
    const feeData = await provider.getFeeData()
    const gasPrice = feeData.gasPrice || BigInt(5000000000)
    console.log('  - Gas Price:', ethers.formatUnits(gasPrice, 'gwei'), 'gwei')
    
    // Execute withdrawal
    console.log('\n⏳ Sending withdrawal transaction...')
    console.log('  - Amount (Wei):', amountBNBWei.toString())
    console.log('  - Gas Limit:', gasLimit.toString())
    console.log('  - Gas Price:', gasPrice.toString())
    
    const tx = await kycContract.withdrawBNB(amountBNBWei, {
      gasLimit,
      gasPrice
    })
    
    console.log('✅ Withdrawal transaction sent!')
    console.log('  - Transaction Hash:', tx.hash)
    console.log('  - Waiting for confirmation...')
    
    const receipt = await tx.wait()
    
    if (!receipt) {
      if (tx.hash) {
        console.warn('⚠️ Transaction confirmation returned null. Using transaction hash:', tx.hash)
        return tx.hash
      }
      throw new Error('Transaction confirmation failed: receipt is null and no transaction hash available')
    }
    
    console.log('✅ Withdrawal confirmed!')
    console.log('  - Block Number:', receipt.blockNumber)
    console.log('  - Gas Used:', receipt.gasUsed.toString())
    console.log('========================================\n')
    
    return receipt.hash
  } catch (error: any) {
    console.error('❌ Error withdrawing funds:', error)
    
    // Handle specific error cases
    if (error.message.includes('user rejected') || error.code === 4001) {
      throw new Error('Withdrawal was rejected. Please approve the transaction in your wallet.')
    }
    
    if (error.message.includes('Insufficient contract balance')) {
      throw error
    }
    
    if (error.message.includes('Only the contract owner')) {
      throw error
    }
    
    if (error.message.includes('execution reverted')) {
      // Try to decode the error
      if (error.data) {
        console.error('  - Error data:', error.data)
      }
      throw new Error(
        `Transaction reverted. This could mean: ` +
        `1) Insufficient contract balance, ` +
        `2) You are not the contract owner, or ` +
        `3) The amount is invalid. ` +
        `Please check the contract balance and try again.`
      )
    }
    
    throw new Error(`Failed to withdraw funds: ${error.message || 'Unknown error'}`)
  }
}
/**
 * Network Switching Utility
 * Automatically switches wallet to BSC Testnet
 */

const BSC_TESTNET_CONFIG = {
  chainId: '0x61', // 97 in hex
  chainName: 'Binance Smart Chain Testnet',
  nativeCurrency: {
    name: 'BNB',
    symbol: 'BNB',
    decimals: 18,
  },
  rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
  blockExplorerUrls: ['https://testnet.bscscan.com/'],
}

/**
 * Switch wallet network to BSC Testnet
 */
export async function switchToBSCTestnet(provider?: any): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false
  }

  const ethereum = provider || (window as any).ethereum

  if (!ethereum) {
    throw new Error('No Ethereum provider found')
  }

  try {
    // Try to switch to BSC Testnet
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: BSC_TESTNET_CONFIG.chainId }],
    })
    
    // Wait a bit for the switch to complete
    await new Promise(resolve => setTimeout(resolve, 1000))
    return true
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        // Add the chain
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [BSC_TESTNET_CONFIG],
        })
        
        // Wait a bit for the chain to be added
        await new Promise(resolve => setTimeout(resolve, 1000))
        return true
      } catch (addError: any) {
        console.error('Error adding BSC Testnet:', addError)
        throw new Error('Failed to add BSC Testnet. Please add it manually in your wallet.')
      }
    } else {
      console.error('Error switching to BSC Testnet:', switchError)
      throw new Error(`Failed to switch network: ${switchError.message}`)
    }
  }
}

/**
 * Check if wallet is on BSC Testnet
 */
export async function isOnBSCTestnet(provider?: any): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false
  }

  const ethereum = provider || (window as any).ethereum

  if (!ethereum) {
    return false
  }

  try {
    const chainId = await ethereum.request({ method: 'eth_chainId' })
    return chainId === BSC_TESTNET_CONFIG.chainId
  } catch (error) {
    console.error('Error checking chain ID:', error)
    return false
  }
}


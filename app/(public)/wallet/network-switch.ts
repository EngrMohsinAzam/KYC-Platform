/**
 * Network Switching Utility
 * Automatically switches wallet to BSC Mainnet
 */

const BSC_MAINNET_CONFIG = {
  chainId: '0x38', // 56 in hex
  chainName: 'Binance Smart Chain',
  nativeCurrency: {
    name: 'BNB',
    symbol: 'BNB',
    decimals: 18,
  },
  rpcUrls: ['https://bsc-dataseed.binance.org/'],
  blockExplorerUrls: ['https://bscscan.com/'],
}

/**
 * Switch wallet network to BSC Mainnet
 */
export async function switchToBSCMainnet(provider?: any): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false
  }

  const ethereum = provider || (window as any).ethereum

  if (!ethereum) {
    throw new Error('No Ethereum provider found')
  }

  try {
    // Try to switch to BSC Mainnet
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: BSC_MAINNET_CONFIG.chainId }],
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
          params: [BSC_MAINNET_CONFIG],
        })
        
        // Wait a bit for the chain to be added
        await new Promise(resolve => setTimeout(resolve, 1000))
        return true
      } catch (addError: any) {
        console.error('Error adding BSC Mainnet:', addError)
        throw new Error('Failed to add BSC Mainnet. Please add it manually in your wallet.')
      }
    } else {
      console.error('Error switching to BSC Mainnet:', switchError)
      throw new Error(`Failed to switch network: ${switchError.message}`)
    }
  }
}

/**
 * Check if wallet is on BSC Mainnet
 */
export async function isOnBSCMainnet(provider?: any): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false
  }

  const ethereum = provider || (window as any).ethereum

  if (!ethereum) {
    return false
  }

  try {
    const chainId = await ethereum.request({ method: 'eth_chainId' })
    return chainId === BSC_MAINNET_CONFIG.chainId
  } catch (error) {
    console.error('Error checking chain ID:', error)
    return false
  }
}

// Keep old function name for backward compatibility (will be removed in future)
export const switchToBSCTestnet = switchToBSCMainnet
export const isOnBSCTestnet = isOnBSCMainnet


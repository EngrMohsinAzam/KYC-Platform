# Blockchain Integration Guide

## Smart Contract Addresses

- **KYC Contract**: `0x132f342D1E8Adc9B4F8A71cEe374b14c7aD45655` (BSC Mainnet)

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Update Contract ABIs**
   - The contract ABIs in `lib/contracts.ts` are basic templates
   - Update them with your actual deployed contract ABIs
   - You can get the ABI from your contract deployment or from Etherscan

3. **Network Configuration**
   - The app is configured for Binance Smart Chain (BSC) Mainnet
   - Chain ID: 56 (0x38 in hex)
   - RPC URL: `https://bsc-dataseed.binance.org/`
   - Block Explorer: `https://bscscan.com/`

## How It Works

1. **User connects wallet** - MetaMask integration
2. **Balance check** - Verifies user has sufficient BNB (for $2 USD fee + gas)
3. **BNB Fee Calculation** - Contract calculates required BNB amount from Chainlink price feed
4. **KYC Submission** - Calls KYC contract with anonymous ID and BNB payment (payable function)
5. **Transaction Hash** - Displays the blockchain transaction ID

## Important Notes

- The KYC contract function `submitKYC` is used for submissions
- Contract address: `0x132f342D1E8Adc9B4F8A71cEe374b14c7aD45655` on BSC Mainnet
- The ABI is already configured in `lib/contracts.ts`
- Contract name: `SimpleKYCWithBNB`

## Contract Function Requirements

Your KYC contract should have a function that:
- Accepts the anonymous ID (bytes32)
- Accepts BNB payment (payable function)
- Fetches BNB/USD price from Chainlink
- Validates the payment amount equals $2 USD
- Records the verification on-chain

Example function signature:
```solidity
function submitKYC(bytes32 _combinedDataHash, string memory _metadataUrl) external payable
```


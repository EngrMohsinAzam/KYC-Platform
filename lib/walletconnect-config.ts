export const walletConnectConfig = {
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'dac575710eb8362c0d28c55d2dcf73dc',
  metadata: {
    name: 'MiraKYC',
    description: 'KYC Verification Platform',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://mirakyc.com',
    icons: [`${typeof window !== 'undefined' ? window.location.origin : 'https://mirakyc.com'}/favicon.ico`]
  },
  chains: [
    {
      id: 56, 
      name: 'Binance Smart Chain',
      network: 'bsc',
      nativeCurrency: {
        decimals: 18,
        name: 'BNB',
        symbol: 'BNB',
      },
      rpcUrls: {
        default: {
          http: ['https://bsc-dataseed.binance.org'],
        },
        public: {
          http: ['https://bsc-dataseed.binance.org'],
        },
      },
      blockExplorers: {
        default: {
          name: 'BscScan',
          url: 'https://bscscan.com',
        },
      },
      testnet: false,
    },
  ],
}


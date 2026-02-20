/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  // Ensure proper routing on Vercel
  trailingSlash: false,
  // Skip static optimization for pages that use client-side only features
  experimental: {
    missingSuspenseWithCSRBailout: false,
    optimizeCss: true,
    optimizePackageImports: ['@heroicons/react', 'react-icons', 'recharts'],
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  // Optimize production builds
  swcMinify: true,
  // Reduce JavaScript bundle size
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Suppress warnings for optional dependencies
  webpack: (config, { isServer }) => {
    // Handle optional dependencies that aren't needed for web builds
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        '@react-native-async-storage/async-storage': false,
        'pino-pretty': false,
      }
    }
    
    // Suppress warnings for optional peer dependencies
    config.ignoreWarnings = [
      { module: /@metamask\/sdk/ },
      { module: /pino/ },
      { message: /@react-native-async-storage/ },
      { message: /pino-pretty/ },
      { message: /Cannot find module for page/ },
    ]
    
    // Aggressive bundle splitting for mobile performance
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        // Minimize JavaScript execution time
        minimize: true,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            default: false,
            vendors: false,
            // Framework chunk (React, React DOM)
            framework: {
              name: 'framework',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 40,
              enforce: true,
            },
            // Vendor chunk for blockchain libraries (keep together for wallet functionality)
            blockchain: {
              name: 'blockchain',
              chunks: 'async', // Load only when needed
              test: /[\\/]node_modules[\\/](wagmi|viem|ethers|@tanstack[\\/]react-query|@walletconnect)[\\/]/,
              priority: 30,
              reuseExistingChunk: true,
            },
            // Separate chunk for UI libraries
            ui: {
              name: 'ui',
              chunks: 'async', // Load only when needed
              test: /[\\/]node_modules[\\/](react-icons|lottie-react|recharts)[\\/]/,
              priority: 20,
              reuseExistingChunk: true,
            },
            // Common vendor chunk
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /[\\/]node_modules[\\/]/,
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      }
    }
    
    return config
  },
}

module.exports = nextConfig


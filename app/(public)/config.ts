/**
 * Centralized API Configuration
 * 
 * This file contains the single source of truth for all API base URLs.
 * 
 * For Vercel deployment:
 * - The default backend API is: https://xzfjrnv9-3902.asse.devtunnels.ms/
 * - To override, set NEXT_PUBLIC_API_URL in Vercel environment variables
 * - Go to: Vercel Dashboard > Your Project > Settings > Environment Variables
 * 
 * For local development:
 * - Create .env.local file with: NEXT_PUBLIC_API_URL=http://localhost:3902
 * - Or use the default production URL
 * 
 * GeoDB Cities API Configuration:
 * - API Key: Set NEXT_PUBLIC_GEODB_API_KEY in .env.local
 * - Get your free API key from: https://rapidapi.com/wirefreethought/api/geodb-cities
 * - Example: NEXT_PUBLIC_GEODB_API_KEY=your_api_key_here
 * - The component will fallback to countries.ts if API key is not configured or API fails
 */

// API Base URL - DigiPortID KYC Backend
// Production: https://api.digiportid.com | Development: http://localhost:3099
// Override with NEXT_PUBLIC_API_URL
const getApiBaseUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_API_URL ||'https://hmt4c7sf-3902.asse.devtunnels.ms'
  return url.replace(/\/$/, '')
}

export const API_BASE_URL = getApiBaseUrl()

// App base URL for KYC links, embeds, etc. (e.g. https://www.digiportid.com)
export const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || ''


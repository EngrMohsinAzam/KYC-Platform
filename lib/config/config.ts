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
 */

// API Base URL - uses environment variable with fallback
// Remove trailing slash if present to ensure consistent URL building
const getApiBaseUrl = (): string => {
  // Default to production backend API (works for Vercel deployment)
  // Override with NEXT_PUBLIC_API_URL environment variable if needed
  const url = process.env.NEXT_PUBLIC_API_URL || 'https://xzfjrnv9-3902.asse.devtunnels.ms/'
  // Remove trailing slash for consistency
  return url.replace(/\/$/, '')
}

export const API_BASE_URL = getApiBaseUrl()


/**
 * Centralized API Configuration
 * 
 * This file contains the single source of truth for all API base URLs.
 * Update NEXT_PUBLIC_API_URL in your .env file to change the API endpoint.
 */

// API Base URL - uses environment variable with fallback
// Remove trailing slash if present to ensure consistent URL building
// For local development, use: http://localhost:3902
// For production, use HTTPS URL
const getApiBaseUrl = (): string => {
  // Default to localhost for local development
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3902'
  // Remove trailing slash for consistency
  return url.replace(/\/$/, '')
}

export const API_BASE_URL = getApiBaseUrl()


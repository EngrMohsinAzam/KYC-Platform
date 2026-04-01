// API base URL - imported from centralized config
import { API_BASE_URL } from '../(public)/config'

const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development'
const devLog = (..._args: unknown[]) => { if (isDev) console.log(..._args) }

// Convert base64 image to File object
const base64ToFile = (base64String: string, filename: string): File => {
  // Remove data URL prefix if present
  const base64Data = base64String.includes(',') 
    ? base64String.split(',')[1] 
    : base64String
  
  // Convert base64 to binary
  const byteCharacters = atob(base64Data)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  
  // Determine MIME type from base64 string
  let mimeType = 'image/jpeg'
  if (base64String.includes('data:image/png')) {
    mimeType = 'image/png'
  } else if (base64String.includes('data:image/jpeg') || base64String.includes('data:image/jpg')) {
    mimeType = 'image/jpeg'
  } else if (base64String.includes('data:video/mp4')) {
    mimeType = 'video/mp4'
  } else if (base64String.includes('data:video/webm')) {
    mimeType = 'video/webm'
  }
  
  // Create File object
  const blob = new Blob([byteArray], { type: mimeType })
  return new File([blob], filename, { type: mimeType })
}

// Submit KYC data to backend
export const submitKYCData = async (data: {
  userId: string
  blockchainAddressId: string
  fullName: string
  firstName?: string
  lastName?: string
  email: string
  phone?: string
  address?: string
  countryName?: string
  cityName?: string
  countryOfPermanentResidence?: string
  stateOfResidence?: string
  legalFirstName?: string
  legalLastName?: string
  idType: string
  usaResidence?: string
  dateOfBirth?: string
  employmentStatus?: string
  industry?: string
  fundSource?: string
  moneyDepositAndWithdrawal?: string
  monthlyIncome?: string
  formerFirstName?: string
  governmentCountryName?: string
  identityDocumentFront: string // base64
  identityDocumentBack?: string // base64
  liveInImage?: string // base64
  faceVerificationVideo?: string // base64/video data URL
  companyId?: string
  companySlug?: string
  transactionHash?: string
  blockNumber?: string
  fromAddress?: string
  toAddress?: string
  amount?: string
  timestamp?: string
  feeUnit?: number
}): Promise<{ success: boolean; message?: string; data?: any; errors?: any[]; isBackendIssue?: boolean }> => {
  try {
    const formData = new FormData()
    const normalizeIdType = (raw: string): 'passport' | 'national_id' | 'driving_license' => {
      const v = (raw || '').trim().toLowerCase()
      if (v === 'passport') return 'passport'
      if (v === 'national-id' || v === 'national_id' || v === 'cnic') return 'national_id'
      if (v === 'drivers-license' || v === 'driving_license' || v === 'license') return 'driving_license'
      return 'national_id'
    }
    const normalizedIdType = normalizeIdType(data.idType)
    const legalFirstName = (data.legalFirstName || data.firstName || '').trim()
    const legalLastName = (data.legalLastName || data.lastName || '').trim()
    const countryOfPermanentResidence = (data.countryOfPermanentResidence || data.countryName || '').trim()
    const stateOfResidence = (data.stateOfResidence || data.cityName || '').trim()
    
    // Add text fields - ensure no empty strings for required fields
    // Validate required fields before sending
    const requiredFields: string[] = []
    
    if (!data.userId || data.userId.trim() === '') {
      requiredFields.push('userId')
    }
    if (!data.blockchainAddressId || data.blockchainAddressId.trim() === '') {
      requiredFields.push('blockchainAddressId')
    }
    if (!data.companyId || data.companyId.trim() === '') requiredFields.push('companyId')
    if (!data.companySlug || data.companySlug.trim() === '') requiredFields.push('companySlug')
    if (!data.email || data.email.trim() === '') {
      requiredFields.push('email')
    }
    if (!countryOfPermanentResidence) requiredFields.push('countryOfPermanentResidence')
    if (!stateOfResidence) requiredFields.push('stateOfResidence')
    if (!legalFirstName) requiredFields.push('legalFirstName')
    if (!legalLastName) requiredFields.push('legalLastName')
    if (!data.idType || data.idType.trim() === '') {
      requiredFields.push('idType')
    }
    if (!data.identityDocumentFront || data.identityDocumentFront.trim() === '') {
      requiredFields.push('identityDocumentFront')
    }
    if ((normalizedIdType === 'national_id' || normalizedIdType === 'driving_license') && (!data.identityDocumentBack || data.identityDocumentBack.trim() === '')) {
      requiredFields.push('identityDocumentBack')
    }
    
    if (requiredFields.length > 0) {
      throw new Error(`Missing required fields: ${requiredFields.join(', ')}`)
    }
    
    formData.append('userId', data.userId.trim())
    // Always send blockchainAddressId - backend requires it
    const blockchainAddressId = data.blockchainAddressId.trim()
    formData.append('blockchainAddressId', blockchainAddressId)
    formData.append('companyId', data.companyId!.trim())
    formData.append('companySlug', data.companySlug!.trim())
    formData.append('legalFirstName', legalFirstName)
    formData.append('legalLastName', legalLastName)
    // Required fields
    formData.append('email', data.email.trim())
    if (data.phone && data.phone.trim()) formData.append('phone', data.phone.trim())
    
    // Optional address field
    if (data.address && data.address.trim()) formData.append('address', data.address.trim())
    
    // Required location fields
    formData.append('countryOfPermanentResidence', countryOfPermanentResidence)
    formData.append('stateOfResidence', stateOfResidence)
    formData.append('idType', normalizedIdType)
    if (data.feeUnit != null) formData.append('feeUnit', String(data.feeUnit))
    if (data.dateOfBirth?.trim()) formData.append('dateOfBirth', data.dateOfBirth.trim())
    if (data.employmentStatus?.trim()) formData.append('employmentStatus', data.employmentStatus.trim())
    if (data.industry?.trim()) formData.append('industry', data.industry.trim())
    if (data.fundSource?.trim()) formData.append('fundSource', data.fundSource.trim())
    if (data.moneyDepositAndWithdrawal?.trim()) formData.append('moneyDepositAndWithdrawal', data.moneyDepositAndWithdrawal.trim())
    if (data.monthlyIncome?.trim()) formData.append('monthlyIncome', data.monthlyIncome.trim())
    if (data.formerFirstName?.trim()) formData.append('formerFirstName', data.formerFirstName.trim())
    if (data.governmentCountryName?.trim()) formData.append('governmentCountryName', data.governmentCountryName.trim())
    
    // Add blockchain transaction details if available
    if (data.transactionHash) {
      formData.append('transactionHash', data.transactionHash)
    }
    if (data.blockNumber) {
      formData.append('blockNumber', data.blockNumber)
    }
    if (data.fromAddress) {
      formData.append('fromAddress', data.fromAddress)
    }
    if (data.toAddress) {
      formData.append('toAddress', data.toAddress)
    }
    if (data.amount) {
      formData.append('amount', data.amount)
    }
    if (data.timestamp) {
      formData.append('timestamp', data.timestamp)
    }
    
    try {
      const frontFile = base64ToFile(data.identityDocumentFront, 'identity-document-front.jpg')
      formData.append('identityDocumentFront', frontFile)
    } catch (err) {
      throw err
    }
    
    if (data.identityDocumentBack && data.identityDocumentBack.trim()) {
      try {
        const backFile = base64ToFile(data.identityDocumentBack, 'identity-document-back.jpg')
        formData.append('identityDocumentBack', backFile)
      } catch (err) {
        throw err
      }
    }
    
    if (data.liveInImage && data.liveInImage.trim()) {
      try {
        const selfieFile = base64ToFile(data.liveInImage, 'live-in-image.jpg')
        formData.append('liveInImage', selfieFile)
      } catch (err) {
        throw err
      }
    }
    if (data.faceVerificationVideo && data.faceVerificationVideo.trim()) {
      try {
        const videoFile = base64ToFile(data.faceVerificationVideo, 'face-verification-video.mp4')
        formData.append('faceVerificationVideo', videoFile)
      } catch {
        // keep non-blocking to avoid breaking image-only submissions
      }
    }
    
    // Check for empty critical fields
    const criticalFields = ['userId', 'companyId', 'companySlug', 'blockchainAddressId', 'email', 'countryOfPermanentResidence', 'stateOfResidence', 'legalFirstName', 'legalLastName', 'idType']
    const emptyFields: string[] = []
    for (const [key, value] of formData.entries()) {
      if (criticalFields.includes(key)) {
        const valueStr = String(value)
        if (!valueStr || valueStr.trim() === '') emptyFields.push(key)
      }
    }
    if (emptyFields.length > 0) {
      throw new Error(`Critical fields are empty: ${emptyFields.join(', ')}. Please check your data before submission.`)
    }
    
    const fullEndpoint = '/api/kyc/submit'
    // Make the actual request with timeout (via Next.js proxy)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout
    
    let response: Response
    try {
      response = await fetch(fullEndpoint, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        // Don't set Content-Type header - browser will set it automatically with boundary for FormData
      })
      clearTimeout(timeoutId)
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        throw new Error('Backend API request timed out. Please check your internet connection and try again.')
      }
      if (fetchError.message?.includes('Failed to fetch') || fetchError.message?.includes('NetworkError')) {
        throw new Error('Cannot connect to backend server. Please check your internet connection and ensure the backend is running.')
      }
      throw fetchError
    }
    
    if (!response.ok) {
      let errorData: any = null
      let errorText = ''
      try {
        errorText = await response.text()
        try {
          errorData = JSON.parse(errorText)
        } catch {
          // not JSON
        }
      } catch {
        // could not read error response
      }
      
      // Check if it's a connection issue
      if (response.status === 0 || response.status >= 500) {
        return {
          success: false,
          message: `Backend server error (${response.status}). The backend server may be down or unreachable.`,
          errors: [],
          isBackendIssue: true
        }
      }
      
      // Extract validation errors if available
      let errorMessage = `Backend API error: ${response.status} ${response.statusText}`
      let isBackendIssue = false
      
      if (errorData) {
        if (errorData.message) {
          errorMessage = errorData.message
        }
        
        // If validation errors exist, add them to the message
        if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          const validationErrors = errorData.errors.map((err: any) => {
            if (!err) return 'Unknown validation error'
            if (typeof err === 'string') return err
            if (typeof err === 'object' && err.field && err.message) return `${err.field}: ${err.message}`
            if (typeof err === 'object' && err.message) return String(err.message)
            return String(err)
          }).join(', ')
          errorMessage += ` - Validation errors: ${validationErrors}`
        } else if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length === 0) {
          // Empty errors array - backend validation failed but didn't provide details
          // This might be a backend issue - the backend should provide specific validation errors
          errorMessage = 'Validation failed - Backend did not provide specific error details. This may be a backend configuration issue. Please check:\n' +
            '1. All required fields are filled\n' +
            '2. Images are properly uploaded\n' +
            '3. Backend API is correctly configured'
          isBackendIssue = true
        }
      } else if (errorText) {
        errorMessage += ` - ${errorText}`
      }
      
      return {
        success: false,
        message: errorMessage,
        errors: errorData?.errors || [],
        isBackendIssue
      }
    }
    
    let result
    try {
      result = await response.json()
    } catch {
      const textResponse = await response.text()
      devLog('KYC submit JSON parse error:', textResponse?.slice(0, 200))
      return {
        success: false,
        message: 'Invalid JSON response from backend API'
      }
    }
    
    return result
  } catch (error: any) {
    if (isDev) console.error('Error submitting KYC data:', error)
    return { 
      success: false, 
      message: error.message || 'Failed to submit KYC data. Please try again.' 
    }
  }
}

// Get KYC status (companyId required per API doc; email or userId required)
export const getKYCStatus = async (opts: { companyId: string; email?: string; userId?: string }): Promise<{ success: boolean; data?: any; message?: string }> => {
  const { companyId, email, userId } = opts
  try {
    const params = new URLSearchParams()
    if (companyId) params.append('companyId', companyId)
    if (email) params.append('email', email)
    if (userId) params.append('userId', userId)
    const url = `/api/kyc/status?${params.toString()}`
    const response = await fetch(url)
    const result = await response.json()
    return result
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to get KYC status.' }
  }
}

// Check KYC status by Email (companyId optional per API doc)
export const checkStatusByEmail = async (email: string, companyId?: string): Promise<{ success: boolean; data?: any; message?: string }> => {
  try {
    const body: { email: string; companyId?: string } = { email }
    if (companyId) body.companyId = companyId
    const response = await fetch('/api/kyc/check-status-by-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    let result: { success?: boolean; data?: any; message?: string; error?: string }
    try {
      result = await response.json()
    } catch {
      return { success: false, message: `Server error (${response.status}). Please try again.` }
    }
    if (!response.ok) {
      const msg = result?.message || result?.error || `Request failed (${response.status})`
      return { success: false, message: msg }
    }
    return { success: result?.success !== false, ...result } as { success: boolean; data?: any; message?: string }
  } catch (error: any) {
    return { success: false, message: error?.message || 'Failed to check status. Please try again.' }
  }
}

// Check KYC status by CNIC (companyId required per API doc)
export const checkStatusByCNIC = async (cnic: string, companyId?: string): Promise<{ success: boolean; data?: any; message?: string }> => {
  try {
    const body: { cnic: string; companyId?: string } = { cnic }
    if (companyId) body.companyId = companyId
    const response = await fetch('/api/kyc/check-status-by-cnic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result?.message || `HTTP ${response.status}`)
    return result
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to check status by CNIC.' }
  }
}

// Check KYC status by wallet address
export const checkStatusByWallet = async (walletAddress: string): Promise<{ success: boolean; data?: any; message?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/kyc/check-status-by-wallet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ walletAddress }),
    })
    const result = await response.json()
    return result
  } catch (error: any) {
    if (isDev) console.error('checkStatusByWallet:', error)
    return { 
      success: false, 
      message: error.message || 'Failed to check status. Please try again.' 
    }
  }
}

// Public: Check if KYC is paused
export const getKycPausedStatus = async (): Promise<{ success: boolean; data?: any; message?: string }> => {
  try {
    const response = await fetch('/api/kyc/paused-status', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    })
    if (!response.ok) throw new Error(`API returned status ${response.status}`)
    const data = await response.json().catch(() => ({}))
    return data
  } catch (error: any) {
    if (isDev) console.error('getKycPausedStatus:', error)
    return { success: false, message: error.message || 'Failed to fetch paused status' }
  }
}

// Update KYC documents (for blur rejection)
export const updateKYCDocuments = async (data: {
  email: string
  companyId?: string
  idType?: string
  identityDocumentFront?: string // base64
  identityDocumentBack?: string // base64
  liveInImage?: string // base64 - selfie
  newEmail?: string
}): Promise<{ success: boolean; message?: string; data?: any }> => {
  try {
    const formData = new FormData()
    formData.append('email', data.email)
    formData.append('status', 'pending')
    if (data.companyId) formData.append('companyId', data.companyId)
    if (data.idType) formData.append('idType', data.idType)
    if (data.newEmail) formData.append('newEmail', data.newEmail)
    
    // Convert base64 images to File objects if provided
    if (data.identityDocumentFront) {
      formData.append('identityDocumentFront', base64ToFile(data.identityDocumentFront, 'identity-document-front.jpg'))
    }
    if (data.identityDocumentBack) {
      formData.append('identityDocumentBack', base64ToFile(data.identityDocumentBack, 'identity-document-back.jpg'))
    }
    if (data.liveInImage) {
      formData.append('liveInImage', base64ToFile(data.liveInImage, 'live-in-image.jpg'))
    }
    const response = await fetch('/api/kyc/update-documents', { method: 'PUT', body: formData })
    if (!response.ok) {
      const errorText = await response.text()
      return {
        success: false,
        message: `API error: ${response.status} ${response.statusText}${errorText ? ' - ' + errorText : ''}`
      }
    }
    return response.json()
  } catch (error: any) {
    if (isDev) console.error('updateKYCDocuments:', error)
    return {
      success: false,
      message: error.message || 'Failed to update documents. Please try again.'
    }
  }
}


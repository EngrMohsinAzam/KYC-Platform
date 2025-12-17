// API base URL - imported from centralized config
import { API_BASE_URL } from '../config/config'

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
  fatherName?: string
  email: string
  phone: string
  address?: string
  countryName: string
  cityName: string
  idType: string
  usaResidence: string
  identityDocumentFront: string // base64
  identityDocumentBack: string // base64
  liveInImage: string // base64
  cnic?: string // CNIC number
  transactionHash?: string
  blockNumber?: string
  fromAddress?: string
  toAddress?: string
  amount?: string
  timestamp?: string
  feeUnit?: number
}): Promise<{ success: boolean; message?: string; data?: any; errors?: any[]; isBackendIssue?: boolean }> => {
  console.log('🔥 submitKYCData FUNCTION CALLED!')
  console.log('📥 Received data parameter:', {
    hasUserId: !!data.userId,
    hasEmail: !!data.email,
    hasFullName: !!data.fullName,
    hasPhone: !!data.phone,
    hasCountry: !!data.countryName,
    hasCity: !!data.cityName,
    hasFrontImage: !!data.identityDocumentFront,
    hasBackImage: !!data.identityDocumentBack,
    hasSelfie: !!data.liveInImage
  })
  
  try {
    console.log('📦 Creating FormData...')
    const formData = new FormData()
    console.log('  ✅ FormData created:', formData)
    console.log('full name ',formData.get('fullName'))
    
    // Add text fields - ensure no empty strings for required fields
    // Validate required fields before sending
    const requiredFields: string[] = []
    
    if (!data.userId || data.userId.trim() === '') {
      requiredFields.push('userId')
    }
    if (!data.blockchainAddressId || data.blockchainAddressId.trim() === '') {
      requiredFields.push('blockchainAddressId')
    }
    if (!data.fullName || data.fullName.trim() === '') {
      requiredFields.push('fullName')
    }
    if (!data.email || data.email.trim() === '') {
      requiredFields.push('email')
    }
    if (!data.phone || data.phone.trim() === '') {
      requiredFields.push('phone')
    }
    if (!data.countryName || data.countryName.trim() === '') {
      requiredFields.push('countryName')
    }
    if (!data.cityName || data.cityName.trim() === '') {
      requiredFields.push('cityName')
    }
    if (!data.idType || data.idType.trim() === '') {
      requiredFields.push('idType')
    }
    if (!data.usaResidence || data.usaResidence.trim() === '') {
      requiredFields.push('usaResidence')
    }
    if (!data.identityDocumentFront || data.identityDocumentFront.trim() === '') {
      requiredFields.push('identityDocumentFront')
    }
    if (!data.liveInImage || data.liveInImage.trim() === '') {
      requiredFields.push('liveInImage')
    }
    
    if (requiredFields.length > 0) {
      const errorMsg = `Missing required fields: ${requiredFields.join(', ')}`
      console.error('❌ Validation Error:', errorMsg)
      throw new Error(errorMsg)
    }
    
    formData.append('userId', data.userId.trim())
    // Always send blockchainAddressId - backend requires it
    const blockchainAddressId = data.blockchainAddressId.trim()
    formData.append('blockchainAddressId', blockchainAddressId)
    console.log('  ✅ Added blockchainAddressId:', blockchainAddressId)
    formData.append('fullName', data.fullName.trim())
    // Add individual name fields if provided
    // Add optional name fields (only if they have values)
    if (data.firstName && data.firstName.trim()) {
      formData.append('firstName', data.firstName.trim())
      console.log('  ✅ Added firstName:', data.firstName.trim())
    }
    if (data.lastName && data.lastName.trim()) {
      formData.append('lastName', data.lastName.trim())
      console.log('  ✅ Added lastName:', data.lastName.trim())
    }
    if (data.fatherName && data.fatherName.trim()) {
      formData.append('fatherName', data.fatherName.trim())
      console.log('  ✅ Added fatherName:', data.fatherName.trim())
    }
    
    // Required fields
    formData.append('email', data.email.trim())
    formData.append('phone', data.phone.trim())
    
    // Optional address field
    if (data.address && data.address.trim()) {
      formData.append('address', data.address.trim())
      console.log('  ✅ Added address:', data.address.trim())
    }
    
    // Required location fields
    formData.append('countryName', data.countryName.trim())
    formData.append('cityName', data.cityName.trim())
    formData.append('idType', data.idType.trim())
    formData.append('usaResidence', data.usaResidence.trim())
    formData.append('feeUnit', String(data.feeUnit || 2))
    
    // Add CNIC if provided (backend expects 'cnicNumber')
    if (data.cnic && data.cnic.trim()) {
      formData.append('cnicNumber', data.cnic.trim())
      console.log('  ✅ Added cnicNumber:', data.cnic.trim())
    }
    
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
    
    // Convert base64 images to File objects and append
    console.log('🖼️ Converting images to File objects...')
    try {
      const frontFile = base64ToFile(data.identityDocumentFront, 'identity-document-front.jpg')
      console.log('  ✅ Front file created:', frontFile.name, frontFile.size, 'bytes')
      formData.append('identityDocumentFront', frontFile)
    } catch (err) {
      console.error('  ❌ Error creating front file:', err)
      throw err
    }
    
    try {
      const backFile = base64ToFile(data.identityDocumentBack, 'identity-document-back.jpg')
      console.log('  ✅ Back file created:', backFile.name, backFile.size, 'bytes')
      formData.append('identityDocumentBack', backFile)
    } catch (err) {
      console.error('  ❌ Error creating back file:', err)
      throw err
    }
    
    try {
      const selfieFile = base64ToFile(data.liveInImage, 'live-in-image.jpg')
      console.log('  ✅ Selfie file created:', selfieFile.name, selfieFile.size, 'bytes')
      formData.append('liveInImage', selfieFile)
    } catch (err) {
      console.error('  ❌ Error creating selfie file:', err)
      throw err
    }
    
    console.log('========================================')
    console.log('📤 SUBMITTING TO BACKEND API')
    console.log('========================================')
    console.log('🌐 API Configuration:')
    console.log('  - API Base URL:', API_BASE_URL)
    console.log('  - Full Endpoint:', `${API_BASE_URL}/api/kyc/submit`)
    console.log('  - Request Method: POST')
    console.log('  - Content Type: multipart/form-data (FormData)')
    
    console.log('\n📋 User Information Being Sent:')
    console.log('  - userId:', data.userId)
    console.log('  - blockchainAddressId:', data.blockchainAddressId)
    console.log('  - fullName:', data.fullName)
    console.log('  - email:', data.email)
    console.log('  - phone:', data.phone)
    console.log('  - countryName:', data.countryName)
    console.log('  - cityName:', data.cityName)
    console.log('  - idType:', data.idType)
    console.log('  - usaResidence:', data.usaResidence)
    if (data.cnic) {
      console.log('  - cnic:', data.cnic)
    }
    
    console.log('\n💰 Payment Information:')
    console.log('  - feeUnit:', data.feeUnit || 2)
    if (data.transactionHash) {
      console.log('  - transactionHash:', data.transactionHash)
    }
    if (data.blockNumber) {
      console.log('  - blockNumber:', data.blockNumber)
    }
    if (data.fromAddress) {
      console.log('  - fromAddress:', data.fromAddress)
    }
    if (data.toAddress) {
      console.log('  - toAddress:', data.toAddress)
    }
    if (data.amount) {
      console.log('  - amount:', data.amount)
    }
    if (data.timestamp) {
      console.log('  - timestamp:', data.timestamp)
    }
    
    console.log('\n📷 Image Information:')
    console.log('  - Front Image Present:', !!data.identityDocumentFront)
    console.log('  - Front Image Length:', data.identityDocumentFront?.length || 0, 'characters (base64)')
    console.log('  - Back Image Present:', !!data.identityDocumentBack)
    console.log('  - Back Image Length:', data.identityDocumentBack?.length || 0, 'characters (base64)')
    console.log('  - Selfie Image Present:', !!data.liveInImage)
    console.log('  - Selfie Image Length:', data.liveInImage?.length || 0, 'characters (base64)')
    
    // Log all FormData entries for debugging
    console.log('\n📦 FormData Contents (all fields being sent):')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    const formDataEntries: Record<string, any> = {}
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  ✅ ${key}: File (${value.name}, ${value.size} bytes, ${value.type})`)
        formDataEntries[key] = `File: ${value.name}, ${value.size} bytes`
      } else {
        const valueStr = String(value)
        // Truncate long values for logging
        const displayValue = valueStr.length > 100 ? valueStr.substring(0, 100) + '...' : valueStr
        console.log(`  ✅ ${key}: ${displayValue}`)
        formDataEntries[key] = valueStr.length > 0 ? 'Present' : 'EMPTY'
      }
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n📊 FormData Summary:')
    console.log(JSON.stringify(formDataEntries, null, 2))
    
    // Check for empty critical fields
    const criticalFields = ['userId', 'blockchainAddressId', 'email', 'fullName', 'phone', 'countryName', 'cityName', 'idType', 'usaResidence']
    const emptyFields: string[] = []
    for (const [key, value] of formData.entries()) {
      if (criticalFields.includes(key)) {
        const valueStr = String(value)
        if (!valueStr || valueStr.trim() === '') {
          emptyFields.push(key)
          console.error(`  ❌ ${key}: EMPTY or missing!`)
        }
      }
    }
    if (emptyFields.length > 0) {
      throw new Error(`Critical fields are empty: ${emptyFields.join(', ')}. Please check your data before submission.`)
    }
    
    console.log('\n🚀 Making POST API Request...')
    const fullEndpoint = `${API_BASE_URL}/api/kyc/submit`
    console.log('  - Endpoint:', fullEndpoint)
    console.log('  - Method: POST')
    console.log('  - Content-Type: multipart/form-data (auto-set by browser)')
    
    // Test backend connection first
    console.log('\n🔍 Testing backend connection...')
    try {
      const healthCheckUrl = `${API_BASE_URL}/api/health` // Try health endpoint if available
      const healthResponse = await fetch(healthCheckUrl, { method: 'GET', signal: AbortSignal.timeout(5000) })
      console.log('  - Backend health check:', healthResponse.status)
    } catch (healthError) {
      console.warn('  - Health check failed (this is OK if endpoint doesn\'t exist):', healthError)
    }
    
    // Make the actual request with timeout
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
    
    console.log('\n📡 API Request Sent!')
    console.log('  - Waiting for response...')
    
    console.log('\n📥 Response Received from Backend:')
    console.log('  - Status Code:', response.status)
    console.log('  - Status Text:', response.statusText)
    console.log('  - OK:', response.ok)
    
    if (!response.ok) {
      let errorData: any = null
      let errorText = ''
      try {
        errorText = await response.text()
        console.error('\n❌ Backend API Error Response:')
        console.error('  - Status:', response.status)
        console.error('  - Status Text:', response.statusText)
        console.error('  - Error Response Body (raw):', errorText)
        
        // Try to parse as JSON
        try {
          errorData = JSON.parse(errorText)
          console.error('  - Error Response (parsed):', JSON.stringify(errorData, null, 2))
        } catch (jsonError) {
          console.error('  - Could not parse as JSON, treating as plain text')
        }
      } catch (parseError) {
        console.error('  - Could not read error response')
      }
      
      // Check if it's a connection issue
      if (response.status === 0 || response.status >= 500) {
        return {
          success: false,
          message: `Backend server error (${response.status}). The backend server may be down or unreachable. Please check if the backend is running at ${API_BASE_URL}`,
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
            if (typeof err === 'string') return err
            if (err.field && err.message) return `${err.field}: ${err.message}`
            if (err.message) return err.message
            return JSON.stringify(err)
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
      
      console.error('  - Final Error Message:', errorMessage)
      console.error('  - Is Backend Issue:', isBackendIssue)
      console.log('========================================\n')
      
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
    } catch (jsonError) {
      console.error('❌ Error parsing JSON response:', jsonError)
      const textResponse = await response.text()
      console.error('  - Raw response:', textResponse)
      return {
        success: false,
        message: 'Invalid JSON response from backend API'
      }
    }
    
    console.log('\n✅ Backend API Success Response:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📋 Full Response Data:')
    console.log(JSON.stringify(result, null, 2))
    console.log('\n📊 Response Summary:')
    console.log('  - Success:', result.success)
    if (result.message) {
      console.log('  - Message:', result.message)
    }
    if (result.data) {
      console.log('  - Response Data Keys:', Object.keys(result.data))
      if (result.data.userId) console.log('    ✅ userId:', result.data.userId)
      if (result.data.email) console.log('    ✅ email:', result.data.email)
      if (result.data.kycStatus) console.log('    ✅ kycStatus:', result.data.kycStatus)
      if (result.data.submittedAt) console.log('    ✅ submittedAt:', result.data.submittedAt)
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('========================================\n')
    return result
  } catch (error: any) {
    console.error('Error submitting KYC data:', error)
    return { 
      success: false, 
      message: error.message || 'Failed to submit KYC data. Please try again.' 
    }
  }
}

// Get KYC status
export const getKYCStatus = async (userId?: string, email?: string): Promise<{ success: boolean; data?: any; message?: string }> => {
  console.log('🔍 getKYCStatus FUNCTION CALLED!')
  console.log('  - userId:', userId || 'not provided')
  console.log('  - email:', email || 'not provided')
  
  try {
    const params = new URLSearchParams()
    if (userId) params.append('userId', userId)
    if (email) params.append('email', email)
    
    const url = `${API_BASE_URL}/api/kyc/status?${params.toString()}`
    console.log('  - API URL:', url)
    console.log('  - Making GET request...')
    
    const response = await fetch(url)
    console.log('  - Response status:', response.status)
    
    const result = await response.json()
    console.log('  - Response data:', result)
    return result
  } catch (error: any) {
    console.error('❌ Error getting KYC status:', error)
    return { 
      success: false, 
      message: error.message || 'Failed to get KYC status. Please try again.' 
    }
  }
}

// Check KYC status by Email
export const checkStatusByEmail = async (email: string): Promise<{ success: boolean; data?: any; message?: string }> => {
  console.log('🔍 checkStatusByEmail FUNCTION CALLED!')
  console.log('  - Email:', email)
  
  try {
    // Call backend API directly
    const url = `${API_BASE_URL}/api/kyc/check-status-by-email`
    const requestBody = { email }
    
    console.log('  - API URL:', url)
    console.log('  - Request body:', requestBody)
    console.log('  - Making POST request...')
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })
    
    console.log('  - Response status:', response.status)
    console.log('  - Response statusText:', response.statusText)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    console.log('  - Response data:', result)
    return result
  } catch (error: any) {
    console.error('❌ Error checking status by email:', error)
    return { 
      success: false, 
      message: error.message || 'Failed to check status. Please try again.' 
    }
  }
}

// Check KYC status by CNIC (kept for backward compatibility)
export const checkStatusByCNIC = async (cnic: string): Promise<{ success: boolean; data?: any; message?: string }> => {
  console.log('🔍 checkStatusByCNIC FUNCTION CALLED!')
  console.log('  - CNIC:', cnic)
  
  try {
    const url = `${API_BASE_URL}/api/kyc/check-status-by-cnic`
    const requestBody = { cnic }
    
    console.log('  - API URL:', url)
    console.log('  - Request body:', requestBody)
    console.log('  - Making POST request...')
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })
    
    console.log('  - Response status:', response.status)
    console.log('  - Response statusText:', response.statusText)
    
    const result = await response.json()
    console.log('  - Response data:', result)
    return result
  } catch (error: any) {
    console.error('❌ Error checking status by CNIC:', error)
    return { 
      success: false, 
      message: error.message || 'Failed to check status. Please try again.' 
    }
  }
}

// Check KYC status by wallet address
export const checkStatusByWallet = async (walletAddress: string): Promise<{ success: boolean; data?: any; message?: string }> => {
  console.log('🔍 checkStatusByWallet FUNCTION CALLED!')
  console.log('  - Wallet Address:', walletAddress)
  
  try {
    const url = `${API_BASE_URL}/api/kyc/check-status-by-wallet`
    const requestBody = { walletAddress }
    
    console.log('  - API URL:', url)
    console.log('  - Request body:', requestBody)
    console.log('  - Making POST request...')
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })
    
    console.log('  - Response status:', response.status)
    console.log('  - Response statusText:', response.statusText)
    
    const result = await response.json()
    console.log('  - Response data:', result)
    return result
  } catch (error: any) {
    console.error('❌ Error checking status by wallet:', error)
    return { 
      success: false, 
      message: error.message || 'Failed to check status. Please try again.' 
    }
  }
}

// Update KYC documents (for blur rejection)
export const updateKYCDocuments = async (data: {
  email: string
  idType?: string
  identityDocumentFront?: string // base64
  identityDocumentBack?: string // base64
  liveInImage?: string // base64 - selfie
  newEmail?: string
}): Promise<{ success: boolean; message?: string; data?: any }> => {
  console.log('🔄 updateKYCDocuments FUNCTION CALLED!')
  console.log('📥 Received data:', {
    email: data.email,
    hasFrontImage: !!data.identityDocumentFront,
    hasBackImage: !!data.identityDocumentBack,
    hasSelfie: !!data.liveInImage,
    idType: data.idType,
    newEmail: data.newEmail
  })
  
  try {
    const formData = new FormData()
    
    // Required field
    formData.append('email', data.email)
    
    // Set status to pending when documents are updated (for resubmission after rejection)
    formData.append('status', 'pending')
    
    // Optional fields
    if (data.idType) {
      formData.append('idType', data.idType)
    }
    if (data.newEmail) {
      formData.append('newEmail', data.newEmail)
    }
    
    // Convert base64 images to File objects if provided
    if (data.identityDocumentFront) {
      const frontFile = base64ToFile(data.identityDocumentFront, 'identity-document-front.jpg')
      formData.append('identityDocumentFront', frontFile)
      console.log('  ✅ Added front document')
    }
    
    if (data.identityDocumentBack) {
      const backFile = base64ToFile(data.identityDocumentBack, 'identity-document-back.jpg')
      formData.append('identityDocumentBack', backFile)
      console.log('  ✅ Added back document')
    }
    
    if (data.liveInImage) {
      const selfieFile = base64ToFile(data.liveInImage, 'live-in-image.jpg')
      formData.append('liveInImage', selfieFile)
      console.log('  ✅ Added selfie image')
    }
    
    const url = `${API_BASE_URL}/api/kyc/update-documents`
    console.log('  - API URL:', url)
    console.log('  - Method: PUT')
    
    const response = await fetch(url, {
      method: 'PUT',
      body: formData,
    })
    
    console.log('  - Response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API Error:', errorText)
      return {
        success: false,
        message: `API error: ${response.status} ${response.statusText}${errorText ? ' - ' + errorText : ''}`
      }
    }
    
    const result = await response.json()
    console.log('✅ Update successful:', result)
    
    // Log status information from response
    if (result.data) {
      console.log('📊 Response data status:', {
        kycStatus: result.data.kycStatus,
        verificationStatus: result.data.verificationStatus,
        email: result.data.email
      })
    }
    
    return result
  } catch (error: any) {
    console.error('❌ Error updating documents:', error)
    return {
      success: false,
      message: error.message || 'Failed to update documents. Please try again.'
    }
  }
}


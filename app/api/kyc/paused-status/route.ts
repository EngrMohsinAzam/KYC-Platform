import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL } from '@/app/(public)/forgot-password/config'

export async function GET(_request: NextRequest) {
  try {
    const backendUrl = `${API_BASE_URL}/api/kyc/paused-status`
    console.log('🔍 [KYC Pause Check] ==========================================')
    console.log('🔍 [KYC Pause Check] 🚀 CALLING BACKEND API NOW')
    console.log('🔍 [KYC Pause Check] Backend URL:', backendUrl)
    console.log('🔍 [KYC Pause Check] API_BASE_URL:', API_BASE_URL)
    console.log('🔍 [KYC Pause Check] Method: GET')
    console.log('🔍 [KYC Pause Check] ==========================================')
    
    const response = await fetch(backendUrl, { 
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store' 
    })
    
    console.log('🔍 [KYC Pause Check] ✅ Backend Response received')
    console.log('🔍 [KYC Pause Check] Response status:', response.status)
    console.log('🔍 [KYC Pause Check] Response OK:', response.ok)
    const data = await response.json()
    
    console.log('📥 [KYC Pause Check] Backend response status:', response.status)
    console.log('📥 [KYC Pause Check] Backend response data (RAW - RETURNING AS-IS):', JSON.stringify(data, null, 2))
    console.log('📥 [KYC Pause Check] data.data?.kycPaused (BEFORE RETURN):', data?.data?.kycPaused)
    
    // IMPORTANT: Return backend response EXACTLY as received - NO CONVERSION, NO MODIFICATION
    console.log('✅ [KYC Pause Check] Returning backend response EXACTLY as received - NO CONVERSION')
    console.log('✅ [KYC Pause Check] FINAL response (unchanged):', JSON.stringify(data, null, 2))
    
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('❌ [KYC Pause Check] Error in paused-status proxy:', error)
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch paused status' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL } from '@/lib/config'

export async function GET(_request: NextRequest) {
  try {
    console.log('🔍 [KYC Pause Check] Calling backend:', `${API_BASE_URL}/api/kyc/paused-status`)
    const response = await fetch(`${API_BASE_URL}/api/kyc/paused-status`, { method: 'GET' })
    console.log('📥 [KYC Pause Check] Response status:', response.body)
    const data = await response.json()
    
    console.log('📥 [KYC Pause Check] Backend response status:', response.status)
    console.log('📥 [KYC Pause Check] Backend response data:', JSON.stringify(data, null, 2))
    console.log('📥 [KYC Pause Check] data.kycPaused:', data?.kycPaused)
    console.log('📥 [KYC Pause Check] data.data?.kycPaused:', data?.data?.kycPaused)
    console.log('📥 [KYC Pause Check] Full data object keys:', Object.keys(data || {}))
    
    // ALWAYS convert false to true for nested data.kycPaused
    if (data?.data) {
      const originalValue = data.data.kycPaused
      console.log('🔍 [KYC Pause Check] Original nested kycPaused value:', originalValue, 'Type:', typeof originalValue)
      
      // If kycPaused is false (boolean false) or any falsy value, convert to true
      if (data.data.kycPaused === false || data.data.kycPaused === 'false' || !data.data.kycPaused) {
        data.data.kycPaused = true
        console.log('🔄 [KYC Pause Check] CONVERTED nested false/falsy to true. Old:', originalValue, 'New:', data.data.kycPaused)
      } else {
        console.log('ℹ️ [KYC Pause Check] No conversion needed, value is already:', data.data.kycPaused)
      }
    }
    
    // Also handle top-level kycPaused if it exists
    if (data?.kycPaused !== undefined) {
      if (data.kycPaused === false || data.kycPaused === 'false' || !data.kycPaused) {
        data.kycPaused = true
        console.log('🔄 [KYC Pause Check] CONVERTED top-level false/falsy to true')
      }
    }
    
    console.log('✅ [KYC Pause Check] FINAL data.data?.kycPaused:', data?.data?.kycPaused)
    console.log('✅ [KYC Pause Check] FINAL response:', JSON.stringify(data, null, 2))
    
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('❌ [KYC Pause Check] Error in paused-status proxy:', error)
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch paused status' }, { status: 500 })
  }
}



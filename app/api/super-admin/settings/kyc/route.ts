import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL } from '@/lib/config'

// Force dynamic rendering since we use request.headers
export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ success: false, message: 'Authorization header required' }, { status: 401 })
    }

    const body = await request.json()
    console.log('📤 [KYC Settings API] Request body:', JSON.stringify(body, null, 2))
    console.log('📤 [KYC Settings API] Sending to backend:', `${API_BASE_URL}/api/super-admin/settings/kyc`)
    
    const response = await fetch(`${API_BASE_URL}/api/super-admin/settings/kyc`, {
      method: 'PATCH',
      headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    console.log('📥 [KYC Settings API] Backend response status:', response.status)
    const data = await response.json().catch(() => ({}))
    console.log('📥 [KYC Settings API] Backend response data:', JSON.stringify(data, null, 2))
    
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('❌ [KYC Settings API] Error in super-admin KYC settings proxy:', error)
    return NextResponse.json({ success: false, message: error.message || 'Failed to update KYC settings' }, { status: 500 })
  }
}



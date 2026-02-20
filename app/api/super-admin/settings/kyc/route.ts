import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL } from '@/app/(public)/config'

// Force dynamic rendering since we use request.headers
export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ success: false, message: 'Authorization header required' }, { status: 401 })
    }

    const body = await request.json()
    const response = await fetch(`${API_BASE_URL}/api/super-admin/settings/kyc`, {
      method: 'PATCH',
      headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await response.json().catch(() => ({}))
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') console.error('[KYC Settings]', error.message)
    return NextResponse.json({ success: false, message: error.message || 'Failed to update KYC settings' }, { status: 500 })
  }
}



import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL } from '@/lib/config'

// Force dynamic rendering since we use request.headers
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ success: false, message: 'Authorization header required' }, { status: 401 })
    }

    const response = await fetch(`${API_BASE_URL}/api/super-admin/wallets/total`, {
      method: 'GET',
      headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
    })

    const data = await response.json().catch(() => ({}))
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('Error in super-admin wallets total proxy:', error)
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch wallets total' }, { status: 500 })
  }
}



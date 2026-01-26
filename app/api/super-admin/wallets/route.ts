import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL } from '@/app/(public)/forgot-password/config'

// Force dynamic rendering since we use request.headers and request.nextUrl
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ success: false, message: 'Authorization header required' }, { status: 401 })
    }

    const qs = request.nextUrl.searchParams.toString()
    const response = await fetch(`${API_BASE_URL}/api/super-admin/wallets?${qs}`, {
      method: 'GET',
      headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('Error in super-admin wallets list proxy:', error)
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch wallets' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ success: false, message: 'Authorization header required' }, { status: 401 })
    }

    const body = await request.json()
    const response = await fetch(`${API_BASE_URL}/api/super-admin/wallets`, {
      method: 'POST',
      headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await response.json().catch(() => ({}))
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('Error in super-admin add wallet proxy:', error)
    return NextResponse.json({ success: false, message: error.message || 'Failed to add wallet' }, { status: 500 })
  }
}



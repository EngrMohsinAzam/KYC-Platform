import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL } from '@/app/(public)/config'

export async function GET(_request: NextRequest) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/kyc/paused-status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    })
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') console.error('[KYC Pause]', error)
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch paused status' }, { status: 500 })
  }
}

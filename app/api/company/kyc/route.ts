import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL } from '@/app/(public)/config'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = request.headers.get('authorization')
    if (!auth) return NextResponse.json({ success: false, message: 'Authorization required' }, { status: 401 })
    const qs = request.nextUrl.searchParams.toString()
    const res = await fetch(`${API_BASE_URL}/api/company/kyc?${qs}`, {
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message || 'Failed to fetch KYC list' }, { status: 500 })
  }
}

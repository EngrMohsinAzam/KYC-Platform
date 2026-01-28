import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL } from '@/app/(public)/config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const res = await fetch(`${API_BASE_URL}/api/company/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message || 'Login failed' }, { status: 500 })
  }
}

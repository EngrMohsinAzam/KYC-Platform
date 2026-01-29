import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL } from '@/app/(public)/config'

export const dynamic = 'force-dynamic'

export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData()
    const res = await fetch(`${API_BASE_URL}/api/kyc/update-documents`, {
      method: 'PUT',
      body: formData,
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message || 'Update documents failed' }, { status: 500 })
  }
}

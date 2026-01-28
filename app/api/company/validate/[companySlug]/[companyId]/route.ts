import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL } from '@/app/(public)/config'

type Params = { params: { companySlug: string; companyId: string } }

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { companySlug, companyId } = params
    const res = await fetch(
      `${API_BASE_URL}/api/company/validate/${encodeURIComponent(companySlug)}/${encodeURIComponent(companyId)}`,
      { headers: { 'Content-Type': 'application/json' } }
    )
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message || 'Validation failed' }, { status: 500 })
  }
}

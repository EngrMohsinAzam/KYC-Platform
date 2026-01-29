import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL } from '@/app/(public)/config'

export const dynamic = 'force-dynamic'

type Params = { params: { id: string } }

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const auth = request.headers.get('authorization')
    if (!auth) return NextResponse.json({ success: false, message: 'Authorization required' }, { status: 401 })
    const id = params.id
    const body = await request.json()
    const res = await fetch(`${API_BASE_URL}/api/super-admin/support/issues/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message || 'Failed to update issue status' }, { status: 500 })
  }
}

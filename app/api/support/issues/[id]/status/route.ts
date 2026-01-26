import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL } from '@/app/(public)/forgot-password/config'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ success: false, message: 'Authorization header required' }, { status: 401 })
    }

    const body = await request.json()

    const response = await fetch(`${API_BASE_URL}/api/support/issues/${encodeURIComponent(params.id)}/status`, {
      method: 'PATCH',
      headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('Error in support issue status update proxy:', error)
    return NextResponse.json({ success: false, message: error.message || 'Failed to update support issue status' }, { status: 500 })
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL } from '@/app/(public)/config'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ success: false, message: 'Authorization header required' }, { status: 401 })
    }

    const response = await fetch(`${API_BASE_URL}/api/support/issues/${encodeURIComponent(params.id)}`, {
      method: 'GET',
      headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('Error in support issue detail proxy:', error)
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch support issue' }, { status: 500 })
  }
}




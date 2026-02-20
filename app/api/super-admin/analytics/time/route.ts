import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL } from '@/app/(public)/config'

// Force dynamic rendering since we use request.headers and request.nextUrl
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ success: false, message: 'Authorization header required' }, { status: 401 })
    }

    const qs = request.nextUrl.searchParams.toString()
    let response: Response
    try {
      response = await fetch(`${API_BASE_URL}/api/super-admin/analytics/time?${qs}`, {
        method: 'GET',
        headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
      })
    } catch (fetchError: any) {
      return NextResponse.json({ 
        success: false, 
        message: `Cannot connect to backend at ${API_BASE_URL}. Please ensure the backend server is running.` 
      }, { status: 503 })
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(`Backend returned ${response.status}: ${response.statusText}${errorText ? ` - ${errorText}` : ''}`)
    }
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') console.error('[Analytics Time]', error.message)
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch analytics' }, { status: 500 })
  }
}



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
    const backendUrl = `${API_BASE_URL}/api/super-admin/analytics/time?${qs}`
    console.log('🔍 [Analytics Time] Calling backend:', backendUrl)
    
    let response: Response
    try {
      response = await fetch(backendUrl, {
        method: 'GET',
        headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
      })
    } catch (fetchError: any) {
      console.error('❌ [Analytics Time] Fetch failed (connection error):', fetchError.message)
      console.error('❌ [Analytics Time] API_BASE_URL:', API_BASE_URL)
      console.error('❌ [Analytics Time] Make sure backend is running at:', API_BASE_URL)
      return NextResponse.json({ 
        success: false, 
        message: `Cannot connect to backend at ${API_BASE_URL}. Please ensure the backend server is running.` 
      }, { status: 503 })
    }

    if (!response.ok) {
      console.error('❌ [Analytics Time] Backend returned error:', response.status, response.statusText)
      const errorText = await response.text().catch(() => '')
      throw new Error(`Backend returned ${response.status}: ${response.statusText}${errorText ? ` - ${errorText}` : ''}`)
    }

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('❌ [Analytics Time] Error in proxy:', error)
    console.error('❌ [Analytics Time] API_BASE_URL:', API_BASE_URL)
    console.error('❌ [Analytics Time] Error message:', error.message)
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch analytics' }, { status: 500 })
  }
}



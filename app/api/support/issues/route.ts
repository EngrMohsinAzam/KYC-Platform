import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL } from '@/lib/config'

// Force dynamic rendering since we use request.headers and request.nextUrl
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ success: false, message: 'Authorization header required' }, { status: 401 })
    }

    const qs = request.nextUrl.searchParams.toString()
    const url = `${API_BASE_URL}/api/support/issues?${qs}`
    console.log('🔍 [Support Issues API] Calling backend:', url)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
    })

    console.log('📥 [Support Issues API] Backend response status:', response.status)
    const data = await response.json()
    console.log('📥 [Support Issues API] Backend response data:', JSON.stringify(data, null, 2))
    
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('❌ [Support Issues API] Error in support issues list proxy:', error)
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch support issues' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const response = await fetch(`${API_BASE_URL}/api/support/issues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('Error in support issue create proxy:', error)
    return NextResponse.json({ success: false, message: error.message || 'Failed to create support issue' }, { status: 500 })
  }
}



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
    const backendUrl = `${API_BASE_URL}/api/super-admin/admins?${qs}`
    console.log('🔍 [Admins List] Calling backend:', backendUrl)
    
    let response: Response
    try {
      response = await fetch(backendUrl, {
        method: 'GET',
        headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
      })
    } catch (fetchError: any) {
      console.error('❌ [Admins List] Fetch failed (connection error):', fetchError.message)
      console.error('❌ [Admins List] API_BASE_URL:', API_BASE_URL)
      console.error('❌ [Admins List] Make sure backend is running at:', API_BASE_URL)
      return NextResponse.json({ 
        success: false, 
        message: `Cannot connect to backend at ${API_BASE_URL}. Please ensure the backend server is running.` 
      }, { status: 503 })
    }

    if (!response.ok) {
      console.error('❌ [Admins List] Backend returned error:', response.status, response.statusText)
      const errorText = await response.text().catch(() => '')
      throw new Error(`Backend returned ${response.status}: ${response.statusText}${errorText ? ` - ${errorText}` : ''}`)
    }

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('❌ [Admins List] Error in proxy:', error)
    console.error('❌ [Admins List] API_BASE_URL:', API_BASE_URL)
    console.error('❌ [Admins List] Error message:', error.message)
    return NextResponse.json({ success: false, message: error.message || 'Failed to list admins' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ success: false, message: 'Authorization header required' }, { status: 401 })
    }

    const body = await request.json()
    const response = await fetch(`${API_BASE_URL}/api/super-admin/admins`, {
      method: 'POST',
      headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('Error in super-admin create admin proxy:', error)
    return NextResponse.json({ success: false, message: error.message || 'Failed to create admin' }, { status: 500 })
  }
}



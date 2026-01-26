import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL } from '@/app/(public)/forgot-password/config'

// Force dynamic rendering since we use request.headers and request.nextUrl
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Authorization header required' },
        { status: 401 }
      )
    }

    // Get query parameters from the request
    const searchParams = request.nextUrl.searchParams
    const queryString = searchParams.toString()

    const response = await fetch(`${API_BASE_URL}/api/admin/users?${queryString}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('Error in admin users proxy:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch users' },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://xzfjrnv9-3099.asse.devtunnels.ms'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Authorization header required' },
        { status: 401 }
      )
    }

    const userId = params.userId
    const encodedUserId = encodeURIComponent(userId)

    const response = await fetch(`${API_BASE_URL}/api/admin/users/${encodedUserId}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('Error in admin user details proxy:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch user details' },
      { status: 500 }
    )
  }
}


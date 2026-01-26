import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL } from '@/app/(public)/forgot-password/config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('Error in admin login proxy:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to login' },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL } from '@/app/(public)/config'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ success: false, message: 'Authorization header required' }, { status: 401 })
    }

    const response = await fetch(`${API_BASE_URL}/api/super-admin/wallets/${encodeURIComponent(params.id)}`, {
      method: 'DELETE',
      headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
    })

    const text = await response.text()
    const data = text ? JSON.parse(text) : { success: response.ok }
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('Error in super-admin remove wallet proxy:', error)
    return NextResponse.json({ success: false, message: error.message || 'Failed to remove wallet' }, { status: 500 })
  }
}



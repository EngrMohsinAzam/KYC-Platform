import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL } from '@/app/(public)/config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, companyId } = body

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      )
    }

    const payload: { email: string; companyId?: string } = { email }
    if (companyId) payload.companyId = companyId

    const response = await fetch(`${API_BASE_URL}/api/kyc/check-status-by-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const text = await response.text()
    let data: Record<string, unknown>
    try {
      data = text ? (JSON.parse(text) as Record<string, unknown>) : {}
    } catch {
      return NextResponse.json(
        { success: false, message: text?.slice(0, 200) || `Backend returned ${response.status}` },
        { status: response.status }
      )
    }

    if (!response.ok) {
      const message = (data?.message as string) || (data?.error as string) || `Request failed (${response.status})`
      return NextResponse.json(
        { success: false, message, ...(typeof data === 'object' ? data : {}) },
        { status: response.status }
      )
    }
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('Error in check-status-by-email proxy:', error)
    const msg = error?.message || (error?.cause?.message) || 'Failed to check status'
    return NextResponse.json(
      { success: false, message: msg },
      { status: 500 }
    )
  }
}


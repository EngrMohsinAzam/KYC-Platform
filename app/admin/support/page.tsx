'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAdminToken } from '@/lib/api/admin-api'
import { LoadingDots } from '@/components/ui/LoadingDots'

type SupportIssue = {
  id?: string
  _id?: string
  email: string
  description: string
  status?: string
  createdAt?: string
}

export default function AdminSupportPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [issues, setIssues] = useState<SupportIssue[]>([])
  const [error, setError] = useState('')
  const [status, setStatus] = useState('all')

  useEffect(() => {
    const token = getAdminToken()
    if (!token) router.replace('/admin')
  }, [router])

  const load = async () => {
    const token = getAdminToken()
    if (!token) return
    try {
      setLoading(true)
      setError('')
      const qs = new URLSearchParams({ page: '1', limit: '50', status })
      const url = `/api/support/issues?${qs.toString()}`
      console.log('📡 [Admin Support Issues] Fetching:', url, 'Status filter:', status)
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      console.log('📥 [Admin Support Issues] Response status:', response.status)
      const data = await response.json()
      console.log('📥 [Admin Support Issues] Full response:', JSON.stringify(data, null, 2))
      
      if (!data.success) {
        console.error('❌ [Admin Support Issues] API returned success: false', data.message)
        setError(data.message || 'Failed to load issues')
        setIssues([])
        return
      }
      
      // Try multiple possible response shapes
      const list = 
        data.data?.issues || 
        data.data?.items || 
        data.data?.results || 
        data.data?.data ||
        data.issues ||
        data.items ||
        data.results ||
        (Array.isArray(data.data) ? data.data : []) ||
        []
      
      console.log('📋 [Admin Support Issues] Parsed list:', list)
      console.log('📋 [Admin Support Issues] List length:', list.length)
      console.log('📋 [Admin Support Issues] Is array:', Array.isArray(list))
      
      setIssues(Array.isArray(list) ? list : [])
    } catch (e: any) {
      console.error('❌ [Admin Support Issues] Error:', e)
      setError(e.message || 'Failed to load issues')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Customer support</h1>
          <p className="text-sm text-gray-600 mt-1">View and manage support issues from users.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm"
          >
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
            <option value="all">All</option>
          </select>
          <button
            onClick={load}
            className="px-4 py-2 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-sm font-medium"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Issues</h2>
          {loading && <LoadingDots size="sm" />}
        </div>
        <div className="divide-y divide-gray-200">
          {!loading && issues.length === 0 ? (
            <div className="p-6 text-sm text-gray-600">No issues found.</div>
          ) : (
            issues.map((i) => {
              const id = String(i.id || i._id || '')
              const rawStatus = String(i.status || 'pending').toLowerCase()
              const normalizedStatus = rawStatus === 'open' ? 'pending' : rawStatus
              const chip =
                normalizedStatus === 'resolved'
                  ? 'bg-green-50 text-green-800 border-green-200'
                  : normalizedStatus === 'closed'
                    ? 'bg-gray-100 text-gray-700 border-gray-200'
                    : 'bg-yellow-50 text-yellow-800 border-yellow-200'
              return (
                <button
                  key={id || `${i.email}-${i.createdAt}`}
                  onClick={() => id && router.push(`/admin/support/${id}`)}
                  className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors"
                  disabled={!id}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{i.email}</p>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{i.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${chip}`}>
                        {normalizedStatus}
                      </span>
                      <span className="text-xs text-gray-500">
                        {i.createdAt ? new Date(i.createdAt).toLocaleString() : '—'}
                      </span>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>
    </main>
  )
}


'use client'

import { useState, useEffect, useCallback } from 'react'
import { companySupportUserIssues } from '@/app/api/company-api'

type Issue = {
  _id?: string
  issueType?: string
  name?: string
  email?: string
  description?: string
  companyId?: string
  companyName?: string
  status?: string
  createdAt?: string
}

export default function CompanySupportPage() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const res = await companySupportUserIssues({ limit: 50, page: 1 })
      if (res?.success && res?.data) {
        const data = res.data as { issues?: Issue[] }
        setIssues(Array.isArray(data.issues) ? data.issues : [])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-gray-900" />
      </div>
    )
  }

  const openCount = issues.filter((i) => (i.status || 'open').toLowerCase() === 'open').length
  const resolvedCount = issues.filter((i) => ['resolved', 'closed'].includes((i.status || '').toLowerCase())).length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Support</h1>
        <p className="text-sm text-gray-600 mt-1">Issues raised by your customers (users doing KYC with you)</p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase">Total</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{issues.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase">Open</p>
          <p className="text-xl font-bold text-blue-700 mt-1">{openCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase">Resolved</p>
          <p className="text-xl font-bold text-green-700 mt-1">{resolvedCount}</p>
        </div>
      </div>

      {/* Customer issues list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Customer support issues</h2>
          <p className="text-sm text-gray-600 mt-0.5">Issues your users have raised while doing KYC</p>
        </div>
        {issues.length === 0 ? (
          <div className="px-4 sm:px-6 py-12 text-center text-gray-500">
            <p>No customer support issues yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {issues.map((issue) => (
              <div key={issue._id!} className="px-4 sm:px-6 py-4 hover:bg-gray-50">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900">{issue.name || issue.email || '—'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {issue.email} · {issue.createdAt ? new Date(issue.createdAt).toLocaleString() : '—'}
                    </p>
                  </div>
                  <span
                    className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                      issue.status === 'resolved' || issue.status === 'closed'
                        ? 'bg-green-100 text-green-800'
                        : issue.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {issue.status || 'open'}
                  </span>
                </div>
                {issue.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{issue.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

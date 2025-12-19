'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getSuperAdminToken, superAdminReplySupportIssue } from '@/lib/api/super-admin-api'
import { LoadingDots, LoadingPage } from '@/components/ui/LoadingDots'

export default function SuperAdminSupportDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [issue, setIssue] = useState<any>(null)
  const [replyOpen, setReplyOpen] = useState(false)
  const [subject, setSubject] = useState('Support Reply')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sendSuccess, setSendSuccess] = useState<string | null>(null)
  const [markingResolved, setMarkingResolved] = useState(false)
  const [markError, setMarkError] = useState<string | null>(null)
  const [markSuccess, setMarkSuccess] = useState<string | null>(null)

  useEffect(() => {
    const token = getSuperAdminToken()
    if (!token) router.replace('/super-admin')
  }, [router])

  useEffect(() => {
    const token = getSuperAdminToken()
    if (!token) return
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await fetch(`/api/support/issues/${encodeURIComponent(id)}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await response.json()
        if (!data.success) {
          setError(data.message || 'Failed to load issue')
          setIssue(null)
          return
        }
        setIssue(data.data || data.issue || data)
      } catch (e: any) {
        setError(e.message || 'Failed to load issue')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return <LoadingPage message="Loading issue..." />

  if (error || !issue) {
    return (
      <main className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <button onClick={() => router.push('/super-admin/support')} className="text-sm text-gray-700 hover:underline">
          ← Back
        </button>
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error || 'Issue not found'}
        </div>
      </main>
    )
  }

  const rawStatus = (issue.status || 'pending').toString().toLowerCase()
  const status = rawStatus === 'open' ? 'pending' : rawStatus
  const statusClasses =
    status === 'resolved'
      ? 'bg-green-50 text-green-800 border-green-200'
      : status === 'closed'
        ? 'bg-gray-100 text-gray-700 border-gray-200'
        : 'bg-yellow-50 text-yellow-800 border-yellow-200'

  const markAsResolved = async () => {
    const token = getSuperAdminToken()
    if (!token) return
    
    setMarkError(null)
    setMarkSuccess(null)
    
    try {
      setMarkingResolved(true)
      const response = await fetch(`/api/support/issues/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'resolved' }),
      })
      
      const data = await response.json()
      if (!data.success) {
        throw new Error(data.message || 'Failed to mark as resolved')
      }
      
      setMarkSuccess('Issue marked as resolved successfully.')
      // Reload issue to get updated status
      const reloadResponse = await fetch(`/api/support/issues/${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const reloadData = await reloadResponse.json()
      if (reloadData.success) {
        setIssue(reloadData.data || reloadData.issue || reloadData)
      }
    } catch (e: any) {
      setMarkError(e.message || 'Failed to mark as resolved')
    } finally {
      setMarkingResolved(false)
    }
  }

  const onSend = async () => {
    setSendError(null)
    setSendSuccess(null)
    if (!issue.email) {
      setSendError('Issue email is missing.')
      return
    }
    if (!subject.trim()) {
      setSendError('Subject is required.')
      return
    }
    if (!message.trim() || message.trim().length < 5) {
      setSendError('Message is required (min 5 chars).')
      return
    }

    try {
      setSending(true)
      const res = await superAdminReplySupportIssue(id, {
        to: issue.email,
        subject: subject.trim(),
        message: message.trim(),
      })

      if (!res?.success) throw new Error(res?.message || 'Failed to send reply')
      setSendSuccess('Reply sent successfully.')
      setMessage('')
      setReplyOpen(false)
    } catch (e: any) {
      setSendError(e?.message || 'Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <div className="flex items-center justify-between gap-4">
        <button onClick={() => router.push('/super-admin/support')} className="text-sm text-gray-700 hover:underline">
          ← Back to support
        </button>
        <div className="flex gap-2">
          {status !== 'resolved' && status !== 'closed' && (
            <button
              onClick={markAsResolved}
              disabled={markingResolved}
              className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {markingResolved ? (
                <>
                  <LoadingDots size="sm" color="#ffffff" />
                  Marking...
                </>
              ) : (
                'Mark as Resolved'
              )}
            </button>
          )}
          <button
            onClick={() => setReplyOpen(true)}
            className="px-4 py-2 rounded-xl bg-black hover:bg-black/80 text-white text-sm font-medium"
          >
            Reply
          </button>
        </div>
      </div>

      {sendSuccess && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
          {sendSuccess}
        </div>
      )}

      {markSuccess && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
          {markSuccess}
        </div>
      )}

      {markError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {markError}
        </div>
      )}

      <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900">Support Issue</h1>
            <p className="text-sm text-gray-600 mt-1 truncate">{issue.email || '—'}</p>
          </div>
          <span className={`px-3 py-1 rounded-full border text-xs font-semibold ${statusClasses}`}>
            {status}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-gray-200">
            <p className="text-xs text-gray-500">Created</p>
            <p className="text-sm font-medium text-gray-900 mt-1">
              {issue.createdAt ? new Date(issue.createdAt).toLocaleString() : '—'}
            </p>
          </div>
          <div className="p-4 rounded-xl border border-gray-200">
            <p className="text-xs text-gray-500">Issue ID</p>
            <p className="text-sm font-medium text-gray-900 mt-1 break-all">{String(issue.id || issue._id || id)}</p>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs text-gray-500">Description</p>
          <div className="mt-2 p-4 rounded-xl bg-gray-50 border border-gray-200">
            <p className="text-sm text-gray-900 whitespace-pre-wrap">{issue.description || '—'}</p>
          </div>
        </div>
      </div>

      {/* Reply modal */}
      {replyOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-gray-200 shadow-xl">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Reply to user</p>
                <p className="text-xs text-gray-500 mt-0.5">{issue.email}</p>
              </div>
              <button
                onClick={() => {
                  setReplyOpen(false)
                  setSendError(null)
                }}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-4">
              {sendError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{sendError}</div>
              )}

              <div>
                <label className="text-xs font-medium text-gray-700">Subject</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-black text-sm"
                  placeholder="Support Reply"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-black text-sm"
                  placeholder="Write your reply..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setReplyOpen(false)}
                  className="flex-1 px-4 py-2 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-sm font-medium"
                  disabled={sending}
                >
                  Cancel
                </button>
                <button
                  onClick={onSend}
                  className="flex-1 px-4 py-2 rounded-xl bg-black hover:bg-black/80 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={sending}
                >
                  {sending ? (
                    <>
                      <LoadingDots size="sm" color="#ffffff" />
                      Sending...
                    </>
                  ) : (
                    'Send reply'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}



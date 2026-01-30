'use client'

import { useState, useEffect, useCallback } from 'react'
import { companySupportCreateIssue, companySupportMyIssuesList } from '@/app/api/company-api'

const CATEGORIES = ['technical', 'billing', 'account', 'kyc', 'general', 'other'] as const

type MyIssue = {
  _id?: string
  subject?: string
  description?: string
  category?: string
  status?: string
  adminReply?: string
  repliedAt?: string
  createdAt?: string
}

export default function CompanyHelpPage() {
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ subject: '', description: '', category: 'general' as string })
  const [issues, setIssues] = useState<MyIssue[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await companySupportMyIssuesList()
      if (res?.success && res?.data?.issues) {
        setIssues(Array.isArray(res.data.issues) ? res.data.issues : [])
      }
    } catch {
      setIssues([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.subject.trim() || !form.description.trim()) return
    setError('')
    setSubmitting(true)
    try {
      const r = await companySupportCreateIssue({
        subject: form.subject.trim(),
        description: form.description.trim(),
        category: form.category,
      })
      if (r?.success) {
        setForm({ subject: '', description: '', category: 'general' })
        setSent(true)
        setError('')
        await load()
      } else {
        setError(r?.message || 'Failed to send')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Help</h1>
        <p className="text-sm text-gray-600 mt-1">Issues you&apos;ve raised with Super Admin – contact us for help</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Contact us</h2>
          <p className="text-sm text-gray-600 mb-4">
            Send a message to Super Admin. Track your requests below.
          </p>
          {sent && (
            <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm">
              Message sent. We&apos;ll reply soon.
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="Brief summary"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="How can we help?"
                rows={4}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {submitting ? 'Sending…' : 'Send'}
            </button>
          </form>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Issues you&apos;ve raised</h2>
          <p className="text-sm text-gray-600 mb-4">
            Issues your company has raised with Super Admin.
          </p>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-900" />
            </div>
          ) : issues.length === 0 ? (
            <p className="text-sm text-gray-500">No issues yet.</p>
          ) : (
            <div className="space-y-3 max-h-[320px] overflow-y-auto">
              {issues.map((issue) => (
                <div key={issue._id!} className="p-3 rounded-lg border border-gray-100">
                  <p className="font-medium text-gray-900 text-sm">{issue.subject || '—'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {issue.category} · {issue.createdAt ? new Date(issue.createdAt).toLocaleString() : '—'}
                  </p>
                  <span className={`inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                    issue.status === 'resolved' || issue.status === 'closed' ? 'bg-green-100 text-green-800' :
                    issue.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {issue.status || 'open'}
                  </span>
                  {issue.adminReply && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                      <p className="font-medium text-gray-600">Reply:</p>
                      <p className="text-gray-700 mt-0.5">{issue.adminReply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

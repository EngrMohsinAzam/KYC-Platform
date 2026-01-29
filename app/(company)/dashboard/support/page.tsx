'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  companySupportMyIssuesList,
  companySupportCreateIssue,
  companySupportStats
} from '@/app/api/company-api'

type Issue = {
  _id?: string
  issueType?: string
  subject?: string
  description?: string
  category?: string
  status?: string
  adminReply?: string
  repliedAt?: string
  createdAt?: string
}

const CATEGORIES = ['technical', 'billing', 'account', 'kyc', 'general', 'other'] as const

export default function CompanySupportPage() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [stats, setStats] = useState<{ total?: number; open?: number; pending?: number; resolved?: number; closed?: number }>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ subject: '', description: '', category: 'technical' })

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const [issuesRes, statsRes] = await Promise.all([
        companySupportMyIssuesList(),
        companySupportStats()
      ])
      if (issuesRes?.success && issuesRes?.data?.issues) {
        setIssues(Array.isArray(issuesRes.data.issues) ? issuesRes.data.issues : [])
      }
      if (statsRes?.success && statsRes?.data) {
        setStats(statsRes.data)
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.subject.trim() || !form.description.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const r = await companySupportCreateIssue({
        subject: form.subject.trim(),
        description: form.description.trim(),
        category: form.category
      })
      if (!r?.success) {
        setError(r?.message || 'Failed to create issue')
        return
      }
      setForm({ subject: '', description: '', category: 'technical' })
      setShowForm(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-gray-900" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Support</h1>
          <p className="text-sm text-gray-600 mt-1">Issues your company has raised with us</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {showForm ? 'Cancel' : 'New issue'}
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create support issue</h2>
          <form onSubmit={handleCreate} className="space-y-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Describe your issue..."
                rows={4}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                {submitting ? 'Sending…' : 'Submit'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase">Total</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{Number(stats.total ?? 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase">Open</p>
          <p className="text-xl font-bold text-blue-700 mt-1">{Number(stats.open ?? 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase">Pending</p>
          <p className="text-xl font-bold text-yellow-700 mt-1">{Number(stats.pending ?? 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase">Resolved</p>
          <p className="text-xl font-bold text-green-700 mt-1">{Number(stats.resolved ?? 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Issues list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Your issues</h2>
          <p className="text-sm text-gray-600 mt-0.5">All issues your company has raised</p>
        </div>
        {issues.length === 0 ? (
          <div className="px-4 sm:px-6 py-12 text-center text-gray-500">
            <p>No support issues yet.</p>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-2 text-sm font-medium text-gray-900 hover:underline"
            >
              Create one
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {issues.map((issue) => (
              <div key={issue._id!} className="px-4 sm:px-6 py-4 hover:bg-gray-50">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900">{issue.subject || 'No subject'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {issue.category} · {issue.createdAt ? new Date(issue.createdAt).toLocaleString() : '—'}
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
                {issue.adminReply && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase">Reply</p>
                    <p className="text-sm text-gray-700 mt-1">{issue.adminReply}</p>
                    {issue.repliedAt && (
                      <p className="text-xs text-gray-500 mt-2">{new Date(issue.repliedAt).toLocaleString()}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

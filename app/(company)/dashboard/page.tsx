'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { companyProfile, companyDashboardStats } from '@/app/api/company-api'

type Profile = {
  companyName?: string
  companyId?: string
  companySlug?: string
  email?: string
  kycUrl?: string
  totalKycSubmissions?: number
  approvedKycCount?: number
  pendingKycCount?: number
  rejectedKycCount?: number
  package?: string
  plan?: string
}

type Stats = {
  kyc?: {
    total?: number
    pending?: number
    submitted?: number
    under_review?: number
    approved?: number
    rejected?: number
  }
  support?: { total?: number; open?: number; pending?: number; resolved?: number; closed?: number }
  recentKyc?: Array<{
    userId?: string
    fullName?: string
    email?: string
    kycStatus?: string
    submittedAt?: string
  }>
}

export default function CompanyDashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const [p, s] = await Promise.all([companyProfile(), companyDashboardStats()])
      if (!p?.success) {
        setError(p?.message || 'Failed to load profile')
        return
      }
      if (!s?.success) {
        setError(s?.message || 'Failed to load stats')
        return
      }
      setProfile(p?.data ?? null)
      setStats(s?.data ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const kyc = stats?.kyc ?? {}
  const total = kyc.total ?? profile?.totalKycSubmissions ?? 0
  const approved = kyc.approved ?? profile?.approvedKycCount ?? 0
  const pending = kyc.pending ?? profile?.pendingKycCount ?? 0
  const rejected = kyc.rejected ?? profile?.rejectedKycCount ?? 0
  const kycUrl = profile?.kycUrl ?? ''
  const pkg = profile?.package || profile?.plan || 'Standard'
  const recentKyc = stats?.recentKyc ?? []

  const copyUrl = () => {
    if (!kycUrl) return
    navigator.clipboard.writeText(kycUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-gray-900" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700">
        {error}
        <button onClick={load} className="ml-3 text-sm font-medium underline">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">KYC activity for your company</p>
      </div>

      {/* KYC Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total KYC</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{Number(total).toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Users verified with your form</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Approved</p>
              <p className="text-2xl font-bold text-green-700 mt-1">{Number(approved).toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending</p>
              <p className="text-2xl font-bold text-yellow-700 mt-1">{Number(pending).toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Rejected</p>
              <p className="text-2xl font-bold text-red-700 mt-1">{Number(rejected).toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Package & KYC URL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Package</h3>
          <p className="text-lg font-medium text-gray-700">{pkg}</p>
          <p className="text-xs text-gray-500 mt-1">Your current plan</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Your KYC URL</h3>
          {kycUrl ? (
            <div className="flex gap-2">
              <input
                readOnly
                value={kycUrl}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm font-mono truncate"
              />
              <button
                type="button"
                onClick={copyUrl}
                className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 whitespace-nowrap"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No KYC URL available.</p>
          )}
          <p className="text-xs text-gray-500 mt-2">Share this link with users to complete KYC for your company.</p>
        </div>
      </div>

      {/* Recent KYC */}
      {recentKyc.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Recent KYC</h3>
            <p className="text-sm text-gray-600 mt-0.5">Latest verifications via your form</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentKyc.slice(0, 10).map((r, i) => (
                  <tr key={r.userId || i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.fullName || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{r.email || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          r.kycStatus === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : r.kycStatus === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {r.kycStatus || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Support CTA */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Need help?</h3>
          <p className="text-sm text-gray-600 mt-1">Open a support ticket or view your existing issues.</p>
        </div>
        <Link
          href="/dashboard/support"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Support
        </Link>
      </div>
    </div>
  )
}

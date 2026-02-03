'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { companyProfile, companyDashboardStats, companyKycList } from '@/app/api/company-api'
import { Modal } from '@/components/ui/Modal'

type PackageInfo = {
  selected?: string
  name?: string
  baseChargePerUser?: number
  monthlyFee?: number
  extraChargePerUser?: number
  totalChargePerUser?: number
}

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
  package?: PackageInfo | string
  plan?: string
}

type KycUser = {
  userId?: string
  fullName?: string
  email?: string
  kycStatus?: string
  submittedAt?: string
}

type Stats = {
  kyc?: { total?: number; pending?: number; submitted?: number; under_review?: number; approved?: number; rejected?: number }
  support?: { total?: number; open?: number; pending?: number; resolved?: number; closed?: number }
  recentKyc?: KycUser[]
  data?: { users?: KycUser[]; recentKyc?: KycUser[] }
}

export default function CompanyDashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentKycFromList, setRecentKycFromList] = useState<KycUser[]>([])
  const [kycTotalsFromList, setKycTotalsFromList] = useState<{ total?: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [kycUrlModalOpen, setKycUrlModalOpen] = useState(false)

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    setRecentKycFromList([])
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
      const statsData = s?.data
      const recentKyc = statsData?.recentKyc ?? statsData?.data?.recentKyc ?? []
      if (recentKyc.length === 0) {
        const kycRes = await companyKycList({ limit: 20, page: 1 })
        if (kycRes?.success && kycRes?.data) {
          const data = kycRes.data as { users?: KycUser[]; pagination?: { totalItems?: number } }
          const users = data?.users ?? []
          const totalItems = data?.pagination?.totalItems ?? users.length
          setRecentKycFromList(users.map((u: KycUser) => ({ userId: u.userId, fullName: u.fullName, email: u.email, kycStatus: u.kycStatus, submittedAt: u.submittedAt })))
          setKycTotalsFromList({ total: totalItems })
        }
      } else {
        setKycTotalsFromList(null)
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

  const kyc = stats?.kyc ?? {}
  const total = kyc.total ?? profile?.totalKycSubmissions ?? kycTotalsFromList?.total ?? 0
  const approved = kyc.approved ?? profile?.approvedKycCount ?? 0
  const pending = kyc.pending ?? profile?.pendingKycCount ?? 0
  const rejected = kyc.rejected ?? profile?.rejectedKycCount ?? 0
  const kycUrl = profile?.kycUrl ?? ''
  const recentFromStats = stats?.recentKyc ?? (stats as Stats)?.data?.recentKyc ?? []
  const recentKyc = recentFromStats.length > 0 ? recentFromStats : recentKycFromList

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
        <button onClick={load} className="ml-3 text-sm font-medium underline">Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-wrap items-center justify-between  gap-2 sm:gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
         <div className="flex flex-wrap items-center gap-2 sm:gap-3">
           {kycUrl && (
            <button
              type="button"
              onClick={() => setKycUrlModalOpen(true)}
              className="p-2 rounded-lg text-gray-900 hover:bg-gray-100"
              title="View KYC URL"
              aria-label="View KYC URL"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </button>
          )}
           <Link
            href="/dashboard/help"
            className="p-2 rounded-lg text-gray-900 hover:bg-gray-100"
            title="Help"
            aria-label="Help"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </Link>
         </div>
         
         
        </div>
        <p className="text-sm text-gray-600 mt-1">KYC activity for your company</p>
      </div>

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
        {(() => {
          const pkg = typeof profile?.package === 'object' ? profile.package : null
          const pkgName = pkg?.name ?? (typeof profile?.package === 'string' ? profile.package : profile?.plan) ?? '—'
          const hasPackage = pkg || profile?.package || profile?.plan
          if (!hasPackage) return null
          return (
            <Link href="/dashboard/profile" className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:border-gray-300 transition-colors block">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Package</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{pkgName}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {pkg ? `$${pkg.totalChargePerUser ?? pkg.baseChargePerUser ?? '—'}/user` : '—'}
                    {pkg?.extraChargePerUser != null && pkg.extraChargePerUser > 0 && (
                      <span> · +${pkg.extraChargePerUser} extra</span>
                    )}
                  </p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          )
        })()}
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

      {recentKyc.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Recent KYC</h3>
            <p className="text-sm text-gray-600 mt-0.5">Latest verifications via your form</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentKyc.slice(0, 20).map((r, i) => (
                  <tr key={r.userId || i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.fullName || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{r.email || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          r.kycStatus === 'approved' ? 'bg-green-100 text-green-800' : r.kycStatus === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {r.kycStatus || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {r.userId ? (
                        <Link
                          href={`/dashboard/users/${r.userId}`}
                          className="text-xs font-medium text-gray-900 hover:underline"
                        >
                          View
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={kycUrlModalOpen} onClose={() => setKycUrlModalOpen(false)}>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Your KYC URL</h3>
          {kycUrl ? (
            <>
              <input
                readOnly
                value={kycUrl}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm font-mono mb-3"
              />
              <button
                type="button"
                onClick={copyUrl}
                className="w-full px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </>
          ) : (
            <p className="text-sm text-gray-500">No KYC URL available.</p>
          )}
        </div>
      </Modal>
    </div>
  )
}

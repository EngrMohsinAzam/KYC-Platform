'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import nextDynamic from 'next/dynamic'
import { getSuperAdminToken, superAdminCompanyById, superAdminApproveCompany, superAdminRejectCompany } from '@/app/api/super-admin-api'
import { LoadingDots } from '@/components/ui/LoadingDots'

const LazyResponsiveContainer = nextDynamic(() => import('recharts').then((m) => m.ResponsiveContainer), { ssr: false })
const LazyBarChart = nextDynamic(() => import('recharts').then((m) => m.BarChart), { ssr: false })
const LazyBar = nextDynamic(() => import('recharts').then((m) => m.Bar), { ssr: false })
const LazyXAxis = nextDynamic(() => import('recharts').then((m) => m.XAxis), { ssr: false })
const LazyYAxis = nextDynamic(() => import('recharts').then((m) => m.YAxis), { ssr: false })
const LazyCartesianGrid = nextDynamic(() => import('recharts').then((m) => m.CartesianGrid), { ssr: false })
const LazyTooltip = nextDynamic(() => import('recharts').then((m) => m.Tooltip), { ssr: false })

export default function SuperAdminCompanyDetailPage() {
  const router = useRouter()
  const params = useParams()
  const companyId = params.companyId as string
  const [loading, setLoading] = useState(true)
  const [company, setCompany] = useState<any>(null)
  const [error, setError] = useState('')
  const [acting, setActing] = useState(false)
  const [rejectModal, setRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const load = useCallback(async () => {
    const t = getSuperAdminToken()
    if (!t) return
    try {
      const res = await superAdminCompanyById(companyId)
      if (res?.success && res?.data) setCompany(res.data)
      else setError(res?.message || 'Failed to load')
    } catch (e: any) {
      setError(e?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => {
    const t = getSuperAdminToken()
    if (!t) {
      router.replace('/super-admin')
      return
    }
    load()
  }, [companyId, router, load])

  const handleApprove = async () => {
    setActing(true)
    setError('')
    try {
      const res = await superAdminApproveCompany(companyId)
      if (!res?.success) throw new Error(res?.message || 'Approve failed')
      router.push('/super-admin/companies')
    } catch (e: any) {
      setError(e?.message || 'Approve failed')
    } finally {
      setActing(false)
    }
  }

  const handleReject = async () => {
    setActing(true)
    setError('')
    try {
      const res = await superAdminRejectCompany(companyId, { reason: rejectReason || undefined })
      if (!res?.success) throw new Error(res?.message || 'Reject failed')
      setRejectModal(false)
      setRejectReason('')
      router.push('/super-admin/companies')
    } catch (e: any) {
      setError(e?.message || 'Reject failed')
    } finally {
      setActing(false)
    }
  }

  const status = (company?.status || '').toLowerCase()
  const isPending = status === 'pending'
  const isApproved = status === 'approved'
  const isRejected = status === 'rejected'

  const totalUsers = Number(company?.totalKycSubmissions ?? 0)
  const approvedCount = Number(company?.approvedKycCount ?? 0)
  const pendingCount = Number(company?.pendingKycCount ?? 0)
  const rejectedCount = Number(company?.rejectedKycCount ?? 0)
  const chartData = useMemo(
    () => [
      { label: 'Approved', value: approvedCount },
      { label: 'Pending', value: pendingCount },
      { label: 'Rejected', value: rejectedCount },
    ],
    [approvedCount, pendingCount, rejectedCount]
  )

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12 flex items-center justify-center min-h-[360px]">
        <LoadingDots />
      </main>
    )
  }

  if (error || !company) {
    return (
      <main className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <Link href="/super-admin/companies" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to companies
        </Link>
        <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-red-700">{error || 'Company not found.'}</div>
      </main>
    )
  }

  return (
    <main className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <Link href="/super-admin/companies" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to companies
      </Link>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>
      )}

      {/* Header card */}
      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div className="p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{company.companyName}</h1>
              <p className="text-gray-600 mt-1">{company.industry || '—'} · {company.companyId || company._id}</p>
            </div>
            <span
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold shrink-0 ${
                isPending ? 'bg-amber-100 text-amber-800' : isApproved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
          {isPending && (
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={handleApprove}
                disabled={acting}
                className="px-4 py-2 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {acting ? 'Approving…' : 'Approve'}
              </button>
              <button
                onClick={() => setRejectModal(true)}
                disabled={acting}
                className="px-4 py-2 rounded-xl border border-red-300 text-red-700 font-medium hover:bg-red-50 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Package */}
      {(company.selectedPackage || company.packageDetails || company.extraChargePerUser != null) && (
        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-semibold text-gray-900">Package</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs font-medium text-gray-500 uppercase">Plan</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">{company.packageDetails?.packageName || company.selectedPackage || '—'}</p>
              </div>
              {company.packageDetails?.baseChargePerUser != null && (
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase">Base charge / user</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">${company.packageDetails.baseChargePerUser}</p>
                </div>
              )}
              {company.packageDetails?.monthlyFee != null && company.packageDetails.monthlyFee > 0 && (
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase">Monthly fee</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">${company.packageDetails.monthlyFee}/mo</p>
                </div>
              )}
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs font-medium text-gray-500 uppercase">Extra charge / user</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">${company.extraChargePerUser ?? 0}</p>
              </div>
              {company.totalChargePerUser != null && (
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase">Total / user</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">${company.totalChargePerUser}</p>
                </div>
              )}
            </div>
            {company.packageDetails?.features?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">Features</p>
                <ul className="flex flex-wrap gap-2">
                  {company.packageDetails.features.map((f: string, i: number) => (
                    <li key={i} className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg text-sm font-medium">{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Company details */}
      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900">Company details</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Owner</p>
                <p className="text-gray-900 font-medium mt-0.5">{company.ownerName || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Email</p>
                <a href={`mailto:${company.email}`} className="text-blue-600 hover:underline mt-0.5 block">{company.email}</a>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Phone</p>
                <p className="text-gray-900 mt-0.5">{company.phone || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Website</p>
                {company.website ? (
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline mt-0.5 block truncate">
                    {company.website}
                  </a>
                ) : (
                  <p className="text-gray-500 mt-0.5">—</p>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Address</p>
                <p className="text-gray-900 mt-0.5">{company.address || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">KYC URL</p>
                {company.kycUrl ? (
                  <a href={company.kycUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all text-sm mt-0.5 block">
                    {company.kycUrl}
                  </a>
                ) : (
                  <p className="text-gray-500 mt-0.5">—</p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Created</p>
                <p className="text-gray-900 mt-0.5">{company.createdAt ? new Date(company.createdAt).toLocaleString() : '—'}</p>
              </div>
            </div>
          </div>
          {company.description && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Description</p>
              <p className="text-gray-700 bg-gray-50 rounded-xl p-4">{company.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* KYC overview (only for approved) */}
      {isApproved && (
        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-semibold text-gray-900">KYC overview</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="rounded-xl bg-gray-50 p-4 text-center">
                <p className="text-xs font-medium text-gray-500 uppercase">Total</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalUsers.toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-green-50 p-4 text-center">
                <p className="text-xs font-medium text-gray-500 uppercase">Approved</p>
                <p className="text-2xl font-bold text-green-700 mt-1">{approvedCount.toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-amber-50 p-4 text-center">
                <p className="text-xs font-medium text-gray-500 uppercase">Pending</p>
                <p className="text-2xl font-bold text-amber-700 mt-1">{pendingCount.toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-red-50 p-4 text-center">
                <p className="text-xs font-medium text-gray-500 uppercase">Rejected</p>
                <p className="text-2xl font-bold text-red-700 mt-1">{rejectedCount.toLocaleString()}</p>
              </div>
            </div>
            <div className="h-[260px]">
              {chartData.some((d) => d.value > 0) ? (
                <LazyResponsiveContainer width="100%" height="100%">
                  <LazyBarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
                    <LazyCartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <LazyXAxis dataKey="label" stroke="#6b7280" />
                    <LazyYAxis stroke="#6b7280" />
                    <LazyTooltip formatter={(v) => [String(v), 'Count']} />
                    <LazyBar dataKey="value" fill="#111827" radius={[4, 4, 0, 0]} name="Count" />
                  </LazyBarChart>
                </LazyResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500 rounded-xl bg-gray-50">No KYC data yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => { setRejectModal(false); setRejectReason('') }} />
            <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Reject application</h3>
              <p className="text-sm text-gray-600 mb-4">{company.companyName}</p>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 mb-4"
                placeholder="e.g. Invalid business documentation"
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setRejectModal(false); setRejectReason('') }} className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button onClick={handleReject} disabled={acting} className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                  {acting ? 'Rejecting…' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

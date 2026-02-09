'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  getSuperAdminToken,
  superAdminCompaniesStats,
  superAdminCompaniesList,
  superAdminApproveCompany,
  superAdminRejectCompany,
} from '@/app/api/super-admin-api'
import { APP_BASE_URL } from '@/app/(public)/config'
import { LoadingDots } from '@/components/ui/LoadingDots'

const INDUSTRIES = [
  'FinTech', 'Payments', 'Trading', 'Crypto', 'Banking', 'Insurance', 'Real Estate', 'Healthcare',
  'E-commerce', 'Marketplace', 'iGaming', 'SaaS', 'Telecommunications', 'Education', 'Other',
]

const PACKAGES = [
  { id: 'pay_as_you_go', name: 'Pay as you go' },
  { id: 'basic', name: 'Basic' },
  { id: 'standard', name: 'Standard' },
  { id: 'premium', name: 'Premium' },
]

type CompanyRow = {
  _id: string
  companyName: string
  ownerName?: string
  email: string
  phone?: string
  address?: string
  industry?: string
  website?: string
  description?: string
  status: string
  createdAt?: string
  companyId?: string
  companySlug?: string
  selectedPackage?: string
  packageDetails?: { packageName?: string; baseChargePerUser?: number; monthlyFee?: number; features?: string[] }
  extraChargePerUser?: number
  totalChargePerUser?: number
}

type Stats = { total?: number; pending?: number; approved?: number; rejected?: number }

function useCopy() {
  const [copied, setCopied] = useState(false)
  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }, [])
  return { copy, copied }
}

export default function SuperAdminCompaniesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'pending' | 'approved'>('pending')
  const [stats, setStats] = useState<Stats>({})
  const [pending, setPending] = useState<CompanyRow[]>([])
  const [approved, setApproved] = useState<CompanyRow[]>([])
  const [error, setError] = useState('')
  const [addModal, setAddModal] = useState(false)
  const [credentialsModal, setCredentialsModal] = useState<{
    company: { companyName: string; companyId?: string; companySlug?: string; kycUrl?: string; email?: string }
    credentials: { kycUrl?: string; password?: string; companyId?: string; companySlug?: string; email?: string }
  } | null>(null)
  const [rejectModal, setRejectModal] = useState<CompanyRow | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [acting, setActing] = useState(false)
  const [addForm, setAddForm] = useState({
    companyName: '', ownerName: '', email: '', phone: '', address: '', industry: '', website: '', description: '',
    selectedPackage: 'basic', extraChargePerUser: '0',
  })
  const { copy, copied } = useCopy()

  const load = useCallback(async () => {
    const t = getSuperAdminToken()
    if (!t) return
    setError('')
    try {
      const [statsRes, listRes] = await Promise.all([
        superAdminCompaniesStats(),
        superAdminCompaniesList({ limit: 50 }),
      ])
      if (statsRes?.success && statsRes?.data) {
        const d = statsRes.data as { companies?: Stats } & Stats
        const s = d.companies || d
        setStats({
          total: s.total ?? 0,
          pending: s.pending ?? 0,
          approved: s.approved ?? 0,
          rejected: s.rejected ?? 0,
        })
      }
      if (!listRes?.success) {
        setError(listRes?.message || 'Failed to load companies')
        setPending([])
        setApproved([])
        return
      }
      const raw = listRes?.data?.companies ?? listRes?.data
      const list: CompanyRow[] = Array.isArray(raw) ? raw : []
      const byStatus = (s: string) => (c: CompanyRow) => (c.status || '').toLowerCase() === s.toLowerCase()
      setPending(list.filter(byStatus('pending')))
      setApproved(list.filter(byStatus('approved')))
    } catch (e: any) {
      setError(e?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = getSuperAdminToken()
    if (!t) {
      router.replace('/super-admin')
      return
    }
    load()
  }, [router, load])

  const handleApprove = async (c: CompanyRow) => {
    setActing(true)
    setError('')
    try {
      const res = await superAdminApproveCompany(c._id)
      if (!res?.success) throw new Error(res?.message || 'Approve failed')
      const company = res?.data?.company ?? res?.data
      const credentials = res?.data?.credentials ?? {}
      // Optimistic update: remove from pending, add to approved (so it no longer shows as pending)
      setPending((prev) => prev.filter((x) => x._id !== c._id))
      const approvedRow: CompanyRow = {
        _id: c._id,
        companyName: company?.companyName ?? c.companyName,
        ownerName: c.ownerName,
        email: company?.email ?? credentials?.email ?? c.email,
        phone: c.phone,
        industry: c.industry,
        status: 'approved',
        companyId: company?.companyId ?? credentials?.companyId,
        companySlug: company?.companySlug ?? credentials?.companySlug,
      }
      setApproved((prev) => [approvedRow, ...prev])
      setStats((s) => ({
        ...s,
        pending: Math.max(0, (s.pending ?? 0) - 1),
        approved: (s.approved ?? 0) + 1,
      }))

      setCredentialsModal({
        company: {
          companyName: company?.companyName ?? c.companyName,
          companyId: company?.companyId ?? credentials?.companyId,
          companySlug: company?.companySlug ?? credentials?.companySlug,
          kycUrl: company?.kycUrl ?? credentials?.kycUrl,
          email: company?.email ?? credentials?.email ?? c.email,
        },
        credentials: {
          kycUrl: credentials?.kycUrl ?? company?.kycUrl,
          password: credentials?.password,
          companyId: credentials?.companyId ?? company?.companyId,
          companySlug: credentials?.companySlug ?? company?.companySlug,
          email: credentials?.email ?? company?.email ?? c.email,
        },
      })
      await load()
    } catch (e: any) {
      setError(e?.message || 'Approve failed')
    } finally {
      setActing(false)
    }
  }

  const handleReject = async () => {
    const c = rejectModal
    if (!c) return
    setActing(true)
    setError('')
    try {
      const res = await superAdminRejectCompany(c._id, { reason: rejectReason || undefined })
      if (!res?.success) throw new Error(res?.message || 'Reject failed')
      setRejectModal(null)
      setRejectReason('')
      await load()
    } catch (e: any) {
      setError(e?.message || 'Reject failed')
    } finally {
      setActing(false)
    }
  }

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addForm.companyName?.trim() || !addForm.ownerName?.trim() || !addForm.email?.trim() ||
        !addForm.phone?.trim() || !addForm.address?.trim() || !addForm.industry?.trim()) {
      setError('Please fill required fields')
      return
    }
    setActing(true)
    setError('')
    try {
      const extra = parseFloat(String(addForm.extraChargePerUser || '0'))
      const res = await fetch('/api/company/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: addForm.companyName.trim(),
          ownerName: addForm.ownerName.trim(),
          email: addForm.email.trim(),
          phone: addForm.phone.trim(),
          address: addForm.address.trim(),
          industry: addForm.industry.trim(),
          selectedPackage: addForm.selectedPackage || 'basic',
          extraChargePerUser: Number.isNaN(extra) || extra < 0 ? 0 : extra,
          ...(addForm.website?.trim() && { website: addForm.website.trim() }),
          ...(addForm.description?.trim() && { description: addForm.description.trim() }),
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message || 'Registration failed')
      setAddModal(false)
      setAddForm({ companyName: '', ownerName: '', email: '', phone: '', address: '', industry: '', website: '', description: '', selectedPackage: 'basic', extraChargePerUser: '0' })
      await load()
    } catch (e: any) {
      setError(e?.message || 'Failed to add company')
    } finally {
      setActing(false)
    }
  }

  const base = typeof window !== 'undefined' ? window.location.origin : (APP_BASE_URL || 'https://www.digiportid.com')
  const kycUrl = credentialsModal?.credentials?.kycUrl || (credentialsModal?.company?.companySlug && credentialsModal?.company?.companyId
    ? `${base}/verify/start/${credentialsModal.company.companySlug}/${credentialsModal.company.companyId}`
    : '')

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 flex items-center justify-center min-h-[320px]">
        <LoadingDots />
      </main>
    )
  }

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Companies</h1>
          <p className="text-sm text-gray-600 mt-1">Manage company applications and approved companies</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setAddModal(true); setError('') }}
            className="px-4 py-2 rounded-xl bg-black text-white text-sm font-medium hover:bg-gray-800"
          >
            Add company
          </button>
          <button onClick={load} className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-medium hover:bg-gray-50">
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase">Total</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total ?? pending.length + approved.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase">Pending</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending ?? pending.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase">Approved</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.approved ?? approved.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase">Rejected</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.rejected ?? 0}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setTab('pending')}
          className={`px-4 py-2 text-sm font-medium rounded-t-xl border-b-2 transition-colors ${tab === 'pending' ? 'border-black text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Pending ({stats.pending ?? pending.length})
        </button>
        <button
          onClick={() => setTab('approved')}
          className={`px-4 py-2 text-sm font-medium rounded-t-xl border-b-2 transition-colors ${tab === 'approved' ? 'border-black text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Approved ({stats.approved ?? approved.length})
        </button>
      </div>

      {tab === 'pending' && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Pending company applications</h2>
            <p className="text-sm text-gray-500 mt-1">Review and approve or reject new company applications</p>
          </div>
          <div className="overflow-x-auto">
            {pending.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No pending applications.</div>
            ) : (
              <table className="w-full min-w-[720px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Company</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Package</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Industry</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pending.map((r) => (
                    <tr key={r._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold text-gray-900">{r.companyName}</div>
                        <div className="text-xs text-gray-500">{String(r._id).slice(-8)}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {r.packageDetails?.packageName || r.selectedPackage || '—'}
                        {r.extraChargePerUser != null && r.extraChargePerUser > 0 && (
                          <span className="text-gray-500"> · +${r.extraChargePerUser}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r.ownerName || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r.industry || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/super-admin/companies/${encodeURIComponent(r._id)}`}
                            className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
                          >
                            View details
                          </Link>
                          <button
                            onClick={() => handleApprove(r)}
                            disabled={acting}
                            className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => { setRejectModal(r); setRejectReason('') }}
                            className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === 'approved' && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Approved companies</h2>
            <p className="text-sm text-gray-500 mt-1">Click a company to view details, financials, and user count</p>
          </div>
          <div className="overflow-x-auto">
            {approved.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No approved companies yet.</div>
            ) : (
              <table className="w-full min-w-[640px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Company</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Package</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Industry</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Contact</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {approved.map((c) => (
                    <tr key={c._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold text-gray-900">{c.companyName}</div>
                        <div className="text-xs text-gray-500">{c.companyId || c._id}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {c.packageDetails?.packageName || c.selectedPackage || '—'}
                        {c.extraChargePerUser != null && c.extraChargePerUser > 0 && (
                          <span className="text-gray-500"> · +${c.extraChargePerUser}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{c.industry || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{c.ownerName || '—'} · {c.email}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/super-admin/companies/${encodeURIComponent(c._id)}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-black text-white text-sm font-medium hover:bg-gray-800"
                        >
                          View details
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => { setRejectModal(null); setRejectReason('') }} />
            <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Reject application</h3>
              <p className="text-sm text-gray-600 mb-4">{rejectModal.companyName}</p>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 mb-4"
                placeholder="e.g. Invalid business documentation"
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setRejectModal(null); setRejectReason('') }} className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button onClick={handleReject} disabled={acting} className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                  {acting ? 'Rejecting…' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add company modal */}
      {addModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setAddModal(false)} />
            <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add company</h3>
              <form onSubmit={handleAddCompany} className="space-y-4">
                {['companyName', 'ownerName', 'email', 'phone', 'address'].map((f) => (
                  <div key={f}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {f === 'companyName' && 'Company name *'}
                      {f === 'ownerName' && "Owner's name *"}
                      {f === 'email' && 'Email *'}
                      {f === 'phone' && 'Phone *'}
                      {f === 'address' && 'Address *'}
                    </label>
                    <input
                      type={f === 'email' ? 'email' : 'text'}
                      value={(addForm as any)[f]}
                      onChange={(e) => setAddForm((x) => ({ ...x, [f]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300"
                      required={['companyName', 'ownerName', 'email', 'phone', 'address'].includes(f)}
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industry *</label>
                  <select
                    value={addForm.industry}
                    onChange={(e) => setAddForm((x) => ({ ...x, industry: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300"
                    required
                  >
                    <option value="">Select</option>
                    {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Package / Plan *</label>
                  <select
                    value={addForm.selectedPackage}
                    onChange={(e) => setAddForm((x) => ({ ...x, selectedPackage: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300"
                    required
                  >
                    {PACKAGES.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Extra charge per user ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={addForm.extraChargePerUser}
                    onChange={(e) => setAddForm((x) => ({ ...x, extraChargePerUser: e.target.value.replace(/[^0-9.]/g, '') }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website (optional)</label>
                  <input type="url" value={addForm.website} onChange={(e) => setAddForm((x) => ({ ...x, website: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                  <textarea value={addForm.description} onChange={(e) => setAddForm((x) => ({ ...x, description: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-xl border border-gray-300" />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button type="button" onClick={() => setAddModal(false)} className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-medium hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={acting} className="px-4 py-2 rounded-xl bg-black text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50">Submit</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Credentials modal (after approve) */}
      {credentialsModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setCredentialsModal(null)} />
            <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Company approved</h3>
                <button onClick={() => setCredentialsModal(null)} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Close">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600">Share the KYC URL and credentials with the company. Use the embed codes to integrate into your app.</p>

                {kycUrl && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">KYC URL</label>
                    <div className="flex gap-2">
                      <input readOnly value={kycUrl} className="flex-1 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm" />
                      <button type="button" onClick={() => copy(kycUrl)} className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800">
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}

                {credentialsModal.credentials?.password && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Password (send securely)</label>
                    <div className="flex gap-2">
                      <input readOnly value={credentialsModal.credentials.password} className="flex-1 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm font-mono" />
                      <button type="button" onClick={() => copy(credentialsModal.credentials!.password!)} className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800">
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-2">Embed / integrate</label>
                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <div className="flex border-b border-gray-200">
                      {['React', 'Flutter', 'Link'].map((label) => (
                        <button key={label} type="button" className="px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:bg-gray-50" id={`tab-${label}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="p-4 bg-gray-50 font-mono text-xs overflow-x-auto space-y-4">
                      <div>
                        <p className="text-gray-500 mb-1">React (iframe)</p>
                        <pre className="whitespace-pre-wrap break-all">{`<iframe\n  src="${kycUrl}"\n  title="KYC Verification"\n  width="100%" height="600"\n  style={{ border: 0 }}\n/>`}</pre>
                        <button type="button" onClick={() => copy(`<iframe src="${kycUrl}" title="KYC Verification" width="100%" height="600" style={{ border: 0 }} />`)} className="mt-1 text-gray-600 hover:underline text-xs">Copy</button>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Flutter (WebView)</p>
                        <pre className="whitespace-pre-wrap break-all">{`WebView(\n  initialUrl: '${kycUrl}',\n  javascriptMode: JavascriptMode.unrestricted,\n)`}</pre>
                        <button type="button" onClick={() => copy(`WebView(initialUrl: '${kycUrl}', javascriptMode: JavascriptMode.unrestricted,)`)} className="mt-1 text-gray-600 hover:underline text-xs">Copy</button>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Direct link</p>
                        <pre className="whitespace-pre-wrap break-all">{`<a href="${kycUrl}" target="_blank" rel="noopener">Start KYC</a>`}</pre>
                        <button type="button" onClick={() => copy(`<a href="${kycUrl}" target="_blank" rel="noopener">Start KYC</a>`)} className="mt-1 text-gray-600 hover:underline text-xs">Copy</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200">
                <button onClick={() => setCredentialsModal(null)} className="w-full py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800">Done</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

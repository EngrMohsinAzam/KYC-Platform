'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import nextDynamic from 'next/dynamic'
import { companyProfile, companyDashboardStats, companyKycList } from '@/app/api/company-api'
import { Modal } from '@/components/ui/Modal'

type TimeRange = 'day' | 'week' | 'month' | 'year'

const LazyResponsiveContainer = nextDynamic(() => import('recharts').then((m) => m.ResponsiveContainer), { ssr: false })
const LazyLineChart = nextDynamic(() => import('recharts').then((m) => m.LineChart), { ssr: false })
const LazyCartesianGrid = nextDynamic(() => import('recharts').then((m) => m.CartesianGrid), { ssr: false })
const LazyXAxis = nextDynamic(() => import('recharts').then((m) => m.XAxis), { ssr: false })
const LazyYAxis = nextDynamic(() => import('recharts').then((m) => m.YAxis), { ssr: false })
const LazyTooltip = nextDynamic(() => import('recharts').then((m) => m.Tooltip), { ssr: false })
const LazyLegend = nextDynamic(() => import('recharts').then((m) => m.Legend), { ssr: false })
const LazyLine = nextDynamic(() => import('recharts').then((m) => m.Line), { ssr: false })

function ActivityChart({ data }: { data: { label: string; total: number; approved: number; pending: number; rejected: number }[] }) {
  return (
    <LazyResponsiveContainer width="100%" height="100%">
      <LazyLineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
        <LazyCartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <LazyXAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" tickLine={false} />
        <LazyYAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickLine={false} axisLine={false} width={32} />
        <LazyTooltip
          contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
          labelStyle={{ fontWeight: 600, color: '#0f172a' }}
        />
        <LazyLegend wrapperStyle={{ fontSize: 12 }} />
        <LazyLine type="monotone" dataKey="total" stroke="#475569" strokeWidth={2} dot={{ fill: '#475569', r: 3 }} name="Total" />
        <LazyLine type="monotone" dataKey="approved" stroke="#059669" strokeWidth={2} dot={{ fill: '#059669', r: 3 }} name="Approved" />
        <LazyLine type="monotone" dataKey="pending" stroke="#d97706" strokeWidth={2} dot={{ fill: '#d97706', r: 3 }} name="Pending" />
        <LazyLine type="monotone" dataKey="rejected" stroke="#dc2626" strokeWidth={2} dot={{ fill: '#dc2626', r: 3 }} name="Rejected" />
      </LazyLineChart>
    </LazyResponsiveContainer>
  )
}

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

  const [chartRange, setChartRange] = useState<TimeRange>('week')
  const [kycForChart, setKycForChart] = useState<KycUser[]>([])

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    setRecentKycFromList([])
    setKycForChart([])
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
      // Fetch more KYC for chart (up to 200 across pages)
      const all: KycUser[] = []
      let page = 1
      let hasMore = true
      while (hasMore && page <= 10) {
        const res = await companyKycList({ limit: 50, page })
        const d = res?.data as { users?: KycUser[]; pagination?: { totalPages?: number } }
        const users = d?.users ?? []
        all.push(...users.map((u: KycUser) => ({ userId: u.userId, fullName: u.fullName, email: u.email, kycStatus: u.kycStatus, submittedAt: u.submittedAt })))
        hasMore = users.length === 50 && (d?.pagination?.totalPages ?? 1) > page
        page++
        if (all.length >= 200) break
      }
      setKycForChart(all)
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

  const chartData = useMemo(() => {
    const list = kycForChart.filter((u) => u.submittedAt)
    if (list.length === 0) return []
    const now = new Date()
    const buckets: Record<string, { total: number; approved: number; pending: number; rejected: number }> = {}

    const getKey = (d: Date) => {
      if (chartRange === 'day') return d.toISOString().slice(0, 10)
      if (chartRange === 'week') {
        const start = new Date(d)
        start.setDate(start.getDate() - start.getDay())
        return start.toISOString().slice(0, 10)
      }
      if (chartRange === 'month') return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      return `${d.getFullYear()}`
    }

    const rangeStart = (() => {
      const x = new Date(now)
      if (chartRange === 'day') x.setDate(x.getDate() - 7)
      else if (chartRange === 'week') x.setDate(x.getDate() - 28)
      else if (chartRange === 'month') x.setMonth(x.getMonth() - 6)
      else x.setFullYear(x.getFullYear() - 2)
      return x
    })()

    list.forEach((u) => {
      const d = new Date(u.submittedAt!)
      if (d < rangeStart) return
      const key = getKey(d)
      if (!buckets[key]) buckets[key] = { total: 0, approved: 0, pending: 0, rejected: 0 }
      buckets[key].total++
      if (u.kycStatus === 'approved') buckets[key].approved++
      else if (u.kycStatus === 'rejected') buckets[key].rejected++
      else buckets[key].pending++
    })

    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, v]) => ({ label, ...v }))
  }, [kycForChart, chartRange])

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
            title="Contact Admin"
            aria-label="Contact Admin"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </Link>
         </div>
         
         
        </div>
        <p className="text-sm text-gray-600 mt-1">KYC activity for your company</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:border-slate-300 hover:shadow-md">
          <div className="absolute top-0 right-0 w-20 h-20 -translate-y-1/2 translate-x-1/2 rounded-full bg-slate-100/80" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Total KYC</p>
              <p className="mt-1.5 font-semibold tabular-nums text-slate-900" style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)' }}>
                {Number(total).toLocaleString()}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">Users verified</p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50">
              <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:border-emerald-200 hover:shadow-md">
          <div className="absolute top-0 right-0 w-20 h-20 -translate-y-1/2 translate-x-1/2 rounded-full bg-emerald-50/80" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600/80">Approved</p>
              <p className="mt-1.5 font-semibold tabular-nums text-emerald-800" style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)' }}>
                {Number(approved).toLocaleString()}
              </p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
              <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="group relative overflow-hidden rounded-2xl border border-amber-100 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:border-amber-200 hover:shadow-md">
          <div className="absolute top-0 right-0 w-20 h-20 -translate-y-1/2 translate-x-1/2 rounded-full bg-amber-50/80" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-600/80">Pending</p>
              <p className="mt-1.5 font-semibold tabular-nums text-amber-800" style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)' }}>
                {Number(pending).toLocaleString()}
              </p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50">
              <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="group relative overflow-hidden rounded-2xl border border-rose-100 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:border-rose-200 hover:shadow-md">
          <div className="absolute top-0 right-0 w-20 h-20 -translate-y-1/2 translate-x-1/2 rounded-full bg-rose-50/80" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-rose-600/80">Rejected</p>
              <p className="mt-1.5 font-semibold tabular-nums text-rose-800" style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)' }}>
                {Number(rejected).toLocaleString()}
              </p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50">
              <svg className="h-5 w-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Activity chart */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-900">User activity</h3>
            <p className="text-xs text-slate-500 mt-0.5">KYC submissions by period</p>
          </div>
          <div className="flex gap-1 rounded-lg border border-slate-300 bg-slate-50/50 p-1">
            {(['day', 'week', 'month', 'year'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setChartRange(r)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  chartRange === r ? 'bg-black text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[280px]">
          {chartData.length > 0 ? (
            <ActivityChart data={chartData} />
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/30 text-sm text-slate-500">
              No activity in this range
            </div>
          )}
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

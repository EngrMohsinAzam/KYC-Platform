'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import nextDynamic from 'next/dynamic'
import { LoadingDots } from '@/components/ui/LoadingDots'
import { ShimmerChart, ShimmerCard } from '@/components/ui/Shimmer'
import { getSuperAdminToken, superAdminAnalyticsTime, superAdminDashboardSummary, type TimeRange } from '@/lib/api/super-admin-api'

type Point = { label: string; value: number }

function normalizeSeries(raw: any): Point[] {
  if (!raw) return []

  // Common shape: { labels: [], values: [] }
  if (Array.isArray(raw.labels) && Array.isArray(raw.values)) {
    return raw.labels.map((l: any, i: number) => ({
      label: String(l),
      value: Number(raw.values[i] ?? 0) || 0,
    }))
  }

  // Common shape: [{ label, value }]
  if (Array.isArray(raw)) {
    return raw.map((item: any, idx: number) => {
      if (typeof item === 'number') return { label: `#${idx + 1}`, value: item }
      const label =
        item?.label ??
        item?.date ??
        item?.day ??
        item?.month ??
        item?.year ??
        item?.time ??
        `#${idx + 1}`
      const value =
        item?.value ??
        item?.count ??
        item?.total ??
        item?.amount ??
        item?.sum ??
        0
      return { label: String(label), value: Number(value) || 0 }
    })
  }

  // Fallback: object with entries
  if (typeof raw === 'object') {
    const entries = Object.entries(raw)
    if (entries.length > 0) {
      return entries.map(([k, v]) => ({ label: String(k), value: Number(v) || 0 }))
    }
  }

  return []
}

export default function SuperAdminFinancialPage() {
  const router = useRouter()
  const [range, setRange] = useState<TimeRange>('month')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<any>(null)
  const [summary, setSummary] = useState<any>(null)

  useEffect(() => {
    const token = getSuperAdminToken()
    if (!token) router.replace('/super-admin')
  }, [router])

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const [aRes, summaryRes] = await Promise.all([
        superAdminAnalyticsTime(range),
        superAdminDashboardSummary(),
      ])

      if (!aRes?.success) throw new Error(aRes?.message || 'Failed to load analytics')
      setAnalytics(aRes.data || aRes)

      if (summaryRes?.success) {
        setSummary(summaryRes.data || summaryRes)
      } else {
        setSummary(null)
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load financial record')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range])

  const chartData = useMemo(() => {
    const data = analytics || {}

    // try multiple nesting patterns
    const root = data.data ?? data
    const amountSeries = normalizeSeries(root.amountCollected ?? root.amounts ?? root.amount ?? root.revenue)
    const kycSeries = normalizeSeries(root.kycSubmissions ?? root.submissions ?? root.kyc ?? root.kycCount)

    const length = Math.max(amountSeries.length, kycSeries.length)
    return Array.from({ length }).map((_, idx) => {
      const a = amountSeries[idx]
      const k = kycSeries[idx]
      const label = a?.label || k?.label || `#${idx + 1}`
      return {
        label,
        amount: a?.value ?? 0,
        submissions: k?.value ?? 0,
      }
    })
  }, [analytics])

  const totalAmountCollected = useMemo(() => {
    const data = analytics || {}
    const root = data.data ?? data
    if (typeof root.totalAmountCollected === 'number') return root.totalAmountCollected
    if (typeof root.amountCollectedTotal === 'number') return root.amountCollectedTotal
    if (typeof root?.totals?.amountCollected === 'number') return root.totals.amountCollected

    const amountSeries = normalizeSeries(root.amountCollected ?? root.amounts ?? root.amount ?? root.revenue)
    return amountSeries.reduce((acc, p) => acc + (Number(p.value) || 0), 0)
  }, [analytics])

  // Lazy load recharts
  const LazyResponsiveContainer = nextDynamic(() => import('recharts').then((m) => m.ResponsiveContainer), { ssr: false })
  const LazyComposedChart = nextDynamic(() => import('recharts').then((m) => m.ComposedChart), { ssr: false })
  const LazyCartesianGrid = nextDynamic(() => import('recharts').then((m) => m.CartesianGrid), { ssr: false })
  const LazyXAxis = nextDynamic(() => import('recharts').then((m) => m.XAxis), { ssr: false })
  const LazyYAxis = nextDynamic(() => import('recharts').then((m) => m.YAxis), { ssr: false })
  const LazyTooltip = nextDynamic(() => import('recharts').then((m) => m.Tooltip), { ssr: false })
  const LazyLegend = nextDynamic(() => import('recharts').then((m) => m.Legend), { ssr: false })
  const LazyArea = nextDynamic(() => import('recharts').then((m) => m.Area), { ssr: false })
  const LazyLine = nextDynamic(() => import('recharts').then((m) => m.Line), { ssr: false })

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Financial record</h1>
          <p className="text-sm text-gray-600 mt-1">Analytics + wallet management (Super Admin only).</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as TimeRange)}
            className="px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm"
          >
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
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

      {/* Financial Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <ShimmerCard />
          <ShimmerCard />
          <ShimmerCard />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Amount Collected</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Number(summary?.totalAmountCollected || 0).toLocaleString()} USD
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Withdrawn</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Number(summary?.totalWithdrawn || summary?.totalWithdrawals || 0).toLocaleString()} USD
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Current Balance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(
                    Number(summary?.totalAmountCollected || 0) - 
                    Number(summary?.totalWithdrawn || summary?.totalWithdrawals || 0)
                  ).toLocaleString()} USD
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chart full width */}
      {loading ? (
        <ShimmerChart />
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Amount collected ({range})</h2>
              <p className="text-xs text-gray-500 mt-0.5">Total: {Number(totalAmountCollected || 0).toLocaleString()} USD</p>
            </div>
          </div>

          <div className="h-[360px]">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-600">
                No analytics data returned for <span className="font-medium mx-1">{range}</span>.
              </div>
            ) : (
              <Suspense fallback={<div className="h-full flex items-center justify-center"><LoadingDots /></div>}>
                <LazyResponsiveContainer width="100%" height="100%">
                  <LazyComposedChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                    <defs>
                      <linearGradient id="amountFillFin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#111827" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#111827" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <LazyCartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" vertical={false} />
                    <LazyXAxis dataKey="label" stroke="#6b7280" tickLine={false} axisLine={false} />
                    <LazyYAxis stroke="#6b7280" tickLine={false} axisLine={false} />
                    <LazyTooltip
                      contentStyle={{ borderRadius: 12, borderColor: '#e5e7eb' }}
                      labelStyle={{ color: '#111827', fontWeight: 600 }}
                    />
                    <LazyLegend />
                    <LazyArea type="monotone" dataKey="amount" stroke="#111827" fill="url(#amountFillFin)" strokeWidth={2} name="Amount collected" />
                    <LazyLine type="monotone" dataKey="submissions" stroke="#6b7280" strokeWidth={2} dot={false} name="KYC submissions" />
                  </LazyComposedChart>
                </LazyResponsiveContainer>
              </Suspense>
            )}
          </div>
        </div>
      )}

    </main>
  )
}



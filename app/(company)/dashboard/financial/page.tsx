'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import nextDynamic from 'next/dynamic'
import { companyProfile, companyDashboardStats, companyPackageGet, companyKycList } from '@/app/api/company-api'
import { ShimmerCard, ShimmerChart } from '@/components/ui/Shimmer'

type TimeRange = 'day' | 'week' | 'month' | 'year'

type KycUser = {
  userId?: string
  fullName?: string
  email?: string
  kycStatus?: string
  submittedAt?: string
}

const LazyResponsiveContainer = nextDynamic(() => import('recharts').then((m) => m.ResponsiveContainer), { ssr: false })
const LazyBarChart = nextDynamic(() => import('recharts').then((m) => m.BarChart), { ssr: false })
const LazyCartesianGrid = nextDynamic(() => import('recharts').then((m) => m.CartesianGrid), { ssr: false })
const LazyXAxis = nextDynamic(() => import('recharts').then((m) => m.XAxis), { ssr: false })
const LazyYAxis = nextDynamic(() => import('recharts').then((m) => m.YAxis), { ssr: false })
const LazyTooltip = nextDynamic(() => import('recharts').then((m) => m.Tooltip), { ssr: false })
const LazyBar = nextDynamic(() => import('recharts').then((m) => m.Bar), { ssr: false })
const LazyCell = nextDynamic(() => import('recharts').then((m) => m.Cell), { ssr: false })

export default function CompanyFinancialPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [range, setRange] = useState<TimeRange>('month')
  const [stats, setStats] = useState<{ kyc?: { approved?: number; total?: number }; total?: number } | null>(null)
  const [packageInfo, setPackageInfo] = useState<{ totalChargePerUser?: number; extraChargePerUser?: number; name?: string } | null>(null)
  const [kycList, setKycList] = useState<KycUser[]>([])

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const [profileRes, statsRes, pkgRes] = await Promise.all([
        companyProfile(),
        companyDashboardStats(),
        companyPackageGet(),
      ])
      if (!profileRes?.success && !statsRes?.success) {
        setError('Failed to load data')
        return
      }
      const kyc = (statsRes?.data as { kyc?: { approved?: number; total?: number } })?.kyc
      setStats({ kyc, total: kyc?.total ?? (profileRes?.data as { totalKycSubmissions?: number })?.totalKycSubmissions ?? 0 })
      if (pkgRes?.success && pkgRes?.data) {
        const p = pkgRes.data as { totalChargePerUser?: number; extraChargePerUser?: number; name?: string }
        setPackageInfo({ totalChargePerUser: p.totalChargePerUser, extraChargePerUser: p.extraChargePerUser, name: p.name })
      } else {
        setPackageInfo(null)
      }
      const all: KycUser[] = []
      let page = 1
      while (page <= 10) {
        const res = await companyKycList({ limit: 50, page })
        const d = res?.data as { users?: KycUser[]; pagination?: { totalPages?: number } }
        const users = d?.users ?? []
        all.push(...users)
        if (users.length < 50 || (d?.pagination?.totalPages ?? 1) <= page) break
        page++
        if (all.length >= 300) break
      }
      setKycList(all)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const approvedCount = stats?.kyc?.approved ?? 0
  const chargePerUser = packageInfo?.totalChargePerUser ?? 0
  const estimatedRevenue = approvedCount * chargePerUser

  const chartData = useMemo(() => {
    const list = kycList.filter((u) => u.submittedAt && u.kycStatus === 'approved')
    if (list.length === 0 || chargePerUser <= 0) return []

    const getKey = (d: Date) => {
      if (range === 'day') return d.toISOString().slice(0, 10)
      if (range === 'week') {
        const start = new Date(d)
        start.setDate(start.getDate() - start.getDay())
        return start.toISOString().slice(0, 10)
      }
      if (range === 'month') return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      return `${d.getFullYear()}`
    }

    const buckets: Record<string, number> = {}
    list.forEach((u) => {
      const d = new Date(u.submittedAt!)
      const key = getKey(d)
      buckets[key] = (buckets[key] ?? 0) + chargePerUser
    })

    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, value]) => ({ label, value, count: value / chargePerUser }))
  }, [kycList, range, chargePerUser])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financial</h1>
          <p className="text-sm text-slate-500 mt-0.5">Revenue and billing overview</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ShimmerCard />
          <ShimmerCard />
          <ShimmerCard />
        </div>
        <ShimmerChart />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
        {error}
        <button onClick={load} className="ml-3 text-sm font-medium underline">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financial</h1>
        <p className="text-sm text-slate-500 mt-0.5">Revenue and billing overview for your company</p>
      </div>

      {/* Financial cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Approved KYC</p>
          <p className="mt-2 font-semibold tabular-nums text-slate-900" style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>
            {Number(approvedCount).toLocaleString()}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Users generating revenue</p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Charge per user</p>
          <p className="mt-2 font-semibold tabular-nums text-slate-900" style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>
            ${chargePerUser.toFixed(2)}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {packageInfo?.extraChargePerUser ? `Base + $${packageInfo.extraChargePerUser} extra` : 'Per verified user'}
          </p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600/80">Est. revenue</p>
          <p className="mt-2 font-semibold tabular-nums text-emerald-800" style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>
            ${estimatedRevenue.toFixed(2)}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Approved × charge per user</p>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-900">Revenue by period</h3>
            <p className="text-xs text-slate-500 mt-0.5">Estimated revenue from approved KYC</p>
          </div>
          <div className="flex gap-1 rounded-lg border border-slate-300 bg-slate-50/50 p-1">
            {(['day', 'week', 'month', 'year'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  range === r ? 'bg-black text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[300px]">
          {chartData.length > 0 ? (
            <LazyResponsiveContainer width="100%" height="100%">
              <LazyBarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                <LazyCartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <LazyXAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" tickLine={false} />
                <LazyYAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickLine={false} axisLine={false} width={40} tickFormatter={(v) => `$${v}`} />
                <LazyTooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
                  labelStyle={{ fontWeight: 600, color: '#0f172a' }}
                  formatter={(value: unknown) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
                />
                <LazyBar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => (
                    <LazyCell key={String(i)} fill="#059669" fillOpacity={0.85 - (i % 3) * 0.1} />
                  ))}
                </LazyBar>
              </LazyBarChart>
            </LazyResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/30 text-sm text-slate-500">
              {chargePerUser <= 0 ? 'Configure your package in Profile to see revenue estimates' : 'No revenue data in this range'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

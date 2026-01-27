'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import nextDynamic from 'next/dynamic'
import { LoadingDots } from '@/components/ui/LoadingDots'
import { ShimmerCard, ShimmerChart, ShimmerNotification } from '@/components/ui/Shimmer'
import {
  getSuperAdminToken,
  superAdminDashboardSummary,
  superAdminAnalyticsTime,
  superAdminListAdmins,
  type TimeRange,
} from '@/app/api/super-admin-api'

// Lazy load blockchain functions
let blockchainFunctions: any = null
const loadBlockchainFunctions = async () => {
  if (!blockchainFunctions) {
    blockchainFunctions = await import('@/app/(public)/wallet/web3')
  }
  return blockchainFunctions
}

export default function SuperAdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [range, setRange] = useState<TimeRange>('month')
  const [analytics, setAnalytics] = useState<any>(null)
  const [adminCount, setAdminCount] = useState<number>(0)
  const [summary, setSummary] = useState<any>(null)
  const [issues, setIssues] = useState<any[]>([])
  const [blockchainAmount, setBlockchainAmount] = useState<string | null>(null)

  useEffect(() => {
    const token = getSuperAdminToken()
    if (!token) router.replace('/super-admin')
  }, [router])

  const load = async () => {
    const token = getSuperAdminToken()
    if (!token) return
    try {
      setLoading(true)
      setError(null)

      // Load blockchain functions and fetch financial stats
      const blockchain = await loadBlockchainFunctions()
      const { getFinancialStats } = blockchain

      const [summaryRes, analyticsRes, adminsRes, issuesRes, financialStats] = await Promise.all([
        superAdminDashboardSummary(),
        superAdminAnalyticsTime(range),
        superAdminListAdmins({ page: 1, limit: 200 }),
        fetch('/api/support/issues?page=1&limit=5&status=all', { headers: { Authorization: `Bearer ${token}` } })
          .then((r) => r.json())
          .catch(() => ({ success: false })),
        getFinancialStats().catch((e: any) => {
          console.error('Failed to fetch blockchain financial stats:', e)
          return null
        }),
      ])

      if (!summaryRes?.success) {
        throw new Error(summaryRes?.message || 'Failed to load summary')
      }
      setSummary(summaryRes.data || summaryRes)

      if (!analyticsRes?.success) {
        throw new Error(analyticsRes?.message || 'Failed to load analytics')
      }
      const analyticsData = analyticsRes.data || analyticsRes
      console.log('📊 [Dashboard] Analytics data structure:', {
        hasData: !!analyticsData,
        keys: Object.keys(analyticsData || {}),
        kycSubmissions: analyticsData?.kycSubmissions,
        dataKycSubmissions: analyticsData?.data?.kycSubmissions,
        fullData: JSON.stringify(analyticsData, null, 2).substring(0, 500)
      })
      
      setAnalytics(analyticsData)

      // Set blockchain amount collected
      if (financialStats) {
        setBlockchainAmount(financialStats.totalCollected)
      }

      if (adminsRes?.success) {
        const list = adminsRes.data?.admins || adminsRes.data?.data?.admins || adminsRes.data?.items || adminsRes.data?.results || []
        const totalFromPagination =
          adminsRes.data?.pagination?.totalAdmins ??
          adminsRes.data?.pagination?.total ??
          adminsRes.data?.totalAdmins ??
          adminsRes.totalAdmins
        setAdminCount(typeof totalFromPagination === 'number' ? totalFromPagination : Array.isArray(list) ? list.length : 0)
      } else {
        setAdminCount(0)
      }

      if (issuesRes?.success) {
        // Try multiple possible response shapes
        const list = 
          issuesRes.data?.issues || 
          issuesRes.data?.items || 
          issuesRes.data?.results || 
          issuesRes.data?.data ||
          issuesRes.issues ||
          issuesRes.items ||
          issuesRes.results ||
          (Array.isArray(issuesRes.data) ? issuesRes.data : []) ||
          []
        // Filter to show only pending/open issues in notifications
        const pendingIssues = Array.isArray(list) 
          ? list.filter((i: any) => {
              const status = String(i.status || 'pending').toLowerCase()
              return status === 'pending' || status === 'open'
            })
          : []
        setIssues(pendingIssues)
        console.log('📋 [Dashboard] Support issues loaded:', {
          total: list.length,
          pending: pendingIssues.length,
          sample: list.slice(0, 2)
        })
      } else {
        console.error('❌ [Dashboard] Failed to load support issues:', issuesRes)
        setIssues([])
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range])

  const { kpis, chartData } = useMemo(() => {
    const data = analytics || {}
    const s = summary || {}

    // Normalize time-series arrays
    const seriesUsers = data.users || data.data?.users || []
    const seriesKyc = data.kycSubmissions || data.data?.kycSubmissions || []
    const seriesAmount = data.amountCollected || data.data?.amountCollected || []

    const sum = (arr: any[]) =>
      arr.reduce((acc, v) => acc + (typeof v?.value === 'number' ? v.value : typeof v === 'number' ? v : 0), 0)

    // KPIs must come from /super-admin/dashboard/summary (source of truth)
    const totalUsers = Number(s.totalUsers ?? 0) || 0
    const totalAdmins = Number(s.totalAdmins ?? adminCount ?? 0) || 0
    const totalApproved = Number(s.totalApprovedApplications ?? 0) || 0
    const totalCancelled = Number(s.totalCancelledApplications ?? 0) || 0
    const totalRejected = Number(s.totalRejectedApplications ?? 0) || 0
    // Amount collected will come from blockchain, not API
    const totalAmountCollected = Number(s.totalAmountCollected ?? 0) || 0

    // Pending isn't in summary response; compute pending as total - (approved + rejected + cancelled)
    const totalPending = Math.max(0, totalUsers - (totalApproved + totalRejected + totalCancelled))

    // Merge chart buckets by label/index
    const length = Math.max(seriesUsers?.length || 0, seriesKyc?.length || 0, seriesAmount?.length || 0, 0)
    const merged = Array.from({ length }).map((_, idx) => {
      const u = seriesUsers?.[idx]
      const k = seriesKyc?.[idx]
      const a = seriesAmount?.[idx]
      const label = u?.label || k?.label || a?.label || `#${idx + 1}`
      const usersVal = typeof u?.value === 'number' ? u.value : typeof u === 'number' ? u : 0
      const kycVal = typeof k?.value === 'number' ? k.value : typeof k === 'number' ? k : 0
      const amtVal = typeof a?.value === 'number' ? a.value : typeof a === 'number' ? a : 0
      return { label, users: usersVal, submissions: kycVal, amount: amtVal }
    })

    return {
      kpis: {
        totalUsers,
        totalAdmins,
        totalApproved,
        totalPending,
        totalAmountCollected,
        totalCancelled,
      },
      chartData: merged,
    }
  }, [analytics, adminCount, summary])

  // Calculate trends data from analytics - use same data structure as chartData
  const trendsData = useMemo(() => {
    if (!analytics) {
      console.log('⚠️ [Trends] No analytics data')
      return []
    }
    
    const data = analytics || {}
    const s = summary || {}
    
    // Normalize time-series arrays (same as chartData)
    const seriesUsers = data.users || data.data?.users || []
    const seriesKyc = data.kycSubmissions || data.data?.kycSubmissions || []
    
    console.log('📈 [Trends] Data check:', {
      hasAnalytics: !!analytics,
      seriesUsersLength: Array.isArray(seriesUsers) ? seriesUsers.length : 'not array',
      seriesKycLength: Array.isArray(seriesKyc) ? seriesKyc.length : 'not array',
      seriesUsersType: typeof seriesUsers,
      seriesKycType: typeof seriesKyc,
      seriesKycSample: Array.isArray(seriesKyc) ? seriesKyc.slice(0, 2) : seriesKyc
    })
    
    // Calculate actual ratios from summary for better accuracy
    const totalApproved = Number(s.totalApprovedApplications ?? 0) || 0
    const totalCancelled = Number(s.totalCancelledApplications ?? 0) || 0
    const totalRejected = Number(s.totalRejectedApplications ?? 0) || 0
    const totalUsers = Number(s.totalUsers ?? 0) || 0
    const totalPending = Math.max(0, totalUsers - (totalApproved + totalRejected + totalCancelled))
    
    // Calculate ratios
    const approvedRatio = totalUsers > 0 ? totalApproved / totalUsers : 0.7
    const pendingRatio = totalUsers > 0 ? totalPending / totalUsers : 0.2
    const cancelledRatio = totalUsers > 0 ? (totalCancelled + totalRejected) / totalUsers : 0.1
    
    // Use the same merging logic as chartData
    const length = Math.max(
      Array.isArray(seriesUsers) ? seriesUsers.length : 0,
      Array.isArray(seriesKyc) ? seriesKyc.length : 0,
      0
    )
    
    console.log('📈 [Trends] Calculated length:', length)
    
    if (length === 0) {
      // Try alternative data structures
      const altKyc = Array.isArray(data.kycSubmissions) ? data.kycSubmissions : 
                     Array.isArray(data.data?.kycSubmissions) ? data.data.kycSubmissions :
                     Array.isArray(data.submissions) ? data.submissions :
                     Array.isArray(data.data?.submissions) ? data.data.submissions :
                     Array.isArray(data) ? data : []
      
      console.log('📈 [Trends] Trying alternative structures, found:', altKyc.length, 'items')
      
      if (altKyc.length > 0) {
        const result = altKyc.map((item: any, idx: number) => {
          const label = item?.label || item?.date || item?.month || item?.period || `#${idx + 1}`
          const value = typeof item?.value === 'number' ? item.value : typeof item === 'number' ? item : (item?.count || item?.total || 0)
          return {
            period: label,
            submissions: value,
            approved: Math.round(value * approvedRatio),
            pending: Math.round(value * pendingRatio),
            cancelled: Math.round(value * cancelledRatio),
          }
        })
        console.log('✅ [Trends] Generated from alternative structure:', result.length, 'items')
        return result
      }
      console.log('❌ [Trends] No data found in any structure')
      return []
    }
    
    // Use merged data structure (same as chartData)
    const result = Array.from({ length }).map((_, idx) => {
      const u = Array.isArray(seriesUsers) ? seriesUsers[idx] : undefined
      const k = Array.isArray(seriesKyc) ? seriesKyc[idx] : undefined
      const label = u?.label || k?.label || u?.date || k?.date || u?.month || k?.month || `#${idx + 1}`
      const kycVal = typeof k?.value === 'number' ? k.value : typeof k === 'number' ? k : (k?.count || k?.total || 0)
      const usersVal = typeof u?.value === 'number' ? u.value : typeof u === 'number' ? u : (u?.count || u?.total || 0)
      
      // Use KYC submissions or users as base
      const baseValue = kycVal > 0 ? kycVal : usersVal
      
      return {
        period: label,
        submissions: baseValue,
        approved: Math.round(baseValue * approvedRatio),
        pending: Math.round(baseValue * pendingRatio),
        cancelled: Math.round(baseValue * cancelledRatio),
      }
    }).filter(item => item.submissions > 0 || item.approved > 0 || item.pending > 0 || item.cancelled > 0)
    
    console.log('✅ [Trends] Generated trends data:', result.length, 'items', result.slice(0, 2))
    return result
  }, [analytics, summary, range])

  // Lazy load recharts components
  const LazyResponsiveContainer = nextDynamic(() => import('recharts').then((m) => m.ResponsiveContainer), { ssr: false })
  const LazyComposedChart = nextDynamic(() => import('recharts').then((m) => m.ComposedChart), { ssr: false })
  const LazyCartesianGrid = nextDynamic(() => import('recharts').then((m) => m.CartesianGrid), { ssr: false })
  const LazyXAxis = nextDynamic(() => import('recharts').then((m) => m.XAxis), { ssr: false })
  const LazyYAxis = nextDynamic(() => import('recharts').then((m) => m.YAxis), { ssr: false })
  const LazyTooltip = nextDynamic(() => import('recharts').then((m) => m.Tooltip), { ssr: false })
  const LazyLegend = nextDynamic(() => import('recharts').then((m) => m.Legend), { ssr: false })
  const LazyLine = nextDynamic(() => import('recharts').then((m) => m.Line), { ssr: false })
  const LazyArea = nextDynamic(() => import('recharts').then((m) => m.Area), { ssr: false })
  const LazyLineChart = nextDynamic(() => import('recharts').then((m) => m.LineChart), { ssr: false })

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Platform overview (Super Admin)</p>
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

      {/* KPI cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ShimmerCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <KpiCard title="Total users" value={kpis.totalUsers} icon="users" />
          <KpiCard title="Total admins" value={kpis.totalAdmins} icon="admins" />
          <KpiCard title="Approved applications" value={kpis.totalApproved} icon="approved" />
          <KpiCard title="Pending applications" value={kpis.totalPending} icon="pending" />
          <KpiCard 
            title="Amount collected" 
            value={blockchainAmount ? parseFloat(blockchainAmount).toFixed(4) : '0.0000'} 
            suffix=" BNB" 
            icon="amount" 
          />
          <KpiCard title="Cancelled applications" value={kpis.totalCancelled} icon="cancelled" />
        </div>
      )}

      {/* Trends Chart - Similar to Admin Dashboard */}
      {loading ? (
        <ShimmerChart />
      ) : (
        <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">KYC Verification Trends</h2>
              <p className="text-xs text-gray-500 mt-0.5">Application status over time ({range})</p>
            </div>
          </div>
          <div className="h-[320px]">
            {trendsData.length > 0 ? (
              <Suspense fallback={<div className="h-full flex items-center justify-center"><LoadingDots /></div>}>
                <LazyResponsiveContainer width="100%" height="100%">
                  <LazyLineChart data={trendsData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <LazyCartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <LazyXAxis dataKey="period" stroke="#6b7280" />
                    <LazyYAxis stroke="#6b7280" />
                    <LazyTooltip />
                    <LazyLegend />
                    <LazyLine type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} name="Approved" />
                    <LazyLine type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 4 }} name="Pending" />
                    <LazyLine type="monotone" dataKey="cancelled" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 4 }} name="Cancelled" />
                  </LazyLineChart>
                </LazyResponsiveContainer>
              </Suspense>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-600">
                {loading ? 'Loading trends data...' : `No trends data available for ${range} view.`}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Overall report graph */}
        {loading ? (
          <>
            <ShimmerChart />
            <ShimmerNotification />
          </>
        ) : (
          <>
            <div className="bg-white border border-gray-200 rounded-2xl p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Overall report</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Users, KYC submissions, amount collected ({range})</p>
                </div>
              </div>

              <div className="h-[320px]">
                {chartData.length > 0 ? (
                  <Suspense fallback={<div className="h-full flex items-center justify-center"><LoadingDots /></div>}>
                    <LazyResponsiveContainer width="100%" height="100%">
                      <LazyComposedChart data={chartData}>
                        <defs>
                          <linearGradient id="usersFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#111827" stopOpacity={0.18} />
                            <stop offset="95%" stopColor="#111827" stopOpacity={0.02} />
                          </linearGradient>
                          <linearGradient id="amountFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6b7280" stopOpacity={0.22} />
                            <stop offset="95%" stopColor="#6b7280" stopOpacity={0.04} />
                          </linearGradient>
                        </defs>
                        <LazyCartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" vertical={false} />
                        <LazyXAxis dataKey="label" stroke="#6b7280" tickLine={false} axisLine={false} />
                        <LazyYAxis yAxisId="left" stroke="#6b7280" tickLine={false} axisLine={false} />
                        <LazyYAxis yAxisId="right" orientation="right" stroke="#6b7280" tickLine={false} axisLine={false} />
                        <LazyTooltip
                          contentStyle={{ borderRadius: 12, borderColor: '#e5e7eb' }}
                          labelStyle={{ color: '#111827', fontWeight: 600 }}
                        />
                        <LazyLegend />
                        <LazyArea yAxisId="left" type="monotone" dataKey="users" stroke="#111827" fill="url(#usersFill)" strokeWidth={2} name="Users" />
                        <LazyLine yAxisId="left" type="monotone" dataKey="submissions" stroke="#6b7280" strokeWidth={2} dot={false} name="KYC submissions" />
                        <LazyArea yAxisId="right" type="monotone" dataKey="amount" stroke="#4b5563" fill="url(#amountFill)" strokeWidth={2} name="Amount collected" />
                      </LazyComposedChart>
                    </LazyResponsiveContainer>
                  </Suspense>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-gray-600">
                    No data available for this time range.
                  </div>
                )}
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Notifications</h2>
                <button
                  onClick={() => router.push('/super-admin/support')}
                  className="text-xs font-medium text-gray-700 hover:underline"
                >
                  View all
                </button>
              </div>

              {issues.length === 0 ? (
                <p className="text-sm text-gray-600">No open support issues.</p>
              ) : (
                <div className="space-y-3">
                  {issues.slice(0, 5).map((i) => (
                    <div key={String(i.id || i._id || i.createdAt)} className="p-3 rounded-xl border border-gray-200">
                      <p className="text-xs font-semibold text-gray-900 truncate">{i.email || '—'}</p>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{i.description || ''}</p>
                      <p className="text-[11px] text-gray-500 mt-2">
                        {i.createdAt ? new Date(i.createdAt).toLocaleString() : '—'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  )
}

function KpiCard({
  title,
  value,
  suffix,
  icon,
}: {
  title: string
  value: number | string
  suffix?: string
  icon: 'users' | 'admins' | 'approved' | 'pending' | 'amount' | 'cancelled'
}) {
  const iconWrap = 'w-11 h-11 rounded-2xl flex items-center justify-center border'
  const iconByType: Record<typeof icon, { wrap: string; svg: React.ReactNode }> = {
    users: {
      wrap: `${iconWrap} bg-gray-50 border-gray-200 text-gray-900`,
      svg: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857M14 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    admins: {
      wrap: `${iconWrap} bg-gray-50 border-gray-200 text-gray-900`,
      svg: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    approved: {
      wrap: `${iconWrap} bg-green-50 border-green-200 text-green-700`,
      svg: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    pending: {
      wrap: `${iconWrap} bg-yellow-50 border-yellow-200 text-yellow-800`,
      svg: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    amount: {
      wrap: `${iconWrap} bg-gray-900 border-gray-900 text-white`,
      svg: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1" />
        </svg>
      ),
    },
    cancelled: {
      wrap: `${iconWrap} bg-red-50 border-red-200 text-red-700`,
      svg: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    },
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {typeof value === 'number' ? value.toLocaleString() : value}
            {suffix || ''}
          </p>
        </div>
        <div className={iconByType[icon].wrap}>{iconByType[icon].svg}</div>
      </div>
    </div>
  )
}



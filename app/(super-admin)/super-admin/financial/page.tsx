'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import nextDynamic from 'next/dynamic'
import { LoadingDots } from '@/components/ui/LoadingDots'
import { ShimmerChart, ShimmerCard } from '@/components/ui/Shimmer'
import { getSuperAdminToken } from '@/lib/api/super-admin-api'

// Lazy load blockchain functions
let blockchainFunctions: any = null
const loadBlockchainFunctions = async () => {
  if (!blockchainFunctions) {
    blockchainFunctions = await import('@/app/(public)/wallet/web3')
  }
  return blockchainFunctions
}

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<any>(null)
  const [summary, setSummary] = useState<{
    totalCollected: string
    totalWithdrawn: string
    currentBalance: string
  } | null>(null)

  useEffect(() => {
    const token = getSuperAdminToken()
    if (!token) router.replace('/super-admin')
  }, [router])

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const blockchain = await loadBlockchainFunctions()
      const { getFinancialStats } = blockchain
      
      // Fetch summary stats from contract
      const stats = await getFinancialStats()

      // Set summary (convert BNB to number for display)
      setSummary({
        totalCollected: stats.totalCollected,
        totalWithdrawn: stats.totalWithdrawn,
        currentBalance: stats.currentBalance,
      })

      // Create chart data with actual contract values
      const totalCollectedNum = parseFloat(stats.totalCollected) || 0
      const totalWithdrawnNum = parseFloat(stats.totalWithdrawn) || 0
      const currentBalanceNum = parseFloat(stats.currentBalance) || 0
      
      // Set analytics for chart - show actual contract values with colors
      const chartData = [
        {
          label: 'Total Collected',
          value: totalCollectedNum,
          color: '#3b82f6', // Blue
        },
        {
          label: 'Total Withdrawn',
          value: totalWithdrawnNum,
          color: '#f59e0b', // Orange
        },
        {
          label: 'Current Balance',
          value: currentBalanceNum,
          color: '#10b981', // Green
        },
      ]
      
      setAnalytics(chartData)
    } catch (e: any) {
      setError(e?.message || 'Failed to load financial record from blockchain')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const chartData = useMemo(() => {
    if (!analytics || !Array.isArray(analytics)) {
      return []
    }
    
    // Analytics is now an array of { label, value, color } objects
    return analytics.map((item: any) => ({
      label: item.label || '',
      value: item.value || 0,
      color: item.color || '#3b82f6',
    }))
  }, [analytics])

  const totalAmountCollected = useMemo(() => {
    if (!summary) return 0
    return parseFloat(summary.totalCollected) || 0
  }, [summary])

  // Lazy load recharts
  const LazyResponsiveContainer = nextDynamic(() => import('recharts').then((m) => m.ResponsiveContainer), { ssr: false })
  const LazyBarChart = nextDynamic(() => import('recharts').then((m) => m.BarChart), { ssr: false })
  const LazyCartesianGrid = nextDynamic(() => import('recharts').then((m) => m.CartesianGrid), { ssr: false })
  const LazyXAxis = nextDynamic(() => import('recharts').then((m) => m.XAxis), { ssr: false })
  const LazyYAxis = nextDynamic(() => import('recharts').then((m) => m.YAxis), { ssr: false })
  const LazyTooltip = nextDynamic(() => import('recharts').then((m) => m.Tooltip), { ssr: false })
  const LazyLegend = nextDynamic(() => import('recharts').then((m) => m.Legend), { ssr: false })
  const LazyBar = nextDynamic(() => import('recharts').then((m) => m.Bar), { ssr: false })
  const LazyCell = nextDynamic(() => import('recharts').then((m) => m.Cell), { ssr: false })

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Financial record</h1>
          <p className="text-sm text-gray-600 mt-1">Analytics + wallet management (Super Admin only).</p>
        </div>
        <div className="flex items-center gap-2">
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
                  {summary ? parseFloat(summary.totalCollected).toFixed(4) : '0.0000'} BNB
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
                  {summary ? parseFloat(summary.totalWithdrawn).toFixed(4) : '0.0000'} BNB
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
                  {summary ? parseFloat(summary.currentBalance).toFixed(4) : '0.0000'} BNB
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

      {/* Financial Overview Chart */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Financial Overview</h2>
            <p className="text-xs text-gray-500 mt-0.5">Data from smart contract • Total collected: {totalAmountCollected.toFixed(4)} BNB</p>
          </div>
        </div>

        <div className="h-[360px]">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <LoadingDots />
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-gray-600">
              No financial data available.
            </div>
          ) : (
            <Suspense fallback={<div className="h-full flex items-center justify-center"><LoadingDots /></div>}>
              <LazyResponsiveContainer width="100%" height="100%">
                <LazyBarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 80 }}>
                  <LazyCartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <LazyXAxis 
                    dataKey="label" 
                    stroke="#6b7280"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <LazyYAxis 
                    domain={[0, 'auto']} 
                    stroke="#6b7280"
                    tickFormatter={(value) => `${parseFloat(String(value)).toFixed(4)}`}
                  />
                  <LazyTooltip 
                    formatter={(value: any) => {
                      if (value === null || value === undefined) return ''
                      const numValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0
                      return `${numValue.toFixed(8)} BNB`
                    }}
                    labelFormatter={(label) => `${label}`}
                  />
                  <LazyBar 
                    dataKey="value" 
                    name="Amount (BNB)" 
                    radius={[4, 4, 0, 0]}
                  >
                    {chartData.map((entry: any, index: number) => (
                      <LazyCell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </LazyBar>
                </LazyBarChart>
              </LazyResponsiveContainer>
            </Suspense>
          )}
        </div>
      </div>

    </main>
  )
}



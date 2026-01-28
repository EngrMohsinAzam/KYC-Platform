'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import nextDynamic from 'next/dynamic'
import { getSuperAdminToken, superAdminCompanyById } from '@/app/api/super-admin-api'
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

  useEffect(() => {
    const t = getSuperAdminToken()
    if (!t) {
      router.replace('/super-admin')
      return
    }
    const load = async () => {
      try {
        const res = await superAdminCompanyById(companyId)
        if (res?.success && res?.data) setCompany(res.data)
        else setError(res?.message || 'Failed to load')
      } catch (e: any) {
        setError(e?.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [companyId, router])

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
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10 flex items-center justify-center min-h-[320px]">
        <LoadingDots />
      </main>
    )
  }

  if (error || !company) {
    return (
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <Link href="/super-admin/companies" className="text-sm text-gray-600 hover:underline mb-4 inline-block">← Back to companies</Link>
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">{error || 'Company not found.'}</div>
      </main>
    )
  }

  return (
    <main className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link href="/super-admin/companies" className="text-sm text-gray-600 hover:underline">← Back to companies</Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{company.companyName}</h1>
        <p className="text-sm text-gray-600 mt-1">{company.companyId || company._id} · {company.industry || '—'}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase font-medium">Total users (KYC)</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalUsers.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase font-medium">Approved</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{approvedCount.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase font-medium">Pending</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{pendingCount.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase font-medium">Rejected</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{rejectedCount.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Company details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p><span className="text-gray-500">Owner:</span> {company.ownerName || '—'}</p>
            <p><span className="text-gray-500">Email:</span> {company.email}</p>
            <p><span className="text-gray-500">Phone:</span> {company.phone || '—'}</p>
            <p><span className="text-gray-500">Website:</span> {company.website ? <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{company.website}</a> : '—'}</p>
          </div>
          <div>
            <p><span className="text-gray-500">Address:</span> {company.address || '—'}</p>
            <p><span className="text-gray-500">KYC URL:</span> {company.kycUrl ? <a href={company.kycUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{company.kycUrl}</a> : '—'}</p>
          </div>
        </div>
        {company.description && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-gray-500 text-sm">Description</p>
            <p className="text-gray-700 mt-1">{company.description}</p>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">KYC overview</h2>
        <div className="h-[280px]">
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
            <div className="h-full flex items-center justify-center text-sm text-gray-500">No KYC data for this company yet.</div>
          )}
        </div>
      </div>
    </main>
  )
}

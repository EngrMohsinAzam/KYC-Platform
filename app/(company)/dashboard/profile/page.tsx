'use client'

import { useState, useEffect, useCallback } from 'react'
import { companyProfile } from '@/app/api/company-api'

type Profile = {
  companyName?: string
  companyId?: string
  companySlug?: string
  ownerName?: string
  email?: string
  phone?: string
  address?: string
  website?: string
  description?: string
  kycUrl?: string
  status?: string
  totalKycSubmissions?: number
  approvedKycCount?: number
  pendingKycCount?: number
  rejectedKycCount?: number
  createdAt?: string
  approvedAt?: string
  package?: string
  plan?: string
}

export default function CompanyProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const r = await companyProfile()
      if (!r?.success) {
        setError(r?.message || 'Failed to load profile')
        return
      }
      setProfile(r?.data ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const copyUrl = () => {
    if (!profile?.kycUrl) return
    navigator.clipboard.writeText(profile.kycUrl).then(() => {
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

  const p = profile!
  const pkg = p.package || p.plan || 'Standard'

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Profile</h1>
        <p className="text-sm text-gray-600 mt-1">Your company details</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Company</h2>
          <p className="text-sm text-gray-600">Basic information</p>
        </div>
        <div className="px-4 sm:px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Company name</label>
              <p className="text-sm font-medium text-gray-900">{p.companyName || '—'}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Package / Plan</label>
              <p className="text-sm font-medium text-gray-900">{pkg}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Owner</label>
              <p className="text-sm text-gray-900">{p.ownerName || '—'}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Email</label>
              <p className="text-sm text-gray-900">{p.email || '—'}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Phone</label>
              <p className="text-sm text-gray-900">{p.phone || '—'}</p>
            </div>
            {p.website && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Website</label>
                <a href={p.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                  {p.website}
                </a>
              </div>
            )}
            {p.address && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Address</label>
                <p className="text-sm text-gray-900">{p.address}</p>
              </div>
            )}
            {p.description && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Description</label>
                <p className="text-sm text-gray-700">{p.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">KYC URL</h2>
          <p className="text-sm text-gray-600">Share this link with users to complete verification</p>
        </div>
        <div className="px-4 sm:px-6 py-5">
          {p.kycUrl ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                readOnly
                value={p.kycUrl}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm font-mono"
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
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">KYC summary</h2>
          <p className="text-sm text-gray-600">Verifications via your form</p>
        </div>
        <div className="px-4 sm:px-6 py-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Total</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{Number(p.totalKycSubmissions ?? 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Approved</p>
              <p className="text-xl font-bold text-green-700 mt-1">{Number(p.approvedKycCount ?? 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Pending</p>
              <p className="text-xl font-bold text-yellow-700 mt-1">{Number(p.pendingKycCount ?? 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Rejected</p>
              <p className="text-xl font-bold text-red-700 mt-1">{Number(p.rejectedKycCount ?? 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

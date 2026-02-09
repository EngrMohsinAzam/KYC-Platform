'use client'

import { useState, useEffect, useCallback } from 'react'
import { companyProfile, companyPackageGet, companyPackageUpdate } from '@/app/api/company-api'

type PackageInfo = {
  selected?: string
  name?: string
  baseChargePerUser?: number
  monthlyFee?: number
  features?: string[]
  extraChargePerUser?: number
  totalChargePerUser?: number
}

type AvailablePackage = {
  id: string
  name: string
  baseChargePerUser?: number
  monthlyFee?: number
  features?: string[]
}

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
  status?: string
  createdAt?: string
  approvedAt?: string
  package?: PackageInfo | string
  plan?: string
}

const PACKAGE_IDS = [
  { id: 'pay_as_you_go', name: 'Pay as you go' },
  { id: 'basic', name: 'Basic' },
  { id: 'standard', name: 'Standard' },
  { id: 'premium', name: 'Premium' },
]

export default function CompanyProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [packageData, setPackageData] = useState<{ data?: PackageInfo & { availablePackages?: AvailablePackage[] } } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editPackage, setEditPackage] = useState(false)
  const [editSelectedPackage, setEditSelectedPackage] = useState('')
  const [editExtraCharge, setEditExtraCharge] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const [p, pkg] = await Promise.all([companyProfile(), companyPackageGet()])
      if (!p?.success) {
        setError(p?.message || 'Failed to load profile')
        return
      }
      setProfile(p?.data ?? null)
      if (pkg?.success && pkg?.data) {
        setPackageData(pkg)
        const d = pkg.data as PackageInfo
        setEditSelectedPackage(d.selected ?? '')
        setEditExtraCharge(String(d.extraChargePerUser ?? 0))
      } else {
        const pkgFromProfile = (p?.data as Profile)?.package
        if (typeof pkgFromProfile === 'object' && pkgFromProfile) {
          setEditSelectedPackage(pkgFromProfile.selected ?? '')
          setEditExtraCharge(String(pkgFromProfile.extraChargePerUser ?? 0))
        }
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

  const handleSavePackage = async () => {
    setSaveError('')
    setSaving(true)
    try {
      const extra = parseFloat(editExtraCharge)
      const res = await companyPackageUpdate({
        selectedPackage: editSelectedPackage || undefined,
        extraChargePerUser: Number.isNaN(extra) || extra < 0 ? 0 : extra,
      })
      if (!res?.success) throw new Error(res?.message || 'Update failed')
      setEditPackage(false)
      // Update packageData immediately from PATCH response so UI shows new values
      const updated = res?.data?.package ?? res?.data
      if (updated) {
        setPackageData({ data: updated as PackageInfo })
      }
      await load()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to update')
    } finally {
      setSaving(false)
    }
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
  // Prefer packageData from GET /api/company/package (fresh) over profile.package (may be stale)
  const pkgObj = (packageData?.data ? packageData.data as PackageInfo : null) ?? (typeof p.package === 'object' ? p.package : null)
  const pkgName = pkgObj?.name ?? (typeof p.package === 'string' ? p.package : p.plan) ?? '—'
  const availablePkgs = packageData?.data?.availablePackages ?? PACKAGE_IDS

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Profile</h1>
        <p className="text-sm text-gray-600 mt-1">Your company details</p>
      </div>

      {/* Package section with edit */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Package</h2>
            <p className="text-sm text-gray-600">Your plan and pricing</p>
          </div>
          {!editPackage ? (
            <button
              onClick={() => setEditPackage(true)}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setEditPackage(false)} className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">
                Cancel
              </button>
              <button onClick={handleSavePackage} disabled={saving} className="px-3 py-1.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
        </div>
        <div className="px-4 sm:px-6 py-5">
          {editPackage ? (
            <div className="space-y-4">
              {saveError && <p className="text-sm text-red-600">{saveError}</p>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Package</label>
                <select
                  value={editSelectedPackage}
                  onChange={(e) => setEditSelectedPackage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900"
                >
                  {availablePkgs.map((ap) => (
                    <option key={typeof ap === 'object' ? ap.id : ap} value={typeof ap === 'object' ? ap.id : ap}>
                      {typeof ap === 'object' ? ap.name : ap}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Extra charge per user ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editExtraCharge}
                  onChange={(e) => setEditExtraCharge(e.target.value.replace(/[^0-9.]/g, ''))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">Plan</p>
                <p className="text-sm font-medium text-gray-900">{pkgName}</p>
              </div>
              {pkgObj?.baseChargePerUser != null && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Base charge / user</p>
                  <p className="text-sm font-medium text-gray-900">${pkgObj.baseChargePerUser}</p>
                </div>
              )}
              {pkgObj?.monthlyFee != null && pkgObj.monthlyFee > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Monthly fee</p>
                  <p className="text-sm font-medium text-gray-900">${pkgObj.monthlyFee}/mo</p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">Extra charge / user</p>
                <p className="text-sm font-medium text-gray-900">${pkgObj?.extraChargePerUser ?? 0}</p>
              </div>
              {pkgObj?.totalChargePerUser != null && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Total charge / user</p>
                  <p className="text-sm font-medium text-gray-900">${pkgObj.totalChargePerUser}</p>
                </div>
              )}
            </div>
          )}
          {!editPackage && pkgObj?.features?.length && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Features</p>
              <ul className="flex flex-wrap gap-2">
                {pkgObj.features.map((f, i) => (
                  <li key={i} className="px-2 py-1 bg-gray-100 rounded-lg text-sm text-gray-700">{f}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
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
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Owner</label>
              <p className="text-sm font-medium text-gray-900">{p.ownerName || '—'}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Email</label>
              <p className="text-sm font-medium text-gray-900">{p.email || '—'}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Phone</label>
              <p className="text-sm font-medium text-gray-900">{p.phone || '—'}</p>
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
                <p className="text-sm font-medium text-gray-900">{p.address}</p>
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
    </div>
  )
}

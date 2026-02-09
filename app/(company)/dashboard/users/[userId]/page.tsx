'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { companyKycByUserId, companyKycUserStatus } from '@/app/api/company-api'

type KycUser = {
  userId?: string
  fullName?: string
  email?: string
  phone?: string
  kycStatus?: string
  submittedAt?: string
  countryName?: string
  cityName?: string
  address?: string
  idType?: string
  cnicNumber?: string
  identityDocumentFront?: string
  identityDocumentBack?: string
  liveInImage?: string
  rejectionReason?: string
}

const REJECT_REASONS = [
  { id: 'blur', label: 'Picture is blurry – allow user to redo KYC', allowResubmit: true },
  { id: 'invalid', label: 'Invalid or expired document', allowResubmit: false },
  { id: 'mismatch', label: "Information doesn't match", allowResubmit: false },
  { id: 'other', label: 'Other', allowResubmit: false },
]

export default function CompanyUserDetailPage() {
  const params = useParams()
  const userId = params.userId as string
  const [user, setUser] = useState<KycUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const load = useCallback(async () => {
    if (!userId) return
    setError('')
    setLoading(true)
    try {
      const r = await companyKycByUserId(userId)
      if (r?.success && r?.data) setUser(r.data as KycUser)
      else setError(r?.message || 'User not found')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  const handleApprove = async () => {
    if (!userId) return
    setActionError('')
    setActionLoading(true)
    try {
      const r = await companyKycUserStatus(userId, { status: 'approved' })
      if (r?.success) await load()
      else setActionError(r?.message || 'Failed to approve')
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to approve')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!userId || !rejectReason.trim()) return
    const entry = REJECT_REASONS.find((r) => r.id === rejectReason)
    const allowResubmit = entry?.allowResubmit ?? false
    const reasonLabel = entry?.label ?? rejectReason
    setActionError('')
    setActionLoading(true)
    try {
      const body: { status: string; reason?: string; allowResubmit?: boolean } = { status: 'rejected', reason: reasonLabel }
      if (allowResubmit) body.allowResubmit = true
      const r = await companyKycUserStatus(userId, body)
      if (r?.success) {
        setRejectOpen(false)
        setRejectReason('')
        await load()
      } else {
        setActionError(r?.message || 'Failed to reject')
      }
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to reject')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-gray-900" />
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900">← Back to Dashboard</Link>
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700">
          {error || 'User not found'}
        </div>
      </div>
    )
  }

  const canAct = user.kycStatus !== 'approved' && user.kycStatus !== 'rejected'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900">← Back to Dashboard</Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mt-1">User details</h1>
          <p className="text-sm text-gray-600 mt-0.5">{user.fullName || '—'} · {user.email || '—'}</p>
        </div>
        {canAct && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleApprove}
              disabled={actionLoading}
              className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => { setRejectOpen(true); setActionError(''); setRejectReason('') }}
              disabled={actionLoading}
              className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        )}
      </div>

      {actionError && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
          {actionError}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">KYC information</h2>
        </div>
        <div className="px-4 sm:px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Full name</label>
              <p className="text-sm font-medium text-gray-900">{user.fullName || '—'}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Email</label>
              <p className="text-sm text-gray-900">{user.email || '—'}</p>
            </div>
            {user.phone && (
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Phone</label>
                <p className="text-sm text-gray-900">{user.phone}</p>
              </div>
            )}
            {user.countryName && (
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Country</label>
                <p className="text-sm text-gray-900">{user.countryName}</p>
              </div>
            )}
            {user.cityName && (
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">City</label>
                <p className="text-sm text-gray-900">{user.cityName}</p>
              </div>
            )}
            {user.address && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Address</label>
                <p className="text-sm text-gray-900">{user.address}</p>
              </div>
            )}
            {user.idType && (
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">ID type</label>
                <p className="text-sm text-gray-900">{user.idType}</p>
              </div>
            )}
            {user.cnicNumber && (
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">CNIC</label>
                <p className="text-sm text-gray-900">{user.cnicNumber}</p>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Status</label>
              <span
                className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                  user.kycStatus === 'approved' ? 'bg-green-100 text-green-800' : user.kycStatus === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {user.kycStatus || '—'}
              </span>
            </div>
            {user.submittedAt && (
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Submitted</label>
                <p className="text-sm text-gray-900">{new Date(user.submittedAt).toLocaleString()}</p>
              </div>
            )}
            {user.rejectionReason && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Rejection reason</label>
                <p className="text-sm text-red-700">{user.rejectionReason}</p>
              </div>
            )}
          </div>
          <div className="pt-4 border-t border-gray-100 space-y-4">
            {user.identityDocumentFront && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">ID front</p>
                <a href={user.identityDocumentFront} target="_blank" rel="noopener noreferrer" className="block">
                  <img
                    src={user.identityDocumentFront}
                    alt="ID front"
                    className="max-w-full w-full max-h-[320px] object-contain rounded-lg border border-gray-200 bg-gray-50"
                  />
                </a>
              </div>
            )}
            {user.identityDocumentBack && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">ID back</p>
                <a href={user.identityDocumentBack} target="_blank" rel="noopener noreferrer" className="block">
                  <img
                    src={user.identityDocumentBack}
                    alt="ID back"
                    className="max-w-full w-full max-h-[320px] object-contain rounded-lg border border-gray-200 bg-gray-50"
                  />
                </a>
              </div>
            )}
            {user.liveInImage && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">Selfie</p>
                <a href={user.liveInImage} target="_blank" rel="noopener noreferrer" className="block">
                  <img
                    src={user.liveInImage}
                    alt="Selfie"
                    className="max-w-full w-full max-h-[320px] object-contain rounded-lg border border-gray-200 bg-gray-50"
                  />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {rejectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Reject KYC</h3>
            <p className="text-sm text-gray-600 mb-4">{user.fullName || '—'} ({user.email || '—'})</p>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
            <select
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm mb-4"
            >
              <option value="">Select reason…</option>
              {REJECT_REASONS.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setRejectOpen(false); setRejectReason(''); setActionError('') }}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={actionLoading || !rejectReason}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting…' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

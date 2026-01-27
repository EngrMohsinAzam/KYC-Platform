'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingDots } from '@/components/ui/LoadingDots'
import { getSuperAdminToken, getKycPausedStatus, superAdminSetKycPaused } from '@/app/api/super-admin-api'

function toIsoOrUndefined(value: string): string | undefined {
  if (!value) return undefined
  const dt = new Date(value)
  if (isNaN(dt.getTime())) return undefined
  return dt.toISOString()
}

function formatCountdown(ms: number) {
  if (!ms || isNaN(ms) || ms < 0) return '00:00:00'
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

export default function PauseKycPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [kycPaused, setKycPaused] = useState(false)
  const [pauseStartAt, setPauseStartAt] = useState('')
  const [pauseEndAt, setPauseEndAt] = useState('')
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const token = getSuperAdminToken()
    if (!token) router.replace('/super-admin')
  }, [router])

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const result = await getKycPausedStatus()
      if (!result || !result.success) {
        setError(result?.message || 'Failed to load paused status')
        return
      }
      const data = result.data || {}
      setKycPaused(!!data.kycPaused)
      try {
        if (data.pauseStartAt) {
          const startDate = new Date(data.pauseStartAt)
          if (!isNaN(startDate.getTime())) {
            setPauseStartAt(startDate.toISOString().slice(0, 16))
          }
        }
        if (data.pauseEndAt) {
          const endDate = new Date(data.pauseEndAt)
          if (!isNaN(endDate.getTime())) {
            setPauseEndAt(endDate.toISOString().slice(0, 16))
          }
        }
      } catch (dateError) {
        console.error('Error parsing dates:', dateError)
      }
    } catch (e: any) {
      console.error('Error loading paused status:', e)
      setError(e?.message || 'Failed to load paused status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const endMs = useMemo(() => {
    if (!pauseEndAt) return null
    const dt = new Date(pauseEndAt).getTime()
    return isNaN(dt) ? null : dt
  }, [pauseEndAt])

  const countdown = useMemo(() => {
    if (!kycPaused || !endMs || !now) return null
    const diff = endMs - now
    if (diff <= 0) return null
    return formatCountdown(diff)
  }, [endMs, kycPaused, now])

  const onSave = async () => {
    try {
      setSaving(true)
      setError('')
      const body = {
        kycPaused,
        pauseStartAt: toIsoOrUndefined(pauseStartAt),
        pauseEndAt: toIsoOrUndefined(pauseEndAt),
      }
      console.log('💾 [PauseKycPage] onSave - Request body:', JSON.stringify(body, null, 2))
      const result = await superAdminSetKycPaused(body)
      console.log('💾 [PauseKycPage] onSave - Result:', JSON.stringify(result, null, 2))
      if (!result.success) {
        setError(result.message || 'Failed to update KYC pause')
        return
      }
      await load()
    } catch (e: any) {
      setError(e.message || 'Failed to update KYC pause')
      console.error('❌ [PauseKycPage] onSave - Error:', e)
    } finally {
      setSaving(false)
    }
  }

  const onTogglePause = async () => {
    // Immediate toggle should call the backend right away (no need to press Save).
    const next = !kycPaused
    setKycPaused(next)
    try {
      setSaving(true)
      setError('')
      const requestBody = {
        kycPaused: next,
        // Keep schedule fields if provided; backend can ignore if not supported
        pauseStartAt: toIsoOrUndefined(pauseStartAt),
        pauseEndAt: toIsoOrUndefined(pauseEndAt),
      }
      console.log('🔄 [PauseKycPage] onTogglePause - Request body:', JSON.stringify(requestBody, null, 2))
      const result = await superAdminSetKycPaused(requestBody)
      console.log('🔄 [PauseKycPage] onTogglePause - Result:', JSON.stringify(result, null, 2))
      if (!result.success) {
        throw new Error(result.message || 'Failed to update KYC pause')
      }
      await load()
    } catch (e: any) {
      // Revert UI toggle if API fails
      setKycPaused(!next)
      setError(e.message || 'Failed to update KYC pause')
      console.error('❌ [PauseKycPage] onTogglePause - Error:', e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Pause / Unpause</h1>
          <p className="text-sm text-gray-600 mt-1">
            When paused, `POST /kyc/submit` and `PUT /kyc/update-documents` are blocked.
          </p>
        </div>
        <button
          onClick={load}
          className="px-4 py-2 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-gray-500">Current status</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {loading ? 'Loading...' : kycPaused ? 'Paused' : 'Active'}
              </p>
              {countdown && (
                <p className="text-sm text-gray-600 mt-1">
                  Ends in: <span className="font-mono">{countdown}</span>
                </p>
              )}
            </div>
            <label className="inline-flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Pause KYC</span>
              <button
                type="button"
                onClick={onTogglePause}
                disabled={saving || loading}
                className={[
                  'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
                  kycPaused ? 'bg-black' : 'bg-gray-300',
                ].join(' ')}
              >
                <span
                  className={[
                    'inline-block h-5 w-5 transform rounded-full bg-white transition-transform',
                    kycPaused ? 'translate-x-6' : 'translate-x-1',
                  ].join(' ')}
                />
              </button>
            </label>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-700">Pause start (optional)</label>
              <input
                type="datetime-local"
                value={pauseStartAt}
                onChange={(e) => setPauseStartAt(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Pause end (optional)</label>
              <input
                type="datetime-local"
                value={pauseEndAt}
                onChange={(e) => setPauseEndAt(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={onSave}
              disabled={saving || loading}
              className="px-5 py-2.5 rounded-xl bg-black hover:bg-black/80 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <LoadingDots size="sm" color="#ffffff" />
                  Saving...
                </>
              ) : (
                'Save schedule'
              )}
            </button>
            <button
              onClick={() => {
                setKycPaused(false)
                setPauseStartAt('')
                setPauseEndAt('')
              }}
              className="px-5 py-2.5 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-sm font-medium"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Notes</h2>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>- Super Admin bypasses permission checks.</li>
            <li>- Admin role uses permissions returned from `/admin/capabilities`.</li>
            <li>- If you set an end time, the UI shows a live countdown.</li>
          </ul>
        </div>
      </div>
    </main>
  )
}



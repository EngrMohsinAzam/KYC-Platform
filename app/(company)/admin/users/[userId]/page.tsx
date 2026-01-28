'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getAdminToken, getUserDetails, User } from '@/app/api/admin-api'
import { LoadingPage } from '@/components/ui/LoadingDots'

export default function UserDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.userId as string

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = getAdminToken()
    if (!token) {
      router.replace('/admin')
      return
    }
    if (!userId) {
      setError('User ID is missing')
      setLoading(false)
      return
    }
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const result = await getUserDetails(decodeURIComponent(userId))
        if (result.success && result.data) {
          setUser(result.data)
        } else {
          setError(result.message || 'Failed to load user')
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load user')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router, userId])

  if (loading) {
    return <LoadingPage message="Loading user details..." />
  }

  if (error || !user) {
    return (
      <main className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <button
          onClick={() => router.push('/admin/dashboard')}
          className="text-sm text-gray-700 hover:underline"
        >
          ← Back to Dashboard
        </button>
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error || 'User not found'}
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-xl font-bold text-gray-900">User Details</h1>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-600">Email</p>
          <p className="text-base font-medium text-gray-900">{user.email}</p>
          {user.fullName && (
            <>
              <p className="text-sm text-gray-600 mt-4">Name</p>
              <p className="text-base font-medium text-gray-900">{user.fullName}</p>
            </>
          )}
          {user.kycStatus && (
            <>
              <p className="text-sm text-gray-600 mt-4">KYC Status</p>
              <p className="text-base font-medium text-gray-900">{user.kycStatus}</p>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

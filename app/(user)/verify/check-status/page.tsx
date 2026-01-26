'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Header } from '@/components/layout/Header'
import { checkStatusByEmail } from '@/lib/api/api'
import { LoadingDots } from '@/components/ui/LoadingDots'

// Validate email format
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export default function CheckStatus() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusData, setStatusData] = useState<any>(null)

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    setError(null)
    setStatusData(null)
  }

  const handleCheckStatus = async () => {
    if (!email) {
      setError('Please enter your email address')
      return
    }

    // Validate email format
    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setError(null)
    setStatusData(null)

    try {
      const result = await checkStatusByEmail(email)
      
      if (result.success && result.data) {
        setStatusData(result.data)
        
        // Handle different statuses - check both verificationStatus and kycStatus
        const status = result.data.verificationStatus || result.data.kycStatus
        
        console.log('📊 Status check result:', {
          verificationStatus: result.data.verificationStatus,
          kycStatus: result.data.kycStatus,
          finalStatus: status,
          fullData: result.data
        })
        
        if (status === 'approved') {
          // Redirect to complete screen
          setTimeout(() => {
            router.push('/decentralized-id/complete')
          }, 2000)
        } else if (status === 'pending' || status === 'submitted' || status === 'under_review' || status === 'underReview') {
          // Show under review screen - prioritize pending/under_review over rejected
          setTimeout(() => {
            router.push('/verify/under-review')
          }, 2000)
        } else if (status === 'cancelled' || status === 'rejected') {
          // Show rejected screen with email parameter
          setTimeout(() => {
            router.push(`/verify/rejected?email=${encodeURIComponent(email)}`)
          }, 2000)
        } else if (status === 'not_found') {
          // Show verification start screen
          setTimeout(() => {
            router.push('/')
          }, 2000)
        } else {
          // Unknown status - default to under review if status exists, otherwise show error
          if (status) {
            console.warn('⚠️ Unknown status, defaulting to under review:', status)
            setTimeout(() => {
              router.push('/verify/under-review')
            }, 2000)
          } else {
            setError('Status information not available. Please try again.')
          }
        }
      } else {
        setError(result.message || 'Failed to check status')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white md:bg-surface-gray flex flex-col">
      <Header showBack title="Check Verification Status" />
      <main className="flex-1 px-4 md:px-0 pt-6 pb-24 md:flex md:items-center md:justify-center">
        <div className="w-full max-w-md md:bg-white md:rounded-2xl md:p-8 md:my-8 md:border-[2px] md:border-grey-400">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-text-primary mb-4 text-center">
              Check Your Status
            </h1>
            <p className="text-sm text-text-secondary mb-6 text-center">
              Enter your email address to check your verification status
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={handleEmailChange}
                disabled={loading}
                className="w-full"
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {statusData && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-semibold text-blue-900 mb-2">Status:</p>
                <p className="text-sm text-blue-800 capitalize mb-1">
                  {(() => {
                    const status = statusData.verificationStatus || statusData.kycStatus
                    if (status === 'not_found') return 'Not Found'
                    if (status === 'approved') return 'Approved ✓'
                    if (status === 'pending' || status === 'submitted' || status === 'under_review' || status === 'underReview') return 'Under Review'
                    if (status === 'cancelled') return 'Cancelled'
                    if (status === 'rejected') return 'Rejected'
                    return status || 'Unknown'
                  })()}
                </p>
                {statusData.fullName && (
                  <p className="text-xs text-blue-700">Name: {statusData.fullName}</p>
                )}
                {statusData.email && (
                  <p className="text-xs text-blue-700">Email: {statusData.email}</p>
                )}
                {statusData.message && (
                  <p className="text-xs text-blue-700 mt-2">{statusData.message}</p>
                )}
                <p className="text-xs text-blue-600 mt-2">
                  {(() => {
                    const status = statusData.verificationStatus || statusData.kycStatus
                    if (status === 'approved') return 'Redirecting to your verified ID...'
                    if (status === 'pending' || status === 'submitted' || status === 'under_review' || status === 'underReview') return 'Redirecting to under review page...'
                    if (status === 'cancelled' || status === 'rejected') return 'Redirecting...'
                    if (status === 'not_found') return 'Redirecting to start verification...'
                    return 'Redirecting...'
                  })()}
                </p>
              </div>
            )}

            <Button
              onClick={handleCheckStatus}
              disabled={loading || !email}
              className="w-full bg-black hover:bg-black/80 text-white font-semibold rounded-full py-3 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <LoadingDots size="sm" color="#ffffff" />
                  <span>Checking...</span>
                </>
              ) : (
                'Check Status'
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}


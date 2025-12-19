'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Header } from '@/components/layout/Header'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useAppContext } from '@/context/useAppContext'
import { clearKYCCache, clearAllKYCCaches } from '@/lib/utils/kyc-cache'
import { getKycPausedStatus } from '@/lib/api/api'

export default function VerificationStart() {
  const router = useRouter()
  const { state, dispatch } = useAppContext()
  const [pausedMessage, setPausedMessage] = useState<string | null>(null)

  // Clear KYC data when user navigates to start page (starting new submission)
  useEffect(() => {
    const clearData = async () => {
      console.log('🧹 Clearing KYC data - user starting new submission')
      
      // Set clear flag immediately to prevent AppProvider from restoring
      if (typeof window !== 'undefined') {
        localStorage.setItem('kyc_data_cleared', Date.now().toString())
      }
      
      // Clear all documents and personal info from state
      dispatch({ type: 'CLEAR_KYC_DATA' })
      
      // Clear cache from IndexedDB - try to get email from localStorage before clearing
      let email: string | undefined
      let userId: string | undefined
      
      try {
        const stored = localStorage.getItem('kyc_app_state')
        if (stored) {
          const parsed = JSON.parse(stored)
          email = parsed.personalInfo?.email
          userId = parsed.user?.id || parsed.user?.anonymousId
        }
      } catch (e) {
        // Ignore
      }
      
      // Also try from current state
      if (!email) email = state.personalInfo?.email
      if (!userId) userId = state.user?.id || state.user?.anonymousId
      
      // Always clear all caches to ensure no old documents remain
      try {
        await clearAllKYCCaches()
        console.log('✅ All KYC caches cleared')
      } catch (error) {
        console.error('Failed to clear all KYC caches:', error)
        // Fallback: try to clear with specific email/userId if available
        if (email || userId) {
          try {
            await clearKYCCache(email, userId)
            console.log('✅ KYC cache cleared (fallback)')
          } catch (fallbackError) {
            console.error('Failed to clear KYC cache (fallback):', fallbackError)
          }
        }
      }
    }
    
    clearData()
  }, []) // Only run once on mount

  // Guard: if KYC is paused, block the start flow
  useEffect(() => {
    const checkPaused = async () => {
      try {
        const res = await getKycPausedStatus()
        const paused = !!(res?.data?.kycPaused ?? (res as any)?.kycPaused)
        if (paused) {
          setPausedMessage('KYC process has been stopped for a specific reason. We’ll let you know when you can come back.')
        }
      } catch {
        // If the check fails, don't hard-block; user can proceed.
      }
    }
    checkPaused()
  }, [])

  const handleContinue = () => {
    if (pausedMessage) return
    router.push('/verify/personal-info')
  }

  return (
    <div className="min-h-screen h-screen bg-white flex flex-col overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <button onClick={() => router.push('/')} className="p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block">
        <Header showClose />
        <ProgressBar currentStep={0} totalSteps={5} />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full md:flex md:items-center md:justify-center md:py-8">
          {/* Mobile Design */}
          <div className="md:hidden h-full flex flex-col px-4 pt-12 pb-32">
            {pausedMessage && (
              <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-yellow-900">KYC temporarily paused</p>
                <p className="text-sm text-yellow-800 mt-1">{pausedMessage}</p>
                <button
                  onClick={() => router.push('/')}
                  className="mt-3 text-sm font-medium text-gray-900 underline"
                >
                  Back to home
                </button>
              </div>
            )}
            <div className="flex-1 flex flex-col justify-center">
              {/* Title */}
              <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                Identity Verification
              </h1>

              {/* Important Note */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-yellow-900 mb-3">
                      Important Instructions
                    </h3>
                    <ul className="space-y-2 text-sm text-yellow-800">
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-600 mt-1">•</span>
                        <span>All details entered must be correct and complete</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-600 mt-1">•</span>
                        <span>Ensure your ID document is valid and not expired</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-600 mt-1">•</span>
                        <span>Take clear photos with good lighting</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-600 mt-1">•</span>
                        <span>Make sure your face is clearly visible in the selfie</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-600 mt-1">•</span>
                        <span>Have your wallet ready with BNB for the $2 KYC fee payment</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-600 mt-1">•</span>
                        <span>You will need to connect your wallet and pay the fee to complete verification</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Design */}
          <div className="hidden md:block w-full max-w-2xl px-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 border border-gray-200">
              {pausedMessage && (
                <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-yellow-900">KYC temporarily paused</p>
                  <p className="text-sm text-yellow-800 mt-1">{pausedMessage}</p>
                  <button
                    onClick={() => router.push('/')}
                    className="mt-3 text-sm font-medium text-gray-900 underline"
                  >
                    Back to home
                  </button>
                </div>
              )}
              {/* Title */}
              <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
                Identity Verification
              </h1>

              {/* Important Note */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 mb-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-yellow-900 mb-4">
                      Important Instructions
                    </h3>
                    <ul className="space-y-3 text-base text-yellow-800">
                      <li className="flex items-start gap-3">
                        <span className="text-yellow-600 mt-1.5">•</span>
                        <span>All details entered must be correct and complete</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-yellow-600 mt-1.5">•</span>
                        <span>Ensure your ID document is valid and not expired</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-yellow-600 mt-1.5">•</span>
                        <span>Take clear photos with good lighting</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-yellow-600 mt-1.5">•</span>
                        <span>Make sure your face is clearly visible in the selfie</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-yellow-600 mt-1.5">•</span>
                        <span>Have your wallet ready with BNB for the $2 KYC fee payment</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-yellow-600 mt-1.5">•</span>
                        <span>You will need to connect your wallet and pay the fee to complete verification</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Continue Button */}
              <Button
                onClick={handleContinue}
                disabled={!!pausedMessage}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full py-4 font-semibold text-lg"
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Fixed Button */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg">
        <Button
          onClick={handleContinue}
          disabled={!!pausedMessage}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full py-4 font-semibold text-lg"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}


'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Header } from '@/components/layout/Header'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useAppContext } from '@/context/useAppContext'
import { HiOutlineDocumentText, HiOutlineUser } from 'react-icons/hi'
import { updateKYCDocuments } from '@/lib/api'
import { LoadingDots } from '@/components/ui/LoadingDots'

export default function VerifyIdentity() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { state } = useAppContext()
  const [isUpdating, setIsUpdating] = useState(false)
  
  // Check if we're in update mode (from blur rejection)
  const isUpdateMode = searchParams.get('update') === 'true'
  const updateEmail = searchParams.get('email') || state.personalInfo?.email

  const handleDocumentClick = () => {
    // Preserve update mode query params if in update mode
    if (isUpdateMode && updateEmail) {
      router.push(`/verify/upload-document?update=true&email=${encodeURIComponent(updateEmail)}`)
    } else {
      router.push('/verify/upload-document')
    }
  }

  const handleSelfieClick = () => {
    // Preserve update mode query params if in update mode
    if (isUpdateMode && updateEmail) {
      router.push(`/verify/upload-selfie?update=true&email=${encodeURIComponent(updateEmail)}`)
    } else {
      router.push('/verify/upload-selfie')
    }
  }

  const hasDocument = state.documentImageFront || state.documentImage
  const needsBackSide = state.selectedIdType && state.selectedIdType !== 'passport'
  const hasBackImage = !needsBackSide || state.documentImageBack
  const documentComplete = hasDocument && hasBackImage
  const canContinue = documentComplete && state.selfieImage

  const handleUpdateDocuments = useCallback(async () => {
    if (!updateEmail || !state.documentImageFront || !state.selfieImage) {
      return
    }

    if (needsBackSide && !state.documentImageBack) {
      return
    }

    setIsUpdating(true)
    try {
      const idTypeMap: Record<string, string> = {
        'national-id': 'CNIC',
        'passport': 'Passport',
        'drivers-license': 'License'
      }
      const idType = idTypeMap[state.selectedIdType || ''] || 'CNIC'

      const result = await updateKYCDocuments({
        email: updateEmail,
        idType,
        identityDocumentFront: state.documentImageFront,
        identityDocumentBack: state.documentImageBack || state.documentImageFront,
        liveInImage: state.selfieImage
      })

      if (result.success) {
        // Navigate to under review page after successful update
        router.push('/verify/under-review')
      } else {
        alert(result.message || 'Failed to update documents. Please try again.')
        setIsUpdating(false)
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred. Please try again.')
      setIsUpdating(false)
    }
  }, [updateEmail, state.documentImageFront, state.documentImageBack, state.selfieImage, state.selectedIdType, needsBackSide, router])

  // Auto-update when both documents are ready in update mode
  useEffect(() => {
    if (isUpdateMode && canContinue && updateEmail && !isUpdating) {
      handleUpdateDocuments()
    }
  }, [isUpdateMode, canContinue, updateEmail, isUpdating, handleUpdateDocuments])

  const handleContinue = () => {
    if (isUpdateMode) {
      // In update mode, never go to personal-info, only update documents
      // handleUpdateDocuments will be called automatically when both are ready
      // But if user clicks manually, call it here too
      if (canContinue && !isUpdating) {
        handleUpdateDocuments()
      }
    } else {
      // Normal flow - go to personal-info
      router.push('/verify/personal-info')
    }
  }

  return (
    <div className="min-h-screen h-screen bg-white flex flex-col overflow-hidden">
      {/* Mobile Header - Simple back and close */}
      <div className="md:hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <button onClick={() => router.back()} className="p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button onClick={() => router.push('/')} className="p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block">
        <Header showBack showClose title="Verify your identity" />
        <ProgressBar currentStep={3} totalSteps={5} />
      </div>
      
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full md:flex md:items-center md:justify-center md:py-16">
          {/* Mobile Design - Full screen, centered */}
          <div className="md:hidden h-full flex flex-col px-4 pt-12 pb-32">
            {/* Title */}
            <div className="text-center mb-6">
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                {isUpdateMode ? 'Update your documents' : 'Verify your identity'}
              </h1>
              <p className="text-sm text-gray-400">
                {isUpdateMode 
                  ? 'Please upload clear photos of your document and selfie'
                  : 'It will only take 2 minutes'}
              </p>
            </div>

            {/* Uploading Status - Prominent Display */}
            {isUpdateMode && isUpdating && (
              <div className="mb-6 p-5 bg-blue-50 border-2 border-blue-300 rounded-xl shadow-sm">
                <div className="flex flex-col items-center justify-center gap-3">
                  <LoadingDots size="lg" color="#2563eb" />
                  <div className="text-center">
                    <p className="text-base font-bold text-blue-900 mb-1">Uploading...</p>
                    <p className="text-sm text-blue-700">Please wait, this may take a moment</p>
                  </div>
                </div>
              </div>
            )}

            {/* Cards */}
            <div className={`space-y-3 flex-1 ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}>
              {/* Identity Document Card */}
              <div 
                onClick={isUpdating ? undefined : handleDocumentClick}
                className={`bg-gray-100 rounded-xl p-4 transition-all ${isUpdating ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-gray-200'} ${documentComplete ? 'ring-2 ring-green-500' : ''}`}
              >
                <div className="flex items-center gap-3">
                  {/* Icon */}
                  <div className="bg-white rounded-lg w-10 h-10 flex items-center justify-center flex-shrink-0">
                    <HiOutlineDocumentText className="w-5 h-5 text-gray-500" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-medium text-gray-900 text-sm">Identity document</h3>
                      {documentComplete && (
                        <div className="w-4 h-4 bg-green-500 rounded flex items-center justify-center flex-shrink-0">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      {documentComplete ? 'Document uploaded ' : 'Take a photo of your ID'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Selfie Card */}
              <div 
                onClick={isUpdating ? undefined : handleSelfieClick}
                className={`bg-gray-100 rounded-xl p-4 transition-all ${isUpdating ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-gray-200'} ${state.selfieImage ? 'ring-2 ring-green-500' : ''}`}
              >
                <div className="flex items-center gap-3">
                  {/* Icon */}
                  <div className="bg-white rounded-lg w-10 h-10 flex items-center justify-center flex-shrink-0">
                    <HiOutlineUser className="w-5 h-5 text-gray-500" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-medium text-gray-900 text-sm">Selfie</h3>
                      {state.selfieImage && (
                        <div className="w-4 h-4 bg-green-500 rounded flex items-center justify-center flex-shrink-0">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      {state.selfieImage ? 'Selfie uploaded ' : 'Take a selfie'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Design - Card with all content */}
          <div className="hidden md:block w-full max-w-md lg:max-w-2xl px-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
              {/* Title */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                  {isUpdateMode ? 'Update your documents' : 'Verify your identity'}
                </h1>
                <p className="text-sm text-gray-500">
                  {isUpdateMode 
                    ? 'Please upload clear photos of your document and selfie'
                    : 'It will only take 2 minutes'}
                </p>
              </div>

              {/* Uploading Status - Prominent Display */}
              {isUpdateMode && isUpdating && (
                <div className="mb-8 p-6 bg-blue-50 border-2 border-blue-300 rounded-xl shadow-sm">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <LoadingDots size="lg" color="#2563eb" />
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-900 mb-2">Uploading...</p>
                      <p className="text-sm text-blue-700">Please wait, this may take a moment</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Cards Container */}
              <div className={`space-y-4 mb-8 ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}>
                {/* Identity Document Card */}
                <div 
                  onClick={isUpdating ? undefined : handleDocumentClick}
                  className={`
                    bg-gray-100 rounded-xl p-5 transition-all flex items-center gap-4
                    ${isUpdating ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-gray-200'}
                    ${documentComplete ? 'ring-2 ring-green-500' : ''}
                  `}
                >
                  <div className="bg-white rounded-lg w-12 h-12 flex items-center justify-center flex-shrink-0">
                    <HiOutlineDocumentText className="w-6 h-6 text-gray-600" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">Identity document</h3>
                      {documentComplete && (
                        <div className="w-5 h-5 bg-green-500 rounded-lg flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {documentComplete 
                        ? needsBackSide 
                          ? 'Front and back sides uploaded ✓' 
                          : 'Document uploaded '
                        : 'Take a photo of your ID'}
                    </p>
                  </div>

                  {!documentComplete && (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>

                {/* Selfie Card */}
                <div 
                  onClick={isUpdating ? undefined : handleSelfieClick}
                  className={`
                    bg-gray-100 rounded-xl p-5 transition-all flex items-center gap-4
                    ${isUpdating ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-gray-200'}
                    ${state.selfieImage ? 'ring-2 ring-green-500' : ''}
                  `}
                >
                  <div className="bg-white rounded-lg w-12 h-12 flex items-center justify-center flex-shrink-0">
                    <HiOutlineUser className="w-6 h-6 text-gray-600" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">Selfie</h3>
                      {state.selfieImage && (
                        <div className="w-5 h-5 bg-green-500 rounded-lg flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {state.selfieImage ? 'Selfie uploaded ' : 'Take a selfie'}
                    </p>
                  </div>

                  {!state.selfieImage && (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              </div>

              <Button 
                onClick={handleContinue} 
                disabled={!canContinue || isUpdating} 
                className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full py-3 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isUpdateMode && isUpdating 
                  ? 'Updating...' 
                  : isUpdateMode 
                  ? 'Update Documents' 
                  : 'Continue'}
              </Button>
              <p className="text-xs text-gray-500 text-center mt-3">
                Powered by Mira
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Fixed Button */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg">
        <Button 
          onClick={handleContinue} 
          disabled={!canContinue || isUpdating} 
          className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full py-3 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isUpdateMode && isUpdating 
            ? 'Updating...' 
            : isUpdateMode 
            ? 'Update Documents' 
            : 'Continue'}
        </Button>
        <p className="text-xs text-gray-500 text-center mt-2">
          Powered by Mira
        </p>
      </div>
    </div>
  )
}
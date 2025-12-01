'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Header } from '@/components/layout/Header'
import { checkStatusByEmail, updateKYCDocuments } from '@/lib/api'
import { useAppContext } from '@/context/useAppContext'
import { LoadingDots } from '@/components/ui/LoadingDots'
import { HiOutlineCamera, HiOutlinePhotograph } from 'react-icons/hi'
import { Modal } from '@/components/ui/Modal'

const idTypeLabels: Record<string, string> = {
  'passport': 'Passport',
  'national-id': 'National ID Card',
  'drivers-license': "Driver's License",
}

export default function Rejected() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { state, dispatch } = useAppContext()
  const [rejectionData, setRejectionData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [canRetry, setCanRetry] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number
    hours: number
    minutes: number
    canReapply: boolean
    reapplyDate?: string
  } | null>(null)
  const [isBlurRejection, setIsBlurRejection] = useState(false)
  const [updatingDocuments, setUpdatingDocuments] = useState(false)
  const [documentFront, setDocumentFront] = useState<string | null>(state.documentImageFront || null)
  const [documentBack, setDocumentBack] = useState<string | null>(state.documentImageBack || null)
  const [selfie, setSelfie] = useState<string | null>(state.selfieImage || null)
  
  // Document upload modal states
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [documentCurrentSide, setDocumentCurrentSide] = useState<'front' | 'back'>('front')
  const [documentModalFront, setDocumentModalFront] = useState<string | null>(documentFront)
  const [documentModalBack, setDocumentModalBack] = useState<string | null>(documentBack)
  const [isDocumentCameraActive, setIsDocumentCameraActive] = useState(false)
  const [isDocumentCameraLoading, setIsDocumentCameraLoading] = useState(false)
  const [documentStream, setDocumentStream] = useState<MediaStream | null>(null)
  
  // Selfie upload modal states
  const [showSelfieModal, setShowSelfieModal] = useState(false)
  const [isSelfieCameraActive, setIsSelfieCameraActive] = useState(false)
  const [isSelfieCameraLoading, setIsSelfieCameraLoading] = useState(false)
  const [selfieStream, setSelfieStream] = useState<MediaStream | null>(null)
  
  const documentInputRef = useRef<HTMLInputElement>(null)
  const documentCameraInputRef = useRef<HTMLInputElement>(null)
  const documentVideoRef = useRef<HTMLVideoElement>(null)
  const documentCanvasRef = useRef<HTMLCanvasElement>(null)
  
  const selfieInputRef = useRef<HTMLInputElement>(null)
  const selfieCameraInputRef = useRef<HTMLInputElement>(null)
  const selfieVideoRef = useRef<HTMLVideoElement>(null)
  const selfieCanvasRef = useRef<HTMLCanvasElement>(null)

  // Get document type from rejection data or state
  const getDocumentType = () => {
    if (rejectionData?.documentType) {
      // Map API document types to our format
      const typeMap: Record<string, string> = {
        'Passport': 'passport',
        'CNIC': 'national-id',
        'License': 'drivers-license',
      }
      return typeMap[rejectionData.documentType] || state.selectedIdType || 'national-id'
    }
    return state.selectedIdType || 'national-id'
  }

  const documentType = getDocumentType()
  const idTypeLabel = idTypeLabels[documentType] || 'ID Document'
  const needsBackSide = documentType !== 'passport'

  useEffect(() => {
    // Get email from URL params or context
    const email = searchParams.get('email') || state.personalInfo?.email
    
    if (email) {
      checkRejectionStatus(email)
    } else {
      setLoading(false)
    }
  }, [searchParams, state.personalInfo?.email])

  // Set document type in context when rejection data is loaded
  useEffect(() => {
    if (rejectionData?.documentType && !state.selectedIdType) {
      const typeMap: Record<string, string> = {
        'Passport': 'passport',
        'CNIC': 'national-id',
        'License': 'drivers-license',
      }
      const mappedType = typeMap[rejectionData.documentType]
      if (mappedType) {
        dispatch({ type: 'SET_ID_TYPE', payload: mappedType })
      }
    }
  }, [rejectionData?.documentType, state.selectedIdType, dispatch])

  const handleUploadDocuments = () => {
    if (rejectionData?.email) {
      router.push(`/verify/identity?update=true&email=${encodeURIComponent(rejectionData.email)}`)
    }
  }

  // Sync modal states with main states
  useEffect(() => {
    if (showDocumentModal) {
      setDocumentModalFront(documentFront)
      setDocumentModalBack(documentBack)
      if (documentFront && needsBackSide && !documentBack) {
        setDocumentCurrentSide('back')
      } else {
        setDocumentCurrentSide('front')
      }
    }
  }, [showDocumentModal, documentFront, documentBack, needsBackSide])

  const checkRejectionStatus = async (email: string) => {
    setLoading(true)
    try {
      const result = await checkStatusByEmail(email)
      if (result.success && result.data) {
        // Check both verificationStatus and kycStatus
        const status = result.data.verificationStatus || result.data.kycStatus
        
        console.log('📊 Rejected page - Status check:', {
          verificationStatus: result.data.verificationStatus,
          kycStatus: result.data.kycStatus,
          finalStatus: status
        })
        
        // If status is no longer rejected (e.g., pending, under_review, submitted), redirect to under-review
        if (status === 'pending' || status === 'submitted' || status === 'under_review' || status === 'underReview') {
          console.log('✅ Status changed to pending/under_review, redirecting to under-review page')
          router.push('/verify/under-review')
          return
        }
        
        // If status is approved, redirect to complete page
        if (status === 'approved') {
          router.push('/decentralized-id/complete')
          return
        }
        
        // Only show rejected page if status is actually rejected or cancelled
        if (status === 'rejected' || status === 'cancelled') {
          setRejectionData(result.data)
          
          // Check if rejection reason is "Picture is blur"
          const rejectionReason = result.data.rejectionReason || ''
          setIsBlurRejection(rejectionReason.toLowerCase().includes('blur') || rejectionReason === 'Picture is blur')
          
          // Use timeRemaining from API response
          if (result.data.timeRemaining) {
            setTimeRemaining(result.data.timeRemaining)
            setCanRetry(result.data.timeRemaining.canReapply)
          } else {
            setCanRetry(true)
            setTimeRemaining(null)
          }
        } else {
          // Unknown status or not found - redirect to under review as default
          console.warn('⚠️ Unknown status on rejected page, redirecting to under-review:', status)
          router.push('/verify/under-review')
        }
      }
    } catch (err) {
      console.error('Error checking rejection status:', err)
    } finally {
      setLoading(false)
    }
  }

  // Document Camera Functions
  const startDocumentCamera = async () => {
    try {
      setIsDocumentCameraLoading(true)
      
      if (documentStream) {
        documentStream.getTracks().forEach(track => track.stop())
        setDocumentStream(null)
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })
      
      setDocumentStream(mediaStream)
      setIsDocumentCameraActive(true)
      setIsDocumentCameraLoading(false)
      
      setTimeout(() => {
        if (documentVideoRef.current) {
          documentVideoRef.current.srcObject = mediaStream
          documentVideoRef.current.play().catch(err => {
            console.error('Error playing video:', err)
          })
        }
      }, 100)
    } catch (error) {
      console.error('Error accessing camera:', error)
      setIsDocumentCameraActive(false)
      setIsDocumentCameraLoading(false)
      documentCameraInputRef.current?.click()
    }
  }

  const stopDocumentCamera = () => {
    if (documentStream) {
      documentStream.getTracks().forEach(track => track.stop())
      setDocumentStream(null)
    }
    setIsDocumentCameraActive(false)
    setIsDocumentCameraLoading(false)
    if (documentVideoRef.current) {
      documentVideoRef.current.srcObject = null
    }
  }

  const captureDocumentPhoto = () => {
    if (documentVideoRef.current && documentCanvasRef.current) {
      const video = documentVideoRef.current
      const canvas = documentCanvasRef.current
      const context = canvas.getContext('2d')
      
      if (context && video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        const imageData = canvas.toDataURL('image/jpeg', 0.9)
        
        if (documentCurrentSide === 'front') {
          setDocumentModalFront(imageData)
        } else {
          setDocumentModalBack(imageData)
        }
        
        stopDocumentCamera()
      }
    }
  }

  const handleDocumentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        if (documentCurrentSide === 'front') {
          setDocumentModalFront(result)
        } else {
          setDocumentModalBack(result)
        }
      }
      reader.readAsDataURL(file)
    }
    if (e.target) e.target.value = ''
  }

  const handleDocumentCameraClick = async () => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      await startDocumentCamera()
    } else {
      documentCameraInputRef.current?.click()
    }
  }

  const saveDocumentImages = () => {
    // If front is uploaded and back is needed but not uploaded, switch to back side
    if (documentCurrentSide === 'front' && needsBackSide && documentModalFront && !documentModalBack) {
      setDocumentCurrentSide('back')
      return // Don't close modal, just switch sides
    }
    
    // Both sides are complete (or passport is complete)
    if ((needsBackSide && documentModalFront && documentModalBack) || (!needsBackSide && documentModalFront)) {
      setDocumentFront(documentModalFront)
      setDocumentBack(documentModalBack)
      if (documentModalFront) {
        dispatch({ type: 'SET_DOCUMENT_IMAGE_FRONT', payload: documentModalFront })
      }
      if (documentModalBack) {
        dispatch({ type: 'SET_DOCUMENT_IMAGE_BACK', payload: documentModalBack })
      }
      setShowDocumentModal(false)
      stopDocumentCamera()
    }
  }

  // Selfie Camera Functions
  const startSelfieCamera = async () => {
    try {
      setIsSelfieCameraLoading(true)
      setIsSelfieCameraActive(false)
      
      if (selfieStream) {
        selfieStream.getTracks().forEach(track => track.stop())
        setSelfieStream(null)
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      console.log('✅ Selfie camera stream obtained')
      setSelfieStream(mediaStream)
      setIsSelfieCameraActive(true)
      
      // Set up video element immediately
      const setupVideo = () => {
        if (selfieVideoRef.current) {
          const video = selfieVideoRef.current
          video.srcObject = mediaStream
          video.muted = true
          video.playsInline = true
          video.setAttribute('autoplay', 'true')
          video.setAttribute('playsinline', 'true')
          video.setAttribute('webkit-playsinline', 'true')
          ;(video as any).webkitPlaysInline = true
          ;(video as any).playsInline = true
          
          const handlePlaying = () => {
            console.log('✅ Selfie video is playing')
            setIsSelfieCameraLoading(false)
            video.removeEventListener('playing', handlePlaying)
          }
          
          video.addEventListener('playing', handlePlaying)
          
          const playPromise = video.play()
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log('✅ Selfie video play promise resolved')
                setIsSelfieCameraLoading(false)
              })
              .catch(err => {
                console.error('Error playing selfie video:', err)
                setIsSelfieCameraLoading(false)
              })
          }
        } else {
          // Retry if video element not ready
          setTimeout(setupVideo, 50)
        }
      }
      
      // Try immediately, then retry if needed
      setupVideo()
      setTimeout(setupVideo, 100)
    } catch (error) {
      console.error('Error accessing camera:', error)
      setIsSelfieCameraActive(false)
      setIsSelfieCameraLoading(false)
      alert('Unable to access camera. Please allow camera permissions and try again.')
    }
  }

  // Handle selfie video element initialization
  useEffect(() => {
    if (selfieStream && selfieVideoRef.current) {
      const video = selfieVideoRef.current
      
      // Set stream if not already set
      if (video.srcObject !== selfieStream) {
        console.log('📹 Setting selfie video stream in useEffect')
        video.srcObject = selfieStream
        video.muted = true
        video.playsInline = true
        video.setAttribute('autoplay', 'true')
        video.setAttribute('playsinline', 'true')
        video.setAttribute('webkit-playsinline', 'true')
        ;(video as any).webkitPlaysInline = true
        ;(video as any).playsInline = true
      }
      
      const handleLoadedMetadata = () => {
        console.log('✅ Selfie video metadata loaded')
        video.play().catch(err => {
          console.error('Error playing video:', err)
        })
      }
      
      const handleCanPlay = () => {
        console.log('✅ Selfie video can play')
        setIsSelfieCameraLoading(false)
        video.play().catch(err => {
          console.error('Error playing video on canplay:', err)
        })
      }
      
      const handlePlaying = () => {
        console.log('✅ Selfie video is playing')
        setIsSelfieCameraLoading(false)
      }
      
      video.addEventListener('loadedmetadata', handleLoadedMetadata)
      video.addEventListener('canplay', handleCanPlay)
      video.addEventListener('playing', handlePlaying)
      
      // If already ready, try to play immediately
      if (video.readyState >= 3) {
        handlePlaying()
      } else if (video.readyState >= 2) {
        video.play().catch(err => {
          console.error('Error playing video:', err)
        })
      }
      
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata)
        video.removeEventListener('canplay', handleCanPlay)
        video.removeEventListener('playing', handlePlaying)
      }
    }
  }, [selfieStream])

  const stopSelfieCamera = () => {
    if (selfieStream) {
      selfieStream.getTracks().forEach(track => track.stop())
      setSelfieStream(null)
    }
    setIsSelfieCameraActive(false)
    setIsSelfieCameraLoading(false)
    if (selfieVideoRef.current) {
      selfieVideoRef.current.srcObject = null
    }
  }

  const captureSelfiePhoto = () => {
    if (selfieVideoRef.current && selfieCanvasRef.current) {
      const video = selfieVideoRef.current
      const canvas = selfieCanvasRef.current
      const context = canvas.getContext('2d')
      
      if (context && video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.translate(canvas.width, 0)
        context.scale(-1, 1)
        context.drawImage(video, 0, 0)
        
        const imageData = canvas.toDataURL('image/jpeg', 0.9)
        setSelfie(imageData)
        dispatch({ type: 'SET_SELFIE_IMAGE', payload: imageData })
        
        stopSelfieCamera()
        setShowSelfieModal(false)
      }
    }
  }

  const handleSelfieFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setSelfie(result)
        dispatch({ type: 'SET_SELFIE_IMAGE', payload: result })
        setShowSelfieModal(false)
      }
      reader.readAsDataURL(file)
    }
    if (e.target) e.target.value = ''
  }

  const handleSelfieCameraClick = async () => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      await startSelfieCamera()
    } else {
      selfieCameraInputRef.current?.click()
    }
  }

  // Cleanup streams on unmount
  useEffect(() => {
    return () => {
      if (documentStream) {
        documentStream.getTracks().forEach(track => track.stop())
      }
      if (selfieStream) {
        selfieStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [documentStream, selfieStream])

  const handleUpdateDocuments = async () => {
    if (!rejectionData?.email) return
    
    const email = rejectionData.email
    
    if (!documentFront || !selfie) {
      alert('Please upload both document and selfie images')
      return
    }

    if (needsBackSide && !documentBack) {
      alert('Please upload both front and back sides of your document')
      return
    }

    setUpdatingDocuments(true)
    try {
      const idTypeMap: Record<string, string> = {
        'national-id': 'CNIC',
        'passport': 'Passport',
        'drivers-license': 'License'
      }
      const idType = idTypeMap[documentType] || rejectionData.documentType || 'CNIC'

      const result = await updateKYCDocuments({
        email,
        idType,
        identityDocumentFront: documentFront,
        identityDocumentBack: documentBack || documentFront,
        liveInImage: selfie
      })

      if (result.success) {
        // Check if status was updated in the response
        const updatedStatus = result.data?.verificationStatus || result.data?.kycStatus
        console.log('✅ Documents updated. New status:', updatedStatus)
        
        alert('Documents updated successfully! Your application is now under review.')
        
        // Redirect to under-review page instead of review page
        // This ensures the status check will show under review
        router.push('/verify/under-review')
      } else {
        alert(result.message || 'Failed to update documents. Please try again.')
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred. Please try again.')
    } finally {
      setUpdatingDocuments(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white md:bg-surface-gray flex items-center justify-center">
        <div className="text-center">
          <LoadingDots size="lg" color="#2563eb" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const currentDocumentImage = documentCurrentSide === 'front' ? documentModalFront : documentModalBack
  const canSaveDocument = needsBackSide 
    ? (documentModalFront && documentModalBack) 
    : documentModalFront

  return (
    <div className="min-h-screen bg-white md:bg-surface-gray flex flex-col">
      <Header showClose />
      <main className="flex-1 px-4 md:px-0 pt-8 pb-24 md:flex md:items-center md:justify-center">
        <div className="w-full max-w-md md:bg-white p-4 rounded-2xl md:shadow-lg md:p-8 md:my-8 border-[2px] border-grey-400">
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-6 bg-red-50 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-4">
              KYC Verification Rejected
            </h1>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              Unfortunately, your KYC verification has been rejected.
            </p>
            
            {rejectionData?.rejectionReason && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-semibold text-yellow-900 mb-1">Rejection Reason:</p>
                <p className="text-sm text-yellow-800">{rejectionData.rejectionReason}</p>
              </div>
            )}

            {!canRetry && timeRemaining && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-semibold text-blue-900 mb-2">
                  Wait Period Required
                </p>
                <p className="text-sm text-blue-800 mb-2">
                  You need to wait before you can apply again.
                </p>
                <div className="text-sm text-blue-700 space-y-1">
                  {timeRemaining.days > 0 && (
                    <p>Days: {timeRemaining.days}</p>
                  )}
                  {timeRemaining.hours > 0 && (
                    <p>Hours: {timeRemaining.hours}</p>
                  )}
                  {timeRemaining.minutes > 0 && (
                    <p>Minutes: {timeRemaining.minutes}</p>
                  )}
                  {timeRemaining.reapplyDate && (
                    <p className="text-xs mt-2">
                      You can reapply on: {new Date(timeRemaining.reapplyDate).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Blur rejection - show upload button */}
            {isBlurRejection && canRetry && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-semibold text-green-900 mb-2">
                  Update Your Documents
                </p>
                <p className="text-sm text-green-800 mb-4">
                  Since your rejection was due to blurry pictures, you can update your document and selfie images.
                </p>
                <Button
                  onClick={handleUploadDocuments}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  Upload Your Documents
                </Button>
              </div>
            )}
          </div>

          <div className="md:block fixed md:relative bottom-0 left-0 right-0 p-4 bg-white md:bg-transparent border-t md:border-t-0 border-surface-light">
            {canRetry && !isBlurRejection && (
            <Button 
              onClick={() => router.push('/verify/select-id-type')}
              className="w-full"
            >
              Start New Verification
            </Button>
            )}
            {!canRetry && timeRemaining && (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  {timeRemaining.days > 0 && `${timeRemaining.days} day${timeRemaining.days > 1 ? 's' : ''}, `}
                  {timeRemaining.hours > 0 && `${timeRemaining.hours} hour${timeRemaining.hours > 1 ? 's' : ''}, `}
                  {timeRemaining.minutes > 0 && `${timeRemaining.minutes} minute${timeRemaining.minutes > 1 ? 's' : ''} remaining`}
                  {timeRemaining.days === 0 && timeRemaining.hours === 0 && timeRemaining.minutes === 0 && 'Please wait before applying again.'}
                </p>
                <Button 
                  onClick={() => router.push('/')}
                  className="w-full"
                  variant="secondary"
                >
                  Go to Home
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Document Upload Modal */}
      {showDocumentModal && (
        <Modal
          isOpen={showDocumentModal}
          onClose={() => {
            setShowDocumentModal(false)
            stopDocumentCamera()
          }}
        >
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Update {idTypeLabel}
            </h2>
            {needsBackSide && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {documentCurrentSide === 'front' ? 'Step 1 of 2: Front Side' : 'Step 2 of 2: Back Side'}
                </p>
                {documentCurrentSide === 'back' && documentModalFront && (
                  <p className="text-xs text-green-600 font-semibold mb-2">
                    ✓ Front side uploaded! Now take a photo of the BACK side.
                  </p>
                )}
                <div className="flex gap-2 mb-2">
                  <div className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${documentModalFront ? 'bg-gray-900' : 'bg-gray-200'}`} />
                  <div className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${documentModalBack ? 'bg-gray-900' : 'bg-gray-200'}`} />
                </div>
                <div className="flex gap-2 text-xs">
                  <div className={`flex-1 text-center ${documentModalFront ? 'text-gray-900 font-semibold' : 'text-gray-400'}`}>
                    Front {documentModalFront ? '✓' : '○'}
                  </div>
                  <div className={`flex-1 text-center ${documentModalBack ? 'text-gray-900 font-semibold' : 'text-gray-400'}`}>
                    Back {documentModalBack ? '✓' : '○'}
                  </div>
                </div>
              </div>
            )}

            <div 
              className={`
                relative w-full aspect-[3/2] rounded-2xl overflow-hidden mb-4 transition-all duration-300
                ${currentDocumentImage ? 'bg-white border border-gray-200' : 'bg-gray-50 border-2 border-dashed border-gray-300'}
              `}
            >
              {isDocumentCameraLoading ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-black rounded-2xl">
                  <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-white text-sm">Starting camera...</p>
                </div>
              ) : isDocumentCameraActive ? (
                <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden">
                  <video
                    ref={documentVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={documentCanvasRef} className="hidden" />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 px-4 z-10">
                    <button
                      onClick={stopDocumentCamera}
                      disabled={isDocumentCameraLoading}
                      className="px-6 py-3 bg-white text-gray-900 rounded-full font-medium shadow-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={captureDocumentPhoto}
                      disabled={isDocumentCameraLoading}
                      className="px-6 py-3 bg-gray-900 text-white rounded-full font-medium shadow-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Capture Photo
                    </button>
                  </div>
                </div>
              ) : currentDocumentImage ? (
                <div className="relative w-full h-full group">
                  <img
                    src={currentDocumentImage}
                    alt={`ID Document ${documentCurrentSide}`}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6">
                  <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm text-gray-500 text-center mb-6">
                    Make sure all information is visible and easy to read
                  </p>

                  <div className="flex flex-col gap-3 w-full">
                    <button
                      onClick={handleDocumentCameraClick}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-full font-medium transition-all"
                    >
                      <HiOutlineCamera className="w-5 h-5" />
                      <span>Take Photo</span>
                    </button>
                    <button
                      onClick={() => documentInputRef.current?.click()}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300 rounded-full font-medium transition-all"
                    >
                      <HiOutlinePhotograph className="w-5 h-5" />
                      <span>Choose File</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <input
              ref={documentInputRef}
              type="file"
              accept="image/*"
              onChange={handleDocumentFileChange}
              className="hidden"
            />
            <input
              ref={documentCameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleDocumentFileChange}
              className="hidden"
            />

            <div className="space-y-3">
              <Button
                onClick={saveDocumentImages}
                disabled={!canSaveDocument}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full py-3 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {needsBackSide && documentCurrentSide === 'front' && documentModalFront
                  ? 'Continue to Back Side →'
                  : needsBackSide && documentCurrentSide === 'back' && documentModalBack && documentModalFront
                  ? 'Save Document'
                  : !needsBackSide && documentModalFront
                  ? 'Save Document'
                  : 'Upload Document to Continue'}
              </Button>
              {currentDocumentImage && (
                <button
                  onClick={() => {
                    if (documentCurrentSide === 'front') {
                      setDocumentModalFront(null)
                    } else {
                      setDocumentModalBack(null)
                    }
                  }}
                  className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-full font-medium"
                >
                  Retake Photo
                </button>
              )}
              {needsBackSide && documentCurrentSide === 'front' && documentModalFront && (
                <button
                  onClick={() => setDocumentCurrentSide('back')}
                  className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-full font-medium"
                >
                  Continue to Back Side →
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Selfie Upload Modal */}
      {showSelfieModal && (
        <Modal
          isOpen={showSelfieModal}
          onClose={() => {
            setShowSelfieModal(false)
            stopSelfieCamera()
          }}
        >
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Update Selfie
            </h2>
            <div className="relative w-full aspect-square bg-gray-900 rounded-2xl overflow-hidden mb-4">
              {/* Always render video element - never remove from DOM */}
              <video
                ref={selfieVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover absolute inset-0"
                style={{ 
                  transform: 'scaleX(-1)',
                  opacity: (isSelfieCameraActive && selfieStream && !isSelfieCameraLoading) ? 1 : 0,
                  transition: 'opacity 0.3s ease-in-out',
                  zIndex: 1,
                  pointerEvents: 'none'
                }}
              />
              <canvas ref={selfieCanvasRef} className="hidden" />
              
              {isSelfieCameraLoading ? (
                <div className="w-full h-full flex items-center justify-center absolute inset-0 z-20 bg-gray-900">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-sm">Starting camera...</p>
                  </div>
                </div>
              ) : isSelfieCameraActive && selfieStream ? (
                <div className="relative w-full h-full pointer-events-none">
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 px-4 z-10 pointer-events-auto">
                    <button
                      onClick={stopSelfieCamera}
                      disabled={isSelfieCameraLoading}
                      className="px-6 py-3 bg-white text-gray-900 rounded-full font-medium shadow-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={captureSelfiePhoto}
                      disabled={isSelfieCameraLoading}
                      className="px-6 py-3 bg-gray-900 text-white rounded-full font-medium shadow-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Capture Photo
                    </button>
                  </div>
                </div>
              ) : selfie ? (
                <div className="relative w-full h-full group">
                  <img
                    src={selfie}
                    alt="Selfie"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6">
                  <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p className="text-sm text-gray-500 text-center mb-6">
                    Make sure your face is clearly visible
                  </p>
                  <div className="flex flex-col gap-3 w-full">
                    <button
                      onClick={handleSelfieCameraClick}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-full font-medium transition-all"
                    >
                      <HiOutlineCamera className="w-5 h-5" />
                      <span>Take Photo</span>
                    </button>
                    <button
                      onClick={() => selfieInputRef.current?.click()}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300 rounded-full font-medium transition-all"
                    >
                      <HiOutlinePhotograph className="w-5 h-5" />
                      <span>Choose File</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {selfie && (
              <button
                onClick={() => {
                  setSelfie(null)
                  dispatch({ type: 'SET_SELFIE_IMAGE', payload: '' })
                }}
                className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-full font-medium"
              >
                Retake Photo
              </button>
            )}

            <input
              ref={selfieInputRef}
              type="file"
              accept="image/*"
              onChange={handleSelfieFileChange}
              className="hidden"
            />
            <input
              ref={selfieCameraInputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleSelfieFileChange}
              className="hidden"
            />
          </div>
        </Modal>
      )}
    </div>
  )
}

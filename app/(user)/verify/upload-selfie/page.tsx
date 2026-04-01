'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { VerifyMobileBackRow } from '@/components/verify/VerifyMobileBackRow'
import { useAppContext } from '@/context/useAppContext'
// PoweredBy intentionally omitted on this premium camera screen
import dynamic from 'next/dynamic'

const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

const LIME = '#A7D80D'
// Prefer exact file name; also try encoded variant when fetching
const FACE_ID_RECORD_PATH = '/animations/digiport animations/Face ID record (1).json'

function FaceIdRecordRing({ sizePx, animationData }: { sizePx: number; animationData: any }) {
  // Native animation: 400x400 canvas, tick inner edge at radius 105.75px.
  // Scale so inner edge sits 2px outside the circle border.
  // containerSize * (105.75/400) = sizePx/2 + 2  →  containerSize = (sizePx/2 + 2) * (400/105.75)
  const gap = 8
  const containerSize = Math.round((sizePx / 2 + gap) * (400 / 105.75))
  const baseOffset = -Math.round((containerSize - sizePx) / 2)
  // Layer center in native canvas is at (196.16, 200) — not perfectly centered.
  // Compensate so the ring is centered on the circle, not the animation bbox.
  const nativeSize = 400
  const layerCenterX = 196.16
  const ringCenterInContainer = layerCenterX * (containerSize / nativeSize)
  const xAdjust = Math.round(containerSize / 2 - ringCenterInContainer)
  return (
    <div
      className="absolute pointer-events-none z-20"
      style={{
        width: containerSize,
        height: containerSize,
        top: baseOffset,
        left: baseOffset + xAdjust,
      }}
      aria-hidden
    >
      <Lottie animationData={animationData} loop className="w-full h-full" />
    </div>
  )
}

type LivenessStep = 'center' | 'left' | 'right' | 'up' | 'down' | 'complete'

/** Video recording steps: 2s each. Order: straight, right (once), left, up, down = 10s */
const VIDEO_STEPS: LivenessStep[] = ['center', 'right', 'left', 'up', 'down']
const STEP_DURATION_MS = 2000
const TOTAL_VIDEO_MS = VIDEO_STEPS.length * STEP_DURATION_MS

export default function UploadSelfie() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { state, dispatch } = useAppContext()
  
  // Check if we're in update mode
  const isUpdateMode = searchParams.get('update') === 'true'
  const updateEmail = searchParams.get('email')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isCameraLoading, setIsCameraLoading] = useState(false)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const [currentStep, setCurrentStep] = useState<LivenessStep>('center')
  const [progress, setProgress] = useState(0)
  const [capturedImage, setCapturedImage] = useState<string | null>(state.selfieImage || null)
  const [isRecording, setIsRecording] = useState(false)
  const [animationData, setAnimationData] = useState<any>(null)
  const [loadingAnimationData, setLoadingAnimationData] = useState<any>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoRefMobile = useRef<HTMLVideoElement>(null)
  const videoRefDesktop = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()
  const isLivenessRunningRef = useRef(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const recordingStepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cameraFrontRef = useRef<HTMLInputElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  
  // Get the active video ref based on screen size
  const getActiveVideoRef = () => {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768
      return isMobile ? videoRefMobile : videoRefDesktop
    }
    return videoRefMobile // Default to mobile
  }

  // Load animation and detect mobile
  useEffect(() => {
    fetch('/face.json')
      .then(res => res.json())
      .then(data => {
          setAnimationData(data)
        console.log('✅ Face verification animation loaded')
      })
      .catch(err => {
        console.error('❌ Error loading animation:', err)
      })

    // Loading animation (Face ID record)
    const encoded = '/animations/digiport%20animations/Face%20ID%20record%20%281%29.json'
    fetch(FACE_ID_RECORD_PATH)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('not found'))))
      .then((data) => setLoadingAnimationData(data))
      .catch(() => {
        fetch(encoded)
          .then((res) => (res.ok ? res.json() : Promise.reject(new Error('not found'))))
          .then((data) => setLoadingAnimationData(data))
          .catch(() => {})
      })
    
    // Detect mobile device
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768
      setIsMobile(isMobileDevice)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const steps: LivenessStep[] = ['center', 'left', 'right', 'up', 'down', 'complete']
  const stepInstructions: Record<LivenessStep, string> = {
    center: 'Position your face in the center',
    left: 'Turn your head to the LEFT ←',
    right: 'Turn your head to the RIGHT →',
    up: 'Move your head UP ↑',
    down: 'Move your head DOWN ↓',
    complete: 'Face verification complete! ✓',
  }

  // Handle video element initialization - stable stream management
  useEffect(() => {
    if (!stream) return
    
    // Set stream on both video elements to ensure it works on mobile and desktop
    const videos = [videoRefMobile.current, videoRefDesktop.current].filter(Boolean) as HTMLVideoElement[]
    
    if (videos.length === 0) {
      console.warn('⚠️ No video elements found')
      return
    }
    
    videos.forEach((video, index) => {
      
      // Only set stream if it's different to prevent unnecessary updates
      if (video.srcObject !== stream) {
        console.log(`📹 Setting video stream on video ${index + 1} (${index === 0 ? 'mobile' : 'desktop'})`)
        
        // Clear any existing stream tracks first
        if (video.srcObject) {
          const oldStream = video.srcObject as MediaStream
          oldStream.getTracks().forEach(track => track.stop())
        }
        
        // Set video attributes for better compatibility, especially mobile
        video.muted = true
        video.playsInline = true
        video.setAttribute('autoplay', 'true')
        video.setAttribute('playsinline', 'true')
        video.setAttribute('webkit-playsinline', 'true')
        video.setAttribute('x5-playsinline', 'true')
        video.setAttribute('x-webkit-airplay', 'allow')
        ;(video as any).webkitPlaysInline = true
        ;(video as any).playsInline = true
        ;(video as any).x5PlaysInline = true
        
        video.srcObject = stream
        
        // Reset ready state when stream changes (only once, on first video)
        if (index === 0) {
          setIsVideoReady(false)
          setIsCameraLoading(true)
        }
      }
      
      // Only add listeners to the first video to avoid duplicate events
      if (index === 0 && !isVideoReady && stream.active && video.paused) {
        const handleLoadedMetadata = () => {
          console.log('✅ Video metadata loaded')
          video.play().catch(err => {
            console.error('Error playing video:', err)
          })
        }
        
        const handleCanPlay = () => {
          console.log('✅ Video can play')
          video.play().catch(err => {
            console.error('Error playing video on canplay:', err)
          })
        }
        
        const handlePlaying = () => {
          console.log('✅ Video is playing (useEffect)')
          setIsVideoReady(true)
          setIsCameraLoading(false)
          setIsCameraActive(true)
          
          // Remove all listeners once playing
          video.removeEventListener('loadedmetadata', handleLoadedMetadata)
          video.removeEventListener('canplay', handleCanPlay)
          video.removeEventListener('playing', handlePlaying)
        }
        
        video.addEventListener('loadedmetadata', handleLoadedMetadata)
        video.addEventListener('canplay', handleCanPlay)
        video.addEventListener('playing', handlePlaying)
        
        // If already ready, trigger immediately
        if (video.readyState >= 3) {
          handlePlaying()
        } else if (video.readyState >= 2) {
          // Force play on mobile
          const playPromise = video.play()
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log('✅ Video play promise resolved')
                handlePlaying()
              })
              .catch(err => {
                console.error('Error playing video:', err)
                // Try again after a short delay
                setTimeout(() => {
                  video.play().catch(e => console.error('Retry play failed:', e))
                }, 100)
              })
          }
        }
        
        return () => {
          video.removeEventListener('loadedmetadata', handleLoadedMetadata)
          video.removeEventListener('canplay', handleCanPlay)
          video.removeEventListener('playing', handlePlaying)
        }
      } else if (index === 0 && isVideoReady && video.paused && stream.active) {
        // If video is ready but paused, try to play
        console.log('🔄 Video paused but ready, resuming...')
        video.play().catch(err => {
          console.error('Error resuming video:', err)
        })
      }
      
      // Try to play all videos
      if (video.paused && stream.active) {
        video.play().catch(err => {
          console.error(`Error playing video ${index + 1}:`, err)
        })
      }
    })
    
    // Debug: Log video state for mobile debugging
    if (videos.length > 0) {
      const firstVideo = videos[0]
      console.log('📱 Video state:', {
        videoCount: videos.length,
        readyState: firstVideo.readyState,
        paused: firstVideo.paused,
        isVideoReady,
        streamActive: stream.active,
        videoWidth: firstVideo.videoWidth,
        videoHeight: firstVideo.videoHeight
      })
    }
  }, [stream, isVideoReady])

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [stream])

  const startCamera = async () => {
    try {
      console.log('🎥 Starting camera...')
      setIsCameraLoading(true)
      setIsVideoReady(false)
      
      // Stop any existing stream first
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
        setStream(null)
      }

      // Cancel any existing animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = undefined
      }
      isLivenessRunningRef.current = false
      
      // Reset states
      setCurrentStep('center')
      setProgress(0)
      
      // Mobile-friendly camera constraints with better mobile support
      const isMobile = typeof window !== 'undefined' && typeof navigator !== 'undefined' 
        ? /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
        : false
      
      // Try with ideal constraints first, fallback to basic if needed
      let mediaStream: MediaStream | null = null
      let lastError: any = null
      
      // Try different constraint sets for better mobile compatibility
      const constraintSets = [
        // First try: Ideal constraints for mobile
        {
          video: { 
            facingMode: { ideal: 'user' },
            width: isMobile ? { ideal: 640, min: 320 } : { ideal: 1280 },
            height: isMobile ? { ideal: 480, min: 240 } : { ideal: 720 }
          },
          audio: false
        },
        // Second try: Simpler constraints if first fails
        {
          video: { 
            facingMode: 'user'
          },
          audio: false
        },
        // Third try: Most basic - just front camera
        {
          video: true,
          audio: false
        }
      ]
      
      if (typeof window === 'undefined' || !navigator.mediaDevices) {
        throw new Error('Camera not available')
      }
      
      for (const constraints of constraintSets) {
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
          console.log('✅ Camera stream obtained with constraints:', constraints)
          break
        } catch (error: any) {
          lastError = error
          console.warn('⚠️ Camera constraint set failed, trying next...', error.name)
          // Continue to next constraint set
        }
      }
      
      if (!mediaStream) {
        throw lastError || new Error('Failed to access camera with any constraint set')
      }
      
      // Set stream first
      setStream(mediaStream)
      
      // Set stream state - useEffect will handle video element setup
      // This ensures stable stream management without race conditions
      console.log('✅ Stream obtained, setting state for useEffect to handle')
      
      // Small delay to ensure state is set and video elements are rendered
      await new Promise(resolve => setTimeout(resolve, 100))

      // Camera is ready - no automatic liveness check
      console.log('✅ Camera is ready for manual capture')
      
    } catch (error: any) {
      console.error('❌ Error accessing camera:', error)
      let errorMessage = 'Unable to access camera. '
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera permissions and try again.'
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera found.'
      } else {
        errorMessage += 'Please check your camera permissions.'
      }
      alert(errorMessage)
      setIsCameraActive(false)
      setIsCameraLoading(false)
      setIsVideoReady(false)
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
        setStream(null)
      }
    }
  }

  const startLivenessCheck = () => {
    if (isLivenessRunningRef.current) {
      console.log('⚠️ Liveness check already running')
        return
      }

    console.log('🎬 Starting liveness check animation...')
    isLivenessRunningRef.current = true
    
    let stepIndex = 0
    let startTime = Date.now()
    const stepDuration = 3000 // 3 seconds per step

    setCurrentStep('center')
    setProgress(0)

    const animate = () => {
      const elapsed = Date.now() - startTime

      if (elapsed >= stepDuration) {
        startTime = Date.now()
        stepIndex++
        
        if (stepIndex < steps.length - 1) {
          const nextStep = steps[stepIndex]
          console.log(`📸 Moving to step: ${nextStep}`)
          setCurrentStep(nextStep)
        } else {
          console.log('✅ Liveness check complete!')
          setCurrentStep('complete')
          setProgress(100)
          isLivenessRunningRef.current = false
          captureFinalPhoto()
          return
        }
      }

      // Calculate overall progress
      const stepProgress = elapsed / stepDuration
      const overallProgress = ((stepIndex + stepProgress) / (steps.length - 1)) * 100
      setProgress(Math.min(overallProgress, 100))

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)
  }

  const captureFinalPhoto = () => {
    console.log('📸 Capturing final photo...')
    
    // Get the active video element
    const activeVideoRef = getActiveVideoRef()
    const video = activeVideoRef.current || videoRefMobile.current || videoRefDesktop.current
    
    if (video && canvasRef.current) {
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (!context) {
        console.error('❌ Could not get canvas context')
        return
      }

      // Wait a moment to ensure video frame is ready
      setTimeout(() => {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
        
        // Flip the image horizontally to match the mirrored video
        context.translate(canvas.width, 0)
        context.scale(-1, 1)
        context.drawImage(video, 0, 0)

      const imageData = canvas.toDataURL('image/png')
        console.log('✅ Selfie captured')
        
      setCapturedImage(imageData)
      dispatch({ type: 'SET_SELFIE_IMAGE', payload: imageData })
        
      stopCamera()
      }, 200)
    } else {
      console.error('❌ Video or canvas ref not available')
    }
  }

  const stopCamera = () => {
    console.log('🛑 Stopping camera...')
    if (recordingStepTimerRef.current) {
      clearTimeout(recordingStepTimerRef.current)
      recordingStepTimerRef.current = null
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = undefined
    }
    isLivenessRunningRef.current = false
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop() } catch (_) {}
      mediaRecorderRef.current = null
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    
    setIsCameraActive(false)
    setIsCameraLoading(false)
    setIsVideoReady(false)
    setIsRecording(false)
    
    // Clear all video refs
    if (videoRefMobile.current) {
      videoRefMobile.current.srcObject = null
    }
    if (videoRefDesktop.current) {
      videoRefDesktop.current.srcObject = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const handleContinue = () => {
    if (capturedImage) {
      console.log('✅ Continuing with selfie image saved')
      dispatch({ type: 'SET_SELFIE_IMAGE', payload: capturedImage })
      // OTP verification is now on enter-email page; after selfie go to review
      sessionStorage.setItem('justCompletedOTP', 'true')
      if (isUpdateMode && updateEmail) {
        router.push(`/verify/processing-selfei?update=true&email=${encodeURIComponent(updateEmail)}`)
      } else {
        router.push('/verify/processing-selfei')
      }
    }
  }

  const handleRetake = () => {
    setCapturedImage(null)
    setCurrentStep('center')
    setProgress(0)
    dispatch({ type: 'SET_SELFIE_IMAGE', payload: '' })
    stopCamera()
    
    // Use web camera for both mobile and desktop for consistent behavior
    setTimeout(() => {
      startCamera()
    }, 300)
  }

  const handleTakeSelfie = async () => {
    // Start camera (works for both mobile and desktop)
    await startCamera()
  }

  const captureSelfie = () => {
    const video = videoRefMobile.current || videoRefDesktop.current || videoRef.current
    const canvas = canvasRef.current
    
    if (video && canvas && video.videoWidth > 0 && video.videoHeight > 0) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        // Flip horizontally for selfie (mirror effect)
        ctx.translate(canvas.width, 0)
        ctx.scale(-1, 1)
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        const imageData = canvas.toDataURL('image/jpeg', 0.9)
        setCapturedImage(imageData)
        dispatch({ type: 'SET_SELFIE_IMAGE', payload: imageData })
        setCurrentStep('complete')
        setProgress(100)
        stopCamera()
      }
    } else {
      console.error('❌ Video or canvas not ready for capture')
    }
  }

  /** Start 10s video recording: straight 2s → right 2s → left 2s → right 2s → down 2s. Arrow prompts only. */
  const startVideoRecording = () => {
    if (!stream || isRecording) return
    const video = videoRefMobile.current || videoRefDesktop.current || videoRef.current
    if (!video || !video.srcObject) return

    setIsRecording(true)
    setCurrentStep(VIDEO_STEPS[0])
    setProgress(0)
    recordedChunksRef.current = []

    try {
      const options: MediaRecorderOptions = {}
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
        options.mimeType = 'video/webm;codecs=vp8'
        options.videoBitsPerSecond = 2500000
      }
      const mediaRecorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data)
      }
      mediaRecorder.onstop = () => {
        const chunks = recordedChunksRef.current
        const mime = mediaRecorderRef.current?.mimeType || 'video/webm'
        mediaRecorderRef.current = null
        if (chunks.length === 0) {
          setIsRecording(false)
          setCurrentStep('center')
          return
        }
        const blob = new Blob(chunks, { type: mime })
        const url = URL.createObjectURL(blob)
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64 = reader.result as string
          setCapturedImage(base64)
          dispatch({ type: 'SET_SELFIE_IMAGE', payload: base64 })
          setCurrentStep('complete')
          setProgress(100)
          stopCamera()
          setIsRecording(false)
        }
        reader.readAsDataURL(blob)
        URL.revokeObjectURL(url)
      }
      mediaRecorder.start(500)
    } catch (err) {
      console.error('MediaRecorder failed:', err)
      setIsRecording(false)
      return
    }

    let stepIndex = 0
    const advanceStep = () => {
      stepIndex += 1
      if (stepIndex >= VIDEO_STEPS.length) {
        if (recordingStepTimerRef.current) clearTimeout(recordingStepTimerRef.current)
        mediaRecorderRef.current?.stop()
        return
      }
      setCurrentStep(VIDEO_STEPS[stepIndex])
      setProgress((stepIndex / VIDEO_STEPS.length) * 100)
      recordingStepTimerRef.current = setTimeout(advanceStep, STEP_DURATION_MS)
    }
    recordingStepTimerRef.current = setTimeout(advanceStep, STEP_DURATION_MS)
  }

  const handleNativeCameraChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setCapturedImage(result)
        dispatch({ type: 'SET_SELFIE_IMAGE', payload: result })
        setCurrentStep('complete')
        setProgress(100)
      }
      reader.readAsDataURL(file)
    }
    
    // Reset input
    if (e.target) {
      e.target.value = ''
    }
  }


  // Auto-start camera when component loads - wait for video element to be rendered
  useEffect(() => {
    if (!state.selfieImage && !isCameraActive && !capturedImage) {
      // Auto-start camera on both mobile and desktop
      // Wait longer to ensure video element is rendered
      const timer = setTimeout(() => {
        // Check if any video ref is available before starting
        const hasVideoRef = videoRefMobile.current || videoRefDesktop.current || videoRef.current
        if (hasVideoRef) {
          console.log('🚀 Auto-starting camera...')
          startCamera()
        } else {
          console.warn('⚠️ Video ref not ready, will retry on next render')
          // Retry after a longer delay
          setTimeout(() => {
            const hasVideoRefRetry = videoRefMobile.current || videoRefDesktop.current || videoRef.current
            if (hasVideoRefRetry) {
              console.log('🚀 Retrying camera start...')
              startCamera()
            }
          }, 1000)
        }
      }, 800)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile])

  const getProgressColor = () => {
    if (progress < 33) return 'bg-red-500'
    if (progress < 66) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getProgressColorHex = () => {
    if (progress < 33) return '#ef4444'
    if (progress < 66) return '#eab308'
    return '#10b981'
  }

    return (
      <div className="h-full md:h-screen bg-black flex flex-col overflow-hidden">
        <VerifyMobileBackRow variant="light" className="!pt-2 !pb-1" onBack={() => router.back()} />
        <main className="flex-1 flex flex-col items-center justify-start min-h-0 overflow-hidden px-4 pt-2 pb-[92px] md:py-10">
          <h1 className="text-white text-[18px] md:text-[20px] font-semibold text-center mb-7 mt-0">
            Centre your self on the screen
          </h1>
          {/*
            Circle size tuned to match reference.
            The Face ID record animation is drawn on top of the circle, aligned to the same box.
          */}
          <div className="relative flex-shrink-0 overflow-visible mt-4 md:mt-0" style={{ width: isMobile ? 330 : 300, height: isMobile ? 330 : 300 }}>
            {/* Arrow prompt overlay when recording - same design, only direction changes */}
            {isRecording && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-white text-sm font-medium mb-2">Move your face</p>
                <div className="text-white/95 flex items-center justify-center" aria-hidden>
                  {currentStep === 'center' && (
                    <span className="w-4 h-4 rounded-full border-2 border-white" title="Face straight" />
                  )}
                  {currentStep === 'right' && (
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                  )}
                  {currentStep === 'left' && (
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
                    </svg>
                  )}
                  {currentStep === 'down' && (
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                  {currentStep === 'up' && (
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </div>
                <p className="text-white/80 text-xs mt-2">{Math.round(progress)}%</p>
              </div>
            )}
            <div className="absolute inset-0 rounded-full overflow-hidden bg-black">
              <video
                ref={videoRefMobile}
                autoPlay
                playsInline
                muted
                className="md:hidden w-full h-full object-cover"
                style={{
                  transform: 'scaleX(-1)',
                  opacity: (isVideoReady && isCameraActive && stream && !capturedImage) ? 1 : 0,
                  display: (isVideoReady && isCameraActive && stream && !capturedImage) ? 'block' : 'none',
                }}
              />
              <video
                ref={videoRefDesktop}
                autoPlay
                playsInline
                muted
                className="hidden md:block w-full h-full object-cover"
                style={{
                  transform: 'scaleX(-1)',
                  opacity: (isVideoReady && isCameraActive && stream && !capturedImage) ? 1 : 0,
                  display: (isVideoReady && isCameraActive && stream && !capturedImage) ? 'block' : 'none',
                }}
              />
              {capturedImage && (
                <>
                  {capturedImage.startsWith('data:video/') ? (
                    <video
                      src={capturedImage}
                      playsInline
                      muted
                      loop
                      autoPlay
                      className="w-full h-full object-cover"
                      style={{ transform: 'scaleX(-1)' }}
                    />
                  ) : (
                    <Image
                      src={capturedImage}
                      alt="Selfie"
                      fill
                      className="object-cover"
                      style={{ transform: 'scaleX(-1)' }}
                      unoptimized
                    />
                  )}
                </>
              )}
              {isCameraLoading && !isVideoReady && !capturedImage && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
                  <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <p className="mt-2 text-white/80 text-xs text-center">Starting camera...</p>
                </div>
              )}
            </div>
            {loadingAnimationData ? (
              <FaceIdRecordRing sizePx={isMobile ? 330 : 300} animationData={loadingAnimationData} />
            ) : null}
          </div>
          <canvas ref={canvasRef} className="hidden" aria-hidden />
          <div className="md:hidden fixed bottom-0 left-0 right-0 px-6 pb-8 z-10">
            {capturedImage ? (
              <>
                <button
                  type="button"
                  onClick={handleContinue}
                  className="w-full h-[56px] rounded-[14px] bg-[#A7D80D] hover:bg-[#9BC90C] text-black text-[16px] font-semibold transition-colors"
                >
                  Continue
                </button>
                <button
                  type="button"
                  onClick={handleRetake}
                  className="mt-3 w-full h-[56px] rounded-[14px] bg-transparent border-2 border-white text-white text-[16px] font-semibold transition-colors"
                >
                  Retake photo
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={startVideoRecording}
                  disabled={!isVideoReady || !stream || isRecording}
                  className="w-full h-[56px] rounded-[14px] bg-[#A7D80D] hover:bg-[#9BC90C] disabled:opacity-50 text-black text-[16px] font-semibold transition-colors"
                >
                  {isRecording ? 'Capture' : 'Capture'}
                </button>
              </>
            )}
          </div>
        </main>
        {/* PoweredBy removed for this premium screen */}
        <input
          ref={cameraFrontRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleNativeCameraChange}
          className="hidden"
          aria-label="Take selfie"
        />
      </div>
    )
  }
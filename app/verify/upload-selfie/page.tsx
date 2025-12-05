'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Header } from '@/components/layout/Header'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useAppContext } from '@/context/useAppContext'
import dynamic from 'next/dynamic'

// Dynamically import Lottie
const Lottie = dynamic(() => import('lottie-react'), { 
  ssr: false
})

type LivenessStep = 'center' | 'left' | 'right' | 'up' | 'down' | 'complete'

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
  const [animationData, setAnimationData] = useState<any>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoRefMobile = useRef<HTMLVideoElement>(null)
  const videoRefDesktop = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()
  const isLivenessRunningRef = useRef(false)
  const cameraFrontRef = useRef<HTMLInputElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
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

      // Start liveness check after video is playing
      setTimeout(() => {
        if (mediaStream && mediaStream.active && !isLivenessRunningRef.current) {
          console.log('🎬 Starting liveness check...')
          startLivenessCheck()
        }
      }, 500)
      
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
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = undefined
    }
    isLivenessRunningRef.current = false
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    
    setIsCameraActive(false)
    setIsCameraLoading(false)
    setIsVideoReady(false)
    
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
      // Preserve update mode query params if in update mode
      if (isUpdateMode && updateEmail) {
        router.push(`/verify/identity?update=true&email=${encodeURIComponent(updateEmail)}`)
      } else {
        router.push('/verify/identity')
      }
    }
  }

  const handleRetake = () => {
    setCapturedImage(null)
    setCurrentStep('center')
    setProgress(0)
    dispatch({ type: 'SET_SELFIE_IMAGE', payload: '' })
    stopCamera()
    
    // On mobile, use native camera instead of web camera
    if (isMobile) {
      // Use front camera for selfie by default
      setTimeout(() => {
        cameraFrontRef.current?.click()
      }, 100)
    } else {
      setTimeout(() => {
        startCamera()
      }, 300)
    }
  }

  const handleTakeSelfie = async () => {
    // Start camera (works for both mobile and desktop)
    await startCamera()
    
    // Wait for camera to be ready, then start countdown
    const checkCameraReady = setInterval(() => {
      if (isCameraActive && stream && isVideoReady) {
        clearInterval(checkCameraReady)
        
        // Start countdown after camera is ready
        setCountdown(3)
        
        let count = 3
        const countdownInterval = setInterval(() => {
          count--
          setCountdown(count)
          
          if (count <= 0) {
            clearInterval(countdownInterval)
            setCountdown(null)
            
            // Auto-capture after countdown
            setTimeout(() => {
              captureSelfie()
            }, 200) // Small delay to ensure countdown UI updates
          }
        }, 1000)
        
        countdownIntervalRef.current = countdownInterval
      }
    }, 200) // Check every 200ms
    
    // Timeout after 5 seconds if camera doesn't become ready
    setTimeout(() => {
      clearInterval(checkCameraReady)
    }, 5000)
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
    }
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

  // Cleanup countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }
  }, [])

  // Auto-start camera when component loads - wait for video element to be rendered
  useEffect(() => {
    if (!state.selfieImage && !isCameraActive && !capturedImage) {
      // On mobile, don't auto-start web camera - user will use native camera
      if (isMobile) {
        return
      }
      
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
      <div className="min-h-screen h-screen bg-white flex flex-col overflow-hidden">
        {/* Mobile Header */}
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
          <Header showBack showClose />
          <ProgressBar currentStep={4} totalSteps={5} />
        </div>
        
        <main className="flex-1 overflow-y-auto">
          <div className="min-h-full md:flex md:items-center md:justify-center md:py-8">
            {/* Mobile Design */}
          <div className="md:hidden h-full flex flex-col px-4 pt-4 pb-32">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Take a Selfie
            </h1>
            <p className="text-sm text-gray-500 mb-4">
              Make sure your face is clearly visible and well-lit
            </p>

            <div className="flex-1 flex flex-col min-h-0">
              <div className="relative w-full flex-1 min-h-[400px] max-h-[70vh] bg-gray-900 rounded-2xl overflow-hidden mb-4">
                {/* Always render video element - never remove from DOM */}
                        <video
                          ref={videoRefMobile}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover absolute inset-0"
                          style={{ 
                            transform: 'scaleX(-1)',
                            opacity: (isVideoReady && isCameraActive && stream) ? 1 : 0,
                            transition: isVideoReady ? 'opacity 0.3s ease-in-out' : 'none',
                            pointerEvents: 'none',
                            zIndex: 0,
                            backgroundColor: '#000',
                            display: 'block',
                            visibility: (isVideoReady && isCameraActive && stream) ? 'visible' : 'hidden'
                          }}
                        />
                        <canvas ref={canvasRef} className="hidden" />
                        
                {isCameraLoading && !isVideoReady ? (
                  <div className="w-full h-full flex items-center justify-center absolute inset-0 z-20 bg-gray-900">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-white text-sm">Starting camera...</p>
                    </div>
                  </div>
                ) : isVideoReady && isCameraActive && stream ? (
                  <>
                        {/* Face frame overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                      <div className="relative w-full h-full flex items-center justify-center">
                          <div className="w-[70%] aspect-square rounded-full border-4 border-green-500 relative">
                            <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(16, 185, 129, 0.2)" strokeWidth="4" />
                              <circle
                                cx="50" cy="50" r="48" fill="none"
                              stroke={getProgressColorHex()}
                                strokeWidth="4"
                                strokeDasharray={`${2 * Math.PI * 48}`}
                                strokeDashoffset={`${2 * Math.PI * 48 * (1 - progress / 100)}`}
                                strokeLinecap="round"
                                className="transition-all duration-300"
                              />
                            </svg>
                          
                          {/* Center dot indicator */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className={`w-2 h-2 rounded-full ${currentStep === 'complete' ? 'bg-green-500' : 'bg-white'} transition-all duration-300`} />
                          </div>
                        </div>

                        {/* Direction arrows - larger and more visible */}
                        {currentStep !== 'complete' && currentStep !== 'center' && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            {currentStep === 'left' && (
                              <div className="absolute left-2 sm:left-4 text-white text-5xl sm:text-6xl font-black animate-pulse drop-shadow-2xl" style={{ textShadow: '0 0 20px rgba(0,0,0,0.8)' }}>←</div>
                            )}
                            {currentStep === 'right' && (
                              <div className="absolute right-2 sm:right-4 text-white text-5xl sm:text-6xl font-black animate-pulse drop-shadow-2xl" style={{ textShadow: '0 0 20px rgba(0,0,0,0.8)' }}>→</div>
                            )}
                            {currentStep === 'up' && (
                              <div className="absolute top-2 sm:top-4 text-white text-5xl sm:text-6xl font-black animate-pulse drop-shadow-2xl" style={{ textShadow: '0 0 20px rgba(0,0,0,0.8)' }}>↑</div>
                            )}
                            {currentStep === 'down' && (
                              <div className="absolute bottom-2 sm:bottom-4 text-white text-5xl sm:text-6xl font-black animate-pulse drop-shadow-2xl" style={{ textShadow: '0 0 20px rgba(0,0,0,0.8)' }}>↓</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress bar and instruction text */}
                        <div className="absolute bottom-4 left-4 right-4">
                      <div className="w-full h-2 bg-white bg-opacity-20 rounded-full overflow-hidden mb-2">
                        <div className={`h-full ${getProgressColor()} transition-all duration-300`} style={{ width: `${progress}%` }} />
                      </div>
                      <p className="text-white text-sm text-center font-semibold">
                            {stepInstructions[currentStep]}
                          </p>
                        </div>

                        {/* Countdown overlay - shows on top of video */}
                        {countdown !== null && countdown > 0 && (
                          <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 pointer-events-none">
                            <div className="text-center">
                              <div className="text-9xl font-bold text-white mb-4 animate-pulse drop-shadow-2xl" style={{ textShadow: '0 0 30px rgba(255,255,255,0.8)' }}>
                                {countdown}
                              </div>
                              <p className="text-white text-xl font-semibold">Get ready!</p>
                            </div>
                          </div>
                        )}
                      </>
                ) : capturedImage ? (
                  <img src={capturedImage} alt="Selfie" className="w-full h-full object-contain" />
                    ) : !isCameraLoading ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                          <p className="text-white text-sm">Initializing camera...</p>
                        </div>
                      </div>
                    ) : null}
              </div>

              <p className="text-sm text-gray-600 text-center mb-4">
                {capturedImage 
                  ? '✓ Selfie captured successfully'
                  : isCameraActive
                  ? 'Position your face within the frame'
                  : isMobile
                  ? 'Tap the button below to take a selfie'
                  : 'Ready to capture'}
              </p>

              {/* Mobile native camera button */}
              {isMobile && !capturedImage && !isCameraActive && (
                <div className="flex flex-col gap-3 w-full">
                  <button
                    onClick={handleTakeSelfie}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-full font-medium transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Take Selfie</span>
                  </button>
                </div>
              )}


              {/* Hidden native camera input - front camera for selfie */}
              <input
                ref={cameraFrontRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleNativeCameraChange}
                className="hidden"
                aria-label="Take selfie with front camera"
              />
            </div>
          </div>

          {/* Desktop Design */}
          <div className="hidden md:block w-full max-w-md lg:max-w-2xl px-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                Take a Selfie
              </h1>
              <p className="text-sm text-gray-600 mb-6">
                Please take a clear selfie for face verification. Make sure your face is clearly visible and well-lit.
              </p>

              <div className="mb-6">
                <div className="relative w-full aspect-[3/2] bg-gray-900 rounded-lg overflow-hidden mb-4">
                  {/* Always render video element - never remove from DOM */}
                        <video
                          ref={videoRefDesktop}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover absolute inset-0"
                          style={{ 
                            transform: 'scaleX(-1)',
                            opacity: (isVideoReady && isCameraActive && stream) ? 1 : 0,
                            transition: isVideoReady ? 'opacity 0.3s ease-in-out' : 'none',
                            pointerEvents: 'none',
                            zIndex: 0,
                            backgroundColor: '#000',
                            display: 'block',
                            visibility: (isVideoReady && isCameraActive && stream) ? 'visible' : 'hidden'
                          }}
                        />
                          <canvas ref={canvasRef} className="hidden" />
                          
                  {isCameraLoading && !isVideoReady ? (
                    <div className="w-full h-full flex items-center justify-center absolute inset-0 z-20 bg-gray-900">
                      <div className="text-center">
                        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-white text-sm">Starting camera...</p>
                      </div>
                    </div>
                  ) : isVideoReady && isCameraActive && stream ? (
                    <>
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <div className="relative w-full h-full flex items-center justify-center">
                            <div className="w-[70%] max-w-[256px] aspect-square rounded-full border-4 border-green-500 relative">
                              <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(16, 185, 129, 0.2)" strokeWidth="4" />
                                <circle
                                  cx="50" cy="50" r="48" fill="none"
                                stroke={getProgressColorHex()}
                                  strokeWidth="4"
                                  strokeDasharray={`${2 * Math.PI * 48}`}
                                  strokeDashoffset={`${2 * Math.PI * 48 * (1 - progress / 100)}`}
                                strokeLinecap="round"
                                  className="transition-all duration-300"
                                />
                              </svg>
                            
                            {/* Center dot indicator */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className={`w-2 h-2 rounded-full ${currentStep === 'complete' ? 'bg-green-500' : 'bg-white'} transition-all duration-300`} />
                            </div>
                          </div>

                          {/* Direction arrows - larger and more visible */}
                          {currentStep !== 'complete' && currentStep !== 'center' && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              {currentStep === 'left' && (
                                <div className="absolute left-8 text-white text-7xl font-black animate-pulse drop-shadow-2xl" style={{ textShadow: '0 0 30px rgba(0,0,0,0.9)' }}>←</div>
                              )}
                              {currentStep === 'right' && (
                                <div className="absolute right-8 text-white text-7xl font-black animate-pulse drop-shadow-2xl" style={{ textShadow: '0 0 30px rgba(0,0,0,0.9)' }}>→</div>
                              )}
                              {currentStep === 'up' && (
                                <div className="absolute top-8 text-white text-7xl font-black animate-pulse drop-shadow-2xl" style={{ textShadow: '0 0 30px rgba(0,0,0,0.9)' }}>↑</div>
                              )}
                              {currentStep === 'down' && (
                                <div className="absolute bottom-8 text-white text-7xl font-black animate-pulse drop-shadow-2xl" style={{ textShadow: '0 0 30px rgba(0,0,0,0.9)' }}>↓</div>
                              )}
                            </div>
                          )}
                            </div>
                          </div>

                          <div className="absolute bottom-4 left-4 right-4">
                            <div className="w-full h-2 bg-white bg-opacity-20 rounded-full overflow-hidden mb-2">
                              <div className={`h-full ${getProgressColor()} transition-all duration-300`} style={{ width: `${progress}%` }} />
                            </div>
                            <p className="text-white text-sm text-center font-medium">{stepInstructions[currentStep]}</p>
                          </div>
                        </>
                  ) : capturedImage ? (
                    <img src={capturedImage} alt="Selfie" className="w-full h-full object-contain" />
                      ) : !isCameraLoading ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-white text-sm">Initializing camera...</p>
                          </div>
                        </div>
                      ) : null}
                </div>
              </div>

              <div className="space-y-3">
                {isCameraActive && !capturedImage && (
                  <button onClick={stopCamera} className="w-full px-6 py-3 bg-gray-100 text-gray-900 rounded-full font-medium">
                    Cancel Camera
                  </button>
                )}
                {capturedImage && (
                  <>
                    <Button 
                      onClick={handleContinue} 
                      className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full py-3 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                      disabled={currentStep !== 'complete'}
                    >
                      {currentStep === 'complete' ? '✓ Selfie is Clear - Continue' : 'Please complete face verification'}
                    </Button>
                    <button onClick={handleRetake} className="w-full px-6 py-3 bg-gray-100 text-gray-900 rounded-full font-medium">
                      Retake photo
                    </button>
                  </>
                )}
                {!capturedImage && !isCameraActive && (
                  <>
                    {isMobile ? (
                      <Button 
                        onClick={handleTakeSelfie}
                        className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full py-3 font-medium"
                      >
                        Take Selfie
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => {
                          console.log('📸 Manual camera start requested')
                          startCamera()
                        }} 
                        className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full py-3 font-medium"
                      >
                        Start Camera
                      </Button>
                    )}
                  </>
                )}
              </div>

              <p className="text-xs text-gray-500 text-center mt-3">Powered by Mira</p>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Fixed Button */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg">
        <div className="space-y-2">
          {isCameraActive && !capturedImage && (
            <button onClick={stopCamera} className="w-full px-6 py-3 bg-gray-100 text-gray-900 rounded-full font-medium">
              Cancel Camera
            </button>
          )}
          {capturedImage && (
            <>
              <Button 
                onClick={handleContinue} 
                className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full py-3 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                disabled={currentStep !== 'complete'}
              >
                {currentStep === 'complete' ? 'Continue' : 'Please complete face verification'}
              </Button>
              <button onClick={handleRetake} className="w-full px-6 py-3 bg-gray-100 text-gray-900 rounded-full font-medium">
                Retake Photo
              </button>
            </>
          )}
          {!capturedImage && !isCameraActive && (
            <>
              {isMobile ? (
                <Button 
                  onClick={handleTakeSelfie}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full py-3 font-medium"
                >
                  Take Selfie
                </Button>
              ) : (
                <Button 
                  onClick={() => {
                    console.log('📸 Manual camera start requested')
                    startCamera()
                  }} 
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full py-3 font-medium"
                >
                  Start Camera
                </Button>
              )}
            </>
          )}
          {isCameraActive && !stream && (
            <div className="w-full p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-2">
              <p className="text-sm text-yellow-800 text-center">
                Camera is starting... Please wait
              </p>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 text-center mt-2">Powered by Mira</p>
      </div>
    </div>
  )
}
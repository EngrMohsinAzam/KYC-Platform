'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { useAppContext } from '@/context/useAppContext'
import dynamic from 'next/dynamic'

const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

const PURPLE = '#6D3CCC'

/** Circular frame outside selfie: dotted circle + equalizer bars drawn fully outside the selfie circle */
function SelfieCircleFrame({ sizePx, paused = false }: { sizePx: number; paused?: boolean }) {
  const ringR = 66
  const numBars = 28
  const barAngles = Array.from({ length: numBars }, (_, i) => {
    const t = (i / (numBars - 1)) * 0.65 + 0.175
    return (t - 0.5) * Math.PI * 2
  })
  const [heights, setHeights] = useState(() => barAngles.map(() => 4))
  const rafRef = useRef<number>()

  useEffect(() => {
    if (paused) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      return
    }
    const startRef = { current: 0 }
    const animate = (time: number) => {
      if (!startRef.current) startRef.current = time
      const elapsed = (time - startRef.current) / 1000
      setHeights(
        barAngles.map((_, i) => {
          const wave = Math.sin(elapsed * 3 + i * 0.4) * 0.5 + Math.sin(elapsed * 5 + i * 0.2) * 0.3
          return 4 + Math.max(0, wave * 12)
        })
      )
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [barAngles.length, paused])

  const cx = 50
  const cy = 50

  return (
    <svg
      viewBox="-16 -16 132 132"
      className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
      style={{ width: sizePx, height: sizePx, overflow: 'visible' }}
    >
      <circle
        cx={cx}
        cy={cy}
        r={ringR}
        fill="none"
        stroke={PURPLE}
        strokeWidth={1.8}
        strokeDasharray="1.5 4"
        strokeLinecap="round"
      />
      <g transform={`translate(${cx}, ${cy})`}>
        {barAngles.map((angle, i) => {
          const h = heights[i] ?? 4
          const x1 = (ringR * Math.cos(angle))
          const y1 = (-ringR * Math.sin(angle))
          const x2 = ((ringR + h) * Math.cos(angle))
          const y2 = (-(ringR + h) * Math.sin(angle))
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={PURPLE}
              strokeWidth={2.2}
              strokeLinecap="round"
            />
          )
        })}
      </g>
    </svg>
  )
}

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
      // Identity page removed - go directly to OTP verification
      if (isUpdateMode && updateEmail) {
        router.push(`/verify/otp-verification?update=true&email=${encodeURIComponent(updateEmail)}`)
      } else {
        router.push('/verify/otp-verification')
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
      <div className="min-h-screen h-screen bg-black flex flex-col overflow-hidden">
        <div className="md:hidden flex-shrink-0 px-4 pt-2 pb-1">
          <button type="button" onClick={() => router.back()} className="p-2 text-white hover:opacity-80" aria-label="Go back">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
        <main className="flex-1 flex flex-col items-center justify-center min-h-0 overflow-hidden px-4 py-4 md:py-6">
          <h1 className="text-white text-lg md:text-xl font-bold text-center mb-6">
            Centre your self on the screen
          </h1>
          <div className="relative flex-shrink-0 overflow-visible" style={{ width: 280, height: 280 }}>
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
                <Image
                  src={capturedImage}
                  alt="Selfie"
                  fill
                  className="object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                  unoptimized
                />
              )}
              {isCameraLoading && !isVideoReady && !capturedImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <p className="absolute bottom-2 left-0 right-0 text-white text-xs text-center">Starting camera...</p>
                </div>
              )}
            </div>
            <SelfieCircleFrame sizePx={280} paused={!!capturedImage} />
          </div>
          <canvas ref={canvasRef} className="hidden" aria-hidden />
          <div className="mt-8 flex flex-col items-center w-full max-w-[320px] gap-3">
            {capturedImage ? (
              <>
                <Button
                  onClick={handleContinue}
                  className="w-full h-12 rounded-[14px] md:rounded-[12px] bg-[#6D3CCC] hover:bg-[#8558D9] text-white font-semibold text-base"
                >
                  Continue
                </Button>
                <button
                  type="button"
                  onClick={handleRetake}
                  className="text-white/90 text-sm hover:text-white flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Retake photo
                </button>
              </>
            ) : (
              <>
                <Button
                  onClick={captureSelfie}
                  disabled={!isVideoReady || !stream}
                  className="w-full h-12 rounded-[14px] md:rounded-[12px] bg-[#6D3CCC] hover:bg-[#8558D9] disabled:opacity-50 text-white font-semibold text-base"
                >
                  Continue
                </Button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="text-white/90 text-sm hover:text-white flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Previous
                </button>
              </>
            )}
          </div>
        </main>
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
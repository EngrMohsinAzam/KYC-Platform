// 'use client'

// import { useState, useRef, useEffect } from 'react'
// import { useRouter } from 'next/navigation'
// import { Button } from '@/components/ui/Button'
// import { Header } from '@/components/layout/Header'
// import { ProgressBar } from '@/components/ui/ProgressBar'
// import { useAppContext } from '@/context/useAppContext'

// const idTypeLabels: Record<string, string> = {
//   'passport': 'Passport',
//   'national-id': 'National ID Card',
//   'drivers-license': "Driver's License",
// }

// export default function UploadDocument() {
//   const router = useRouter()
//   const { state, dispatch } = useAppContext()
  
//   const idTypeLabel = state.selectedIdType ? idTypeLabels[state.selectedIdType] || 'ID Document' : 'ID Document'
//   const needsBackSide = state.selectedIdType !== 'passport' // Passports usually only need front
  
//   // Determine initial side: if front is uploaded and back is needed but not uploaded, show back side
//   const getInitialSide = (): 'front' | 'back' => {
//     if (state.documentImageFront && needsBackSide && !state.documentImageBack) {
//       return 'back'
//     }
//     return 'front'
//   }
  
//   const [currentSide, setCurrentSide] = useState<'front' | 'back'>(getInitialSide())
//   const [frontImage, setFrontImage] = useState<string | null>(state.documentImageFront || null)
//   const [backImage, setBackImage] = useState<string | null>(state.documentImageBack || null)
  
//   const fileInputRef = useRef<HTMLInputElement>(null)
//   const cameraInputRef = useRef<HTMLInputElement>(null)
  
//   // Preload face verification animation for next step
//   useEffect(() => {
//     // Preload the animation JSON file in the background
//     fetch('/Face%20verification.json')
//       .then(res => res.json())
//       .then(() => {
//         // Animation data cached by browser, will load faster on next page
//         console.log('Face verification animation preloaded')
//       })
//       .catch(() => {
//         // Silently fail - will load on next page anyway
//       })
//   }, [])

//   // Debug: Log state changes to help troubleshoot
//   useEffect(() => {
//     console.log('Document Upload State:', {
//       currentSide,
//       hasFrontImage: !!frontImage,
//       hasBackImage: !!backImage,
//       needsBackSide,
//       frontImageLength: frontImage?.length || 0,
//       backImageLength: backImage?.length || 0,
//       stateFrontImage: !!state.documentImageFront,
//       stateBackImage: !!state.documentImageBack
//     })
//   }, [currentSide, frontImage, backImage, needsBackSide, state.documentImageFront, state.documentImageBack])
  
//   // Sync local state with global state when component mounts or state changes
//   useEffect(() => {
//     if (state.documentImageFront && !frontImage) {
//       console.log('Restoring front image from global state')
//       setFrontImage(state.documentImageFront)
//     }
//     if (state.documentImageBack && !backImage) {
//       console.log('Restoring back image from global state')
//       setBackImage(state.documentImageBack)
//     }
//   }, [state.documentImageFront, state.documentImageBack])

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0]
//     if (file) {
//       console.log('📷 File selected:', file.name, file.size, 'bytes')
//       const reader = new FileReader()
//       reader.onloadend = () => {
//         const result = reader.result as string
//         if (currentSide === 'front') {
//           console.log('✅ Front image captured, saving to state...')
//           setFrontImage(result)
//           // Immediately save to global state
//           dispatch({ type: 'SET_DOCUMENT_IMAGE_FRONT', payload: result })
//           // Also set as main document image for backward compatibility
//           dispatch({ type: 'SET_DOCUMENT_IMAGE', payload: result })
//           console.log('✅ Front image saved to state (length:', result.length, 'chars)')
//           // Don't change UI - just set the image
//         } else if (currentSide === 'back') {
//           console.log('✅ Back image captured, saving to state...')
//           setBackImage(result)
//           // Immediately save to global state
//           dispatch({ type: 'SET_DOCUMENT_IMAGE_BACK', payload: result })
//           console.log('✅ Back image saved to state (length:', result.length, 'chars)')
//           // Don't change UI - just set the image, stay on back side
//         }
//       }
//       reader.onerror = (error) => {
//         console.error('❌ Error reading file:', error)
//         alert('Error reading file. Please try again.')
//       }
//       reader.readAsDataURL(file)
//     }
//     // Reset input so same file can be selected again if needed
//     if (e.target) {
//       e.target.value = ''
//     }
//   }

//   const handleCameraClick = () => {
//     cameraInputRef.current?.click()
//   }

//   const handleFileClick = () => {
//     fileInputRef.current?.click()
//   }

//   const handleContinue = () => {
//     console.log('Continue clicked:', { currentSide, frontImage: !!frontImage, backImage: !!backImage, needsBackSide })
    
//     // Front side uploaded, need to switch to back side
//     if (currentSide === 'front' && needsBackSide && frontImage) {
//       // Ensure front image is saved to state before switching
//       console.log('✅ Front image present, saving to state and switching to back side...')
//       dispatch({ type: 'SET_DOCUMENT_IMAGE_FRONT', payload: frontImage })
//       dispatch({ type: 'SET_DOCUMENT_IMAGE', payload: frontImage })
      
//       // Switch to back side immediately (no delay)
//       setCurrentSide('back')
//       // Reset file inputs for back side
//       if (fileInputRef.current) fileInputRef.current.value = ''
//       if (cameraInputRef.current) cameraInputRef.current.value = ''
//       console.log('✅ Switched to back side - ready for back image upload')
//       return // Don't proceed further, just switch sides
//     }
    
//     // Back side uploaded, both sides are complete
//     if (currentSide === 'back' && backImage && frontImage) {
//       // Ensure both images are saved to state
//       console.log('Both images present, saving to state and navigating...')
//       console.log('Front image length:', frontImage.length)
//       console.log('Back image length:', backImage.length)
      
//       // Save both images to state
//       dispatch({ type: 'SET_DOCUMENT_IMAGE_FRONT', payload: frontImage })
//       dispatch({ type: 'SET_DOCUMENT_IMAGE_BACK', payload: backImage })
      
//       // Double-check that both images are valid before navigating
//       if (!frontImage || frontImage.length < 100) {
//         alert('Front image is missing or invalid. Please retake the front side photo.')
//         return
//       }
//       if (!backImage || backImage.length < 100) {
//         alert('Back image is missing or invalid. Please retake the back side photo.')
//         return
//       }
      
//       // Wait a moment to ensure state is saved before navigation
//       setTimeout(() => {
//         // Verify state was saved correctly
//         console.log('Verifying state before navigation...')
//         console.log('State front image:', !!state.documentImageFront)
//         console.log('State back image:', !!state.documentImageBack)
//         console.log('Navigating to identity page with both images')
//         router.push('/verify/identity')
//       }, 300)
//       return
//     }
    
//     // Passport only needs front side
//     if (currentSide === 'front' && !needsBackSide && frontImage) {
//       console.log('Passport - only front side needed, saving and navigating...')
//       dispatch({ type: 'SET_DOCUMENT_IMAGE_FRONT', payload: frontImage })
//       setTimeout(() => {
//         router.push('/verify/identity')
//       }, 200)
//       return
//     }
    
//     // If we reach here, something is wrong - show alert
//     if (needsBackSide && currentSide === 'back' && !backImage) {
//       alert('Please upload the back side of your document before continuing.')
//     } else if (needsBackSide && currentSide === 'front' && !frontImage) {
//       alert('Please upload the front side of your document first.')
//     } else {
//       console.error('Unexpected state in handleContinue:', { currentSide, frontImage: !!frontImage, backImage: !!backImage, needsBackSide })
//       alert('Please upload the required document image(s) before continuing.')
//     }
//   }

//   const handleRetake = () => {
//     if (currentSide === 'front') {
//       setFrontImage(null)
//       dispatch({ type: 'SET_DOCUMENT_IMAGE_FRONT', payload: '' })
//     } else {
//       setBackImage(null)
//       dispatch({ type: 'SET_DOCUMENT_IMAGE_BACK', payload: '' })
//     }
//     if (fileInputRef.current) fileInputRef.current.value = ''
//     if (cameraInputRef.current) cameraInputRef.current.value = ''
//   }

//   const handleBackToFront = () => {
//     setCurrentSide('front')
//   }

//   const currentImage = currentSide === 'front' ? frontImage : backImage
//   // Can continue only if current side has image
//   // For back side, also need front image to be present
//   const canContinue = currentImage !== null && (currentSide === 'front' || (currentSide === 'back' && frontImage))

//   return (
//     <div className="min-h-screen bg-white md:bg-surface-gray flex flex-col">
//       <Header showBack showClose />
//       <ProgressBar currentStep={4} totalSteps={5} />
//       <main className="flex-1 px-4 md:px-0 pt-6 pb-24 md:flex md:items-center md:justify-center py-24">
//         <div className="w-full max-w-md lg:max-w-2xl md:bg-white p-4 rounded-2xl md:p-6 md:my-8 border-[2px] border-grey-400">
//           <div className="mb-6">
//             <h1 className="text-xl font-bold text-text-primary mb-2">
//               {idTypeLabel}
//             </h1>
//             {needsBackSide && (
//               <div className="mb-4">
//                 <p className="text-sm font-semibold text-text-primary mb-2">
//                   {currentSide === 'front' ? 'Step 1 of 2: Front Side' : 'Step 2 of 2: Back Side'}
//                 </p>
              
//                 {currentSide === 'front' && frontImage && (
//                   <p className="text-xs text-accent-green font-semibold">
//                     ✓ Front side uploaded. Now you need to upload the BACK side.
//                   </p>
//                 )}
//               </div>
//             )}
            
//             {!needsBackSide && (
//               <p className="text-xs text-text-secondary mb-2">
//                 Please take a photo of your passport. Make sure all information is visible and readable.
//               </p>
//             )}

//             {/* Progress indicator for front/back */}
//             {needsBackSide && (
//               <div className="mb-4">
//                 <div className="flex gap-2 mb-2">
//                   <div className={`flex-1 h-2 rounded-full ${frontImage ? 'bg-accent-green' : 'bg-surface-light'}`} />
//                   <div className={`flex-1 h-2 rounded-full ${backImage ? 'bg-accent-green' : 'bg-surface-light'}`} />
//                 </div>
//                 <div className="flex gap-2 text-xs">
//                   <div className={`flex-1 text-center ${frontImage ? 'text-accent-green font-semibold' : 'text-text-light'}`}>
//                     Front {frontImage ? '✓' : '○'}
//                   </div>
//                   <div className={`flex-1 text-center ${backImage ? 'text-accent-green font-semibold' : 'text-text-light'}`}>
//                     Back {backImage ? '✓' : '○'}
//                   </div>
//                 </div>
//               </div>
//             )}
            
//             {/* Show both images when on back side */}
//             {currentSide === 'back' && frontImage && (
//   <div className="mb-4 flex justify-center">
//     <div className="relative w-full max-w-sm aspect-[16/16] bg-pink-50 border-2 border-pink-200 rounded-lg overflow-hidden">
//       <img
//         src={frontImage}
//         alt="Front side preview"
//         className="w-full h-auto max-h-96 object-contain bg-white"
//       />
//     </div>
//   </div>
// )}

//             <div className="mb-6">
//               <div className="relative mx-auto w-full max-w-sm aspect-[16/16] bg-pink-50 border-2 border-pink-200 rounded-lg overflow-hidden mb-4">
//                 {currentImage ? (
//                   <img
//                     src={currentImage}
//                     alt={`ID Document ${currentSide}`}
//                     className="w-full h-auto max-h-96 object-contain bg-white"
//                   />
//                 ) : (
//                   <div className="w-full h-full flex items-center justify-center cursor-pointer" onClick={handleFileClick}>
//                     <div className="text-center">
//                       <svg
//                         className="w-16 h-16 text-text-light mx-auto mb-4"
//                         fill="none"
//                         stroke="currentColor"
//                         viewBox="0 0 24 24"
//                       >
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           strokeWidth={2}
//                           d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
//                         />
//                       </svg>
//                       <p className="text-sm text-text-light mb-4">Make sure that all the information on the document is visible and easily readable.</p>
//                       <div className="flex gap-2 justify-center">
//                         <button
//                           onClick={(e) => {
//                             e.stopPropagation()
//                             handleFileClick()
//                           }}
//                           className="px-4 py-2 bg-primary text-white rounded-button text-sm hover:bg-primary-light transition-colors"
//                         >
//                           Choose File
//                         </button>
//                         <button
//                           onClick={(e) => {
//                             e.stopPropagation()
//                             handleCameraClick()
//                           }}
//                           className="px-4 py-2 bg-white text-primary border-2 border-primary rounded-button text-sm hover:bg-surface-light transition-colors"
//                         >
//                           Use Camera
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </div>
//               {/* Hidden file inputs */}
//               <input
//                 ref={fileInputRef}
//                 type="file"
//                 accept="image/*"
//                 onChange={handleFileChange}
//                 className="hidden"
//                 aria-label={`Upload ID document ${currentSide}`}
//               />
//               <input
//                 ref={cameraInputRef}
//                 type="file"
//                 accept="image/*"
//                 capture="environment"
//                 onChange={handleFileChange}
//                 className="hidden"
//                 aria-label={`Take photo with camera ${currentSide}`}
//               />
//             </div>
//           </div>

//           <div className="space-y-3">
//             {currentImage ? (
//               <>
//                 <Button 
//                   onClick={handleContinue}
//                   disabled={!canContinue}
//                   className="w-full bg-black hover:bg-black/80 text-white font-semibold rounded-full py-3 disabled:bg-gray-300 disabled:cursor-not-allowed"
//                 >
//                   {currentSide === 'front' && needsBackSide && frontImage
//                     ? 'Continue to Back Side'
//                     : currentSide === 'back' && backImage && frontImage
//                     ? 'Continue'
//                     : 'Document is readable'}
//                 </Button>
                
//                 <Button 
//                   onClick={handleRetake}
//                   variant="secondary"
//                   className="w-full border-2 border-text-primary text-text-primary hover:bg-surface-light rounded-full py-3"
//                 >
//                   Retake photo
//                 </Button>
//               </>
//             ) : (
//               <Button 
//                 onClick={handleFileClick}
//                 className="w-full bg-black hover:bg-black/80 text-white font-semibold rounded-full py-3"
//               >
//                 Upload Document
//               </Button>
//             )}
//           </div>

//           <div className="md:block fixed md:relative bottom-0 left-0 right-0 p-4 bg-white md:bg-transparent border-t md:border-t-0 border-surface-light">
//             <p className="text-xs text-text-light text-center">Powered by Mira</p>
//           </div>
//         </div>
//       </main>
//     </div>
//   )
// }
'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Header } from '@/components/layout/Header'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useAppContext } from '@/context/useAppContext'
import { HiOutlineCamera, HiOutlinePhotograph } from 'react-icons/hi'

const idTypeLabels: Record<string, string> = {
  'passport': 'Passport',
  'national-id': 'National ID Card',
  'drivers-license': "Driver's License",
}

export default function UploadDocument() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { state, dispatch } = useAppContext()
  
  // Check if we're in update mode
  const isUpdateMode = searchParams.get('update') === 'true'
  const updateEmail = searchParams.get('email')
  
  const idTypeLabel = state.selectedIdType ? idTypeLabels[state.selectedIdType] || 'ID Document' : 'ID Document'
  const needsBackSide = state.selectedIdType !== 'passport'
  
  const getInitialSide = (): 'front' | 'back' => {
    if (state.documentImageFront && needsBackSide && !state.documentImageBack) {
      return 'back'
    }
    return 'front'
  }
  
  const [currentSide, setCurrentSide] = useState<'front' | 'back'>(getInitialSide())
  const [frontImage, setFrontImage] = useState<string | null>(state.documentImageFront || null)
  const [backImage, setBackImage] = useState<string | null>(state.documentImageBack || null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isCameraLoading, setIsCameraLoading] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const cameraFrontRef = useRef<HTMLInputElement>(null)
  const cameraBackRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    // Preload animation (optional, won't break if it fails)
    fetch('/face.json')
      .then(res => res.json())
      .then(() => {
        console.log('Face verification animation preloaded')
      })
      .catch(() => {
        // Silently fail - animation is optional
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

  useEffect(() => {
    console.log('Document Upload State:', {
      currentSide,
      hasFrontImage: !!frontImage,
      hasBackImage: !!backImage,
      needsBackSide,
    })
  }, [currentSide, frontImage, backImage, needsBackSide])
  
  useEffect(() => {
    if (state.documentImageFront && !frontImage) {
      setFrontImage(state.documentImageFront)
    }
    if (state.documentImageBack && !backImage) {
      setBackImage(state.documentImageBack)
    }
  }, [state.documentImageFront, state.documentImageBack])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIsUploading(true)
      const reader = new FileReader()
      reader.onloadend = async () => {
        try {
          const result = reader.result as string;
          
          // Optional: Compress image for mobile performance (reduces memory usage)
          // Uncomment the following lines to enable compression:
          // if (result && result.length > 500000) { // Only compress if > 500KB
          //   const { compressBase64Image } = await import('@/lib/image-utils')
          //   result = await compressBase64Image(result, 1920, 0.85)
          // }
          
          setTimeout(() => {
            if (currentSide === 'front') {
              // Only save front image, don't auto-switch
              setFrontImage(result);
              dispatch({ type: 'SET_DOCUMENT_IMAGE_FRONT', payload: result });
              dispatch({ type: 'SET_DOCUMENT_IMAGE', payload: result });
              console.log('✅ Front image saved. User must click Continue to upload back side.');
            } else if (currentSide === 'back') {
              // Save back image separately
              setBackImage(result);
              dispatch({ type: 'SET_DOCUMENT_IMAGE_BACK', payload: result });
              console.log('✅ Back image saved.');
            }
            setIsUploading(false);
          }, 800);
        } catch (error) {
          console.error('Error processing image:', error);
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file)
    }
    // Reset input so user can take a new photo
    if (e.target) {
      e.target.value = ''
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setIsUploading(true)
      const reader = new FileReader()
      reader.onloadend = () => {
        setTimeout(() => {
          const result = reader.result as string
          if (currentSide === 'front') {
            // Only save front image, don't auto-switch
            setFrontImage(result)
            dispatch({ type: 'SET_DOCUMENT_IMAGE_FRONT', payload: result })
            dispatch({ type: 'SET_DOCUMENT_IMAGE', payload: result })
            console.log('✅ Front image saved. User must click Continue to upload back side.')
          } else if (currentSide === 'back') {
            // Save back image separately
            setBackImage(result)
            dispatch({ type: 'SET_DOCUMENT_IMAGE_BACK', payload: result })
            console.log('✅ Back image saved.')
          }
          setIsUploading(false)
        }, 800)
      }
      reader.readAsDataURL(file)
    }
  };

  const startCamera = async () => {
    try {
      setIsCameraLoading(true)
      setIsCameraActive(false) // Reset to ensure clean state
      
      // Stop any existing stream first
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
        setStream(null)
      }
      
      // Clear video element
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
      
      if (typeof window === 'undefined' || !navigator.mediaDevices) {
        throw new Error('Camera not available')
      }
      
      console.log('📷 Requesting camera access...')
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })
      
      console.log('✅ Camera access granted, setting up video...')
      console.log('  - Stream active:', mediaStream.active)
      console.log('  - Video tracks:', mediaStream.getVideoTracks().length)
      
      // CRITICAL: Set camera active FIRST so React renders the video element
      setIsCameraActive(true)
      setIsCameraLoading(false)
      
      // Wait for React to render the video element
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Now set the stream - this will trigger useEffect
      setStream(mediaStream)
      
      // Wait a bit more for useEffect to run and video to be set up
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Double-check and force video to play
      if (videoRef.current) {
        const video = videoRef.current
        console.log('  - Video ref available, verifying setup...')
        
        // Ensure stream is set
        if (video.srcObject !== mediaStream) {
          console.log('  - Stream not set, setting now...')
          video.srcObject = mediaStream
        }
        
        // Ensure all attributes are set
        video.autoplay = true
        video.playsInline = true
        video.muted = true
        video.setAttribute('webkit-playsinline', 'true')
        video.setAttribute('x5-playsinline', 'true')
        
        // CRITICAL: Force video to be visible - override any React style props
        // Use setProperty to ensure styles override React style prop
        video.style.setProperty('display', 'block', 'important')
        video.style.setProperty('width', '100%', 'important')
        video.style.setProperty('height', '100%', 'important')
        video.style.setProperty('object-fit', 'cover', 'important')
        video.style.setProperty('background-color', '#000', 'important')
        video.style.setProperty('position', 'absolute', 'important')
        video.style.setProperty('top', '0', 'important')
        video.style.setProperty('left', '0', 'important')
        video.style.setProperty('z-index', '10', 'important')
        video.style.setProperty('opacity', '1', 'important')
        video.style.setProperty('visibility', 'visible', 'important')
        video.style.setProperty('pointer-events', 'auto', 'important')
        
        // Force a reflow to ensure styles are applied
        void video.offsetHeight
        
        console.log('  - Video style forced with setProperty')
        console.log('  - Video computed opacity:', window.getComputedStyle(video).opacity)
        console.log('  - Video computed display:', window.getComputedStyle(video).display)
        console.log('  - Video computed visibility:', window.getComputedStyle(video).visibility)
        
        console.log('  - Video srcObject:', !!video.srcObject)
        console.log('  - Video readyState:', video.readyState)
        console.log('  - Video paused:', video.paused)
        console.log('  - Video width:', video.videoWidth)
        console.log('  - Video height:', video.videoHeight)
        console.log('  - Stream active:', mediaStream.active)
        console.log('  - Stream tracks enabled:', mediaStream.getVideoTracks().every(t => t.enabled))
        
        // Force play - try multiple times
        const forcePlay = async (attempt = 1) => {
          try {
            if (video.paused) {
              console.log(`  - Attempting to play (attempt ${attempt})...`);
              await video.play();
              console.log('✅ Video playing!');
              
              // Double check it's actually playing
              setTimeout(() => {
                if (video.videoWidth > 0 && video.videoHeight > 0) {
                  console.log('✅ Video confirmed playing with dimensions');
                } else {
                  console.warn('⚠️ Video playing but no dimensions - may need more time');
                }
              }, 500);
            } else {
              console.log('✅ Video already playing');
            }
          } catch (error: any) {
            console.warn(`⚠️ Play attempt ${attempt} failed:`, error.message);
            if (attempt < 5) {
              setTimeout(() => forcePlay(attempt + 1), 500);
            }
          }
        };
        
        // Try to play immediately
        forcePlay();
        
        // Also set up a listener for when video becomes ready
        const onReady = () => {
          if (video.videoWidth > 0 && video.videoHeight > 0 && video.paused) {
            console.log('  - Video ready, forcing play...');
            forcePlay();
          }
        };
        
        video.addEventListener('loadedmetadata', onReady, { once: true })
        video.addEventListener('canplay', onReady, { once: true })
      } else {
        console.warn('⚠️ Video ref still not available after wait')
        // The useEffect will handle it when ref becomes available
      }
    } catch (error: any) {
      console.error('❌ Error accessing camera:', error)
      setIsCameraActive(false)
      setIsCameraLoading(false)
      
      // On mobile, if getUserMedia fails, use file input with capture
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      if (isMobile) {
        console.log('📱 Mobile detected, using file input with capture attribute')
        // Small delay to ensure UI updates
        setTimeout(() => {
          cameraInputRef.current?.click()
        }, 100)
      } else {
        // Desktop fallback
        alert('Could not access camera. Please check permissions or use file upload.')
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setIsCameraActive(false)
    setIsCameraLoading(false)
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      if (context && video.videoWidth > 0 && video.videoHeight > 0) {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        // Draw the video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        const imageData = canvas.toDataURL('image/jpeg', 0.9)
        
        // Process the captured image
        if (currentSide === 'front') {
          setFrontImage(imageData)
          dispatch({ type: 'SET_DOCUMENT_IMAGE_FRONT', payload: imageData })
          dispatch({ type: 'SET_DOCUMENT_IMAGE', payload: imageData })
        } else if (currentSide === 'back') {
          setBackImage(imageData)
          dispatch({ type: 'SET_DOCUMENT_IMAGE_BACK', payload: imageData })
        }
        
        stopCamera()
      } else {
        console.error('Video not ready for capture')
        alert('Camera not ready. Please wait a moment and try again.')
      }
    }
  };

  const handleCameraClick = async () => {
    // On mobile, use native camera (user can choose camera)
    if (isMobile) {
      cameraInputRef.current?.click()
      return
    }
    
    // On desktop/web, use web camera
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      await startCamera()
    } else {
      // Fallback to file input with capture attribute
      cameraInputRef.current?.click()
    }
  };

  const handleNativeCamera = () => {
    if (isMobile) {
      // Use a single input that lets user choose camera
      cameraInputRef.current?.click()
    }
  };

  // Handle video element ready - ensure video displays properly
  useEffect(() => {
    // Only run when we have both camera active, video ref, and stream
    if (!isCameraActive || !videoRef.current || !stream) {
      if (isCameraActive && !stream) {
        console.log('⚠️ Camera active but no stream yet')
      }
      return
    }
    
    const video = videoRef.current
    let playAttempts = 0
    const maxPlayAttempts = 10
    let animationFrameId: number | null = null
    
    console.log('🎥 Video element effect triggered')
    console.log('  - Stream active:', stream.active)
    console.log('  - Stream tracks:', stream.getVideoTracks().length)
    console.log('  - Video element exists:', !!video)
    console.log('  - Current srcObject:', !!video.srcObject)
    console.log('  - Video readyState:', video.readyState)
    
    // CRITICAL: Set the stream FIRST - this is the most important step
    if (video.srcObject !== stream) {
      console.log('  - Setting video srcObject to stream...')
      video.srcObject = stream
      console.log('  - Video srcObject now set:', !!video.srcObject)
      console.log('  - Stream tracks after setting:', stream.getVideoTracks().map(t => ({ enabled: t.enabled, readyState: t.readyState })))
    }
    
    // Ensure video attributes are set
    video.autoplay = true
    video.playsInline = true
    video.muted = true
    video.setAttribute('webkit-playsinline', 'true')
    video.setAttribute('x5-playsinline', 'true') // For some Android browsers
    
    // CRITICAL: Force video to be visible with inline styles
    // Remove ALL React style props and control everything via inline styles
    // This is the ONLY way to ensure video is visible on mobile
    
    // First, remove any existing inline styles that might conflict
    video.removeAttribute('style')
    
    // Now set all styles with !important to override everything
    const styles = [
      'display: block !important',
      'width: 100% !important',
      'height: 100% !important',
      'object-fit: cover !important',
      'background-color: #000 !important',
      'position: absolute !important',
      'top: 0 !important',
      'left: 0 !important',
      'right: 0 !important',
      'bottom: 0 !important',
      'z-index: 5 !important',
      'opacity: 1 !important',
      'visibility: visible !important',
      'pointer-events: auto !important',
      'transform: none !important',
      'will-change: auto !important'
    ]
    
    video.style.cssText = styles.join('; ')
    
    // Also remove className styles that might hide it
    video.className = 'w-full h-full object-cover'
    
    console.log('  - Video style applied via cssText')
    console.log('  - Video computed display:', window.getComputedStyle(video).display)
    console.log('  - Video computed opacity:', window.getComputedStyle(video).opacity)
    console.log('  - Video computed visibility:', window.getComputedStyle(video).visibility)
    console.log('  - Video computed z-index:', window.getComputedStyle(video).zIndex)
    console.log('  - Video computed position:', window.getComputedStyle(video).position)
    
    // Force a reflow
    void video.offsetHeight
    
    // Double-check after a moment
    setTimeout(() => {
      const computed = window.getComputedStyle(video)
      if (computed.display === 'none') {
        console.error('❌ Video display is still none after style application!')
        video.style.setProperty('display', 'block', 'important')
      }
      if (computed.opacity === '0') {
        console.error('❌ Video opacity is still 0 after style application!')
        video.style.setProperty('opacity', '1', 'important')
      }
      if (computed.visibility === 'hidden') {
        console.error('❌ Video visibility is still hidden after style application!')
        video.style.setProperty('visibility', 'visible', 'important')
      }
    }, 200)
    
    // Also verify parent container isn't hiding the video
    if (video.parentElement) {
      const parent = video.parentElement as HTMLElement
      const parentComputed = window.getComputedStyle(parent)
      console.log('  - Parent container styles:')
      console.log('    - Display:', parentComputed.display)
      console.log('    - Visibility:', parentComputed.visibility)
      console.log('    - Opacity:', parentComputed.opacity)
      console.log('    - Overflow:', parentComputed.overflow)
      console.log('    - Z-index:', parentComputed.zIndex)
      console.log('    - Position:', parentComputed.position)
      
      // Ensure parent is visible and positioned correctly
      if (parentComputed.display === 'none') {
        console.warn('⚠️ Parent container is hidden!')
        parent.style.setProperty('display', 'block', 'important')
      }
      if (parentComputed.position !== 'relative' && parentComputed.position !== 'absolute') {
        parent.style.setProperty('position', 'relative', 'important')
      }
    }
    
    // CRITICAL: Add a visual test - set a temporary background color to verify video is visible
    // This will help us see if the video element itself is visible
    setTimeout(() => {
      const testColor = 'rgba(255, 0, 0, 0.1)' // Light red tint
      video.style.setProperty('background-color', testColor, 'important')
      console.log('🔴 TEST: Video background set to light red - if you see red, video element is visible')
      
      // After 2 seconds, set back to black
      setTimeout(() => {
        video.style.setProperty('background-color', '#000', 'important')
      }, 2000)
    }, 500)
    
    // Function to attempt playing the video
    const attemptPlay = async () => {
      playAttempts++
      console.log(`  - Play attempt ${playAttempts}/${maxPlayAttempts}`)
      
      try {
        if (video.paused) {
          await video.play()
          console.log('✅ Video playing successfully!')
          setIsCameraLoading(false)
          
          // Verify video is actually showing frames
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            console.log('✅ Video has dimensions:', video.videoWidth, 'x', video.videoHeight)
          } else {
            console.warn('⚠️ Video playing but no dimensions yet')
          }
        } else {
          console.log('✅ Video is already playing')
          setIsCameraLoading(false)
        }
      } catch (error: any) {
        console.warn(`⚠️ Play attempt ${playAttempts} failed:`, error.message)
        if (playAttempts < maxPlayAttempts) {
          // Retry after a delay
          setTimeout(attemptPlay, 300)
        } else {
          console.error('❌ Max play attempts reached')
        }
      }
    }
    
    const handleLoadedMetadata = () => {
      console.log('📹 Video metadata loaded')
      console.log('  - Video width:', video.videoWidth)
      console.log('  - Video height:', video.videoHeight)
      console.log('  - Video readyState:', video.readyState)
      attemptPlay()
    }
    
    const handleCanPlay = () => {
      console.log('✅ Video can play')
      setIsCameraLoading(false)
      attemptPlay()
    }
    
    const handlePlaying = () => {
      console.log('▶️ Video is playing!')
      setIsCameraLoading(false)
      // Verify it's actually showing
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        console.log('✅ Video confirmed playing with dimensions:', video.videoWidth, 'x', video.videoHeight)
      }
    }
    
    const handleLoadedData = () => {
      console.log('📊 Video data loaded')
      attemptPlay()
    }
    
    const handleError = (e: Event) => {
      console.error('❌ Video error:', e)
      const error = (e.target as HTMLVideoElement).error
      if (error) {
        console.error('  - Error code:', error.code)
        console.error('  - Error message:', error.message)
      }
    }
    
    // Remove old listeners first to prevent duplicates
    video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    video.removeEventListener('loadeddata', handleLoadedData)
    video.removeEventListener('canplay', handleCanPlay)
    video.removeEventListener('playing', handlePlaying)
    video.removeEventListener('error', handleError)
    
    // Add new listeners
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('playing', handlePlaying)
    video.addEventListener('error', handleError)
    
    // Try to play immediately if ready
    if (video.readyState >= 2) {
      console.log('🎬 Video ready (readyState >= 2), attempting to play immediately...')
      attemptPlay()
    } else {
      console.log('⏳ Waiting for video to be ready (readyState:', video.readyState, ')')
      // Also try after a short delay
      setTimeout(attemptPlay, 500)
    }
    
    // Use requestAnimationFrame to continuously check if video is playing
    const checkVideoPlaying = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0 && !video.paused) {
        // Video is playing and has dimensions - good!
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId)
          animationFrameId = null
        }
      } else if (playAttempts < maxPlayAttempts) {
        // Keep checking
        animationFrameId = requestAnimationFrame(checkVideoPlaying)
      }
    }
    
    // Start checking after a delay
    setTimeout(() => {
      animationFrameId = requestAnimationFrame(checkVideoPlaying)
    }, 1000)
    
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('playing', handlePlaying)
      video.removeEventListener('error', handleError)
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [isCameraActive, stream])

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])

  const handleFileClick = () => {
    fileInputRef.current?.click()
  };

  const handleContinue = () => {
    console.log('Continue clicked:', { currentSide, hasFrontImage: !!frontImage, hasBackImage: !!backImage, needsBackSide })
    
    // Front side uploaded, switch to back side manually
    if (currentSide === 'front' && needsBackSide && frontImage) {
      console.log('✅ Front image present, switching to back side...')
      // Ensure front image is saved to state
      dispatch({ type: 'SET_DOCUMENT_IMAGE_FRONT', payload: frontImage })
      dispatch({ type: 'SET_DOCUMENT_IMAGE', payload: frontImage })
      
      // Switch to back side - user must take a NEW photo
      setCurrentSide('back')
      
      // Reset file inputs so user can take a fresh photo for back side
      if (fileInputRef.current) fileInputRef.current.value = ''
      if (cameraInputRef.current) cameraInputRef.current.value = ''
      
      // Clear any previous back image
      setBackImage(null)
      
      console.log('✅ Switched to back side - ready for NEW back image upload')
      return
    }
    
    if (currentSide === 'back' && backImage && frontImage) {
      dispatch({ type: 'SET_DOCUMENT_IMAGE_FRONT', payload: frontImage })
      dispatch({ type: 'SET_DOCUMENT_IMAGE_BACK', payload: backImage })
      
      if (!frontImage || frontImage.length < 100) {
        alert('Front image is missing or invalid. Please retake the front side photo.')
        return
      }
      if (!backImage || backImage.length < 100) {
        alert('Back image is missing or invalid. Please retake the back side photo.')
        return
      }
      
      setTimeout(() => {
        // Preserve update mode query params if in update mode
        if (isUpdateMode && updateEmail) {
          router.push(`/verify/identity?update=true&email=${encodeURIComponent(updateEmail)}`)
        } else {
          router.push('/verify/identity')
        }
      }, 300)
      return
    }
    
    if (currentSide === 'front' && !needsBackSide && frontImage) {
      dispatch({ type: 'SET_DOCUMENT_IMAGE_FRONT', payload: frontImage })
      setTimeout(() => {
        // Preserve update mode query params if in update mode
        if (isUpdateMode && updateEmail) {
          router.push(`/verify/identity?update=true&email=${encodeURIComponent(updateEmail)}`)
        } else {
          router.push('/verify/identity')
        }
      }, 200)
      return
    }
    // If none of the conditions match, do nothing
  };

  const handleRetake = () => {
    if (currentSide === 'front') {
      setFrontImage(null)
      dispatch({ type: 'SET_DOCUMENT_IMAGE_FRONT', payload: '' })
    } else {
      setBackImage(null)
      dispatch({ type: 'SET_DOCUMENT_IMAGE_BACK', payload: '' })
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  };

  const currentImage = currentSide === 'front' ? frontImage : backImage;
  const canContinue = currentImage !== null && (currentSide === 'front' || (currentSide === 'back' && frontImage));

  return (
    <div className="min-h-screen h-screen bg-white flex flex-col overflow-hidden">
      <div className="md:hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <button onClick={() => router.back()} className="p-2" type="button" aria-label="Go back">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button onClick={() => router.push('/')} className="p-2" type="button" aria-label="Close">
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
          {/* Mobile Design - Full screen */}
          <div className="md:hidden h-full flex flex-col px-4 pt-8 pb-32">
            {/* Title and Step Info */}
            <div className="mb-6">
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                {idTypeLabel}
              </h1>
              {needsBackSide && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {currentSide === 'front' ? 'Step 1 of 2: Front Side' : 'Step 2 of 2: Back Side'}
                  </p>
                  {currentSide === 'back' && frontImage && (
                    <p className="text-xs text-green-600 font-semibold">
                      ✓ Front side uploaded! Now take a photo of the BACK side.
                    </p>
                  )}
                </div>
              )}
              
              {/* Progress indicator */}
              {needsBackSide && (
                <div className="flex gap-2 mb-4">
                  <div className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${frontImage ? 'bg-gray-900' : 'bg-gray-200'}`} />
                  <div className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${backImage ? 'bg-gray-900' : 'bg-gray-200'}`} />
                </div>
              )}
            </div>

            {/* Upload Area */}
            <div className="flex-1 flex flex-col">
              <div 
                className={`
                  relative w-full aspect-[3/2] rounded-2xl overflow-hidden mb-4 transition-all duration-300
                  ${currentImage ? 'bg-white border border-gray-200' : 'bg-gray-50 border-2 border-dashed border-gray-300'}
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {isUploading ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-white">
                    <div className="scanning-animation mb-4">
                      <svg className="w-16 h-16 text-gray-900 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600 font-medium">Processing document...</p>
                  </div>
                ) : isCameraActive || isCameraLoading ? (
                  <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden">
                    {isCameraLoading ? (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-white text-sm">Starting camera...</p>
                      </div>
                    ) : (
                      <>
                        {/* Always render video element when camera is active - make it always visible */}
                        <video
                          ref={(el) => {
                            if (el) {
                              (videoRef as any).current = el
                              if (stream) {
                                // Immediately set up video when ref is set
                                console.log('🎬 Video ref callback - setting up immediately')
                                el.srcObject = stream
                                el.style.cssText = `
                                  display: block !important;
                                  width: 100% !important;
                                  height: 100% !important;
                                  object-fit: cover !important;
                                  background-color: #000 !important;
                                  position: absolute !important;
                                  top: 0 !important;
                                  left: 0 !important;
                                  z-index: 5 !important;
                                  opacity: 1 !important;
                                  visibility: visible !important;
                                `
                                el.play().catch(err => console.warn('Play error in ref callback:', err))
                              }
                            }
                          }}
                          autoPlay
                          playsInline
                          muted
                        />
                        {!stream && (
                          <div className="w-full h-full flex items-center justify-center absolute inset-0 z-0">
                            <div className="text-center">
                              <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
                              <p className="text-white text-sm">Preparing camera...</p>
                            </div>
                          </div>
                        )}
                        <canvas ref={canvasRef} className="hidden" />
                      </>
                    )}
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 px-4 z-10">
                      <button
                        onClick={stopCamera}
                        disabled={isCameraLoading}
                        className="px-6 py-3 bg-white text-gray-900 rounded-full font-medium shadow-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={capturePhoto}
                        disabled={isCameraLoading}
                        className="px-6 py-3 bg-gray-900 text-white rounded-full font-medium shadow-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Capture Photo
                      </button>
                    </div>
                  </div>
                ) : currentImage ? (
                  <div className="relative w-full h-full group">
                    <img
                      src={currentImage}
                      alt={`ID Document ${currentSide}`}
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
                      {isMobile ? (
                        <>
                          <button
                            onClick={handleNativeCamera}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-full font-medium transition-all"
                          >
                            <HiOutlineCamera className="w-5 h-5" />
                            <span>Take Photo</span>
                          </button>
                          <button
                            onClick={handleFileClick}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300 rounded-full font-medium transition-all"
                          >
                            <HiOutlinePhotograph className="w-5 h-5" />
                            <span>Upload from Device</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={handleCameraClick}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-full font-medium transition-all"
                          >
                            <HiOutlineCamera className="w-5 h-5" />
                            <span>Take Photo</span>
                          </button>
                          <button
                            onClick={handleFileClick}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300 rounded-full font-medium transition-all"
                          >
                            <HiOutlinePhotograph className="w-5 h-5" />
                            <span>Choose File</span>
                          </button>
                        </>
                      )}
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {/* Native mobile camera input - no capture attribute, lets user choose camera */}
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture
                      onChange={handleFileChange}
                      className="hidden"
                      aria-label="Take photo with camera"
                    />
                  </div>
                )}
              </div>

              {/* Tips */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
                <h4 className="font-medium text-gray-900 mb-2 text-sm">Tips for best results</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Ensure all information is clearly visible</li>
                  <li>• Use good lighting, avoid shadows</li>
                  <li>• Place document on flat surface</li>
                  <li>• Capture entire document in frame</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Desktop Design - Keep existing */}
          <div className="hidden md:block w-full max-w-md lg:max-w-2xl px-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
              {/* Your existing desktop code here... */}
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                  {idTypeLabel}
                </h1>
                {needsBackSide && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-4">
                      {currentSide === 'front' ? 'Step 1 of 2: Front Side' : 'Step 2 of 2: Back Side'}
                    </p>
                    
                    <div className="flex gap-2 mb-3">
                      <div className={`flex-1 h-1.5 rounded-full transition-all duration-700 ${frontImage ? 'bg-gray-900' : 'bg-gray-200'}`} />
                      <div className={`flex-1 h-1.5 rounded-full transition-all duration-700 ${backImage ? 'bg-gray-900' : 'bg-gray-200'}`} />
                    </div>
                  </div>
                )}

                {currentSide === 'back' && frontImage && (
                  <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                    <p className="text-sm font-semibold text-green-800 mb-3">✓ Front side uploaded! Now take a photo of the BACK side.</p>
                    <img
                      src={frontImage}
                      alt="Front side preview"
                      className="w-full max-w-xs mx-auto rounded-lg border border-gray-200 shadow-sm"
                    />
                  </div>
                )}
              </div>

              <div className="mb-6">
                <div 
                  className={`
                    relative w-full aspect-[3/2] rounded-2xl overflow-hidden mb-4 transition-all
                    ${currentImage ? 'bg-white border border-gray-200' : 'bg-gray-50 border-2 border-dashed border-gray-300'}
                  `}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {isUploading ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-white">
                      <div className="mb-6">
                        <svg className="w-20 h-20 text-gray-900 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-600 font-medium">Processing document...</p>
                    </div>
                  ) : isCameraActive || isCameraLoading ? (
                    <div className="relative w-full h-full bg-black rounded-2xl" style={{ overflow: 'hidden' }}>
                      {isCameraLoading ? (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
                          <p className="text-white text-sm">Starting camera...</p>
                        </div>
                      ) : (
                        <>
                          {/* Always render video element when camera is active - make it always visible */}
                          <video
                            ref={(el) => {
                              if (el) {
                                (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el
                                if (stream) {
                                  // Immediately set up video when ref is set
                                  console.log('🎬 Video ref callback - setting up immediately')
                                  el.srcObject = stream
                                  el.style.cssText = `
                                    display: block !important;
                                    width: 100% !important;
                                    height: 100% !important;
                                    object-fit: cover !important;
                                    background-color: #000 !important;
                                    position: absolute !important;
                                    top: 0 !important;
                                    left: 0 !important;
                                    z-index: 5 !important;
                                    opacity: 1 !important;
                                    visibility: visible !important;
                                  `
                                  el.play().catch(err => console.warn('Play error in ref callback:', err))
                                }
                              }
                            }}
                            autoPlay
                            playsInline
                            muted
                          />
                          {!stream && (
                            <div className="w-full h-full flex items-center justify-center absolute inset-0 z-0">
                              <div className="text-center">
                                <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
                                <p className="text-white text-sm">Preparing camera...</p>
                              </div>
                            </div>
                          )}
                          <canvas ref={canvasRef} className="hidden" />
                        </>
                      )}
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 px-4 z-10">
                        <button
                          onClick={stopCamera}
                          disabled={isCameraLoading}
                          className="px-6 py-3 bg-white text-gray-900 rounded-full font-medium shadow-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={capturePhoto}
                          disabled={isCameraLoading}
                          className="px-6 py-3 bg-gray-900 text-white rounded-full font-medium shadow-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Capture Photo
                        </button>
                      </div>
                    </div>
                  ) : currentImage ? (
                    <div className="relative w-full h-full group">
                      <img
                        src={currentImage}
                        alt={`ID Document ${currentSide}`}
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                        <button
                          onClick={handleRetake}
                          className="opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all duration-300 bg-white text-gray-900 px-6 py-3 rounded-full font-medium shadow-lg"
                        >
                          Retake Photo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6">
                      <svg className="w-24 h-24 text-gray-400 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Upload {currentSide} side
                      </h3>
                      <p className="text-sm text-gray-500 mb-6 text-center max-w-xs">
                        Drag & drop your document or choose a method below
                      </p>

                      <div className="flex gap-3 w-full max-w-sm">
                        <button
                          onClick={handleCameraClick}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-full font-medium transition-all"
                        >
                          <HiOutlineCamera className="w-5 h-5" />
                          <span>Take Photo</span>
                        </button>
                        <button
                          onClick={handleFileClick}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300 rounded-full font-medium transition-all"
                        >
                          <HiOutlinePhotograph className="w-5 h-5" />
                          <span>Choose File</span>
                        </button>
                      </div>

                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                      <input 
                        ref={cameraInputRef} 
                        type="file" 
                        accept="image/*" 
                        capture="environment" 
                        onChange={handleFileChange} 
                        className="hidden"
                        aria-label="Take photo with camera"
                      />
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Tips for best results</h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Ensure all information is clearly visible and readable</li>
                    <li>• Use good lighting and avoid shadows or glare</li>
                    <li>• Place document on a flat, contrasting surface</li>
                    <li>• Capture the entire document within the frame</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={handleContinue} 
                  disabled={!canContinue}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full py-3 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {currentSide === 'front' && needsBackSide && frontImage 
                    ? 'Continue to Back Side →' 
                    : currentSide === 'back' && backImage && frontImage
                    ? 'Continue'
                    : currentSide === 'back' && !backImage
                    ? 'Upload Back Side to Continue'
                    : 'Continue'}
                </Button>
                {currentImage && (
                  <button 
                    onClick={handleRetake}
                    className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-full font-medium"
                  >
                    Retake Photo
                  </button>
                )}
              </div>
              
              <p className="text-xs text-gray-500 text-center mt-3">Powered by Mira</p>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Fixed Button */}
      {!isCameraActive && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg">
          <div className="space-y-2">
            {currentImage ? (
              <>
                <Button 
                  onClick={handleContinue} 
                  disabled={!canContinue}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full py-3 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {currentSide === 'front' && needsBackSide && frontImage 
                    ? 'Continue to Back Side →' 
                    : currentSide === 'back' && backImage && frontImage
                    ? 'Continue'
                    : currentSide === 'back' && !backImage
                    ? 'Upload Back Side to Continue'
                    : 'Continue'}
                </Button>
                <button 
                  onClick={handleRetake}
                  className="w-full px-6 py-3 bg-gray-100 text-gray-900 rounded-full font-medium"
                >
                  Retake Photo
                </button>
              </> 
            ) : (
              isMobile ? (
                <Button 
                  onClick={handleNativeCamera}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full py-3 font-medium"
                >
                  Take Photo
                </Button>
              ) : (
                <Button 
                  onClick={handleCameraClick}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full py-3 font-medium"
                >
                  Take Photo
                </Button>
              )
            )}
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">Powered by Mira</p>
        </div>
      )}
    </div>
  )
}
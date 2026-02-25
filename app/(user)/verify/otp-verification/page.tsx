// 'use client'

// import { useState, useEffect, useRef } from 'react'
// import { useRouter } from 'next/navigation'
// import { Button } from '@/components/ui/Button'
// import { Header } from '@/components/layout/Header'
// import { ProgressBar } from '@/components/ui/ProgressBar'
// import { useAppContext } from '@/context/useAppContext'

// // API base URL - update this to your backend URL
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://xzfjrnv9-3902.asse.devtunnels.ms'

// // Send OTP to email
// const sendOTP = async (email: string): Promise<{ success: boolean; message?: string }> => {
//   try {
//     console.log('📧 Sending OTP to:', email)
//     const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ email })
//     })
    
//     console.log('📧 OTP Response Status:', response.status)
    
//     if (response.status === 429) {
//       const errorData = await response.json().catch(() => ({ message: 'Too many requests. Please wait before requesting again.' }))
//       console.error('❌ Rate limit exceeded:', errorData)
//       return { success: false, message: errorData.message || 'Too many requests. Please wait a moment and try again.' }
//     }
    
//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({ message: `Server error: ${response.status}` }))
//       console.error('❌ OTP Send Error:', errorData)
//       return { success: false, message: errorData.message || 'Failed to send OTP. Please try again.' }
//     }
    
//     const data = await response.json()
//     console.log('✅ OTP Sent Successfully:', data)
//     return data
//   } catch (error: any) {
//     console.error('❌ Error sending OTP:', error)
//     return { success: false, message: error.message || 'Failed to send OTP. Please try again.' }
//   }
// }

// // Verify OTP
// const verifyOTP = async (email: string, otp: string): Promise<{ success: boolean; message?: string }> => {
//   try {
//     console.log('🔐 Verifying OTP for:', email)
//     const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ email, otp })
//     })
    
//     console.log('🔐 OTP Verify Response Status:', response.status)
    
//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({ message: `Server error: ${response.status}` }))
//       console.error('❌ OTP Verify Error:', errorData)
//       return { success: false, message: errorData.message || 'Invalid OTP code. Please try again.' }
//     }
    
//     const data = await response.json()
//     console.log('✅ OTP Verified Successfully:', data)
//     return data
//   } catch (error: any) {
//     console.error('❌ Error verifying OTP:', error)
//     return { success: false, message: error.message || 'Failed to verify OTP. Please try again.' }
//   }
// }

// export default function OTPVerification() {
//   const router = useRouter()
//   const { state } = useAppContext()
//   const [otp, setOtp] = useState(['', '', '', '', '', ''])
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)
//   const [sendingOTP, setSendingOTP] = useState(false)
//   const [otpSent, setOtpSent] = useState(false)
//   const [resendTimer, setResendTimer] = useState(0)
//   const inputRefs = useRef<(HTMLInputElement | null)[]>([])

//   const email = state.personalInfo?.email || ''
//   const hasAutoSentRef = useRef(false)

//   useEffect(() => {
//     // Auto-send OTP when component mounts (only once)
//     if (email && !otpSent && !hasAutoSentRef.current) {
//       hasAutoSentRef.current = true
//       handleSendOTP()
//     }
//   }, [email])

//   useEffect(() => {
//     // Resend timer countdown
//     if (resendTimer > 0) {
//       const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
//       return () => clearTimeout(timer)
//     }
//   }, [resendTimer])

//   const handleSendOTP = async () => {
//     if (!email) {
//       setError('Email address is required')
//       return
//     }

//     setSendingOTP(true)
//     setError(null)

//     try {
//       const result = await sendOTP(email)
//       if (result.success) {
//         setOtpSent(true)
//         setResendTimer(60) // 60 seconds cooldown
//       } else {
//         setError(result.message || 'Failed to send OTP')
//       }
//     } catch (err: any) {
//       setError(err.message || 'Failed to send OTP. Please try again.')
//     } finally {
//       setSendingOTP(false)
//     }
//   }

//   const handleOtpChange = (index: number, value: string) => {
//     // Only allow digits
//     if (value && !/^\d$/.test(value)) return

//     const newOtp = [...otp]
//     newOtp[index] = value
//     setOtp(newOtp)
//     setError(null)

//     // Auto-focus next input
//     if (value && index < 5) {
//       inputRefs.current[index + 1]?.focus()
//     }
//   }

//   const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
//     // Handle backspace
//     if (e.key === 'Backspace' && !otp[index] && index > 0) {
//       inputRefs.current[index - 1]?.focus()
//     }
//   }

//   const handlePaste = (e: React.ClipboardEvent) => {
//     e.preventDefault()
//     const pastedData = e.clipboardData.getData('text').trim()
//     if (/^\d{6}$/.test(pastedData)) {
//       const newOtp = pastedData.split('')
//       setOtp(newOtp)
//       inputRefs.current[5]?.focus()
//     }
//   }

//   const handleVerify = async () => {
//     const otpString = otp.join('')
    
//     if (otpString.length !== 6) {
//       setError('Please enter the complete 6-digit OTP code')
//       return
//     }

//     setLoading(true)
//     setError(null)

//     try {
//       const result = await verifyOTP(email, otpString)
//       if (result.success) {
//         // OTP verified, proceed to review page (where submission happens)
//         console.log('✅ OTP verified, navigating to review page')
//         router.push('/verify/review')
//       } else {
//         setError(result.message || 'Invalid OTP code. Please try again.')
//         // Clear OTP on error
//         setOtp(['', '', '', '', '', ''])
//         inputRefs.current[0]?.focus()
//       }
//     } catch (err: any) {
//       setError(err.message || 'Failed to verify OTP. Please try again.')
//       setOtp(['', '', '', '', '', ''])
//       inputRefs.current[0]?.focus()
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <div className="min-h-screen bg-white md:bg-surface-gray flex flex-col">
//       <Header showBack title="Verify your email" />
//       <ProgressBar currentStep={4} totalSteps={6} />
//       <main className="flex-1 px-4 md:px-0 pt-6 pb-24 md:flex md:items-center md:justify-center">
//         <div className="w-full max-w-md md:bg-white md:rounded-2xl p-4 md:p-6 md:my-8 border-[2px] border-grey-400">
//           <div className="mb-2">
//             <p className="text-sm text-text-light">Check your email</p>
//           </div>

//           <div className="mb-8">
//             <h2 className="text-2xl font-bold text-text-primary mb-4">
//               Enter verification code
//             </h2>
//             <p className="text-sm text-text-secondary mb-6">
//               We've sent a 6-digit verification code to <span className="font-semibold text-text-primary">{email}</span>
//             </p>

//             <div className="mb-6">
//               <div className="flex gap-3 justify-center">
//                 {otp.map((digit, index) => (
//                   <input
//                     key={index}
//                     ref={(el) => { inputRefs.current[index] = el }}
//                     type="text"
//                     inputMode="numeric"
//                     maxLength={1}
//                     value={digit}
//                     onChange={(e) => handleOtpChange(index, e.target.value)}
//                     onKeyDown={(e) => handleKeyDown(index, e)}
//                     onPaste={handlePaste}
//                     className="w-12 h-14 text-center text-2xl font-bold border-2 border-surface-light rounded-lg focus:border-primary focus:outline-none transition-colors"
//                   />
//                 ))}
//               </div>
//               {error && (
//                 <p className="text-sm text-red-600 mt-3 text-center">{error}</p>
//               )}
//             </div>

//             <div className="text-center">
//               <p className="text-sm text-text-secondary mb-2">
//                 Didn't receive the code?
//               </p>
//               <button
//                 onClick={handleSendOTP}
//                 disabled={sendingOTP || resendTimer > 0}
//                 className="text-sm text-primary hover:underline disabled:text-text-light disabled:no-underline"
//               >
//                 {sendingOTP
//                   ? 'Sending...'
//                   : resendTimer > 0
//                   ? `Resend code in ${resendTimer}s`
//                   : 'Resend code'}
//               </button>
//             </div>
//           </div>

//           <div className="md:block fixed md:relative bottom-0 left-0 right-0 p-4 bg-white md:bg-transparent border-t md:border-t-0 border-surface-light">
//             <Button
//               onClick={handleVerify}
//               disabled={loading || otp.join('').length !== 6}
//               className="w-full"
//             >
//               {loading ? 'Verifying...' : 'Continue'}
//             </Button>
//             <p className="text-xs text-text-light text-center mt-2">Powered by Mira</p>
//           </div>
//         </div>
//       </main>
//     </div>
//   )
// }

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { useAppContext } from '@/context/useAppContext'
import { PoweredBy } from '@/components/verify/PoweredBy'

// API base URL - imported from centralized config
import { API_BASE_URL } from '../../../(public)/config'

// Note: Image conversion and submission is now handled in the review page

// Send OTP
const sendOTP = async (email: string): Promise<{ success: boolean; message?: string }> => {
  try {
    console.log('📧 Sending OTP to:', email)
    const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
    
    if (response.status === 429) {
      const errorData = await response.json().catch(() => ({ message: 'Too many requests.' }))
      return { success: false, message: errorData.message || 'Too many requests. Please wait.' }
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to send OTP' }))
      return { success: false, message: errorData.message || 'Failed to send OTP' }
    }
    
    const data = await response.json()
    console.log('✅ OTP Sent Successfully')
    return data
  } catch (error: any) {
    console.error('❌ Error sending OTP:', error)
    return { success: false, message: 'Failed to send OTP. Please try again.' }
  }
}

// Verify OTP
const verifyOTP = async (email: string, otp: string): Promise<{ success: boolean; message?: string }> => {
  try {
    console.log('🔐 Verifying OTP for:', email)
    const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Invalid OTP' }))
      return { success: false, message: errorData.message || 'Invalid OTP code' }
    }
    
    const data = await response.json()
    console.log('✅ OTP Verified Successfully')
    return data
  } catch (error: any) {
    console.error('❌ Error verifying OTP:', error)
    return { success: false, message: 'Failed to verify OTP. Please try again.' }
  }
}

// Note: KYC data submission is now handled in the review page
// after wallet connection and smart contract transaction

export default function OTPVerification() {
  const router = useRouter()
  const { state } = useAppContext()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sendingOTP, setSendingOTP] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const email = state.personalInfo?.email || ''
  const hasAutoSentRef = useRef(false)
  const displayEmail = email.trim()

  useEffect(() => {
    if (email && !otpSent && !hasAutoSentRef.current) {
      hasAutoSentRef.current = true
      handleSendOTP()
    }
  }, [email])

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mql = window.matchMedia('(min-width: 768px)')
    const prevHtmlOverflow = document.documentElement.style.overflowY
    const prevBodyOverflow = document.body.style.overflowY

    const applyDesktopScrollLock = () => {
      if (mql.matches) {
        document.documentElement.style.overflowY = 'hidden'
        document.body.style.overflowY = 'hidden'
      } else {
        document.documentElement.style.overflowY = prevHtmlOverflow
        document.body.style.overflowY = prevBodyOverflow
      }
    }

    applyDesktopScrollLock()

    if (mql.addEventListener) {
      mql.addEventListener('change', applyDesktopScrollLock)
      return () => {
        mql.removeEventListener('change', applyDesktopScrollLock)
        document.documentElement.style.overflowY = prevHtmlOverflow
        document.body.style.overflowY = prevBodyOverflow
      }
    }

    return () => {
      document.documentElement.style.overflowY = prevHtmlOverflow
      document.body.style.overflowY = prevBodyOverflow
    }
  }, [])

  const handleSendOTP = async () => {
    if (!email) {
      setError('Email address is required')
      return
    }

    setSendingOTP(true)
    setError(null)

    try {
      const result = await sendOTP(email)
      if (result.success) {
        setOtpSent(true)
        setResendTimer(60)
      } else {
        setError(result.message || 'Failed to send OTP')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP')
    } finally {
      setSendingOTP(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setError(null)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').trim()
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split('')
      setOtp(newOtp)
      inputRefs.current[5]?.focus()
    }
  }

  const handlePasteFromClipboard = async () => {
    try {
      const pastedData = (await navigator.clipboard.readText()).trim()
      if (/^\d{6}$/.test(pastedData)) {
        const newOtp = pastedData.split('')
        setOtp(newOtp)
        setError(null)
        inputRefs.current[5]?.focus()
      } else if (pastedData.length > 0) {
        setError('Clipboard must contain a 6-digit code')
      }
    } catch {
      setError('Could not access clipboard')
    }
  }

  const handleVerify = async () => {
    const otpString = otp.join('')
    
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit OTP code')
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('========================================')
      console.log('🔐 STEP 1: VERIFYING OTP')
      console.log('========================================')
      
      // Step 1: Verify OTP
      const otpResult = await verifyOTP(email, otpString)
      
      if (!otpResult.success) {
        setError(otpResult.message || 'Invalid OTP code')
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
        setLoading(false)
        return
      }

      console.log('✅ OTP verified successfully!\n')

      // Mark that user just completed OTP - they need to connect wallet now
      sessionStorage.setItem('justCompletedOTP', 'true')
      
      // After OTP verification, navigate to review page
      // The review page will handle wallet connection, transaction, and backend submission
      console.log('📍 Navigating to review page for wallet connection and submission...')
      router.push('/verify/review')
      
    } catch (err: any) {
      console.error('❌ Error:', err)
      setError(err.message || 'An error occurred. Please try again.')
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen bg-[#FFFFFF] flex flex-col overflow-hidden transform-none [zoom:1] [scale:1]">
      <div className="md:hidden px-4 pt-5 flex-shrink-0">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => router.push('/verify/enter-email')}
          className="h-8 w-8 inline-flex items-center justify-center text-[#828282] hover:text-[#000000] transition-colors"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      <main className="flex-1 w-full min-h-0 overflow-y-auto md:overflow-hidden flex flex-col items-center md:justify-center px-4 pt-3 pb-40 md:py-4 transform-none">
        <section className="hidden md:block text-center mb-3 md:mb-4 flex-shrink-0">
          <h1 className="text-[34px] md:text-[22px] leading-[1.2] font-bold text-[#000000]">Tell us about yourself</h1>
          <p className="mt-1 md:mt-1.5 text-[16px] md:text-[14px] leading-[1.5] font-normal text-[#828282]">
            We&apos;re required to collect this verify your identity.
          </p>
        </section>

        <div className="w-full max-w-[560px] md:max-w-[560px] md:border md:border-[#E8E8E9] md:rounded-[14px] md:px-5 md:py-4 flex-shrink-0">
          <h2 className="text-[24px] md:text-[16px] leading-[1.3] font-bold md:font-semibold text-[#000000] mb-1.5">
            Confirm Email
          </h2>
          <p className="text-[14px] md:text-[13px] leading-[1.35] font-normal text-[#828282] mb-3 md:mb-4">
            Please enter the confirmation code sent to your email. This code will expire in two hours.
          </p>

          <div className="inline-flex items-center gap-2 bg-[#E8E8E9] rounded-[12px] md:rounded-[10px] px-4 py-2 mb-4">
            <span className="text-[14px] md:text-[13px] leading-none font-normal text-[#000000] truncate max-w-[200px] md:max-w-[280px]">{displayEmail}</span>
            <svg className="h-4 w-4 text-[#000000] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
            </svg>
          </div>

          <div className="mb-3">
            <div className="flex items-center gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  disabled={loading}
                  className={`w-[50px] h-[74px] md:w-[32px] md:h-[44px] text-center text-[24px] md:text-[14px] font-semibold rounded-[12px] md:rounded-[8px] border-2 transition-colors focus:outline-none ${
                    index === 0
                      ? 'border-[#6D3CCC] bg-[#E8E8E9] text-[#000000]'
                      : 'border-transparent bg-[#E8E8E9] text-[#000000]'
                  }`}
                />
              ))}
            </div>
            {error && (
              <p className="text-sm text-red-600 mt-2">{error}</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => void handlePasteFromClipboard()}
            className="text-[14px] md:text-[13px] font-normal md:font-semibold text-[#000000] hover:text-[#6D3CCC] transition-colors"
          >
            Paste from clipboard
          </button>

          <div className="hidden md:flex flex-col mt-4 space-y-2">
            <Button
              onClick={() => void handleVerify()}
              disabled={loading || otp.join('').length !== 6}
              className="h-[44px] !rounded-[10px] !bg-[#6D3CCC] hover:!bg-[#8558D9] focus:!bg-[#6D3CCC] focus:!ring-0 focus:!ring-offset-0 active:!bg-[#6D3CCC] disabled:!bg-[#6D3CCC] disabled:opacity-100 !text-white disabled:!text-white text-[14px] font-semibold"
            >
              {loading ? 'Checking...' : 'Go to email'}
            </Button>
            <Button
              onClick={() => void handleSendOTP()}
              disabled={sendingOTP || resendTimer > 0 || loading}
              className="h-[44px] !rounded-[10px] !bg-[#E8E8E9] hover:!bg-[#E8E8E9] focus:!bg-[#E8E8E9] active:!bg-[#E8E8E9] disabled:!bg-[#E8E8E9] disabled:opacity-100 !text-[#000000] disabled:!text-[#000000] text-[14px] font-semibold"
            >
              {resendTimer > 0 ? `Resend email (${resendTimer}s)` : 'Resend email'}
            </Button>

            <button
              type="button"
              onClick={() => router.push('/verify/enter-email')}
              className="flex items-center justify-center gap-2 text-[#828282] text-[13px] leading-none font-normal mt-4 mx-auto hover:text-[#000000] transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
              </svg>
              Back to Previous
            </button>
          </div>
        </div>
      </main>
      <PoweredBy />
      <div className="md:hidden fixed bottom-0 left-0 right-0 px-4 pb-4 pt-2 bg-gradient-to-t from-[#FFFFFF] to-transparent">
        <div className="space-y-3">
          <Button
            onClick={() => void handleVerify()}
            disabled={loading || otp.join('').length !== 6}
            className="h-[68px] !rounded-[14px] !bg-[#6D3CCC] hover:!bg-[#8558D9] focus:!bg-[#6D3CCC] focus:!ring-0 focus:!ring-offset-0 active:!bg-[#6D3CCC] disabled:!bg-[#6D3CCC] disabled:opacity-100 !text-white disabled:!text-white text-[16px] font-semibold"
          >
            {loading ? 'Checking...' : 'Go to email'}
          </Button>
          <Button
            onClick={() => void handleSendOTP()}
            disabled={sendingOTP || resendTimer > 0 || loading}
            className="h-[68px] !rounded-[14px] !bg-[#E8E8E9] hover:!bg-[#E8E8E9] focus:!bg-[#E8E8E9] active:!bg-[#E8E8E9] disabled:!bg-[#E8E8E9] disabled:opacity-100 !text-[#000000] disabled:!text-[#000000] text-[16px] font-semibold"
          >
            {resendTimer > 0 ? `Resend email (${resendTimer}s)` : 'Resend email'}
          </Button>
        </div>
      </div>
    </div>
  )
}

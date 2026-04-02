'use client'

import { useMemo, useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { useAppContext } from '@/context/useAppContext'
import { clearKYCCache, clearAllKYCCaches } from '@/app/(public)/utils/kyc-cache'

export default function VerificationComplete() {
  const { state, dispatch } = useAppContext()
  const [transactionHash, setTransactionHash] = useState<string | null>(null)

  const qrDots = useMemo(() => {
    // Deterministic pattern (avoids hydration mismatches).
    return Array.from({ length: 100 }).map((_, i) => {
      const v = (i * 17 + 11) % 29
      return v < 14
    })
  }, [])
  
  useEffect(() => {
    // Get transaction hash from localStorage
    const hash = localStorage.getItem('kycTransactionHash')
    if (hash) {
      setTransactionHash(hash)
    }
    
    // Clear KYC data when KYC is successfully completed
    const clearData = async () => {
      console.log('🧹 Clearing KYC data - KYC successfully completed')
      
      // Set clear flag immediately to prevent AppProvider from restoring
      if (typeof window !== 'undefined') {
        localStorage.setItem('kyc_data_cleared', Date.now().toString())
      }
      
      // Clear all documents and personal info from state
      dispatch({ type: 'CLEAR_KYC_DATA' })
      
      // Clear all caches to ensure no old documents remain
      try {
        await clearAllKYCCaches()
        console.log('✅ All KYC caches cleared after successful completion')
      } catch (error) {
        console.error('Failed to clear all KYC caches:', error)
        // Fallback: try to clear with specific email/userId if available
        const email = state.personalInfo?.email
        const userId = state.user?.id || state.user?.anonymousId
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
  }, [])

  const anonymousId = state.idNumber 
    ? `AID-${state.idNumber.slice(0, 4)}-${state.idNumber.slice(4, 8)}-${state.idNumber.slice(8, 12)}-${state.idNumber.slice(12)}`
    : 'AID-4278-8818-2637-3231'
  
  // Get explorer URL based on network (adjust based on your network)
  const getExplorerUrl = (hash: string) => {
    // Default to Etherscan - adjust based on your network
    return `https://etherscan.io/tx/${hash}`
  }

  const handleDownload = () => {
    // Create a canvas to generate the ID card image
    const canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 500
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      // Draw background
      ctx.fillStyle = '#1A202C'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Draw text
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 32px Inter'
      ctx.fillText('Digital Identity', 40, 60)
      
      ctx.font = '16px Inter'
      ctx.fillStyle = '#10B981'
      ctx.fillText('Verified by Blockchain', 40, 100)
      
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 24px Inter'
      ctx.fillText(anonymousId, 40, 200)
      
      ctx.font = '14px Inter'
      ctx.fillText('Blockchain: BSC Mainnet', 40, 250)
      ctx.fillText('Verified: Oct 24, 2025', 40, 280)
      
      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `KYX-ID-${anonymousId}.png`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }
      }, 'image/png')
    }
  }

  const handleShare = async () => {
    const shareData = {
      title: 'KYX Platform - Digital Identity',
      text: `My anonymous ID: ${anonymousId}`,
      url: window.location.href,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(
          `KYX Platform - Digital Identity\nAnonymous ID: ${anonymousId}\nBlockchain: Mira-20\nVerified: Oct 24, 2025`
        )
        alert('Information copied to clipboard!')
      }
    } catch (error) {
      // User cancelled or error occurred
      console.log('Share cancelled or failed')
    }
  }

  return (
    <div className="min-h-screen h-[100dvh] md:h-screen bg-white flex flex-col overflow-hidden">
      {/* Non-scroll layout that matches the reference screen */}
      <main className="flex-1 w-full min-h-0 overflow-hidden flex flex-col items-center md:justify-center px-5 pt-4 pb-5 md:py-6">
        <div className="w-full max-w-[560px] md:max-w-[600px] mb-1">
          <button
            type="button"
            aria-label="Go back"
            onClick={() => window.history.back()}
            className="h-8 w-8 inline-flex items-center justify-center text-[#000000] hover:opacity-80 transition-opacity"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>

        {/* Header illustration */}
        <div className="w-full max-w-[560px] md:max-w-[600px] flex flex-col items-center">
          <div className="w-[96px] h-[64px] md:w-[140px] md:h-[92px] mb-1 flex items-center justify-center">
            {/* Simple illustration (card + badge) */}
            <svg viewBox="0 0 120 80" className="w-full h-full">
              <path d="M15 55L60 30l45 25-45 25-45-25z" fill="#EAF6C7" />
              <path d="M18 55l42 23 42-23" fill="none" stroke="#B7D67A" strokeWidth="3" strokeLinejoin="round" />
              <rect x="34" y="22" width="52" height="32" rx="6" fill="#A7D80D" />
              <circle cx="48" cy="38" r="6" fill="#FFFFFF" opacity="0.85" />
              <rect x="58" y="31" width="20" height="4" rx="2" fill="#FFFFFF" opacity="0.8" />
              <rect x="58" y="39" width="24" height="4" rx="2" fill="#FFFFFF" opacity="0.8" />
              <circle cx="83" cy="46" r="8" fill="#F4C94C" />
              <path d="M83 41v7" stroke="#000" strokeWidth="2" strokeLinecap="round" />
              <circle cx="83" cy="51" r="1.2" fill="#000" />
            </svg>
          </div>

          <h1 className="text-[22px] md:text-[24px] font-bold leading-[110%] text-[#000000] text-center">
            Verification pending
          </h1>
          <p className="mt-0 text-[13px] md:text-[13px] text-[#545454] text-center">
            Your anonymous ID has been created
          </p>
        </div>

        {/* Card */}
        <div className="w-full max-w-[560px] md:max-w-[600px] md:border md:border-[#E8E8E9] md:rounded-[14px] md:shadow-sm mt-3 px-0 md:px-6 md:py-5">
          <div className="bg-[#D9D9D9] rounded-[16px] overflow-hidden p-3 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] md:text-[12px] text-[#545454] leading-tight">
                  Digital Identity
                  <br />
                  Verified by Blockchain
                </p>
                <div className="mt-2.5">
                  <p className="text-[11px] md:text-[12px] font-semibold text-[#545454]">Anonymous ID</p>
                  <p className="mt-0.5 text-[12px] md:text-[14px] font-medium text-[#000000]">{anonymousId}</p>
                </div>
                <div className="mt-2.5 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] md:text-[12px] font-semibold text-[#545454]">Blockchain</p>
                    <p className="mt-0.5 text-[12px] md:text-[13px] text-[#000000]">Mira-20</p>
                  </div>
                  <div>
                    <p className="text-[11px] md:text-[12px] font-semibold text-[#545454]">Verified</p>
                    <p className="mt-0.5 text-[12px] md:text-[13px] text-[#000000]">Oct 24, 2025</p>
                  </div>
                </div>
              </div>

              {/* Check badge */}
              <div className="flex-shrink-0 mt-1">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#EDEDED] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#FFFFFF]" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2l3 3.5L20 6l-1 5 3 3-3 3 1 5-5-.5L12 22l-3-3.5L4 18l1-5-3-3 3-3-1-5 5 .5L12 2z" fill="#BDBDBD" />
                    <path d="M9.5 12.5l1.8 1.8 3.6-4" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>

            {/* QR card */}
            <div className="mt-2.5 bg-white rounded-[16px] p-3 md:p-6 flex items-center justify-center">
              <div className="w-[120px] h-[120px] md:w-[210px] md:h-[210px] bg-[#A7D80D] rounded-[10px] grid grid-cols-10 gap-1 p-2">
                {qrDots.map((on, i) => (
                  <div key={i} className={`w-full h-full rounded-full ${on ? 'bg-white' : 'bg-white/30'}`} />
                ))}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-3 md:mt-5 grid grid-cols-1 md:grid-cols-2 gap-2.5 md:gap-4">
            <button
              type="button"
              onClick={handleShare}
              className="w-full h-[50px] md:h-[56px] rounded-[14px] bg-[#E0E0E0] hover:bg-[#D5D5D5] text-[#000000] text-[15px] md:text-[16px] font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              Share
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="w-full h-[50px] md:h-[56px] rounded-[14px] bg-[#A7D80D] hover:bg-[#9BC90C] text-[#000000] text-[15px] md:text-[16px] font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v10m0 0l4-4m-4 4l-4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
              </svg>
              Download
            </button>
          </div>

          {/* Desktop back link */}
          <button
            type="button"
            onClick={() => window.history.back()}
            className="hidden md:block w-full text-center mt-6 text-[#545454] text-[14px] font-normal hover:text-[#000000] transition-colors"
          >
            ← Back to Previous
          </button>
        </div>
      </main>
    </div>
  )
}


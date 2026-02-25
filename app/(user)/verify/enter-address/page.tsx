'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { useAppContext } from '@/context/useAppContext'
import { PoweredBy } from '@/components/verify/PoweredBy'

type GeocodeSuggestion = {
  display_name: string
  lat: string
  lon: string
  address?: {
    road?: string
    house_number?: string
    city?: string
    town?: string
    village?: string
    postcode?: string
  }
}

/** Composes the four address fields into a single string sent to the backend as personalInfo.address */
function composeAddress(line1: string, line2: string, city: string, postalCode: string): string {
  const parts = [line1.trim(), line2.trim(), city.trim(), postalCode.trim()].filter(Boolean)
  return parts.join(', ')
}

export default function EnterAddressPage() {
  const router = useRouter()
  const { state, dispatch } = useAppContext()
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const searchSuggestions = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    try {
      const countryParam = state.selectedCountry ? `&country=${state.selectedCountry}` : ''
      const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(query)}${countryParam}`)
      if (!res.ok) return
      const data = await res.json()
      if (data.error || !Array.isArray(data)) {
        setSuggestions([])
        return
      }
      setSuggestions(data)
      setShowSuggestions(true)
    } catch {
      setSuggestions([])
    }
  }, [state.selectedCountry])

  useEffect(() => {
    const t = setTimeout(() => {
      if (addressLine1.trim().length >= 2) searchSuggestions(addressLine1)
      else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 200)
    return () => clearTimeout(t)
  }, [addressLine1, searchSuggestions])

  const handleSelectSuggestion = (s: GeocodeSuggestion) => {
    const addr = s.address
    if (addr) {
      const street = [addr.house_number, addr.road].filter(Boolean).join(' ').trim()
      setAddressLine1(street || s.display_name)
      if (addr.city) setCity(addr.city)
      else if (addr.town) setCity(addr.town)
      else if (addr.village) setCity(addr.village)
      if (addr.postcode) setPostalCode(addr.postcode)
    } else {
      setAddressLine1(s.display_name)
    }
    setShowSuggestions(false)
    setSuggestions([])
  }

  const handleContinue = () => {
    setError(null)
    const line1 = addressLine1.trim()
    const line3 = city.trim()
    const line4 = postalCode.trim()
    if (!line1) {
      setError('Please enter your address')
      return
    }
    if (!line3) {
      setError('Please enter your city')
      return
    }
    if (!line4) {
      setError('Please enter your postal code')
      return
    }
    setLoading(true)
    const current = state.personalInfo || {
      firstName: '',
      lastName: '',
      fatherName: '',
      idNumber: '',
      email: '',
      phone: '',
      address: '',
    }
    const address = composeAddress(addressLine1, addressLine2, city, postalCode)
    dispatch({
      type: 'SET_PERSONAL_INFO',
      payload: {
        ...current,
        address,
        addressLine1: line1,
        addressLine2: addressLine2.trim() || undefined,
        city: line3,
        postalCode: line4,
      },
    })
    setLoading(false)
    router.push('/verify/documents')
  }

  const canProceed =
    addressLine1.trim().length > 0 && city.trim().length > 0 && postalCode.trim().length > 0

  useEffect(() => {
    const p = state.personalInfo
    if (p?.addressLine1) setAddressLine1(p.addressLine1)
    if (p?.addressLine2) setAddressLine2(p.addressLine2)
    if (p?.city) setCity(p.city)
    if (p?.postalCode) setPostalCode(p.postalCode)
  }, [state.personalInfo?.addressLine1, state.personalInfo?.addressLine2, state.personalInfo?.city, state.personalInfo?.postalCode])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia('(min-width: 768px)')
    const prevHtml = document.documentElement.style.overflowY
    const prevBody = document.body.style.overflowY
    const apply = () => {
      if (mql.matches) {
        document.documentElement.style.overflowY = 'hidden'
        document.body.style.overflowY = 'hidden'
      } else {
        document.documentElement.style.overflowY = prevHtml
        document.body.style.overflowY = prevBody
      }
    }
    apply()
    mql.addEventListener?.('change', apply)
    return () => {
      mql.removeEventListener?.('change', apply)
      document.documentElement.style.overflowY = prevHtml
      document.body.style.overflowY = prevBody
    }
  }, [])

  const inputClass =
    'w-full h-[48px] md:h-[46px] rounded-[12px] md:rounded-[10px] border border-transparent bg-[#E8E8E9] placeholder:text-[#828282] text-[#000000] text-[14px] md:text-[16px] px-4 focus:outline-none focus:ring-0 focus:border-transparent'

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col">
      <div className="md:hidden px-4 pt-5">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => router.push('/verify/enter-dob')}
          className="h-8 w-8 inline-flex items-center justify-center text-[#828282] hover:text-[#000000] transition-colors"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      <main className="flex-1 flex flex-col items-center md:justify-start px-4 pt-3 pb-28 md:pt-6 md:pb-6 md:min-h-0">
        <section className="hidden md:block text-center mb-3 md:mb-4">
          <h1 className="text-[34px] leading-tight font-bold text-[#000000]">Tell us about yourself</h1>
          <p className="mt-1 text-[16px] leading-[1.5] font-normal text-[#828282]">
            We&apos;re required to collect this verify your identity.
          </p>
        </section>

        <div className="w-full max-w-[760px] md:bg-transparent md:border-2 md:border-[#E8E8E9] md:rounded-[14px] md:px-5 md:py-4">
          <h2 className="md:hidden text-[24px] leading-[1.3] font-bold text-[#000000] mb-2">
            Address
          </h2>
          <label className="hidden md:block text-[16px] md:text-[18px] leading-[1.4] font-semibold text-[#000000] mb-1">
            Address
          </label>
          <p className="text-[14px] md:text-[16px] leading-[1.4] font-normal text-[#828282] mb-3">
            What is your residential address?
          </p>

          <div className="space-y-3 md:space-y-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Address"
                value={addressLine1}
                onChange={(e) => {
                  setAddressLine1(e.target.value)
                  setError(null)
                }}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canProceed && !loading) handleContinue()
                }}
                className={inputClass}
                autoComplete="off"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-[#E8E8E9] rounded-[10px] shadow-lg max-h-60 overflow-y-auto">
                  {suggestions.map((s, i) => (
                    <button
                      key={`${s.lat}-${s.lon}-${i}`}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelectSuggestion(s)}
                      className="w-full px-4 py-3 text-left hover:bg-[#E8E8E9] text-[14px] md:text-[16px] text-[#000000] border-b border-[#E8E8E9] last:border-b-0"
                    >
                      {s.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Apt, Suite, Unit, Building"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canProceed && !loading) handleContinue()
                }}
                className={`${inputClass} pr-14`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] md:text-[11px] text-[#828282] pointer-events-none">
                Optional
              </span>
            </div>

            <input
              type="text"
              placeholder="City"
              value={city}
              onChange={(e) => {
                setCity(e.target.value)
                setError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canProceed && !loading) handleContinue()
              }}
              className={inputClass}
            />

            <input
              type="text"
              placeholder="Postal code"
              value={postalCode}
              onChange={(e) => {
                setPostalCode(e.target.value)
                setError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canProceed && !loading) handleContinue()
              }}
              className={inputClass}
            />
          </div>

          {error && (
            <div className="mb-2 mt-2 md:mb-1 md:mt-1">
              <p className="text-sm md:text-base text-red-600">{error}</p>
            </div>
          )}

          <div className="md:hidden mt-6">
            <p className="text-[14px] leading-[1.5] font-normal text-[#828282]">
              We&apos;re required to collect this verify your identity.
            </p>
          </div>

          <div className="hidden md:block mt-4">
            <Button
              onClick={() => void handleContinue()}
              disabled={loading || !canProceed}
              className="h-[48px] !rounded-[12px] !bg-[#6D3CCC] hover:!bg-[#8558D9] focus:!bg-[#6D3CCC] focus:!ring-0 focus:!ring-offset-0 active:!bg-[#6D3CCC] disabled:!bg-[#6D3CCC] disabled:opacity-100 !text-white disabled:!text-white text-[16px] font-semibold"
            >
              {loading ? 'Saving...' : 'Continue'}
            </Button>
            <button
              type="button"
              onClick={() => router.push('/verify/enter-dob')}
              className="flex items-center justify-center gap-2 text-[#828282] text-[14px] leading-none font-normal mt-4 mx-auto hover:text-[#000000] transition-colors"
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
        <Button
          onClick={() => void handleContinue()}
          disabled={loading || !canProceed}
          className="h-[48px] !rounded-[14px] !bg-[#6D3CCC] hover:!bg-[#8558D9] focus:!bg-[#6D3CCC] focus:!ring-0 focus:!ring-offset-0 active:!bg-[#6D3CCC] disabled:!bg-[#6D3CCC] disabled:opacity-100 !text-white disabled:!text-white font-semibold text-[16px]"
        >
          {loading ? 'Saving...' : 'Continue'}
        </Button>
      </div>
    </div>
  )
}

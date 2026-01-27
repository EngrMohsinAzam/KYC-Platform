'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { Header } from '@/components/layout/Header'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Footer } from '@/components/layout/Footer'
import { useAppContext } from '@/context/useAppContext'
import { getCountryOptions, getCitiesForCountry } from '@/app/(public)/utils/countries'
import { getKycPausedStatus } from '@/app/api/api'

// All available ID types
const allIdTypes = [
  { value: 'passport', label: 'Passport' },
  { value: 'national-id', label: 'National ID Card' },
  { value: 'drivers-license', label: "Driver's License" },
]

// Countries WITHOUT mandatory National ID Cards
// These countries should only show Passport and Driver's License
// Based on KYC/compliance standards - countries that don't issue mandatory national ID cards
const countriesWithoutIdCard = [
  'us',      // United States - uses SSN, no mandatory ID card
  'ca',      // Canada - uses provincial IDs, no mandatory national ID
  'uk',      // United Kingdom - uses passport/driving license, no mandatory ID card
  'au',      // Australia - uses Medicare/Driver License, no mandatory ID card
  'nz',      // New Zealand - uses passport-based system, no mandatory ID card
  'jp',      // Japan - has "My Number" but ID card not mandatory
]

export default function SelectIdType() {
  const router = useRouter()
  const { state, dispatch } = useAppContext()
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [idType, setIdType] = useState('')
  const [countrySearch, setCountrySearch] = useState('')
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [citySearch, setCitySearch] = useState('')
  const [showCityDropdown, setShowCityDropdown] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [pausedMessage, setPausedMessage] = useState<string | null>(null)

  const countryOptions = getCountryOptions()
  const cityOptions = country ? getCitiesForCountry(country) : []
  
  // Filter ID types based on selected country
  // If country doesn't have mandatory ID cards, exclude "National ID Card"
  const availableIdTypes = country && countriesWithoutIdCard.includes(country)
    ? allIdTypes.filter(type => type.value !== 'national-id')
    : allIdTypes
  
  // Filter countries based on search - show all when empty, filter when typing
  const filteredCountries = countrySearch
    ? countryOptions.filter(option =>
        option.label.toLowerCase().includes(countrySearch.toLowerCase())
      )
    : countryOptions

  // Filter cities based on search - show all when empty, filter when typing
  const filteredCities = citySearch
    ? cityOptions.filter(option =>
        option.label.toLowerCase().includes(citySearch.toLowerCase())
      )
    : cityOptions

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768
      setIsMobile(isMobileDevice)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Guard: prevent entering KYC flow if paused
  useEffect(() => {
    const checkPaused = async () => {
      try {
        const res = await getKycPausedStatus()
        const paused = !!(res?.data?.kycPaused ?? (res as any)?.kycPaused)
        if (paused) {
          setPausedMessage('KYC process has been stopped for a specific reason. We’ll let you know when you can come back.')
        }
      } catch {
        // don't hard-block on network error
      }
    }
    checkPaused()
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showCountryDropdown && !target.closest('.country-selector')) {
        setShowCountryDropdown(false)
      }
      if (showCityDropdown && !target.closest('.city-selector')) {
        setShowCityDropdown(false)
      }
    }
    if (showCountryDropdown || showCityDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCountryDropdown, showCityDropdown])

  // Reset city when country changes (only when country changes, not when idType changes)
  useEffect(() => {
    if (country) {
      setCity('')
      setCitySearch('') // Clear city search when country changes
      dispatch({ type: 'SET_COUNTRY', payload: country })
      setCountrySearch('') // Clear search when country is selected
      setShowCountryDropdown(false) // Close dropdown
      setShowCityDropdown(false) // Close city dropdown
    }
  }, [country, dispatch])

  // Update city in context when it changes
  useEffect(() => {
    if (city) {
      dispatch({ type: 'SET_CITY', payload: city })
    }
  }, [city, dispatch])

  // Clear ID type if it's no longer valid for the selected country
  useEffect(() => {
    if (country && idType) {
      const newAvailableIdTypes = countriesWithoutIdCard.includes(country)
        ? allIdTypes.filter(type => type.value !== 'national-id')
        : allIdTypes
      
      if (!newAvailableIdTypes.find(type => type.value === idType)) {
        setIdType('')
        dispatch({ type: 'SET_ID_TYPE', payload: '' })
      }
    } else if (!country && idType) {
      // If country is cleared, also clear ID type
      setIdType('')
      dispatch({ type: 'SET_ID_TYPE', payload: '' })
    }
  }, [country, idType, dispatch])

  // Update city in context when it changes
  useEffect(() => {
    if (city) {
      dispatch({ type: 'SET_CITY', payload: city })
    }
  }, [city, dispatch])

  const handleNext = () => {
    if (pausedMessage) return
    dispatch({ type: 'SET_COUNTRY', payload: country })
    if (city) {
      dispatch({ type: 'SET_CITY', payload: city })
    }
    dispatch({ type: 'SET_ID_TYPE', payload: idType })
    router.push('/verify/resident-selection')
  }

  const canProceed = country && city && idType

  return (
    <div className="min-h-screen h-screen bg-white flex flex-col overflow-hidden">
      {/* Mobile Header - Simple back and close */}
      <div className="md:hidden">
        <Header showBack showClose />
      </div>
      
      {/* Desktop Header - with progress bar */}
      <div className="hidden md:block">
        <Header showBack showClose />
        <ProgressBar currentStep={1} totalSteps={5} />
      </div>
      
      {/* Scrollable main content area */}
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full md:flex md:items-center md:justify-center md:py-8">
          {/* Mobile Design - Full screen, no card */}
          <div className="md:hidden h-full flex flex-col px-4 pt-6 pb-24">
            {pausedMessage && (
              <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-yellow-900">KYC temporarily paused</p>
                <p className="text-sm text-yellow-800 mt-1">{pausedMessage}</p>
                <button onClick={() => router.push('/')} className="mt-3 text-sm font-medium text-gray-900 underline">
                  Back to home
                </button>
              </div>
            )}
            {/* Title */}
            <h1 className="text-2xl font-semibold text-gray-900 mb-8">
              Select ID type
            </h1>

            {/* Form Fields */}
            <div className="flex-1 space-y-6">
              {/* Country/region of residence - Mobile with search */}
              <div className="country-selector">
                <label className="block text-sm font-normal text-gray-700 mb-2">
                  Country/region of residence
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={(() => {
                      if (countrySearch) return countrySearch
                      if (country) {
                        const selectedCountry = countryOptions.find(c => c.value === country)
                        return selectedCountry?.label || ''
                      }
                      return ''
                    })()}
                    onChange={(e) => {
                      setCountrySearch(e.target.value)
                      setShowCountryDropdown(true)
                      if (!e.target.value) {
                        setCountry('')
                      }
                    }}
                    onFocus={() => {
                      setShowCountryDropdown(true)
                      // Clear search on focus to show all countries for easy searching/changing
                      setCountrySearch('')
                    }}
                    placeholder="Type to search country..."
                    className="w-full px-4 py-3 rounded-button border border-gray-300 bg-surface-light text-text-primary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
                  />
                  {country && (
                    <button
                      onClick={() => {
                        setCountry('')
                        setCountrySearch('')
                        setCity('')
                      }}
                      className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  <svg
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  
                  {/* Dropdown list */}
                  {showCountryDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowCountryDropdown(false)}
                      />
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                        {filteredCountries.length > 0 ? (
                          filteredCountries.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                setCountry(option.value)
                                setCountrySearch(option.label)
                                setShowCountryDropdown(false)
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              {option.label}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-gray-500 text-center">
                            No countries found
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

               {/* City/Region - Shows when country is selected - Mobile with search */}
              {country && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300 city-selector">
                  <label className="block text-sm font-normal text-gray-700 mb-2">
                    City
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={(() => {
                        if (citySearch) return citySearch
                        if (city) {
                          const selectedCity = cityOptions.find(c => c.value === city)
                          return selectedCity?.label || ''
                        }
                        return ''
                      })()}
                      onChange={(e) => {
                        setCitySearch(e.target.value)
                        setShowCityDropdown(true)
                        if (!e.target.value) {
                          setCity('')
                        }
                      }}
                      onFocus={() => {
                        setShowCityDropdown(true)
                        // Clear search on focus to show all cities for easy searching/changing
                        setCitySearch('')
                      }}
                      placeholder="Type to search city..."
                      className="w-full px-4 py-3 rounded-button border border-gray-300 bg-surface-light text-text-primary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
                    />
                    {city && (
                      <button
                        onClick={() => {
                          setCity('')
                          setCitySearch('')
                        }}
                        className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                    <svg
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    
                    {/* City Dropdown list */}
                    {showCityDropdown && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowCityDropdown(false)}
                        />
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                          {filteredCities.length > 0 ? (
                            filteredCities.map((option) => (
                              <button
                                key={option.value}
                                onClick={() => {
                                  setCity(option.value)
                                  setCitySearch(option.label)
                                  setShowCityDropdown(false)
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                              >
                                {option.label}
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-gray-500 text-center">
                              No cities found
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ID type with red asterisk */}
              <div>
                <label className="block text-sm font-normal text-gray-700 mb-2">
                  ID type
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <Select
                  placeholder={country ? "Select ID type" : "Select country first"}
                  options={availableIdTypes}
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  disabled={!country}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Desktop Design - Card with all fields */}
          <div className="hidden md:block w-full max-w-md lg:max-w-2xl px-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
              {pausedMessage && (
                <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-yellow-900">KYC temporarily paused</p>
                  <p className="text-sm text-yellow-800 mt-1">{pausedMessage}</p>
                  <button onClick={() => router.push('/')} className="mt-3 text-sm font-medium text-gray-900 underline">
                    Back to home
                  </button>
                </div>
              )}
              {/* Title - Desktop */}
              <div className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                  Select ID type
                </h1>
                <p className="text-gray-600 text-sm">
                  Choose your country, city, and the type of ID you&apos;ll be verifying
                </p>
              </div>

              <div className="space-y-6 mb-8">
                {/* Country/region of residence - Desktop with search */}
                <div className="country-selector">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Country/region of residence
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={(() => {
                        if (countrySearch) return countrySearch
                        if (country) {
                          const selectedCountry = countryOptions.find(c => c.value === country)
                          return selectedCountry?.label || ''
                        }
                        return ''
                      })()}
                      onChange={(e) => {
                        setCountrySearch(e.target.value)
                        setShowCountryDropdown(true)
                        if (!e.target.value) {
                          setCountry('')
                        }
                      }}
                      onFocus={() => {
                        setShowCountryDropdown(true)
                        // Clear search on focus to show all countries for easy searching/changing
                        setCountrySearch('')
                      }}
                      placeholder="Type to search country..."
                      className="w-full px-4 py-3 rounded-button border border-gray-300 bg-surface-light text-text-primary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
                    />
                    {country && (
                      <button
                        onClick={() => {
                          setCountry('')
                          setCountrySearch('')
                          setCity('')
                          setCitySearch('')
                        }}
                        className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                    <svg
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    
                    {/* Country Dropdown list */}
                    {showCountryDropdown && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowCountryDropdown(false)}
                        />
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                          {filteredCountries.length > 0 ? (
                            filteredCountries.map((option) => (
                              <button
                                key={option.value}
                                onClick={() => {
                                  setCountry(option.value)
                                  setCountrySearch(option.label)
                                  setShowCountryDropdown(false)
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                              >
                                {option.label}
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-gray-500 text-center">
                              No countries found
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                 {/* City - Desktop with search - Shows when country is selected */}
                 {country && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300 city-selector">
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      City
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={(() => {
                          if (citySearch) return citySearch
                          if (city) {
                            const selectedCity = cityOptions.find(c => c.value === city)
                            return selectedCity?.label || ''
                          }
                          return ''
                        })()}
                        onChange={(e) => {
                          setCitySearch(e.target.value)
                          setShowCityDropdown(true)
                          if (!e.target.value) {
                            setCity('')
                          }
                        }}
                        onFocus={() => {
                          setShowCityDropdown(true)
                          // Clear search on focus to show all cities for easy searching/changing
                          setCitySearch('')
                        }}
                        placeholder="Type to search city..."
                        className="w-full px-4 py-3 rounded-button border border-gray-300 bg-surface-light text-text-primary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
                      />
                      {city && (
                        <button
                          onClick={() => {
                            setCity('')
                            setCitySearch('')
                          }}
                          className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                      <svg
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      
                      {/* City Dropdown list */}
                      {showCityDropdown && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowCityDropdown(false)}
                          />
                          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                            {filteredCities.length > 0 ? (
                              filteredCities.map((option) => (
                                <button
                                  key={option.value}
                                  onClick={() => {
                                    setCity(option.value)
                                    setCitySearch(option.label)
                                    setShowCityDropdown(false)
                                  }}
                                  className="w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                                >
                                  {option.label}
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-gray-500 text-center">
                                No cities found
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    ID type
                  </label>
                  <Select
                    placeholder={country ? "Select ID type" : "Select country first"}
                    options={availableIdTypes}
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    disabled={!country}
                  />
                </div>
              </div>

              {/* Desktop button */}
              <Button
                onClick={handleNext}
                disabled={!canProceed || !!pausedMessage}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full py-3 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile fixed button at bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <Button
          onClick={handleNext}
          disabled={!canProceed || !!pausedMessage}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full py-3 font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Next
        </Button>
      </div>
    </div>
  )
}
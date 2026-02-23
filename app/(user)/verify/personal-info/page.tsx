'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useAppContext } from '@/context/useAppContext'
import { getCountryByValue, getCountryOptions } from '@/app/(public)/utils/countries'
import { LoadingDots } from '@/components/ui/LoadingDots'

export default function PersonalInfo() {
  const router = useRouter()
  const { state, dispatch } = useAppContext()
  
  const [formData, setFormData] = useState({
    idNumber: '',
    email: '',
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  // Debug: Log selected country and ID type on mount
  useEffect(() => {
    console.log('🔍 ========== PERSONAL INFO PAGE STATE DEBUG ==========')
    console.log('🌍 Selected Country:', state.selectedCountry)
    console.log('🆔 Selected ID Type:', state.selectedIdType)
    console.log('📧 Email in state:', state.personalInfo?.email)
    console.log('📋 Full state:', {
      selectedCountry: state.selectedCountry,
      selectedIdType: state.selectedIdType,
      personalInfo: state.personalInfo
    })
    
    if (state.selectedCountry) {
      const countryOption = getCountryOptions().find(c => c.value === state.selectedCountry)
      console.log('🌍 Country details:', {
        value: state.selectedCountry,
        label: countryOption?.label || 'Not found',
      })
    } else {
      console.warn('⚠️ No country selected in state!')
    }
    
    if (state.selectedIdType) {
      const idTypeLabels: Record<string, string> = {
        'national-id': 'National Identity Card (CNIC)',
        'passport': 'Passport',
        'drivers-license': "Driver's License"
      }
      console.log('🆔 ID Type details:', {
        value: state.selectedIdType,
        label: idTypeLabels[state.selectedIdType] || 'Unknown'
      })
    } else {
      console.error('❌ No ID type selected in state! This is a problem!')
    }
    console.log('🔍 ====================================================')
  }, [state.selectedCountry, state.selectedIdType, state.personalInfo?.email])

  // Initialize email from state when component mounts or when state changes
  useEffect(() => {
    const emailFromState = state.personalInfo?.email || ''
    if (emailFromState) {
      console.log('📧 Setting email from state:', emailFromState)
      setFormData((prev) => {
        // Only update if email is different to avoid unnecessary re-renders
        if (prev.email !== emailFromState) {
          return {
            ...prev,
            email: emailFromState
          }
        }
        return prev
      })
    }
  }, [state.personalInfo?.email])

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  // Get ID number length requirements based on country and document type
  // Simple structure: { minLength, maxLength } - allows alphanumeric input
  const getIdNumberLength = (country: string, idType: string) => {
    // Length mapping: country -> idType -> { minLength, maxLength }
    const lengthMap: Record<string, Record<string, { minLength: number; maxLength: number }>> = {
      'pk': { // Pakistan
        'national-id': { minLength: 13, maxLength: 13 },
        'passport': { minLength: 8, maxLength: 9 },
        'drivers-license': { minLength: 5, maxLength: 16 },
      },
      'in': { // India
        'national-id': { minLength: 12, maxLength: 12 },
        'passport': { minLength: 8, maxLength: 9 },
        'drivers-license': { minLength: 5, maxLength: 16 },
      },
      'us': { // United States
        'passport': { minLength: 9, maxLength: 9 },
        'drivers-license': { minLength: 5, maxLength: 16 },
      },
      'uk': { // United Kingdom
        'passport': { minLength: 8, maxLength: 9 },
        'drivers-license': { minLength: 16, maxLength: 16 },
      },
      'ca': { // Canada
        'passport': { minLength: 8, maxLength: 9 },
        'drivers-license': { minLength: 5, maxLength: 16 },
      },
      'au': { // Australia
        'passport': { minLength: 8, maxLength: 9 },
        'drivers-license': { minLength: 5, maxLength: 16 },
      },
      'nz': { // New Zealand
        'passport': { minLength: 8, maxLength: 9 },
        'drivers-license': { minLength: 5, maxLength: 16 },
      },
      'jp': { // Japan
        'national-id': { minLength: 12, maxLength: 12 },
        'passport': { minLength: 8, maxLength: 9 },
        'drivers-license': { minLength: 5, maxLength: 16 },
      },
      'cn': { // China
        'national-id': { minLength: 18, maxLength: 18 },
        'passport': { minLength: 8, maxLength: 9 },
        'drivers-license': { minLength: 5, maxLength: 16 },
      },
      'ae': { // UAE
        'national-id': { minLength: 15, maxLength: 15 },
        'passport': { minLength: 8, maxLength: 9 },
        'drivers-license': { minLength: 5, maxLength: 16 },
      },
      'de': { // Germany
        'national-id': { minLength: 8, maxLength: 12 },
        'passport': { minLength: 8, maxLength: 9 },
        'drivers-license': { minLength: 5, maxLength: 16 },
      },
      'fr': { // France
        'national-id': { minLength: 8, maxLength: 12 },
        'passport': { minLength: 8, maxLength: 9 },
        'drivers-license': { minLength: 5, maxLength: 16 },
      },
    }
    
    // Default lengths for countries not in the list
    const defaultLengths: Record<string, { minLength: number; maxLength: number }> = {
      'national-id': { minLength: 8, maxLength: 18 },
      'passport': { minLength: 8, maxLength: 9 },
      'drivers-license': { minLength: 5, maxLength: 16 },
    }
    
    return lengthMap[country]?.[idType] || defaultLengths[idType] || { minLength: 5, maxLength: 20 }
  }

  // Legacy function for backward compatibility - now just returns length info
  const getIdNumberFormat = (country: string, idType: string) => {
    const length = getIdNumberLength(country, idType)
    return {
      maxLength: length.maxLength,
      minLength: length.minLength,
      pattern: /^[A-Z0-9]+$/, // Allow alphanumeric
      letterCount: 0,
      numberCount: 0,
      letterPosition: 'flexible' as const,
      flexible: true,
    }
  }

  const handleIdNumberChange = (value: string) => {
    const country = state.selectedCountry || ''
    const idType = state.selectedIdType || ''
    const length = getIdNumberLength(country, idType)
    
    // Remove all non-alphanumeric characters and convert to uppercase
    // Allow both letters and numbers (alphanumeric)
    let cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
    
    // Limit to max length
    const limited = cleaned.slice(0, length.maxLength)
    
    handleChange('idNumber', limited)
  }

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {}

    // Validate required fields (name comes from enter-name page / state)
    const firstNameFromState = state.personalInfo?.firstName?.trim() || ''
    const lastNameFromState = state.personalInfo?.lastName?.trim() || ''
    if (!firstNameFromState || !lastNameFromState) {
      newErrors.firstName = 'Please go back and enter your name.'
    }
    if (!formData.idNumber.trim()) {
      newErrors.idNumber = 'ID number is required'
    } else {
      // Validate ID number length based on country and type
      const country = state.selectedCountry || ''
      const idType = state.selectedIdType || ''
      const length = getIdNumberLength(country, idType)
      
      // Check if input contains only alphanumeric characters
      if (!/^[A-Z0-9]+$/.test(formData.idNumber)) {
        newErrors.idNumber = 'ID number can only contain letters and numbers'
      } else if (formData.idNumber.length < length.minLength) {
        newErrors.idNumber = `Please enter a valid ${idType === 'national-id' ? 'ID' : idType === 'passport' ? 'passport' : 'license'} number (minimum ${length.minLength} characters)`
      } else if (formData.idNumber.length > length.maxLength) {
        newErrors.idNumber = `Please enter a valid ${idType === 'national-id' ? 'ID' : idType === 'passport' ? 'passport' : 'license'} number (maximum ${length.maxLength} characters)`
      }
    }
    // Email is read-only, but still validate it exists
    const emailToValidate = formData.email || state.personalInfo?.email || ''
    if (!emailToValidate.trim()) {
      newErrors.email = 'Email is required. Please go back and enter your email.'
    } else if (!validateEmail(emailToValidate)) {
      newErrors.email = 'Please enter a valid email address'
    }
    const addressFromState = state.personalInfo?.address?.trim() || ''
    if (!addressFromState) {
      newErrors.address = 'Please go back and enter your address.'
    }
    const phoneFromState = state.personalInfo?.phone || ''
    if (!phoneFromState.trim()) {
      newErrors.phone = 'Phone number is required. Please go back and enter your phone number.'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Set loading state
    setLoading(true)

    // Save to context - name from enter-name, phone from enter-phone
    const emailToSave = formData.email.trim() || state.personalInfo?.email || ''
    const phoneToSave = state.personalInfo?.phone || ''
    dispatch({
      type: 'SET_PERSONAL_INFO',
      payload: {
        firstName: firstNameFromState,
        lastName: lastNameFromState,
        fatherName: state.personalInfo?.fatherName?.trim() || '',
        idNumber: formData.idNumber.trim(),
        email: emailToSave,
        phone: phoneToSave,
        address: addressFromState,
        dateOfBirth: state.personalInfo?.dateOfBirth || '',
        addressLine1: state.personalInfo?.addressLine1,
        addressLine2: state.personalInfo?.addressLine2,
        city: state.personalInfo?.city,
        postalCode: state.personalInfo?.postalCode,
      },
    })
    
    // Navigate to next page
    router.push('/verify/otp-verification')
  }

  return (
    <div className="min-h-screen bg-white md:bg-surface-gray flex flex-col">
      <Header showBack showClose />
      <ProgressBar currentStep={4} totalSteps={5} />
      <main className="flex-1 px-4 md:px-0 pt-6 pb-24 md:flex md:items-center md:justify-center">
        <div className="w-full max-w-2xl md:bg-white md:rounded-2xl md:p-6 md:my-8 md:border-[2px] md:border-grey-400">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              Personal Information
            </h1>
            <p className="text-sm text-text-light">
              Please verify and complete your information
            </p>
          </div>

          {/* Selected ID Type Display - Always show, even if empty for debugging */}
          <div className="mt-3 p-3 rounded-md bg-yellow-100 border border-yellow-300 mb-8">
                      <p className="text-xs text-yellow-900 font-medium flex items-start gap-2">
                        <span className="text-base">⚠️</span>
                        <span>
                          <strong>Important:</strong> You selected <strong>{state.selectedIdType === 'national-id' ? 'National Identity Card' : state.selectedIdType === 'passport' ? 'Passport' : "Driver's License"}</strong>. 
                          Please ensure all information you enter matches exactly with this document. 
                          <strong className="text-red-600"> Any mismatch will result in KYC rejection.</strong>
                        </span>
                      </p>
                    </div>
          <div className="space-y-4 mb-6">
            {errors.firstName && (
              <p className="text-sm text-red-600">{errors.firstName}</p>
            )}
            <div className="w-full">
              <label className="block text-sm font-medium text-text-primary mb-2">
                {state.selectedIdType === 'national-id' ? 'CNIC Number (without dashes)' :
                state.selectedIdType === 'passport' ? 'Passport Number' :
                state.selectedIdType === 'drivers-license' ? "Driver's License Number" :
                'ID Number'}{' '}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="text"
                pattern="[a-zA-Z0-9]*"
                value={formData.idNumber}
                onChange={(e) => handleIdNumberChange(e.target.value)}
                onKeyDown={(e) => {
                  // Allow navigation and modifier keys
                  const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Home', 'End']
                  const isAllowedKey = allowedKeys.includes(e.key)
                  const isModifier = e.ctrlKey || e.metaKey || e.altKey
                  
                  if (isAllowedKey || isModifier) {
                    return // Allow navigation and modifier keys
                  }
                  
                  // Allow alphanumeric characters (letters and numbers)
                  const isAlphanumeric = /[a-zA-Z0-9]/.test(e.key)
                  
                  if (!isAlphanumeric) {
                    e.preventDefault()
                    return
                  }
                  
                  // Check length limit
                  const country = state.selectedCountry || ''
                  const idType = state.selectedIdType || ''
                  const length = getIdNumberLength(country, idType)
                  
                  if (formData.idNumber.length >= length.maxLength) {
                    e.preventDefault()
                  }
                }}
                onPaste={(e) => {
                  // Handle paste - filter based on ID type
                  e.preventDefault()
                  const pastedText = e.clipboardData.getData('text')
                  handleIdNumberChange(pastedText)
                }}
                placeholder={
                  (() => {
                    const country = state.selectedCountry || ''
                    const idType = state.selectedIdType || ''
                    const length = getIdNumberLength(country, idType)
                    
                    if (length.minLength === length.maxLength) {
                      return `Enter ${length.minLength} characters (letters and/or numbers)`
                    } else {
                      return `Enter ${length.minLength}-${length.maxLength} characters (letters and/or numbers)`
                    }
                  })()
                }
                maxLength={getIdNumberLength(state.selectedCountry || '', state.selectedIdType || '').maxLength}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.idNumber ? 'border-red-500' : 'border-gray-300'
                } bg-white md:bg-surface-light text-text-primary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300`}
              />
              {errors.idNumber && (
                <p className="mt-1 text-sm text-red-500">{errors.idNumber}</p>
              )}
            </div>

            {/* Email Display (Read-only) - Pre-filled from previous step */}
            <div className="w-full">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="px-4 py-3 rounded-lg border-2 border-gray-300 bg-gray-50 text-text-primary w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg"></span>
                    <span className="font-medium text-base text-gray-900">
                      {formData.email || state.personalInfo?.email || 'No email provided'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded-full font-semibold">
                    ✓ Locked
                  </span>
                </div>
              </div>
              
           
            </div>

            {/* Country Display (Read-only) - Show where user lives */}
            <div className="w-full">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Country/Region (Where you live)
              </label>
              {state.selectedCountry ? (
                <>
                  <div className="px-4 py-3 rounded-lg  border-2 border-gray-300 bg-gray-50 text-text-primary w-full">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg"></span>
                        <span className="font-semibold text-base text-gray-900">
                          {(() => {
                            const countryOption = getCountryOptions().find(c => c.value === state.selectedCountry)
                            const countryName = countryOption?.label || state.selectedCountry.toUpperCase()
                            console.log('🌍 Displaying country:', state.selectedCountry, '→', countryName)
                            return countryName
                          })()}
                        </span>
                      </div>
                      <span className="text-xs text-green-700 bg-green-200 px-3 py-1 rounded-full font-semibold">
                        ✓ Selected
                      </span>
                    </div>
                  </div>
                  
                </>
              ) : (
                <div className="px-4 py-3 rounded-lg border-2 border-yellow-300 bg-yellow-50 text-text-primary w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⚠️</span>
                    <p className="text-sm text-yellow-800 font-medium">No country selected. Please go back and select your country.</p>
                  </div>
                </div>
              )}
            </div>

            </div>

          {(errors.phone || errors.address) && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg space-y-1">
              {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
              {errors.address && <p className="text-sm text-red-600">{errors.address}</p>}
            </div>
          )}

          <Button 
            onClick={handleSubmit} 
            disabled={loading}
            className="w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <LoadingDots size="sm" color="#ffffff" />
                <span></span>
              </>
            ) : (
              'Continue'
            )}
          </Button>
        </div>
      </main>
    </div>
  )
}


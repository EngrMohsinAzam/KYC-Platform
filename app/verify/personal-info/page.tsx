'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useAppContext } from '@/context/useAppContext'
import { getCountryByValue, getCountryOptions } from '@/lib/utils/countries'
import { LoadingDots } from '@/components/ui/LoadingDots'

export default function PersonalInfo() {
  const router = useRouter()
  const { state, dispatch } = useAppContext()
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    fatherName: '',
    idNumber: '',
    email: '',
    phone: '',
    address: '',
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [addressSuggestions, setAddressSuggestions] = useState<Array<{ display_name: string; lat: string; lon: string }>>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchingAddress, setSearchingAddress] = useState(false)
  const [addressInitialized, setAddressInitialized] = useState(false)
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

  // Always start with an empty address on this page (do not prefill from previous steps/state)
  useEffect(() => {
    if (addressInitialized) return
    setAddressInitialized(true)
    setFormData((prev) => ({ ...prev, address: '' }))
    setAddressSuggestions([])
    setShowSuggestions(false)
  }, [addressInitialized])

  // If country changes (user re-selected / navigated back), ensure address stays empty
  // and never auto-fills with the country name.
  useEffect(() => {
    setFormData((prev) => ({ ...prev, address: '' }))
    setAddressSuggestions([])
    setShowSuggestions(false)
  }, [state.selectedCountry])


  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone: string) => {
    // Remove all formatting
    const digitsOnly = phone.replace(/\D/g, '')
    const countryCode = getCountryCode()
    const countryCodeDigits = countryCode.replace('+', '')
    
    // Remove country code if included
    const phoneDigits = digitsOnly.startsWith(countryCodeDigits) 
      ? digitsOnly.slice(countryCodeDigits.length)
      : digitsOnly
    
    // Validate based on country
    const error = validatePhoneByCountry(phone, state.selectedCountry || '')
    return error === null
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  // Handle name field changes (alphabet only - letters, spaces, hyphens, apostrophes)
  const handleNameChange = (field: string, value: string) => {
    // Allow only letters, spaces, hyphens, and apostrophes
    const cleaned = value.replace(/[^a-zA-Z\s\-']/g, '')
    handleChange(field, cleaned)
  }

  // Search address suggestions as user types (like Google search)
  const searchAddressSuggestions = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setAddressSuggestions([])
      setShowSuggestions(false)
      return
    }

    setSearchingAddress(true)
    try {
      // Use our API route to avoid CORS issues
      const countryParam = state.selectedCountry ? `&country=${state.selectedCountry}` : ''
      const url = `/api/geocode/search?q=${encodeURIComponent(query)}${countryParam}`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Address search API response:', data) // Debug log
      
      // Check if response is an error
      if (data.error) {
        console.error('API error:', data.error)
        setAddressSuggestions([])
        setShowSuggestions(false)
        return
      }
      
      if (data && Array.isArray(data) && data.length > 0) {
        console.log('Found', data.length, 'address suggestions') // Debug log
        setAddressSuggestions(data)
        setShowSuggestions(true)
      } else {
        console.log('No address suggestions found') // Debug log
        setAddressSuggestions([])
        setShowSuggestions(false)
      }
    } catch (error) {
      console.error('Error searching address:', error)
      setAddressSuggestions([])
      setShowSuggestions(false)
    } finally {
      setSearchingAddress(false)
    }
  }

  // Debounced address search (faster response like Google)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.address && formData.address.trim().length >= 2) {
        searchAddressSuggestions(formData.address)
      } else {
        setAddressSuggestions([])
        setShowSuggestions(false)
      }
    }, 200) // Reduced to 200ms for faster response like Google

    return () => clearTimeout(timer)
  }, [formData.address, state.selectedCountry])

  // Handle address suggestion selection
  const handleSelectAddressSuggestion = (suggestion: { display_name: string; lat: string; lon: string }) => {
    handleChange('address', suggestion.display_name)
    setShowSuggestions(false)
    setAddressSuggestions([])
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

    // Validate required fields
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Prefix name is required'
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'First name is required'
    }
    if (!formData.fatherName.trim()) {
      newErrors.fatherName = 'Surname is required'
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
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required'
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else {
      const phoneError = validatePhoneByCountry(formData.phone, state.selectedCountry || '')
      if (phoneError) {
        newErrors.phone = phoneError
      } else if (!validatePhone(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number'
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Set loading state
    setLoading(true)

    // Format phone number with country code for storage
    // Phone is already stored as digits only, just add country code
    const phoneDigits = formData.phone.replace(/\D/g, '')
    const countryCode = getCountryCode()
    const fullPhoneNumber = countryCode + phoneDigits

    // Save to context - use email from state if formData email is empty (read-only field)
    const emailToSave = formData.email.trim() || state.personalInfo?.email || ''
    dispatch({
      type: 'SET_PERSONAL_INFO',
      payload: {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        fatherName: formData.fatherName.trim(),
        idNumber: formData.idNumber.trim(),
        email: emailToSave,
        phone: fullPhoneNumber, // Store with country code
        address: formData.address.trim(),
      },
    })
    
    // Navigate to next page
    router.push('/verify/otp-verification')
  }

  // Get country code based on selected country
  const getCountryCode = () => {
    // Extended country code mapping
    const countryCodes: Record<string, string> = {
      // North America
      'us': '+1',
      'ca': '+1',
      'mx': '+52',
      // Europe
      'uk': '+44',
      'de': '+49',
      'fr': '+33',
      'it': '+39',
      'es': '+34',
      'nl': '+31',
      'pl': '+48',
      'ru': '+7',
      // Asia
      'cn': '+86',
      'in': '+91',
      'jp': '+81',
      'kr': '+82',
      'pk': '+92',
      'bd': '+880',
      'id': '+62',
      'th': '+66',
      'vn': '+84',
      'ph': '+63',
      'my': '+60',
      'sg': '+65',
      'ae': '+971',
      'sa': '+966',
      'tr': '+90',
      // Oceania
      'au': '+61',
      'nz': '+64',
      // South America
      'br': '+55',
      'ar': '+54',
      'co': '+57',
      'cl': '+56',
      // Africa
      'eg': '+20',
      'za': '+27',
      'ng': '+234',
      'ke': '+254',
    }
    return countryCodes[state.selectedCountry || ''] || '+1'
  }

  const formatPhoneNumber = (value: string, countryCode: string) => {
    // Remove all non-digit characters (only allow numbers) - STRICT validation
    const digitsOnly = value.replace(/\D/g, '')
    
    // If empty, return empty
    if (!digitsOnly) return ''
    
    // Remove country code from the input if user typed it
    const countryCodeDigits = countryCode.replace('+', '')
    let phoneDigits = digitsOnly
    
    // If user included country code, remove it
    if (digitsOnly.startsWith(countryCodeDigits)) {
      phoneDigits = digitsOnly.slice(countryCodeDigits.length)
    }
    
    // Get max length based on country - STRICT LIMIT
    const maxLength = getMaxPhoneLength(state.selectedCountry || '')
    
    // STRICT: Limit to max length - no more digits allowed
    phoneDigits = phoneDigits.slice(0, maxLength)
    
    // Format based on country
    return formatByCountry(phoneDigits, state.selectedCountry || '')
  }

  const handlePhoneChange = (value: string) => {
    // Only allow digits (0-9) - no formatting characters
    const digitsOnly = value.replace(/\D/g, '')
    
    // Get max digits allowed for this country
    const maxDigits = getMaxPhoneLength(state.selectedCountry || '')
    
    // STRICT: If user tries to enter more digits than allowed, reject the extra digits
    if (digitsOnly.length > maxDigits) {
      // User tried to enter too many digits - keep only the allowed amount
      const limitedDigits = digitsOnly.slice(0, maxDigits)
      handleChange('phone', limitedDigits)
      return
    }
    
    // Store only digits (no formatting)
    handleChange('phone', digitsOnly)
    
    // Real-time validation
    if (digitsOnly) {
      const phoneError = validatePhoneByCountry(digitsOnly, state.selectedCountry || '')
      if (phoneError) {
        setErrors((prev) => ({ ...prev, phone: phoneError }))
      } else {
        setErrors((prev) => ({ ...prev, phone: '' }))
      }
    } else {
      // Clear error if field is empty
      setErrors((prev) => ({ ...prev, phone: '' }))
    }
  }

  const getMaxPhoneLength = (country: string) => {
    // Maximum phone number length (without country code) by country
    const lengths: Record<string, number> = {
      // North America
      'us': 10, 'ca': 10, 'mx': 10,
      // Europe
      'uk': 10, 'de': 11, 'fr': 9, 'it': 10, 'es': 9, 'nl': 9, 'pl': 9, 'ru': 10,
      // Asia
      'cn': 11, 'in': 10, 'jp': 10, 'kr': 10, 'pk': 10, 'bd': 10, 'id': 10, 'th': 9,
      'vn': 10, 'ph': 10, 'my': 10, 'sg': 8, 'ae': 9, 'sa': 9, 'tr': 10,
      // Oceania
      'au': 9, 'nz': 9,
      // South America
      'br': 11, 'ar': 10, 'co': 10, 'cl': 9,
      // Africa
      'eg': 10, 'za': 9, 'ng': 10, 'ke': 9,
    }
    return lengths[country] || 15 // Default max length
  }

  const formatByCountry = (digits: string, country: string) => {
    // Format phone number based on country format
    if (country === 'us' || country === 'ca') {
      // US/Canada: (XXX) XXX-XXXX
      if (digits.length <= 3) return digits
      if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    } else if (country === 'uk') {
      // UK: XXXX XXX XXX
      if (digits.length <= 4) return digits
      if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`
      return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
    } else if (country === 'pk') {
      // Pakistan: XXXX-XXXXXXX
      if (digits.length <= 4) return digits
      return `${digits.slice(0, 4)}-${digits.slice(4)}`
    } else if (country === 'in') {
      // India: XXXXX XXXXX
      if (digits.length <= 5) return digits
      return `${digits.slice(0, 5)} ${digits.slice(5)}`
    } else if (country === 'br') {
      // Brazil: (XX) XXXXX-XXXX
      if (digits.length <= 2) return digits
      if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
    } else if (country === 'de') {
      // Germany: XXXX XXXXXXX
      if (digits.length <= 4) return digits
      return `${digits.slice(0, 4)} ${digits.slice(4)}`
    } else if (country === 'fr') {
      // France: XX XX XX XX XX
      if (digits.length <= 2) return digits
      if (digits.length <= 4) return `${digits.slice(0, 2)} ${digits.slice(2)}`
      if (digits.length <= 6) return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4)}`
      if (digits.length <= 8) return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6)}`
      return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`
    } else if (country === 'au') {
      // Australia: XXXX XXX XXX
      if (digits.length <= 4) return digits
      if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`
      return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
    } else if (country === 'cn') {
      // China: XXX XXXX XXXX
      if (digits.length <= 3) return digits
      if (digits.length <= 7) return `${digits.slice(0, 3)} ${digits.slice(3)}`
      return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`
    } else if (country === 'jp') {
      // Japan: XX-XXXX-XXXX
      if (digits.length <= 2) return digits
      if (digits.length <= 6) return `${digits.slice(0, 2)}-${digits.slice(2)}`
      return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`
    }
    // Default: just return digits (no formatting)
    return digits
  }

  const validatePhoneByCountry = (phone: string, country: string) => {
    // Remove formatting to get just digits
    const digitsOnly = phone.replace(/\D/g, '')
    const countryCode = getCountryCode()
    const countryCodeDigits = countryCode.replace('+', '')
    
    // Remove country code if included
    const phoneDigits = digitsOnly.startsWith(countryCodeDigits) 
      ? digitsOnly.slice(countryCodeDigits.length)
      : digitsOnly
    
    const minLength = getMinPhoneLength(country)
    const maxLength = getMaxPhoneLength(country)
    
    if (phoneDigits.length < minLength) {
      return `Phone number must be at least ${minLength} digits`
    }
    if (phoneDigits.length > maxLength) {
      return `Phone number must be at most ${maxLength} digits`
    }
    
    return null
  }

  const getMinPhoneLength = (country: string) => {
    // Minimum phone number length by country
    const lengths: Record<string, number> = {
      // North America
      'us': 10, 'ca': 10, 'mx': 10,
      // Europe
      'uk': 10, 'de': 10, 'fr': 9, 'it': 9, 'es': 9, 'nl': 9, 'pl': 9, 'ru': 10,
      // Asia
      'cn': 11, 'in': 10, 'jp': 10, 'kr': 9, 'pk': 10, 'bd': 10, 'id': 9, 'th': 9,
      'vn': 9, 'ph': 10, 'my': 9, 'sg': 8, 'ae': 9, 'sa': 9, 'tr': 10,
      // Oceania
      'au': 9, 'nz': 8,
      // South America
      'br': 10, 'ar': 10, 'co': 10, 'cl': 9,
      // Africa
      'eg': 10, 'za': 9, 'ng': 10, 'ke': 9,
    }
    return lengths[country] || 7
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
            {/* Row 1: Prefix name full width */}
            <div className="w-full">
              <Input
                label={
                  <>
                    Prefix name <span className="text-red-500">*</span>
                  </>
                }
                value={formData.firstName}
                onChange={(e) => handleNameChange('firstName', e.target.value)}
                onKeyDown={(e) => {
                  // Allow only letters, spaces, hyphens, apostrophes, and navigation keys
                  const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Home', 'End']
                  const isAllowedKey = allowedKeys.includes(e.key)
                  const isModifier = e.ctrlKey || e.metaKey || e.altKey
                  const isLetter = /[a-zA-Z\s\-']/.test(e.key)
                  
                  if (!isAllowedKey && !isModifier && !isLetter) {
                    e.preventDefault()
                  }
                }}
                error={errors.firstName}
                placeholder="Prefix name"
                required
              />
            </div>

            {/* Row 2: First Name and Surname side by side */}
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <Input
                label={
                  <>
                    First Name <span className="text-red-500">*</span>
                  </>
                }
                value={formData.lastName}
                onChange={(e) => handleNameChange('lastName', e.target.value)}
                onKeyDown={(e) => {
                  // Allow only letters, spaces, hyphens, apostrophes, and navigation keys
                  const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Home', 'End']
                  const isAllowedKey = allowedKeys.includes(e.key)
                  const isModifier = e.ctrlKey || e.metaKey || e.altKey
                  const isLetter = /[a-zA-Z\s\-']/.test(e.key)
                  
                  if (!isAllowedKey && !isModifier && !isLetter) {
                    e.preventDefault()
                  }
                }}
                error={errors.lastName}
                placeholder="First name"
                required
              />
              <Input
                label={
                  <>
                    Surname <span className="text-red-500">*</span>
                  </>
                }
                value={formData.fatherName}
                onChange={(e) => handleNameChange('fatherName', e.target.value)}
                onKeyDown={(e) => {
                  // Allow only letters, spaces, hyphens, apostrophes, and navigation keys
                  const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Home', 'End']
                  const isAllowedKey = allowedKeys.includes(e.key)
                  const isModifier = e.ctrlKey || e.metaKey || e.altKey
                  const isLetter = /[a-zA-Z\s\-']/.test(e.key)
                  
                  if (!isAllowedKey && !isModifier && !isLetter) {
                    e.preventDefault()
                  }
                }}
                error={errors.fatherName}
                placeholder="Surname"
                required
              />
            </div>

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

            <div className="w-full relative">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  value={formData.address}
                  onChange={(e) => {
                    const value = e.target.value
                    handleChange('address', value)
                    // Show suggestions immediately as user types (like Google)
                    if (value.trim().length >= 2) {
                      setShowSuggestions(true)
                    } else {
                      setShowSuggestions(false)
                      setAddressSuggestions([])
                    }
                  }}
                  onFocus={() => {
                    // Show suggestions when field is focused if there are any
                    if (addressSuggestions.length > 0 && formData.address.trim().length >= 2) {
                      setShowSuggestions(true)
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding suggestions to allow click on suggestion
                    setTimeout(() => setShowSuggestions(false), 250)
                  }}
                  error={errors.address}
                  placeholder="Start typing your address"
                  // Prevent browser/password-manager autofill writing country (e.g. "pakistan") into this field
                  name="kyc_address"
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="off"
                  required
                />
                
                {/* Address Suggestions Dropdown - Like Google Search */}
                {showSuggestions && formData.address.trim().length >= 2 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-72 overflow-y-auto">
                    {addressSuggestions.length > 0 ? (
                      <>
                        {addressSuggestions.map((suggestion, index) => (
                          <button
                            key={`${suggestion.lat}-${suggestion.lon}-${index}`}
                            type="button"
                            onClick={() => handleSelectAddressSuggestion(suggestion)}
                            onMouseDown={(e) => e.preventDefault()} // Prevent blur before click
                            className="w-full px-4 py-3 text-left hover:bg-blue-50 active:bg-blue-100 border-b border-gray-100 last:border-b-0 transition-colors cursor-pointer"
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 flex-shrink-0">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-text-primary font-medium leading-tight break-words">
                                  {suggestion.display_name}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </>
                    ) : (
                      <div className="px-4 py-3 text-center text-gray-500 text-sm">
                        No addresses found. Try a different search term.
                      </div>
                    )}
                  </div>
                )}
              </div>
              {errors.address && (
                <p className="mt-1 text-sm text-red-500">{errors.address}</p>
              )}
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 w-full">
                <div className="w-20 md:w-24 flex-shrink-0">
                  <div className="px-3 py-3 rounded-lg border border-gray-300 bg-gray-50 text-text-primary text-sm font-medium text-center">
                    {getCountryCode()}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-center">Fixed</p>
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    // Prevent browser/password-manager autofill from auto-filling phone
                    name="kyc_phone"
                    autoComplete="new-password"
                    autoCorrect="off"
                    autoCapitalize="off"
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onKeyDown={(e) => {
                      // Prevent non-numeric keys (except backspace, delete, arrow keys, tab)
                      const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Home', 'End']
                      const isNumber = /[0-9]/.test(e.key)
                      const isAllowedKey = allowedKeys.includes(e.key)
                      const isModifier = e.ctrlKey || e.metaKey || e.altKey
                      
                      // STRICT: Check if user is trying to enter more digits than allowed
                      if (isNumber) {
                        const currentDigits = formData.phone.replace(/\D/g, '')
                        const maxDigits = getMaxPhoneLength(state.selectedCountry || '')
                        
                        // If already at max digits, prevent entering more
                        if (currentDigits.length >= maxDigits && !isModifier) {
                          e.preventDefault()
                          return
                        }
                      }
                      
                      // Allow numbers, allowed keys, and copy/paste shortcuts
                      if (!isNumber && !isAllowedKey && !isModifier) {
                        e.preventDefault()
                      }
                    }}
                    onPaste={(e) => {
                      // Handle paste - only allow digits
                      e.preventDefault()
                      const pastedText = e.clipboardData.getData('text')
                      handlePhoneChange(pastedText)
                    }}
                    placeholder="Enter phone number"
                    maxLength={getMaxPhoneLength(state.selectedCountry || '')}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    } bg-white text-text-primary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300`}
                  />
                </div>
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
              )}
              {!errors.phone && formData.phone && (() => {
                const digits = formData.phone.replace(/\D/g, '')
                const minLength = getMinPhoneLength(state.selectedCountry || '')
                const maxLength = getMaxPhoneLength(state.selectedCountry || '')
                const isValid = digits.length >= minLength && digits.length <= maxLength
                return isValid ? (
                  <p className="mt-1 text-xs text-green-600">
                    ✓ Valid phone number ({digits.length} digits)
                  </p>
                ) : null
              })()}
            </div>
          </div>

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


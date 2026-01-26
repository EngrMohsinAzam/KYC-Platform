'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export default function SignUpPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    password: '',
    companyWebsite: '',
    companyAddress: '',
    industry: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [addressSuggestions, setAddressSuggestions] = useState<Array<{ display_name: string; lat: string; lon: string }>>([])
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false)
  const [searchingAddress, setSearchingAddress] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  })

  const industries = [
    'FinTech',
    'Payments',
    'Trading',
    'Crypto',
    'Banking',
    'Insurance',
    'Real Estate',
    'Healthcare',
    'E-commerce',
    'Marketplace',
    'iGaming',
    'Mobility',
    'SaaS',
    'Telecommunications',
    'Education',
    'Legal Services',
    'Accounting',
    'Consulting',
    'Manufacturing',
    'Retail',
    'Hospitality',
    'Travel',
    'Media & Entertainment',
    'Non-profit',
    'Government',
    'Other',
  ]

  // Password validation
  useEffect(() => {
    const password = formData.password
    setPasswordStrength({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    })
  }, [formData.password])

  // Search address suggestions
  const searchAddressSuggestions = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setAddressSuggestions([])
      setShowAddressSuggestions(false)
      return
    }

    setSearchingAddress(true)
    try {
      const url = `/api/geocode/search?q=${encodeURIComponent(query)}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        setAddressSuggestions([])
        setShowAddressSuggestions(false)
        return
      }

      if (data && Array.isArray(data) && data.length > 0) {
        setAddressSuggestions(data)
        setShowAddressSuggestions(true)
      } else {
        setAddressSuggestions([])
        setShowAddressSuggestions(false)
      }
    } catch (error) {
      console.error('Error searching address:', error)
      setAddressSuggestions([])
      setShowAddressSuggestions(false)
    } finally {
      setSearchingAddress(false)
    }
  }

  // Debounced address search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.companyAddress && formData.companyAddress.trim().length >= 2) {
        searchAddressSuggestions(formData.companyAddress)
      } else {
        setAddressSuggestions([])
        setShowAddressSuggestions(false)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [formData.companyAddress])

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const handleSelectAddress = (suggestion: { display_name: string }) => {
    handleChange('companyAddress', suggestion.display_name)
    setShowAddressSuggestions(false)
    setAddressSuggestions([])
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else {
      const strength = passwordStrength
      const missingRequirements: string[] = []
      
      if (!strength.length) missingRequirements.push('at least 8 characters')
      if (!strength.uppercase) missingRequirements.push('one uppercase letter')
      if (!strength.lowercase) missingRequirements.push('one lowercase letter')
      if (!strength.number) missingRequirements.push('one number')
      if (!strength.special) missingRequirements.push('one special character')
      
      if (missingRequirements.length > 0) {
        newErrors.password = `Password must contain ${missingRequirements.join(', ')}`
      }
    }

    if (!formData.companyWebsite.trim()) {
      newErrors.companyWebsite = 'Company website is required'
    } else {
      // Basic URL validation
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
      if (!urlPattern.test(formData.companyWebsite) && !formData.companyWebsite.startsWith('http://') && !formData.companyWebsite.startsWith('https://')) {
        // Try with https:// prefix
        if (!urlPattern.test('https://' + formData.companyWebsite)) {
          newErrors.companyWebsite = 'Please enter a valid website URL'
        }
      }
    }

    if (!formData.companyAddress.trim()) {
      newErrors.companyAddress = 'Company address is required'
    }

    if (!formData.industry) {
      newErrors.industry = 'Industry is required'
    }

    if (!agreedToTerms) {
      newErrors.terms = 'You must agree to the Terms of Service and Privacy Policy'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      // TODO: Implement signup logic
      console.log('Sign up data:', formData)
      // Redirect to OTP verification page, then to account status pending
      router.push(`/otp-verification?email=${encodeURIComponent(formData.email)}&type=signup`)
    }
  }

  const handleGoogleSignup = () => {
    // TODO: Implement Google signup
    console.log('Google signup clicked')
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active,
        select:-webkit-autofill,
        select:-webkit-autofill:hover,
        select:-webkit-autofill:focus,
        select:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px white inset !important;
          -webkit-text-fill-color: #111827 !important;
          background-color: white !important;
        }
        input[type="text"],
        input[type="email"],
        input[type="password"],
        input[type="url"],
        select {
          background-color: white !important;
        }
        input[type="checkbox"] {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          background-color: white !important;
          border: 1px solid #d1d5db !important;
          position: relative;
        }
        input[type="checkbox"]:checked {
          background-color: white !important;
          border-color: #111827 !important;
          accent-color: #111827 !important;
        }
        input[type="checkbox"]:checked::before {
          content: "✓";
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          color: #111827 !important;
          font-size: 12px;
          font-weight: bold;
          line-height: 1;
        }
      `}} />
    <div className="min-h-screen relative overflow-hidden">
      {/* Blurred Landing Page Background */}
      <div className="fixed inset-0 overflow-y-auto pointer-events-none">
        <div className="min-h-screen bg-white blur-lg scale-105">
          {/* Header */}
          <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-14 md:h-16">
                <div className="flex items-center gap-2 md:gap-3">
                  <Image
                    src="/Logo.png"
                    alt="DigiPort Logo"
                    width={120}
                    height={40}
                    className="h-6 md:h-8 w-auto"
                    priority
                  />
                  <span className="text-base md:text-xl font-bold text-gray-900">DigiPort</span>
                </div>
                <nav className="hidden md:flex items-center space-x-6">
                  <a href="#features" className="text-sm text-gray-600">Products</a>
                  <a href="#solutions" className="text-sm text-gray-600">Solutions</a>
                  <a href="#resources" className="text-sm text-gray-600">Resources</a>
                  <a href="#company" className="text-sm text-gray-600">Company</a>
                  <a href="#pricing" className="text-sm text-gray-600">Pricing</a>
                </nav>
                <div className="flex items-center gap-2 md:space-x-4">
                  <button className="hidden md:block text-sm text-gray-900">Sign In</button>
                  <button className="bg-gray-900 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium">
                    Get started
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Hero Section Preview */}
          <section className="pt-8 md:pt-12 pb-12 md:pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="grid md:grid-cols-2 gap-6 md:gap-12 items-center">
                <div>
                  <h1 className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-semibold text-gray-900 mb-3 md:mb-4">
                    Fast KYC, full compliance, and high pass rates—all in one platform
                  </h1>
                  <p className="text-xs md:text-sm lg:text-base text-gray-600 mb-5 md:mb-6">
                    Maximize pass rates, stop fraud in its tracks, and stay compliant worldwide with customizable User Verification.
                  </p>
                </div>
                <div className="relative flex items-center justify-center">
                  <div className="w-full max-w-full md:max-w-[75%]">
                    <Image
                      src="/Hero.png"
                      alt="DigiPort Dashboard"
                      width={600}
                      height={450}
                      className="rounded-lg shadow-2xl w-full h-auto object-contain"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Additional sections for visual depth */}
          <section className="py-8 md:py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-6 h-32"></div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Dark Overlay for better card visibility */}
      <div className="fixed inset-0 bg-black/20 pointer-events-none z-[5]"></div>

      {/* Form Overlay */}
      <div className="relative z-10 min-h-screen flex items-center justify-center py-6 md:py-8 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
        {/* Sign Up Card */}
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-6 md:p-8 relative">
          {/* Back Button */}
          <button
            onClick={() => router.push('/')}
            className="absolute top-6 left-6 w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Go back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          {/* Logo */}
          <div className="flex items-center justify-center mb-3 md:mb-4">
            <Image
              src="/Logo.png"
              alt="DigiPort Logo"
              width={40}
              height={40}
              className="h-10 w-auto"
              priority
            />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1.5 md:mb-2 text-center">Welcome to DigiPort</h1>
          <p className="text-sm text-gray-600 mb-3 md:mb-4 text-center">
            Already have an account?{' '}
            <Link href="/signin" className="text-gray-900 font-medium hover:underline">
              Log in
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
            {/* Company Name */}
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1.5">
                Full company name
                <span className="ml-1 text-gray-400 cursor-help" title="Enter your company's legal name">
                  ?
                </span>
              </label>
              <input
                id="companyName"
                type="text"
                value={formData.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                placeholder="Company name"
                style={{ backgroundColor: 'white' }}
                className={`w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none ${
                  errors.companyName ? 'border-red-500' : ''
                }`}
              />
              {errors.companyName && (
                <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Work Email
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="name@company.com"
                style={{ backgroundColor: 'white' }}
                className={`w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none ${
                  errors.email ? 'border-red-500' : ''
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Enter your password"
                  style={{ backgroundColor: 'white' }}
                  className={`w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none pr-10 ${
                    errors.password ? 'border-red-500' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Company Website */}
            <div>
              <label htmlFor="companyWebsite" className="block text-sm font-medium text-gray-700 mb-1.5">
                Company website
              </label>
              <input
                id="companyWebsite"
                type="url"
                value={formData.companyWebsite}
                onChange={(e) => handleChange('companyWebsite', e.target.value)}
                placeholder="https://www.company.com"
                style={{ backgroundColor: 'white' }}
                className={`w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none ${
                  errors.companyWebsite ? 'border-red-500' : ''
                }`}
              />
              {errors.companyWebsite && (
                <p className="mt-1 text-sm text-red-600">{errors.companyWebsite}</p>
              )}
            </div>

            {/* Company Address */}
            <div className="relative">
              <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700 mb-1.5">
                Company address
              </label>
              <input
                id="companyAddress"
                type="text"
                value={formData.companyAddress}
                onChange={(e) => handleChange('companyAddress', e.target.value)}
                placeholder="Search for address"
                style={{ backgroundColor: 'white' }}
                className={`w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none ${
                  errors.companyAddress ? 'border-red-500' : ''
                }`}
              />
              {searchingAddress && (
                <div className="absolute right-3 top-9">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-900"></div>
                </div>
              )}
              {showAddressSuggestions && addressSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {addressSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelectAddress(suggestion)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      {suggestion.display_name}
                    </button>
                  ))}
                </div>
              )}
              {errors.companyAddress && (
                <p className="mt-1 text-sm text-red-600">{errors.companyAddress}</p>
              )}
            </div>

            {/* Industry */}
            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1.5">
                Industry
              </label>
              <select
                id="industry"
                value={formData.industry}
                onChange={(e) => handleChange('industry', e.target.value)}
                style={{ backgroundColor: 'white' }}
                className={`w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none ${
                  errors.industry ? 'border-red-500' : ''
                }`}
              >
                <option value="">Select industry</option>
                {industries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
              {errors.industry && (
                <p className="mt-1 text-sm text-red-600">{errors.industry}</p>
              )}
            </div>

            {/* Privacy and Terms Checkbox */}
            <div className="mb-3 md:mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => {
                    setAgreedToTerms(e.target.checked)
                    if (errors.terms) {
                      setErrors((prev) => ({ ...prev, terms: '' }))
                    }
                  }}
                  className="w-3.5 h-3.5 text-gray-900 bg-white border border-gray-300 rounded focus:ring-0 focus:ring-offset-0 focus:outline-none flex-shrink-0 checked:bg-white checked:border-gray-900"
                />
                <span className="text-xs text-gray-500 leading-relaxed">
                  I agree to the{' '}
                  <Link href="/terms" className="text-gray-900 underline hover:no-underline font-medium">
                    Terms of Service
                  </Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="text-gray-900 underline hover:no-underline font-medium">
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {errors.terms && (
                <p className="mt-1 text-xs text-red-600 ml-6">{errors.terms}</p>
              )}
            </div>

            {/* Continue Button */}
            <button
              type="submit"
              disabled={!agreedToTerms}
              className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Continue
            </button>
          </form>

        </div>

        {/* Footer Copyright */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>DigiPort Ltd, {new Date().getFullYear()}. All rights reserved.</p>
          <div className="mt-2 space-x-3">
            <Link href="#" className="hover:text-gray-700">
              Cookie preferences
            </Link>
            <span>•</span>
            <Link href="#" className="hover:text-gray-700">
              Privacy
            </Link>
            <span>•</span>
            <Link href="#" className="hover:text-gray-700">
              Terms
            </Link>
          </div>
        </div>
      </div>
      </div>
    </div>
    </>
  )
}

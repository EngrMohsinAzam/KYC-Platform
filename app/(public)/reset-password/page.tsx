'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  })

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

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

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

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      // TODO: Implement reset password API call
      console.log('Reset password:', { token, password: formData.password })
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      // Redirect to success page or sign in
      router.push('/reset-password/success')
    } catch (error) {
      console.error('Reset password error:', error)
      setErrors({ password: 'Failed to reset password. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
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
                    src="/kyclogo.svg"
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
      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Reset Password Card */}
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-8 relative">
            {/* Back Button */}
            <button
              onClick={() => router.push('/signin')}
              className="absolute top-6 left-6 w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Go back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Logo */}
            <div className="flex items-center justify-center mb-6">
              <Image
                src="/kyclogo.svg"
                alt="DigiPort Logo"
                width={40}
                height={40}
                className="h-10 w-auto"
                priority
              />
            </div>

            <h1 className="text-2xl font-semibold text-gray-900 mb-2 text-center">Create new password</h1>
            <p className="text-sm text-gray-600 mb-6 text-center">
              Enter your new password below. Make sure it&apos;s strong and secure.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    placeholder="Enter your new password"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent pr-10 ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
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

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    placeholder="Confirm your new password"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent pr-10 ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
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
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Reset Password Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                {loading ? 'Resetting password...' : 'Reset password'}
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
  )
}

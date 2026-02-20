'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { getSignupEmailCookie } from '@/app/(public)/utils/signup-cookie'

const Footer = dynamic(
  () => import('@/components/layout/Footer').then((m) => ({ default: m.Footer })),
  { ssr: true }
)
import { getCompanyToken } from '@/app/api/company-api'
import { AW, BR, GB, SG, US } from 'country-flag-icons/react/3x2'

const COUNTRY_FLAGS: Record<string, React.ComponentType<{ className?: string; title?: string }>> = {
  'Aruba': AW,
  'Brazil': BR,
  'United Kingdom': GB,
  'Singapore': SG,
  'United States': US,
}

export default function LandingPage() {
  const router = useRouter()
  const [signedIn, setSignedIn] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'unilink' | 'sdk' | 'api'>('unilink')
  const [selectedVerificationType, setSelectedVerificationType] = useState<string>('ID Verification')
  const [selectedCountry, setSelectedCountry] = useState<string>('United Kingdom')
  const [passRate, setPassRate] = useState<string>('95.86%')
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right')
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [showDemoModal, setShowDemoModal] = useState(false)
  const [demoForm, setDemoForm] = useState({ name: '', email: '', company: '', phone: '' })
  const [scrolled, setScrolled] = useState(false)
  
  useEffect(() => {
    setSignedIn(!!getSignupEmailCookie() || !!getCompanyToken())
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrolled(typeof window !== 'undefined' && window.scrollY > 0)
    window.addEventListener('scroll', handleScroll)
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Refs for smooth scrolling
  const featuresRef = useRef<HTMLElement>(null)
  const solutionsRef = useRef<HTMLElement>(null)
  const resourcesRef = useRef<HTMLElement>(null)
  const companyRef = useRef<HTMLElement>(null)
  const pricingRef = useRef<HTMLElement>(null)

  // Smooth scroll function
  const scrollToSection = (ref: React.RefObject<HTMLElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Pass rate data and country list (order used for auto-rotation)
  const PASS_RATE_COUNTRIES = ['United Kingdom', 'United States', 'Singapore', 'Brazil', 'Aruba']
  const passRateData: { [key: string]: string } = {
    'United Kingdom': '95.86%',
    'United States': '94.23%',
    'Singapore': '96.12%',
    'Brazil': '92.45%',
    'Aruba': '93.67%'
  }

  // Auto-rotate country every 4 seconds and update pass rate (slide from right)
  useEffect(() => {
    const interval = setInterval(() => {
      setSlideDirection('right')
      setSelectedCountry((prev) => {
        const idx = PASS_RATE_COUNTRIES.indexOf(prev)
        const nextIdx = (idx + 1) % PASS_RATE_COUNTRIES.length
        return PASS_RATE_COUNTRIES[nextIdx]
      })
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setPassRate(passRateData[selectedCountry] || '93.50%')
  }, [selectedCountry])

  // Handle demo form submission
  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert('Thank you for your interest! We will contact you soon.')
    setShowDemoModal(false)
    setDemoForm({ name: '', email: '', company: '', phone: '' })
  }

  const faqs = [
    {
      question: 'What is KYC?',
      answer: 'KYC (Know Your Customer) is a process that businesses use to verify the identity of their clients. DigiPort provides a comprehensive platform for identity verification, ensuring compliance with regulatory requirements while maintaining a smooth user experience.'
    },
    {
      question: 'How does DigiPort work?',
      answer: 'DigiPort uses advanced technology to verify user identities through document verification, facial recognition, and liveness detection. Users can complete the verification process in just five minutes by submitting their government-issued ID and a selfie.'
    },
    {
      question: 'What are the best KYC practices?',
      answer: 'Best KYC practices include using automated verification systems, maintaining data security, ensuring compliance with local regulations, and providing a user-friendly experience. DigiPort implements all these practices to deliver secure and efficient identity verification.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes, DigiPort is designed with strict security and compliance measures in mind. We comply with GDPR, CCPA, and other international data protection regulations. Your data is encrypted and stored securely.'
    },
    {
      question: 'What documents are accepted?',
      answer: 'DigiPort accepts various government-issued documents including passports, national ID cards, and driver\'s licenses. The accepted document types may vary by country and region.'
    }
  ]

  return (
    <div className="min-h-screen bg-white">
     
      <header
        className={`
          sticky top-0 z-50 border-b border-gray-200 transition-all duration-300
          ${scrolled ? 'rounded-full bg-gray-200 shadow-xl mx-24 mt-8 mb-8' : 'bg-white py-2'}
        `}
        style={{
          backdropFilter: scrolled ? 'blur(10px)' : undefined,
          WebkitBackdropFilter: scrolled ? 'blur(10px)' : undefined,
        }}
      >
        <div className="max-w-8xl mx-4 lg:mx-16 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 md:h-16">
            <div className="flex items-center gap-2 md:gap-3 flex-nowrap">
              <Image
                src="/kyclogo.svg"
                alt="DigiPort"
                width={120}
                height={40}
                className="h-6 md:h-8 w-auto flex-shrink-0"
                priority
              />
              <span className="text-[16px] md:text-xl font-bold text-gray-900 whitespace-nowrap">DigiPort</span>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <button onClick={() => scrollToSection(featuresRef)} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Products</button>
              <button onClick={() => scrollToSection(solutionsRef)} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Solutions</button>
              <button onClick={() => scrollToSection(resourcesRef)} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Resources</button>
              <button onClick={() => scrollToSection(companyRef)} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Company</button>
              <button onClick={() => scrollToSection(pricingRef)} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Pricing</button>
              <button onClick={() => router.push('/company/register')} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Company registration</button>
            </nav>
            <div className="flex items-center gap-2 md:space-x-4">
              {signedIn ? (
                <>
                  <Link href="/account-status" className="text-sm text-gray-900 hover:text-gray-700 font-medium">
                    Account
                  </Link>
                  <Link
                    href="/dashboard"
                    className="bg-gray-900 hover:bg-gray-800 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-colors"
                  >
                    Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <button
                    onClick={() => router.push('/signin')}
                    className="text-sm text-gray-900 hover:text-gray-700 transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => router.push('/verify/start')}
                    className="bg-gray-900 hover:bg-gray-800 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-colors"
                  >
                    Get started
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-8 md:pt-12 pb-12 md:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-8xl mx-4 lg:mx-16">
          <div className="grid md:grid-cols-2 gap-6 md:gap-12 items-center">
            {/* Text Content - Mobile: appears first, Desktop: left side */}
            <div className="order-1 md:order-1">
              <h1 className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-semibold text-gray-900 mb-3 md:mb-4 leading-tight">
                Fast KYC, full compliance, and high pass rates—all in one platform
              </h1>
              <p className="text-xs md:text-sm lg:text-base text-gray-600 mb-5 md:mb-6 leading-relaxed">
                Maximize pass rates, stop fraud in its tracks, and stay compliant worldwide with customizable User Verification.
              </p>
              {/* Buttons - Mobile: appears before image, Desktop: stays in text section */}
              <div className="flex flex-row gap-2 sm:gap-3 items-center mb-6 md:mb-0">
                <button
                  onClick={() => router.push(signedIn ? '/dashboard' : '/verify/start')}
                  className="bg-gray-900 hover:bg-gray-800 text-white px-3 md:px-6 py-3 md:py-2.5 rounded-full text-xs md:text-sm font-semibold flex items-center justify-center gap-1 md:gap-2 transition-colors border-2 border-transparent flex-1 sm:flex-initial"
                >
                  {signedIn ? 'Dashboard' : 'Get started'}
                  <svg className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button 
                  onClick={() => setShowDemoModal(true)}
                  className="px-3 md:px-6 py-3 md:py-2.5 border-2 border-gray-900 text-gray-900 rounded-full text-xs md:text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-1 md:gap-2 flex-1 sm:flex-initial"
                >
                  Get a demo
                  <svg className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Image - Mobile: appears after buttons, Desktop: right side */}
            <div className="relative flex items-center justify-center order-2 md:order-2">
              <div className="w-full max-w-full md:max-w-[75%]">
                <Image
                  src="/Hero.png"
                  alt="MIRA KYC Dashboard"
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

      {/* Key Features Section */}
      <section ref={featuresRef} className="py-8 md:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="text-left">
              <div className="flex items-center gap-3 md:flex-col md:items-start mb-2 md:mb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900">Get top pass rates and security</h3>
              </div>
              <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                Achieve high pass rates in any market without compromising on compliance or fraud protection.
              </p>
            </div>
            <div className="text-left">
              <div className="flex items-center gap-3 md:flex-col md:items-start mb-2 md:mb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900">Go global with ease</h3>
              </div>
              <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                One verification provider is all you need. Verify users from any country in just 30 seconds on average.
              </p>
            </div>
            <div className="text-left">
              <div className="flex items-center gap-3 md:flex-col md:items-start mb-2 md:mb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900">Manage everything with one platform</h3>
              </div>
              <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                Customize verification with a range of checks, automate decision-making, and access all key data in one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* All the checks you need Section */}
      <section ref={solutionsRef} className="py-12 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Title and Subtitle */}
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-semibold text-gray-900 mb-3 md:mb-4 px-2 mx-auto max-w-4xl">
              All the checks you need for any regulation, market, or use case
            </h2>
            <p className="text-sm md:text-base text-gray-600 max-w-3xl mx-auto px-2 text-center">
              Compliance and fraud protection aren&apos;t one-size-fits-all. Get a perfect solution for any verification task, in any market.
            </p>
          </div>

          {/* Main Content Container */}
          <div className="bg-gray-50 rounded-xl md:rounded-2xl p-6 md:p-8 lg:p-12">
            <div className="grid md:grid-cols-12 gap-6 md:gap-8 items-start">
              {/* Left: Main Content Area */}
              <div className="md:col-span-8 space-y-8 md:space-y-12">
                {/* Verify users in seconds Section */}
                <div>
                  <h3 className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-900 mb-3 md:mb-4">
                    Verify users in seconds
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">
                    Achieve the highest verification pass rates with our fully automated solution. Customize your flow, add any checks you need, and onboard legitimate users in seconds.
                  </p>
                  {/* Verification Type Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {['ID Verification', 'Non-Doc Verification', 'Liveness & Face Match', 'NFC Verification', 'Age Verification', 'Video Identification', 'Database Check', 'Qualified Electronic Signature (QES)'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setSelectedVerificationType(type)}
                        className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-colors ${
                          selectedVerificationType === type
                            ? 'bg-gray-900 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Verify 25,000+ documents Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
                  <div className="relative flex items-center order-2 md:order-1">
                    <Image
                      src="/user.png"
                      alt="Global Verification Map"
                      width={400}
                      height={280}
                      className="w-full h-auto rounded-lg"
                    />
                  </div>
                  <div className="flex flex-col justify-center order-1 md:order-2">
                    <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900 mb-2 md:mb-3">
                      Verify 25,000+ documents from 220+ countries and territories
                    </h3>
                    <p className="text-xs md:text-sm text-gray-600 mb-4 md:mb-5 leading-relaxed">
                      DigiPort is an all-in-one KYC/AML solution that provides the quickest and easiest identity verification. With our automated KYC system, you get the highest pass rates and strongest anti-fraud protection.
                    </p>
                    <button className="px-4 md:px-5 py-2 md:py-2.5 border-2 border-gray-900 text-gray-900 rounded-full text-xs md:text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2 w-fit">
                      Learn more
                      <svg className="w-3 h-3 md:w-3.5 md:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Sidebar Cards */}
              <div className="md:col-span-4 space-y-3 md:space-y-4">
                {[
                  { id: 'onboarding', title: 'Streamline onboarding', content: 'Reduce onboarding time by up to 70% with automated verification flows. Customize check sequences to match your compliance requirements.' },
                  { id: 'fraud', title: 'Prevent fraud', content: 'Advanced AI-powered fraud detection with real-time risk scoring. Protect your platform from identity theft and synthetic fraud.' },
                  { id: 'poa', title: 'Proof of address (PoA)', content: 'Verify user addresses automatically using utility bills, bank statements, and government documents from 200+ countries.' },
                  { id: 'decentralized', title: 'Decentralized identity', content: 'Support for blockchain-based identity verification and self-sovereign identity (SSI) standards for enhanced privacy and control.' }
                ].map((card) => (
                  <div 
                    key={card.id}
                    className="bg-white border border-gray-200 rounded-lg p-6 md:p-8 cursor-pointer hover:border-gray-300 transition-colors"
                    onClick={() => setExpandedCard(expandedCard === card.id ? null : card.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <h4 className="text-base md:text-lg font-semibold text-gray-900 flex-1">{card.title}</h4>
                      <svg 
                        className={`w-4 h-4 md:w-5 md:h-5 text-gray-400 transition-transform flex-shrink-0 ${expandedCard === card.id ? 'rotate-45' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    {expandedCard === card.id && (
                      <p className="text-xs md:text-sm text-gray-600 mt-3 md:mt-4 leading-relaxed">
                        {card.content}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pass Rate & New Markets Section */}
      <section className="py-8 md:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Left: Pass Rate Calculator */}
            <div className="bg-white rounded-xl p-5 md:p-6 shadow-lg">
              <h2 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900 mb-4 md:mb-5">
                See the average pass rate in your target country
              </h2>

              {/* Result Area - arrows on sides to change country (like image carousel) */}
              <div className="bg-gray-50 rounded-lg p-4 md:p-5 overflow-hidden">
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Left arrow - previous country (touch-friendly on mobile) */}
                  <button
                    type="button"
                    onClick={() => {
                      const idx = PASS_RATE_COUNTRIES.indexOf(selectedCountry)
                      const prevIdx = idx <= 0 ? PASS_RATE_COUNTRIES.length - 1 : idx - 1
                      const prev = PASS_RATE_COUNTRIES[prevIdx]
                      setSlideDirection('left')
                      setSelectedCountry(prev)
                      setPassRate(passRateData[prev] || '93.50%')
                    }}
                    className="flex-shrink-0 min-w-[44px] min-h-[44px] w-10 h-10 md:w-10 md:h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 active:bg-gray-200 hover:border-gray-300 transition-colors touch-manipulation"
                    aria-label="Previous country"
                  >
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Center: flag + country + pass rate (slide from side + shine) */}
                  <div className="flex-1 min-w-0 text-center relative overflow-hidden min-h-[140px] sm:min-h-[160px]">
                    <div
                      key={selectedCountry}
                      className={slideDirection === 'right' ? 'pass-rate-slide-from-right' : 'pass-rate-slide-from-left'}
                    >
                      <div className="mb-2 md:mb-3 flex justify-center">
                        {(() => {
                          const FlagComponent = COUNTRY_FLAGS[selectedCountry]
                          return FlagComponent ? (
                            <FlagComponent
                              title={selectedCountry}
                              className="w-12 md:w-14 h-auto rounded shadow-sm"
                            />
                          ) : (
                            <span className="text-2xl" aria-hidden>🏳️</span>
                          )
                        })()}
                      </div>
                      <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1 md:mb-2">
                        {selectedCountry} — {passRate}
                      </h3>
                      <p className="text-xs text-gray-600 mb-3 md:mb-4">
                        DigiPort&apos;s average pass rate for {selectedCountry} is {passRate}
                      </p>
                      <div className="flex justify-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-900"></div>
                        <div className="w-2 h-2 rounded-full bg-gray-900"></div>
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                      </div>
                    </div>
                    {/* Shine layer - sweeps across on change */}
                    <div key={`shine-${selectedCountry}`} className="pass-rate-shine" aria-hidden />
                  </div>

                  {/* Right arrow - next country (touch-friendly on mobile) */}
                  <button
                    type="button"
                    onClick={() => {
                      const idx = PASS_RATE_COUNTRIES.indexOf(selectedCountry)
                      const nextIdx = (idx + 1) % PASS_RATE_COUNTRIES.length
                      const next = PASS_RATE_COUNTRIES[nextIdx]
                      setSlideDirection('right')
                      setSelectedCountry(next)
                      setPassRate(passRateData[next] || '93.50%')
                    }}
                    className="flex-shrink-0 min-w-[44px] min-h-[44px] w-10 h-10 md:w-10 md:h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 active:bg-gray-200 hover:border-gray-300 transition-colors touch-manipulation"
                    aria-label="Next country"
                  >
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Right: New Markets */}
            <div className="bg-white rounded-xl p-5 md:p-6">
              <h2 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900 mb-5 md:mb-6">
                Open doors to new markets with big results
              </h2>

              <div className="space-y-5 md:space-y-6">
                {/* Feature 1 */}
                <div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-1 md:mb-2">
                        Get high pass rates wherever you operate
                      </h3>
                      <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                        Get 90%+ pass rates on average. Ensure easy communication in 50+ interface languages and break down barriers with AI-based OCR that supports any script.
                      </p>
                    </div>
                    </div>
                  </div>

                {/* Feature 2 */}
                <div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-1 md:mb-2">
                        Expand with local expertise
                      </h3>
                      <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                        Expand into any market with confidence. DigiPort offers local data processing, access to trusted regional databases, and full regulatory compliance, enhanced by our deep expertise in regional markets.
                      </p>
                    </div>
                  </div>
                </div>
                    </div>
                </div>
          </div>
        </div>
      </section>

      {/* Product Tours Section */}
      <section ref={resourcesRef} className="py-8 md:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-900 mb-6 md:mb-10 text-center px-2">
            See how you can set up efficient flows with our product tours
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {/* Orchestrate everything */}
            <div className="bg-white rounded-xl overflow-hidden">
              <div className="w-full h-40 md:h-48 bg-gray-100 overflow-hidden">
                <Image
                  src="/image1.png"
                  alt="Orchestrate everything"
                  width={400}
                  height={200}
                  className="w-full h-full object-cover"
                />
                </div>
              <div className="p-4 md:p-6">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2 md:mb-3">Orchestrate everything</h3>
                <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4 leading-relaxed">
                  Turn your AML requirements into an actionable flow. Set up unique logic for various countries, risk levels, and other criteria—code-free.
                </p>
                <button 
                  onClick={() => setShowDemoModal(true)}
                  className="text-xs md:text-sm font-semibold text-gray-900 hover:text-gray-700 transition-colors flex items-center gap-2"
                >
                  See how it works
                  <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>

            {/* Build custom flows */}
            <div className="bg-white rounded-xl overflow-hidden">
              <div className="w-full h-40 md:h-48 bg-gray-100 overflow-hidden">
                <Image
                  src="/image2.png"
                  alt="Build custom flows"
                  width={400}
                  height={200}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 md:p-6">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2 md:mb-3">Build custom flows</h3>
                <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4 leading-relaxed">
                  Create user journeys with tailored check sequences. Add triggers and condition-based actions for multiple countries to automate verification flows.
                </p>
                <button 
                  onClick={() => setShowDemoModal(true)}
                  className="text-xs md:text-sm font-semibold text-gray-900 hover:text-gray-700 transition-colors flex items-center gap-2"
                >
                  See how it works
                  <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                </button>
                        </div>
                      </div>

            {/* Design user journeys */}
            <div className="bg-white rounded-xl overflow-hidden sm:col-span-2 md:col-span-1">
              <div className="w-full h-40 md:h-48 bg-gray-100 overflow-hidden">
                <Image
                  src="/image3.png"
                  alt="Design user journeys"
                  width={400}
                  height={200}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 md:p-6">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2 md:mb-3">Design user journeys</h3>
                <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4 leading-relaxed">
                  Offer user-friendly verification flows optimized for top pass rates. Our pre-built KYC journeys are based on the experience of millions of people.
                </p>
                <button 
                  onClick={() => setShowDemoModal(true)}
                  className="text-xs md:text-sm font-semibold text-gray-900 hover:text-gray-700 transition-colors flex items-center gap-2"
                >
                  See how it works
                  <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                </button>
                        </div>
                      </div>
                    </div>
                  </div>
      </section>

      {/* ROI Calculation Section */}
      <section className="py-8 md:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gray-900 text-white rounded-xl md:rounded-2xl p-6 md:p-8 lg:p-12 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Left: Text Content */}
              <div className="order-2 md:order-1">
                <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold mb-3 leading-tight">
                  Get a customized ROI calculation for your business
                    </h2>
                <p className="text-xs md:text-sm lg:text-base text-gray-300 mb-4 md:mb-5 leading-relaxed">
                  Fill out a simple form to see how DigiPort can help you cut costs and increase revenue.
                </p>
                <button 
                  onClick={() => router.push('/verify/start')}
                  className="bg-white text-gray-900 hover:bg-gray-100 px-4 md:px-5 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  Get Started
                  <svg className="w-3 h-3 md:w-3.5 md:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                    </div>
                    
              {/* Right: Abstract Wave Graphics */}
              <div className="relative h-40 md:h-48 lg:h-64 overflow-hidden rounded-lg order-1 md:order-2">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800">
                  {/* Wave-like shapes */}
                  <div className="absolute bottom-0 left-0 w-full h-20 md:h-24 bg-gray-700 rounded-t-full opacity-50"></div>
                  <div className="absolute bottom-0 left-0 w-full h-16 md:h-20 bg-gray-600 rounded-t-full opacity-40 transform translate-x-8"></div>
                  <div className="absolute bottom-0 left-0 w-full h-12 md:h-16 bg-gray-500 rounded-t-full opacity-30 transform translate-x-16"></div>
                  <div className="absolute top-0 right-0 w-20 md:w-24 h-20 md:h-24 bg-gray-700 rounded-full opacity-40"></div>
                  <div className="absolute top-4 md:top-6 right-4 md:right-6 w-16 md:w-20 h-16 md:h-20 bg-gray-600 rounded-full opacity-30"></div>
                      </div>
                  </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="py-8 md:py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* Title */}
          <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-900 mb-6 md:mb-8 text-center">Integrations</h2>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 md:mb-8 justify-center">
            <button 
              onClick={() => setActiveTab('unilink')}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-colors ${
                activeTab === 'unilink'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Unilink
            </button>
            <button 
              onClick={() => setActiveTab('sdk')}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-colors ${
                activeTab === 'sdk'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Web and Mobile SDK
            </button>
            <button 
              onClick={() => setActiveTab('api')}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-colors ${
                activeTab === 'api'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              API
            </button>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
            {/* Left: Text Content */}
            <div className="order-2 md:order-1">
              {activeTab === 'unilink' && (
                <>
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-900 mb-3 md:mb-4">Unilink</h2>
                  <p className="text-sm md:text-base text-gray-600 mb-5 md:mb-6 leading-relaxed">
                    Skip the integration process entirely and add an identity verification link or QR code to your website. Your customers can pass verification immediately by simply clicking the link.
                  </p>
                  <button className="px-4 md:px-5 py-2 md:py-2.5 bg-white border border-gray-300 text-gray-900 rounded-lg text-xs md:text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2">
                    View docs
                    <svg className="w-3 h-3 md:w-3.5 md:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}

              {activeTab === 'sdk' && (
                <>
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-900 mb-3 md:mb-4">Web and Mobile SDK</h2>
                  <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-5 leading-relaxed">
                    Integrate DigiPort&apos;s verification flow directly into your web or mobile application with our lightweight SDK. Support for React, Vue, Angular, iOS, and Android.
                  </p>
                  <div className="bg-gray-900 rounded-lg p-3 md:p-4 mb-4 md:mb-5 overflow-x-auto">
                    <pre className="text-xs md:text-sm text-gray-300 font-mono">
                      <code>{`npm install @digiport/sdk

import { DigiPortSDK } from '@digiport/sdk';

const sdk = new DigiPortSDK({
  apiKey: 'your-api-key',
  environment: 'production'
});

sdk.startVerification({
  userId: 'user-123',
  callback: (result) => {
    console.log(result);
  }
});`}</code>
                    </pre>
                  </div>
                  <button className="px-4 md:px-5 py-2 md:py-2.5 bg-white border border-gray-300 text-gray-900 rounded-lg text-xs md:text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2">
                    View docs
                    <svg className="w-3 h-3 md:w-3.5 md:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}

              {activeTab === 'api' && (
                <>
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-900 mb-3 md:mb-4">REST API</h2>
                  <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-5 leading-relaxed">
                    Build custom integrations with our comprehensive REST API. Full control over verification flows, webhooks for real-time updates, and detailed analytics.
                  </p>
                  <div className="bg-gray-900 rounded-lg p-3 md:p-4 mb-4 md:mb-5 overflow-x-auto">
                    <pre className="text-xs md:text-sm text-gray-300 font-mono">
                      <code>{`POST https://api.digiport.com/v1/verification

Headers:
  Authorization: Bearer YOUR_API_KEY
  Content-Type: application/json

Body:
{
  "userId": "user-123",
  "type": "identity",
  "country": "US",
  "callbackUrl": "https://yourapp.com/webhook"
}`}</code>
                    </pre>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4 md:mb-5">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">REST API</span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">Webhooks</span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">GraphQL</span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">Rate Limits</span>
                  </div>
                  <button className="px-4 md:px-5 py-2 md:py-2.5 bg-white border border-gray-300 text-gray-900 rounded-lg text-xs md:text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2">
                    View API docs
                    <svg className="w-3 h-3 md:w-3.5 md:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* Right: Visual Content */}
            <div className="bg-white rounded-xl p-5 md:p-6 flex items-center justify-center border border-gray-200 order-1 md:order-2">
              {activeTab === 'unilink' && (
                <Image
                  src="/QRCode.png"
                  alt="QR Code"
                  width={256}
                  height={256}
                  className="w-44 h-44 md:w-60 md:h-60"
                />
              )}
              {activeTab === 'sdk' && (
                <div className="w-full space-y-3">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-xs md:text-sm font-semibold text-gray-900">SDK Ready</span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-2 bg-gray-300 rounded w-2/3"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 rounded p-3 text-center border border-gray-200">
                      <div className="text-lg md:text-xl font-bold text-gray-900 mb-1">5min</div>
                      <div className="text-xs text-gray-600">Setup Time</div>
                    </div>
                    <div className="bg-gray-50 rounded p-3 text-center border border-gray-200">
                      <div className="text-lg md:text-xl font-bold text-gray-900 mb-1">100%</div>
                      <div className="text-xs text-gray-600">Customizable</div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'api' && (
                <div className="w-full space-y-3">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-xs md:text-sm font-semibold text-gray-900">API Status: Online</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Uptime</span>
                        <span className="text-xs font-semibold text-gray-900">99.9%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Response Time</span>
                        <span className="text-xs font-semibold text-gray-900">120ms</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Requests/sec</span>
                        <span className="text-xs font-semibold text-gray-900">1,250</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-3 text-center">
                    <div className="text-white text-xs md:text-sm font-mono">api.digiport.com</div>
                    <div className="text-gray-400 text-xs mt-1">v1.0.0</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-12 md:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-gray-900 text-white rounded-xl p-6 md:p-8 sm:col-span-2 md:col-span-1">
              <p className="text-sm md:text-base lg:text-lg mb-0 md:mb-4">One more than just user verification, it&apos;s the power of platform.</p>
            </div>
            <div className="bg-white rounded-xl p-6 md:p-8 shadow-lg text-center">
              <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">70%</div>
              <p className="text-xs md:text-sm text-gray-600">Onboarding cost reduction</p>
            </div>
            <div className="bg-white rounded-xl p-6 md:p-8 shadow-lg text-center">
              <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">52.6M</div>
              <p className="text-xs md:text-sm text-gray-600">Cost-efficient KYC processes</p>
            </div>
            <div className="bg-white rounded-xl p-6 md:p-8 shadow-lg">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full mb-3 md:mb-4 mx-auto"></div>
              <p className="text-xs md:text-sm text-gray-600 text-center">Customer testimonial</p>
            </div>
          </div>
        </div>
      </section>

      {/* Security and Compliance Section */}
      <section ref={companyRef} className="py-8 md:py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-900 mb-6 md:mb-10 text-center px-2">
            Designed with strict security<br className="hidden md:block" /> and compliance measures in mind
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            {/* Row 1 */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 flex flex-col items-center justify-center text-center min-h-[120px] md:min-h-[140px]">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-900 rounded mb-2 md:mb-3 flex items-center justify-center">
                <span className="text-white text-[10px] md:text-xs font-bold">A</span>
              </div>
              <p className="text-[10px] md:text-xs font-semibold text-gray-900 mb-1">e-IDVT Certification</p>
              <p className="text-[8px] md:text-[10px] text-gray-600 leading-tight">Technology Requirement for Identity Document Validation Technology</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 flex flex-col items-center justify-center text-center min-h-[120px] md:min-h-[140px]">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-full mb-2 md:mb-3 flex items-center justify-center">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-[10px] md:text-xs font-semibold text-gray-900">GDPR READY</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 flex flex-col items-center justify-center text-center min-h-[120px] md:min-h-[140px]">
              <div className="mb-2 md:mb-3">
                <p className="text-base md:text-lg font-bold text-gray-900">PCI</p>
                <p className="text-[10px] md:text-xs text-gray-900">DSS</p>
                <p className="text-[8px] md:text-[10px] text-gray-600 mt-1">COMPLIANT</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 flex flex-col items-center justify-center text-center min-h-[120px] md:min-h-[140px]">
              <div className="mb-2 md:mb-3">
                <p className="text-base md:text-lg font-bold text-gray-900">ISO</p>
                <p className="text-xs md:text-sm font-semibold text-gray-900">27001</p>
              </div>
            </div>

            {/* Row 2 */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 flex flex-col items-center justify-center text-center min-h-[120px] md:min-h-[140px]">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-900 rounded-full mb-2 md:mb-3 flex items-center justify-center">
                <p className="text-white text-[10px] md:text-xs font-semibold">AICPA</p>
                <p className="text-white text-[10px] md:text-xs font-semibold">SOC</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 flex flex-col items-center justify-center text-center min-h-[120px] md:min-h-[140px]">
              <div className="mb-2 md:mb-3">
                <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
                  <p className="text-xs md:text-sm font-bold text-gray-900">iBeta</p>
                  <svg className="w-3 h-3 md:w-4 md:h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-[8px] md:text-[10px] text-gray-600 leading-tight">LEVEL 1 ISO 30107-3 Presentation Attack Detection COMPLIANT</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 flex flex-col items-center justify-center text-center min-h-[120px] md:min-h-[140px]">
              <div className="mb-2 md:mb-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-900 rounded mb-1 md:mb-2 flex items-center justify-center mx-auto">
                  <span className="text-white text-[10px] md:text-xs font-bold">A</span>
                </div>
                <p className="text-[8px] md:text-[10px] font-semibold text-gray-900 mb-1">Data & Privacy Certification</p>
                <p className="text-[7px] md:text-[9px] text-gray-600 leading-tight">UK GDPR APPROVED</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 flex flex-col items-center justify-center text-center min-h-[120px] md:min-h-[140px]">
              <div className="w-10 h-10 md:w-12 md:h-12 border-2 border-gray-900 rounded mb-2 md:mb-3 flex items-center justify-center">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs md:text-sm font-bold text-gray-900">CCPA</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section ref={pricingRef} className="py-8 md:py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold text-gray-900 mb-6 md:mb-8 text-center">FAQ</h2>
          <div className="space-y-3 md:space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg bg-white">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-4 md:px-6 py-3 md:py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm md:text-base font-semibold text-gray-900 pr-4">{faq.question}</span>
                  <svg
                    className={`w-4 h-4 md:w-5 md:h-5 text-gray-600 transition-transform flex-shrink-0 ${openFaq === index ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
                </button>
                {openFaq === index && (
                  <div className="px-4 md:px-6 py-3 md:py-4 border-t border-gray-200">
                    <p className="text-xs md:text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Demo Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 md:p-8 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowDemoModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2">Request a Demo</h2>
            <p className="text-sm text-gray-600 mb-6">Fill out the form below and we&apos;ll get back to you soon.</p>
            <form onSubmit={handleDemoSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={demoForm.name}
                  onChange={(e) => setDemoForm({ ...demoForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={demoForm.email}
                  onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
                  placeholder="john@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input
                  type="text"
                  required
                  value={demoForm.company}
                  onChange={(e) => setDemoForm({ ...demoForm, company: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
                  placeholder="Company Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
                <input
                  type="tel"
                  value={demoForm.phone}
                  onChange={(e) => setDemoForm({ ...demoForm, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDemoModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  Request Demo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

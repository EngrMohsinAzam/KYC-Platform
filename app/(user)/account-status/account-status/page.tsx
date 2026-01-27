'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Footer } from '@/components/layout/Footer'

export default function AccountStatusPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [accountStatus, setAccountStatus] = useState<'verified' | 'pending'>('verified')
  const [copiedKey, setCopiedKey] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedCompany, setCopiedCompany] = useState(false)
  const [copiedPassword, setCopiedPassword] = useState(false)
  const [selectedFramework, setSelectedFramework] = useState<string>('react')
  
  // Dummy data - will be replaced with backend data
  const apiKey = process.env.NEXT_PUBLIC_STRIPE_API_KEY || 'sk_test_placeholder_key'
  const companyName = 'Example Company Ltd'
  const password = 'SecurePassword123!'

  // Framework code examples
  const frameworkCodes: { [key: string]: string } = {
    react: `import { DigiPort } from '@digiport/react';

function App() {
  const client = new DigiPort({
    apiKey: '${apiKey}'
  });
  
  return <div>Your app</div>;
}`,
    nextjs: `import { DigiPort } from '@digiport/nextjs';

export default function Page() {
  const client = new DigiPort({
    apiKey: '${apiKey}'
  });
  
  return <div>Your page</div>;
}`,
    vue: `import { DigiPort } from '@digiport/vue';
import { ref } from 'vue';

export default {
  setup() {
    const client = new DigiPort({
      apiKey: '${apiKey}'
    });
  }
}`,
    angular: `import { DigiPort } from '@digiport/angular';

@Component({
  selector: 'app-root'
})
export class AppComponent {
  client = new DigiPort({
    apiKey: '${apiKey}'
  });
}`,
    nodejs: `const { DigiPort } = require('@digiport/nodejs');

const client = new DigiPort({
  apiKey: '${apiKey}'
});`,
    python: `from digiport import DigiPort

client = DigiPort(
    api_key='${apiKey}'
)`,
    curl: `curl https://api.digiport.com/v1/verify \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"userId": "user-123"}'`
  }

  const apiCode = frameworkCodes[selectedFramework] || frameworkCodes.react

  // Check for status in URL params, default to verified
  useEffect(() => {
    const status = searchParams.get('status')
    if (status === 'pending') {
      setAccountStatus('pending')
    } else {
      setAccountStatus('verified')
    }
  }, [searchParams])

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(apiCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleCopyCompany = () => {
    navigator.clipboard.writeText(companyName)
    setCopiedCompany(true)
    setTimeout(() => setCopiedCompany(false), 2000)
  }

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(password)
    setCopiedPassword(true)
    setTimeout(() => setCopiedPassword(false), 2000)
  }

  return (
    <div className="min-h-screen bg-white">
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
              <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Products</a>
              <a href="#solutions" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Solutions</a>
              <a href="#resources" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Resources</a>
              <a href="#company" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Company</a>
              <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
            </nav>
            <div className="flex items-center gap-2 md:space-x-4">
              <button
                className="hidden md:block text-sm text-gray-900 hover:text-gray-700 transition-colors"
                onClick={() => router.push('/signin')}
              >
                Sign In
              </button>
              <button
                className="bg-gray-900 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium hover:bg-gray-800 transition-colors"
                onClick={() => router.push('/')}
              >
                Get started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Pending State */}
        {accountStatus === 'pending' && (
          <div className="space-y-6 md:space-y-8">
            {/* Title Section */}
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-900 mb-2 md:mb-3">Account Pending</h1>
              <p className="text-sm md:text-base text-gray-600">Your account verification is in progress</p>
            </div>

            {/* Pending Status Card */}
            <div className="bg-gray-50 rounded-lg md:rounded-xl p-5 md:p-6 border border-gray-200">
              <div className="flex flex-col items-center justify-center text-center py-8 md:py-12">
                {/* Professional Loading Animation */}
                <div className="relative w-32 h-32 md:w-40 md:h-40 mb-8 md:mb-10 flex items-center justify-center mx-auto">
                  <style jsx>{`
                    @keyframes orbit {
                      from {
                        transform: rotate(0deg) translateX(40%) rotate(0deg);
                      }
                      to {
                        transform: rotate(360deg) translateX(40%) rotate(-360deg);
                      }
                    }
                    @keyframes orbitReverse {
                      from {
                        transform: rotate(0deg) translateX(28%) rotate(0deg);
                      }
                      to {
                        transform: rotate(-360deg) translateX(28%) rotate(360deg);
                      }
                    }
                    @keyframes pulse {
                      0%, 100% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1);
                      }
                      50% {
                        opacity: 0.7;
                        transform: translate(-50%, -50%) scale(1.1);
                      }
                    }
                    @keyframes wave {
                      0%, 100% {
                        transform: translateY(0) scaleY(1);
                        opacity: 0.4;
                      }
                      50% {
                        transform: translateY(-12px) scaleY(1.2);
                        opacity: 1;
                      }
                    }
                    @keyframes rotate {
                      from {
                        transform: translate(-50%, -50%) rotate(0deg);
                      }
                      to {
                        transform: translate(-50%, -50%) rotate(360deg);
                      }
                    }
                    .loading-container {
                      position: relative;
                      width: 100%;
                      height: 100%;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                    }
                    .orbit-ring {
                      position: absolute;
                      width: 85%;
                      height: 85%;
                      border: 2px solid #e5e7eb;
                      border-radius: 50%;
                      top: 50%;
                      left: 50%;
                      transform: translate(-50%, -50%);
                    }
                    .orbit-dot {
                      position: absolute;
                      width: 10px;
                      height: 10px;
                      background: #111827;
                      border-radius: 50%;
                      top: 50%;
                      left: 50%;
                      transform-origin: center;
                      box-shadow: 0 0 8px rgba(17, 24, 39, 0.3);
                    }
                    .orbit-dot-1 {
                      animation: orbit 3s linear infinite;
                    }
                    .orbit-dot-2 {
                      animation: orbitReverse 2.5s linear infinite;
                      width: 8px;
                      height: 8px;
                    }
                    .center-circle {
                      position: absolute;
                      width: 20px;
                      height: 20px;
                      background: linear-gradient(135deg, #111827 0%, #374151 100%);
                      border-radius: 50%;
                      top: 50%;
                      left: 50%;
                      animation: pulse 3s ease-in-out infinite;
                      box-shadow: 0 0 12px rgba(17, 24, 39, 0.4);
                    }
                    .rotating-ring {
                      position: absolute;
                      width: 75%;
                      height: 75%;
                      border: 3px solid transparent;
                      border-top-color: #111827;
                      border-right-color: #111827;
                      border-radius: 50%;
                      top: 50%;
                      left: 50%;
                      animation: rotate 2s linear infinite;
                    }
                    .wave-bars {
                      display: flex;
                      gap: 4px;
                      position: absolute;
                      bottom: -36px;
                      left: 50%;
                      transform: translateX(-50%);
                      align-items: center;
                      justify-content: center;
                    }
                    .wave-bar {
                      width: 4px;
                      height: 20px;
                      background: #111827;
                      border-radius: 2px;
                      animation: wave 1.8s ease-in-out infinite;
                    }
                    .wave-bar:nth-child(1) {
                      animation-delay: 0s;
                    }
                    .wave-bar:nth-child(2) {
                      animation-delay: 0.15s;
                    }
                    .wave-bar:nth-child(3) {
                      animation-delay: 0.3s;
                    }
                    .wave-bar:nth-child(4) {
                      animation-delay: 0.45s;
                    }
                    .wave-bar:nth-child(5) {
                      animation-delay: 0.6s;
                    }
                    @media (min-width: 768px) {
                      @keyframes orbit {
                        from {
                          transform: rotate(0deg) translateX(45%) rotate(0deg);
                        }
                        to {
                          transform: rotate(360deg) translateX(45%) rotate(-360deg);
                        }
                      }
                      @keyframes orbitReverse {
                        from {
                          transform: rotate(0deg) translateX(32%) rotate(0deg);
                        }
                        to {
                          transform: rotate(-360deg) translateX(32%) rotate(360deg);
                        }
                      }
                      .orbit-dot {
                        width: 12px;
                        height: 12px;
                      }
                      .orbit-dot-2 {
                        width: 10px;
                        height: 10px;
                      }
                      .center-circle {
                        width: 24px;
                        height: 24px;
                      }
                      .wave-bar {
                        width: 5px;
                        height: 24px;
                      }
                      .wave-bars {
                        gap: 5px;
                        bottom: -44px;
                      }
                    }
                  `}</style>
                  <div className="loading-container">
                    {/* Rotating Ring */}
                    <div className="rotating-ring"></div>
                    {/* Orbit Ring Background */}
                    <div className="orbit-ring"></div>
                    {/* Orbiting Dots */}
                    <div className="orbit-dot orbit-dot-1"></div>
                    <div className="orbit-dot orbit-dot-2"></div>
                    {/* Center Circle */}
                    <div className="center-circle"></div>
                    {/* Wave Bars */}
                    <div className="wave-bars">
                      <div className="wave-bar"></div>
                      <div className="wave-bar"></div>
                      <div className="wave-bar"></div>
                      <div className="wave-bar"></div>
                      <div className="wave-bar"></div>
                    </div>
                  </div>
                </div>
                <p className="text-sm md:text-base lg:text-lg text-gray-600 max-w-2xl mb-8 md:mb-10 leading-relaxed">
                  Your account verification is pending. We&apos;ll notify you once it&apos;s complete.
                </p>
              </div>
            </div>

            {/* Continue Button */}
            <div className="pt-2 flex justify-center">
              <button
                onClick={() => router.push('/signin')}
                className="bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2 px-6 rounded-lg transition-colors text-sm"
              >
                Continue to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Verified State */}
        {accountStatus === 'verified' && (
          <div className="space-y-6 md:space-y-8">
            {/* Welcome Section */}
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-900 mb-2 md:mb-3">Welcome to DigiPort</h1>
              <p className="text-sm md:text-base text-gray-600">Your account has been verified successfully</p>
            </div>

            {/* Warning Banner */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg md:rounded-xl p-4 md:p-5 flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-xs md:text-sm text-yellow-800 leading-relaxed">
                <strong>Important:</strong> This information is visible only once. Please save your API key and password securely.
              </p>
            </div>

            {/* API Key Section */}
            <div className="bg-gray-50 rounded-lg md:rounded-xl p-5 md:p-6 border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-3">API Key</label>
              <div className="bg-white border border-gray-300 rounded-lg px-4 py-3 flex items-center gap-3">
                <code className="flex-1 text-xs md:text-sm font-mono text-gray-900 break-all">
                  {apiKey}
                </code>
                <button
                  onClick={handleCopyKey}
                  className="flex-shrink-0 p-1.5 hover:bg-gray-100 rounded transition-colors"
                  title={copiedKey ? "Copied!" : "Copy to clipboard"}
                >
                  {copiedKey ? (
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* API Code Section */}
            <div className="bg-gray-50 rounded-lg md:rounded-xl p-5 md:p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">API Code Example</label>
                {/* Framework Selector */}
                <div className="flex items-center gap-2">
                  <select
                    value={selectedFramework}
                    onChange={(e) => {
                      setSelectedFramework(e.target.value)
                      setCopiedCode(false)
                    }}
                    className="text-xs md:text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="react">React.js</option>
                    <option value="nextjs">Next.js</option>
                    <option value="vue">Vue.js</option>
                    <option value="angular">Angular</option>
                    <option value="nodejs">Node.js</option>
                    <option value="python">Python</option>
                    <option value="curl">cURL</option>
                  </select>
                </div>
              </div>
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 md:p-5 text-xs md:text-sm font-mono overflow-x-auto pr-12">
                  <code>{apiCode}</code>
                </pre>
                <button
                  onClick={handleCopyCode}
                  className="absolute top-3 right-3 p-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                  title={copiedCode ? "Copied!" : "Copy to clipboard"}
                >
                  {copiedCode ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Company Name and Password Section */}
            <div className="bg-gray-50 rounded-lg md:rounded-xl p-5 md:p-6 border border-gray-200">
              <p className="text-xs text-gray-600 mb-4 text-center">Use these credentials to login in dashboard</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Company Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Company Name</label>
                  <div className="bg-white border border-gray-300 rounded-lg px-4 py-3 flex items-center gap-3">
                    <span className="flex-1 text-sm md:text-base text-gray-900">
                      {companyName}
                    </span>
                    <button
                      onClick={handleCopyCompany}
                      className="flex-shrink-0 p-1.5 hover:bg-gray-100 rounded transition-colors"
                      title={copiedCompany ? "Copied!" : "Copy to clipboard"}
                    >
                      {copiedCompany ? (
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Password</label>
                  <div className="bg-white border border-gray-300 rounded-lg px-4 py-3 flex items-center gap-3">
                    <span className="flex-1 text-sm md:text-base font-mono text-gray-900">
                      {password}
                    </span>
                    <button
                      onClick={handleCopyPassword}
                      className="flex-shrink-0 p-1.5 hover:bg-gray-100 rounded transition-colors"
                      title={copiedPassword ? "Copied!" : "Copy to clipboard"}
                    >
                      {copiedPassword ? (
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Continue Button */}
            <div className="pt-2 flex justify-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2 px-6 rounded-lg transition-colors text-sm"
              >
                Continue to Dashboard
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}

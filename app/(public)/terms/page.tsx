'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export default function TermsOfServicePage() {
  const router = useRouter()
  const lastUpdated = 'January 27, 2025'

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 md:h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="p-2 -ml-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Back to home"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <Link href="/" className="flex items-center gap-2">
                <Image src="/kyclogo.svg" alt="DigiPort" width={32} height={32} className="h-7 w-auto" />
                <span className="text-base md:text-lg font-bold text-gray-900">DigiPort</span>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/signin"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 hidden sm:block"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="prose prose-gray max-w-none">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Terms of Service
          </h1>
          <p className="text-sm text-gray-500 mb-10">
            Last updated: {lastUpdated}
          </p>

          <div className="space-y-10 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing or using the DigiPort platform, including our identity verification,
                KYC (Know Your Customer), and related services (“Services”), you agree to be bound
                by these Terms of Service (“Terms”). If you are using the Services on behalf of a
                company or other entity, you represent that you have the authority to bind that
                entity to these Terms. If you do not agree to these Terms, you may not use our
                Services.
              </p>
            </section>

            <section>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3">
                2. Description of Services
              </h2>
              <p className="mb-3">
                DigiPort provides identity verification and KYC solutions, including but not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Document verification (passports, national IDs, driver&apos;s licenses)</li>
                <li>Liveness detection and facial matching</li>
                <li>Address verification and proof-of-address checks</li>
                <li>Business verification and anti-money laundering (AML) screening</li>
                <li>API, SDK, and Unilink integration options</li>
                <li>Decentralized identity and blockchain-based verification</li>
              </ul>
              <p className="mt-4">
                We reserve the right to modify, suspend, or discontinue any part of the Services at
                any time with or without notice.
              </p>
            </section>

            <section>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3">
                3. Account Registration and Security
              </h2>
              <p>
                To access certain Services, you must create an account and provide accurate, current,
                and complete information. You are responsible for maintaining the confidentiality of
                your account credentials and for all activities that occur under your account. You
                must notify us immediately of any unauthorized use. We are not liable for any loss
                or damage arising from your failure to protect your account.
              </p>
            </section>

            <section>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3">
                4. Use of Services and Acceptable Use
              </h2>
              <p className="mb-3">
                You agree to use the Services only for lawful purposes and in accordance with these
                Terms, applicable laws, and regulations. You must not:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the Services to verify false or fraudulent identities or documents</li>
                <li>Attempt to circumvent, disable, or interfere with security or verification features</li>
                <li>Resell, sublicense, or commercially exploit the Services without our written consent</li>
                <li>Use the Services in any way that could harm, overload, or impair our systems</li>
                <li>Violate any third-party rights or applicable data protection or privacy laws</li>
              </ul>
              <p className="mt-4">
                We may suspend or terminate your access if we reasonably believe you have violated
                these Terms or applicable law.
              </p>
            </section>

            <section>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3">
                5. Verification Results and Compliance
              </h2>
              <p>
                Verification results (“Results”) are provided for informational and compliance
                assistance only. You remain responsible for your own compliance with AML, KYC,
                sanctions, and other regulatory requirements. DigiPort does not guarantee the
                accuracy, completeness, or suitability of Results for any particular purpose. You
                must conduct your own due diligence and seek legal or compliance advice where
                appropriate.
              </p>
            </section>

            <section>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3">
                6. Intellectual Property
              </h2>
              <p>
                All intellectual property rights in the Services, including software, design,
                branding, and documentation, remain the property of DigiPort or its licensors.
                You receive only a limited, non-exclusive, revocable right to use the Services as
                permitted under these Terms. You must not copy, modify, distribute, or create
                derivative works from our materials without prior written consent.
              </p>
            </section>

            <section>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3">
                7. Data Protection and Privacy
              </h2>
              <p>
                Our collection, use, and disclosure of personal data in connection with the
                Services are described in our{' '}
                <Link href="/privacy" className="text-gray-900 font-medium underline hover:no-underline">
                  Privacy Policy
                </Link>
                . By using the Services, you also agree to our Privacy Policy. You must ensure
                that your use of the Services and any data you provide complies with applicable
                data protection laws, including GDPR, CCPA, and similar regulations.
              </p>
            </section>

            <section>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3">
                8. Fees and Payment
              </h2>
              <p>
                Fees for the Services are set out in your agreement, order form, or our pricing
                page. You agree to pay all applicable fees when due. We may change pricing with
                reasonable notice. Failure to pay may result in suspension or termination of
                access. All fees are non-refundable unless otherwise specified in a separate
                agreement.
              </p>
            </section>

            <section>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3">
                9. Disclaimers
              </h2>
              <p>
                THE SERVICES ARE PROVIDED “AS IS” AND “AS AVAILABLE” WITHOUT WARRANTIES OF ANY
                KIND, EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY LAW, DIGIPORT
                DISCLAIMS ALL WARRANTIES, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR
                PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICES WILL BE
                UNINTERRUPTED, ERROR-FREE, OR SECURE.
              </p>
            </section>

            <section>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3">
                10. Limitation of Liability
              </h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, DIGIPORT AND ITS AFFILIATES, OFFICERS,
                DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
                SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR ANY LOSS OF PROFITS, DATA,
                OR GOODWILL, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICES. OUR TOTAL
                LIABILITY FOR ANY CLAIMS ARISING UNDER THESE TERMS SHALL NOT EXCEED THE AMOUNT
                YOU PAID US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR ONE HUNDRED
                DOLLARS (USD 100), WHICHEVER IS GREATER.
              </p>
            </section>

            <section>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3">
                11. Indemnification
              </h2>
              <p>
                You agree to indemnify, defend, and hold harmless DigiPort and its affiliates,
                officers, directors, employees, and agents from and against any claims, damages,
                losses, liabilities, and expenses (including reasonable legal fees) arising out
                of or related to your use of the Services, your violation of these Terms, or your
                violation of any third-party rights or applicable law.
              </p>
            </section>

            <section>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3">
                12. Termination
              </h2>
              <p>
                We may suspend or terminate your access to the Services at any time, with or
                without cause or notice. You may stop using the Services at any time. Upon
                termination, your right to use the Services ceases immediately. Provisions that
                by their nature should survive (including disclaimers, limitation of liability,
                and indemnification) will remain in effect.
              </p>
            </section>

            <section>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3">
                13. Governing Law and Disputes
              </h2>
              <p>
                These Terms are governed by the laws of the United Kingdom, without regard to
                conflict-of-law principles. Any disputes arising out of or relating to these
                Terms or the Services shall be resolved exclusively in the courts of England and
                Wales, unless otherwise required by mandatory law.
              </p>
            </section>

            <section>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3">
                14. Changes to Terms
              </h2>
              <p>
                We may update these Terms from time to time. We will notify you of material
                changes by posting the updated Terms on this page and updating the “Last updated”
                date. Your continued use of the Services after such changes constitutes acceptance
                of the updated Terms. If you do not agree, you must stop using the Services.
              </p>
            </section>

            <section>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3">
                15. Contact
              </h2>
              <p>
                If you have questions about these Terms of Service, please contact us at{' '}
                <a href="mailto:legal@digiport.com" className="text-gray-900 font-medium underline hover:no-underline">
                  legal@digiport.com
                </a>
                {' '}or through our{' '}
                <Link href="/support" className="text-gray-900 font-medium underline hover:no-underline">
                  Support
                </Link>
                {' '}page.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} DigiPort. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/privacy" className="text-gray-600 hover:text-gray-900 font-medium">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-600 hover:text-gray-900 font-medium">
                Terms of Service
              </Link>
              <Link href="/" className="text-gray-600 hover:text-gray-900 font-medium">
                Home
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

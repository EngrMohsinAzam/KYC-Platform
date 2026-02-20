'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export default function PrivacyPolicyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-sm text-gray-500 mb-10">
            Last updated: {lastUpdated}
          </p>

          <div className="space-y-10 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3">
                1. Introduction
              </h2>
              <p>
                DigiPort (“we,” “us,” or “our”) is committed to protecting your privacy. This
                Privacy Policy explains how we collect, use, disclose, and safeguard your
                personal data when you use our identity verification, KYC, and related services
                (the “Services”). We process data in compliance with the General Data Protection
                Regulation (GDPR), the California Consumer Privacy Act (CCPA), and other
                applicable privacy laws.
              </p>
            </section>

            <section>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3">
                2. Data We Collect
              </h2>
              <p className="mb-3">
                We may collect the following categories of personal data:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong className="text-gray-900">Identity and contact data:</strong> name,
                  email address, phone number, date of birth, government-issued ID details
                  (e.g. document number, nationality), and similar identifiers.
                </li>
                <li>
                  <strong className="text-gray-900">Verification data:</strong> photographs
                  (e.g. selfie, ID document images), facial biometric data for liveness and
                  matching, and proof-of-address documents.
                </li>
                <li>
                  <strong className="text-gray-900">Account and usage data:</strong> login
                  credentials, company name, website, address, industry, IP address, device
                  information, and usage logs.
                </li>
                <li>
                  <strong className="text-gray-900">Wallet and blockchain data:</strong> when
                  you use decentralized identity features, we may process wallet addresses and
                  transaction-related data as necessary for the Service.
                </li>
              </ul>
              <p className="mt-4">
                We may also receive personal data from our business customers who integrate our
                Services into their own products, in which case we act as a data processor and
                they remain the data controller.
              </p>
            </section>

            <section>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3">
                3. How We Use Your Data
              </h2>
              <p className="mb-3">
                We use your personal data to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide, operate, and improve our identity verification and KYC Services</li>
                <li>Perform liveness checks, document verification, and fraud prevention</li>
                <li>Comply with legal, regulatory, and compliance obligations (e.g. AML, sanctions)</li>
                <li>Manage your account, process payments, and communicate with you</li>
                <li>Send service-related notifications and support your requests</li>
                <li>Analyze usage patterns, debug issues, and enhance security</li>
                <li>Enforce our{' '}
                  <Link href="/terms" className="text-gray-900 font-medium underline hover:no-underline">
                    Terms of Service
                  </Link>
                  {' '}and protect our rights
                </li>
              </ul>
              <p className="mt-4">
                We process your data only where we have a lawful basis, such as performance of a
                contract, consent, legal obligation, or our legitimate interests (e.g. fraud
                prevention, service improvement).
              </p>
            </section>

            <section>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3">
                4. Sharing and Disclosure
              </h2>
              <p>
                We may share your personal data with:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>
                  <strong className="text-gray-900">Business customers</strong> who use our
                  Services to verify your identity (e.g. platforms where you undergo KYC)
                </li>
                <li>
                  <strong className="text-gray-900">Service providers</strong> who assist us
                  (e.g. cloud hosting, analytics, identity and document verification vendors),
                  under strict data processing agreements
                </li>
                <li>
                  <strong className="text-gray-900">Regulators, law enforcement, or courts</strong>{' '}
                  when required by law or to protect our rights
                </li>
                <li>
                  <strong className="text-gray-900">Affiliates and advisors</strong> as needed
                  for group operations, mergers, or legal advice
                </li>
              </ul>
              <p className="mt-4">
                We do not sell your personal data. We may share de-identified or aggregated
                data that cannot reasonably be used to identify you.
              </p>
            </section>

            <section>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3">
                5. International Transfers
              </h2>
              <p>
                Your data may be processed in countries outside your residence, including the
                United Kingdom, European Economic Area, and the United States. We ensure
                appropriate safeguards (e.g. Standard Contractual Clauses, adequacy decisions)
                are in place where required by applicable law.
              </p>
            </section>

            <section>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3">
                6. Data Security
              </h2>
              <p>
                We implement technical and organisational measures to protect your personal
                data against unauthorised access, loss, or alteration. These include
                encryption in transit and at rest, access controls, and regular security
                assessments. Despite our efforts, no system is completely secure; you provide
                data at your own risk.
              </p>
            </section>

            <section>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3">
                7. Data Retention
              </h2>
              <p>
                We retain your personal data only for as long as necessary to fulfil the
                purposes described in this policy, including legal, regulatory, and compliance
                requirements. Verification and identity data may be kept for periods required
                by AML/KYC regulations. When data is no longer needed, we securely delete or
                anonymise it.
              </p>
            </section>

            <section>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3">
                8. Your Rights
              </h2>
              <p className="mb-3">
                Depending on your location, you may have the right to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access and receive a copy of your personal data</li>
                <li>Rectify inaccurate or incomplete data</li>
                <li>Request erasure (“right to be forgotten”) where applicable</li>
                <li>Restrict or object to certain processing</li>
                <li>Data portability</li>
                <li>Withdraw consent where processing is based on consent</li>
                <li>Lodge a complaint with a supervisory authority</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, contact us at{' '}
                <a href="mailto:privacy@digiport.com" className="text-gray-900 font-medium underline hover:no-underline">
                  privacy@digiport.com
                </a>
                . We will respond within the timeframe required by applicable law. Where we act
                as a processor on behalf of a customer, we may refer your request to that
                customer.
              </p>
            </section>

            <section>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3">
                9. Cookies and Similar Technologies
              </h2>
              <p>
                We use cookies and similar technologies to operate our Services, remember your
                preferences, analyse usage, and improve security. You can manage cookie
                preferences through your browser settings or our cookie banner where provided.
                Disabling certain cookies may affect the functionality of our Services.
              </p>
            </section>

            <section>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3">
                10. Children&apos;s Privacy
              </h2>
              <p>
                Our Services are not directed at individuals under the age of 16 (or higher
                where required by law). We do not knowingly collect personal data from
                children. If you believe we have collected such data, please contact us and we
                will take steps to delete it.
              </p>
            </section>

            <section>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3">
                11. Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. We will post the updated
                version on this page and update the “Last updated” date. For material changes,
                we may provide additional notice (e.g. by email or a notice in the Services).
                Your continued use of the Services after updates constitutes acceptance of the
                revised policy.
              </p>
            </section>

            <section>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3">
                12. Contact Us
              </h2>
              <p>
                If you have questions about this Privacy Policy or our data practices, please
                contact us:
              </p>
              <ul className="list-none pl-0 mt-3 space-y-1">
                <li>
                  <strong className="text-gray-900">Email:</strong>{' '}
                  <a href="mailto:privacy@digiport.com" className="text-gray-900 font-medium underline hover:no-underline">
                    privacy@digiport.com
                  </a>
                </li>
                <li>
                  <strong className="text-gray-900">Support:</strong>{' '}
                  <Link href="/support" className="text-gray-900 font-medium underline hover:no-underline">
                    Support page
                  </Link>
                </li>
              </ul>
              <p className="mt-4">
                For GDPR-related requests, you may also contact our data protection officer at{' '}
                <a href="mailto:dpo@digiport.com" className="text-gray-900 font-medium underline hover:no-underline">
                  dpo@digiport.com
                </a>
                .
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

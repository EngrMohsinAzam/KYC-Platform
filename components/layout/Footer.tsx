import React, { memo } from 'react'
import Image from 'next/image'

export const Footer = memo(function Footer() {
  return (
    <footer className="bg-gray-900 text-white" aria-label="Footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Navigation Columns */}
        <div className="py-10 md:py-12 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Products Column */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm md:text-base">Products</h3>
            <ul className="space-y-2.5 text-sm text-gray-300">
              <li><a href="#" className="hover:text-white transition-colors">ID Verification</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Document Verification</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Liveness & Biometric</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Business Verification</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Transaction Monitoring</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Screening & Watchlists</a></li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm md:text-base">Resources</h3>
            <ul className="space-y-2.5 text-sm text-gray-300">
              <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Guides & Reports</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Success Stories</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm md:text-base">Company</h3>
            <ul className="space-y-2.5 text-sm text-gray-300">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms & Conditions</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Security & Compliance</a></li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800"></div>

        {/* Bottom Section */}
        <div className="py-6 md:py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo and Copyright */}
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex items-center gap-2">
                <Image
                  src="/Logo.png"
                  alt="DigiPort Logo"
                  width={40}
                  height={40}
                  className="h-6 w-auto"
                />
                <span className="text-base font-bold text-white">DigiPort</span>
              </div>
              <div className="text-xs text-gray-400 text-center md:text-left">
                © {new Date().getFullYear()} DigiPort. All rights reserved.
              </div>
            </div>

            {/* Social Media Icons */}
            <div className="flex items-center gap-3">
              <a href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors" aria-label="LinkedIn">
                <span className="text-white text-xs font-bold">in</span>
              </a>
              <a href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors" aria-label="Twitter">
                <span className="text-white text-xs font-bold">X</span>
              </a>
              <a href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors" aria-label="YouTube">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Compliance Badges */}
          <div className="mt-6 pt-6 border-t border-gray-800">
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-xs text-gray-400">
              <span>ISO 27001</span>
              <span>GDPR Ready</span>
              <span>PCI DSS</span>
              <span>ISO 30107-3</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}, () => true) // Never re-render footer

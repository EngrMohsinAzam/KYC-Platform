'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

const companyData = {
  id: '1',
  companyName: 'Tech Solutions Inc',
  status: 'pending',
  applicationDate: '2024-01-22',
  submittedAt: '2024-01-22T10:30:00Z',
  businessType: 'Technology',
  industry: 'Software Development',
  companySize: '50-100',
  website: 'https://techsolutions.com',
  description: 'Leading technology solutions provider specializing in enterprise software development and digital transformation services.',
  
  // Contact Information
  contactPerson: {
    name: 'John Smith',
    position: 'CEO & Founder',
    email: 'john.smith@techsolutions.com',
    phone: '+1 (555) 123-4567',
    linkedin: 'https://linkedin.com/in/johnsmith'
  },
  
  // Business Address
  address: {
    street: '123 Tech Boulevard',
    city: 'San Francisco',
    state: 'California',
    zipCode: '94105',
    country: 'United States',
    fullAddress: '123 Tech Boulevard, San Francisco, CA 94105, United States'
  },
  
  // KYC Documents
  documents: [
    {
      id: 'doc1',
      type: 'Business Registration',
      fileName: 'business_registration.pdf',
      uploadDate: '2024-01-22T10:35:00Z',
      status: 'verified',
      size: '2.4 MB'
    },
    {
      id: 'doc2',
      type: 'Tax Identification',
      fileName: 'tax_id_document.pdf',
      uploadDate: '2024-01-22T10:36:00Z',
      status: 'verified',
      size: '1.8 MB'
    },
    {
      id: 'doc3',
      type: 'Proof of Address',
      fileName: 'utility_bill.pdf',
      uploadDate: '2024-01-22T10:37:00Z',
      status: 'pending',
      size: '3.1 MB'
    },
    {
      id: 'doc4',
      type: 'Director Identification',
      fileName: 'director_id.pdf',
      uploadDate: '2024-01-22T10:38:00Z',
      status: 'verified',
      size: '1.2 MB'
    }
  ],
  
  // Compliance Information
  compliance: {
    riskLevel: 'Medium',
    complianceScore: 78,
    lastAuditDate: '2024-01-15',
    nextAuditDate: '2024-04-15',
    regulatoryStatus: 'Compliant',
    amlChecks: 'Passed',
    sanctionsScreening: 'Clear'
  },
  
  // Financial Information
  financial: {
    annualRevenue: '$5-10M',
    fundingStage: 'Series B',
    investors: ['Tech Ventures', 'Innovation Capital', 'Growth Partners'],
    bankAccounts: 2,
    transactionVolume: 'High',
    averageTransaction: '$2,500'
  },
  
  // Verification History
  verificationHistory: [
    {
      date: '2024-01-22T10:30:00Z',
      action: 'Application Submitted',
      status: 'completed',
      details: 'Initial KYC application submitted by John Smith'
    },
    {
      date: '2024-01-22T11:15:00Z',
      action: 'Document Verification',
      status: 'completed',
      details: 'Business registration and tax ID verified'
    },
    {
      date: '2024-01-22T14:30:00Z',
      action: 'Background Check',
      status: 'in_progress',
      details: 'Comprehensive background check in progress'
    }
  ]
}

export default function CompanyDetails() {
  const params = useParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Low': return 'bg-green-100 text-green-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'High': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{companyData.companyName}</h1>
            <p className="text-sm text-gray-600 mt-1">Company Verification Details</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(companyData.status)}`}>
            {companyData.status.charAt(0).toUpperCase() + companyData.status.slice(1)}
          </span>
          <button
            onClick={() => setShowApproveModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Approve Application
          </button>
          <button
            onClick={() => setShowRejectModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Reject Application
          </button>
        </div>
      </div>

      {/* Company Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6">
          {/* Company Information */}
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Business Type</p>
                    <p className="text-sm text-gray-900">{companyData.businessType}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Industry</p>
                    <p className="text-sm text-gray-900">{companyData.industry}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Company Size</p>
                    <p className="text-sm text-gray-900">{companyData.companySize}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Website</p>
                    <a href={companyData.website} className="text-sm text-blue-600 hover:text-blue-700" target="_blank" rel="noopener noreferrer">
                      {companyData.website}
                    </a>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Description</p>
                    <p className="text-sm text-gray-900">{companyData.description}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Contact Person</p>
                    <p className="text-sm text-gray-900">{companyData.contactPerson.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Position</p>
                    <p className="text-sm text-gray-900">{companyData.contactPerson.position}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Email</p>
                    <a href={`mailto:${companyData.contactPerson.email}`} className="text-sm text-blue-600 hover:text-blue-700">
                      {companyData.contactPerson.email}
                    </a>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Phone</p>
                    <a href={`tel:${companyData.contactPerson.phone}`} className="text-sm text-blue-600 hover:text-blue-700">
                      {companyData.contactPerson.phone}
                    </a>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">LinkedIn</p>
                    <a href={companyData.contactPerson.linkedin} className="text-sm text-blue-600 hover:text-blue-700" target="_blank" rel="noopener noreferrer">
                      View LinkedIn Profile
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Address */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Address</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-900">{companyData.address.fullAddress}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowApproveModal(false)} />
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 relative z-10">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Approve Application</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to approve the KYC application for {companyData.companyName}? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowApproveModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowApproveModal(false)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Approve Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowRejectModal(false)} />
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 relative z-10">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Application</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting the KYC application for {companyData.companyName}.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              rows={4}
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowRejectModal(false)}
                disabled={!rejectionReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reject Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

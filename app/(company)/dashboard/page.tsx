'use client'

import { useState } from 'react'

const mockStats = {
  totalCompanies: 342,
  approvedCompanies: 289,
  pendingCompanies: 34
}

export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('7d')
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false)
  const [selectedPendingCompany, setSelectedPendingCompany] = useState<any>(null)
  const [showPendingModal, setShowPendingModal] = useState(false)
  const [pendingRequests, setPendingRequests] = useState([
    {
      id: 1,
      companyName: 'Tech Solutions Inc',
      email: 'contact@techsolutions.com',
      contactPerson: 'John Smith',
      industry: 'Technology',
      applicationDate: '2024-01-21',
      status: 'pending',
      phone: '+1 555-0123',
      website: 'https://techsolutions.com',
      address: '123 Tech Street, San Francisco, CA 94105',
      description: 'Leading technology solutions provider specializing in enterprise software development and cloud services.',
      employees: '50-100',
      revenue: '$5M-$10M',
      businessType: 'Corporation',
      registrationNumber: 'REG-2024-001'
    },
    {
      id: 2,
      companyName: 'Global Finance Ltd',
      email: 'info@globalfinance.com',
      contactPerson: 'Sarah Johnson',
      industry: 'Finance',
      applicationDate: '2024-01-21',
      status: 'pending',
      phone: '+1 555-0124',
      website: 'https://globalfinance.com',
      address: '456 Wall Street, New York, NY 10005',
      description: 'International financial services company offering investment banking, asset management, and financial advisory services.',
      employees: '100-250',
      revenue: '$10M-$50M',
      businessType: 'Limited Liability Company',
      registrationNumber: 'REG-2024-002'
    },
    {
      id: 3,
      companyName: 'Healthcare Plus',
      email: 'admin@healthcareplus.com',
      contactPerson: 'Dr. Michael Chen',
      industry: 'Healthcare',
      applicationDate: '2024-01-21',
      status: 'pending',
      phone: '+1 555-0125',
      website: 'https://healthcareplus.com',
      address: '789 Medical Center Drive, Boston, MA 02115',
      description: 'Comprehensive healthcare provider offering medical services, telemedicine, and health insurance solutions.',
      employees: '250-500',
      revenue: '$50M-$100M',
      businessType: 'Professional Corporation',
      registrationNumber: 'REG-2024-003'
    },
    {
      id: 4,
      companyName: 'Retail Dynamics',
      email: 'hello@retaildynamics.com',
      contactPerson: 'Emily Davis',
      industry: 'Retail',
      applicationDate: '2024-01-21',
      status: 'pending',
      phone: '+1 555-0126',
      website: 'https://retaildynamics.com',
      address: '321 Shopping Mall Ave, Chicago, IL 60601',
      description: 'Modern retail chain specializing in consumer electronics, home goods, and fashion accessories.',
      employees: '500-1000',
      revenue: '$100M-$500M',
      businessType: 'Corporation',
      registrationNumber: 'REG-2024-004'
    },
    {
      id: 5,
      companyName: 'Energy Solutions',
      email: 'contact@energysol.com',
      contactPerson: 'Robert Wilson',
      industry: 'Energy',
      applicationDate: '2024-01-21',
      status: 'pending',
      phone: '+1 555-0127',
      website: 'https://energysolutions.com',
      address: '555 Energy Park, Houston, TX 77002',
      description: 'Renewable energy company focused on solar, wind, and sustainable energy solutions for commercial and residential clients.',
      employees: '100-250',
      revenue: '$25M-$50M',
      businessType: 'Limited Liability Company',
      registrationNumber: 'REG-2024-005'
    }
  ])

  const handleApproveCompany = (company: any) => {
    // Create a new company object for the companies page using all available data
    const newCompany = {
      id: `COMP${String(company.id).padStart(3, '0')}`,
      name: company.companyName,
      industry: company.industry,
      registrationDate: new Date().toISOString().split('T')[0],
      status: 'active',
      kycVolume: 0,
      successRate: 0,
      contactPerson: company.contactPerson,
      email: company.email,
      phone: company.phone,
      website: company.website,
      address: company.address,
      plan: 'Starter',
      complianceScore: 85,
      apiKeys: 0,
      lastActivity: 'Just now',
      description: company.description,
      employees: company.employees,
      revenue: company.revenue,
      businessType: company.businessType,
      registrationNumber: company.registrationNumber
    }

    // Store in localStorage to be picked up by companies page
    const existingCompanies = JSON.parse(localStorage.getItem('approvedCompanies') || '[]')
    localStorage.setItem('approvedCompanies', JSON.stringify([...existingCompanies, newCompany]))

    // Remove from pending requests
    setPendingRequests(prev => prev.filter(req => req.id !== company.id))
    setShowPendingModal(false)
    setSelectedPendingCompany(null)
  }

  const handleRejectCompany = (companyId: number) => {
    setPendingRequests(prev => prev.filter(req => req.id !== companyId))
    setShowPendingModal(false)
    setSelectedPendingCompany(null)
  }

  return (
    <div className="space-y-8">
      {/* Click outside to close dropdown */}
      {showPeriodDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowPeriodDropdown(false)}
        />
      )}
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-gray-600 mt-2">Monitor your KYC platform performance and key metrics</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 hover:border-gray-300">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Total Companies</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">{mockStats.totalCompanies.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 hover:border-gray-300">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Approved Companies</p>
              <p className="text-3xl font-bold text-gray-900 mb-3">{mockStats.approvedCompanies.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 hover:border-gray-300">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pending Companies</p>
              <p className="text-3xl font-bold text-gray-900 mb-3">{mockStats.pendingCompanies.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Company Requests */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Pending Company Requests</h3>
              <p className="text-sm text-gray-600 mt-1">New company applications awaiting review</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search requests..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 w-48"
                />
                <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                View All
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-full sm:min-w-0">
            {/* Mobile Card View */}
            <div className="sm:hidden space-y-4">
              {pendingRequests.map((request) => (
                <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-900">{request.companyName}</h4>
                      <p className="text-xs text-gray-600 mt-1">{request.industry}</p>
                    </div>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                      <span className="text-xs text-gray-600 truncate">{request.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-xs text-gray-600">{request.contactPerson}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 0v4m0 0l-8 8-4-4-6 6" />
                      </svg>
                      <span className="text-xs text-gray-600">{request.applicationDate}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={() => {
                        setSelectedPendingCompany(request)
                        setShowPendingModal(true)
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-50 transition-colors"
                    >
                      View
                    </button>
                    <button className="flex-1 px-3 py-2 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors">
                      Approve
                    </button>
                    <button className="flex-1 px-3 py-2 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition-colors">
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full table-fixed min-w-[800px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">Company</th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">Email</th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-20">Contact</th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-16">Industry</th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-16">Date</th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-12">Status</th>
                    <th className="px-10 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-40">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {pendingRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-2 py-2">
                        <div>
                          <div className="text-sm font-semibold text-gray-900 truncate">{request.companyName}</div>
                          <div className="text-xs text-gray-500 truncate">ID: REQ{String(request.id).padStart(3, '0')}</div>
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <span className="text-sm text-gray-900 truncate block">{request.email}</span>
                      </td>
                      <td className="px-2 py-2">
                        <span className="text-sm text-gray-900 truncate block">{request.contactPerson}</span>
                      </td>
                      <td className="px-2 py-2">
                        <span className="text-sm text-gray-900 truncate block">{request.industry}</span>
                      </td>
                      <td className="px-2 py-2">
                        <span className="text-sm text-gray-900 truncate block">{request.applicationDate}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="inline-flex px-1 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      </td>
                      <td className="px-8 py-2">
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => {
                              setSelectedPendingCompany(request)
                              setShowPendingModal(true)
                            }}
                            className="px-3 py-1 border border-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-50 transition-colors"
                          >
                            View
                          </button>
                          <button className="px-2 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors">
                            Approve
                          </button>
                          <button className="px-3 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition-colors">
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Company Details Modal */}
      {showPendingModal && selectedPendingCompany && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowPendingModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {selectedPendingCompany.companyName}
                      </h3>
                      <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-800">
                        Pending Review
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Company Information</h4>
                        <div className="space-y-2">
                          <p><span className="text-xs text-gray-500">Company ID:</span> REQ{String(selectedPendingCompany.id).padStart(3, '0')}</p>
                          <p><span className="text-xs text-gray-500">Industry:</span> {selectedPendingCompany.industry}</p>
                          <p><span className="text-xs text-gray-500">Application Date:</span> {selectedPendingCompany.applicationDate}</p>
                          <p><span className="text-xs text-gray-500">Business Type:</span> {selectedPendingCompany.businessType}</p>
                          <p><span className="text-xs text-gray-500">Registration Number:</span> {selectedPendingCompany.registrationNumber}</p>
                          <p><span className="text-xs text-gray-500">Employees:</span> {selectedPendingCompany.employees}</p>
                          <p><span className="text-xs text-gray-500">Revenue Range:</span> {selectedPendingCompany.revenue}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Contact Information</h4>
                        <div className="space-y-2">
                          <p><span className="text-xs text-gray-500">Contact Person:</span> {selectedPendingCompany.contactPerson}</p>
                          <p><span className="text-xs text-gray-500">Email:</span> {selectedPendingCompany.email}</p>
                          <p><span className="text-xs text-gray-500">Phone:</span> {selectedPendingCompany.phone}</p>
                          <p><span className="text-xs text-gray-500">Website:</span> 
                            <a href={selectedPendingCompany.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                              {selectedPendingCompany.website}
                            </a>
                          </p>
                          <p><span className="text-xs text-gray-500">Address:</span> {selectedPendingCompany.address}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Company Description</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {selectedPendingCompany.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                <button
                  onClick={() => handleApproveCompany(selectedPendingCompany)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Approve Company
                </button>
                <button
                  onClick={() => handleRejectCompany(selectedPendingCompany.id)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Reject Application
                </button>
                <button
                  onClick={() => setShowPendingModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

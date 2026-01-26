'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts'

const mockStats = {
  totalCompanies: 342,
  approvedCompanies: 289,
  pendingCompanies: 34
}

const financialData = [
  { month: 'Jan', revenue: 125000, costs: 45000, profit: 80000, growth: 8.2 },
  { month: 'Feb', revenue: 142000, costs: 48000, profit: 94000, growth: 13.6 },
  { month: 'Mar', revenue: 168000, costs: 52000, profit: 116000, growth: 18.3 },
  { month: 'Apr', revenue: 155000, costs: 49000, profit: 106000, growth: -7.8 },
  { month: 'May', revenue: 189000, costs: 58000, profit: 131000, growth: 21.9 },
  { month: 'Jun', revenue: 210000, costs: 62000, profit: 148000, growth: 11.1 }
]

const planDistribution = [
  { plan: 'Enterprise', companies: 45, revenue: 185000, avgRevenue: 4111 },
  { plan: 'Professional', companies: 89, revenue: 124000, avgRevenue: 1393 },
  { plan: 'Starter', companies: 155, revenue: 62000, avgRevenue: 400 }
]

const mockCompanies = [
  {
    id: 'COMP001',
    name: 'TechCorp Solutions',
    industry: 'Technology',
    registrationDate: '2023-06-15',
    status: 'active',
    kycVolume: 3420,
    successRate: 94.5,
    contactPerson: 'John Anderson',
    email: 'john.anderson@techcorp.com',
    phone: '+1 (555) 123-4567',
    plan: 'Enterprise',
    lastActivity: '2024-01-20',
    apiKeys: 3,
    complianceScore: 98,
    address: '123 Tech Street, San Francisco, CA 94105',
    website: 'https://techcorp.com'
  },
  {
    id: 'COMP002',
    name: 'FinanceHub Ltd',
    industry: 'Financial Services',
    registrationDate: '2023-08-22',
    status: 'active',
    kycVolume: 8750,
    successRate: 96.2,
    contactPerson: 'Sarah Mitchell',
    email: 'sarah.m@financehub.com',
    phone: '+44 20 7123 4567',
    plan: 'Professional',
    lastActivity: '2024-01-19',
    apiKeys: 2,
    complianceScore: 95,
    address: '456 Finance Ave, London, UK EC1A 1BB',
    website: 'https://financehub.com'
  },
  {
    id: 'COMP003',
    name: 'GlobalTrade Inc',
    industry: 'E-commerce',
    registrationDate: '2023-09-10',
    status: 'active',
    kycVolume: 1250,
    successRate: 91.8,
    contactPerson: 'Michael Chen',
    email: 'mchen@globaltrade.com',
    phone: '+65 6123 4567',
    plan: 'Business',
    lastActivity: '2024-01-18',
    apiKeys: 1,
    complianceScore: 92,
    address: '789 Trade Road, Singapore 238896',
    website: 'https://globaltrade.com'
  },
  {
    id: 'COMP004',
    name: 'SecureBank',
    industry: 'Banking',
    registrationDate: '2023-05-30',
    status: 'suspended',
    kycVolume: 15600,
    successRate: 97.8,
    contactPerson: 'Robert Williams',
    email: 'r.williams@securebank.com',
    phone: '+1 (555) 987-6543',
    plan: 'Enterprise',
    lastActivity: '2024-01-10',
    apiKeys: 5,
    complianceScore: 99,
    address: '321 Banking Blvd, New York, NY 10004',
    website: 'https://securebank.com'
  },
  {
    id: 'COMP005',
    name: 'HealthCare Plus',
    industry: 'Healthcare',
    registrationDate: '2023-11-05',
    status: 'active',
    kycVolume: 2100,
    successRate: 93.1,
    contactPerson: 'Dr. Emily Johnson',
    email: 'emily.j@healthcareplus.com',
    phone: '+1 (555) 234-5678',
    plan: 'Professional',
    lastActivity: '2024-01-17',
    apiKeys: 2,
    complianceScore: 94,
    address: '555 Medical Way, Boston, MA 02115',
    website: 'https://healthcareplus.com'
  },
  {
    id: 'COMP006',
    name: 'CryptoExchange',
    industry: 'Cryptocurrency',
    registrationDate: '2023-12-01',
    status: 'inactive',
    kycVolume: 5400,
    successRate: 89.3,
    contactPerson: 'Alex Kumar',
    email: 'alex@cryptoexchange.io',
    phone: '+1 (555) 456-7890',
    plan: 'Business',
    lastActivity: '2023-12-28',
    apiKeys: 1,
    complianceScore: 87,
    address: '999 Crypto Lane, Miami, FL 33131',
    website: 'https://cryptoexchange.io'
  },
  {
    id: 'COMP007',
    name: 'RetailMart',
    industry: 'Retail',
    registrationDate: '2023-07-18',
    status: 'active',
    kycVolume: 890,
    successRate: 92.7,
    contactPerson: 'Lisa Thompson',
    email: 'lisa.t@retailmart.com',
    phone: '+1 (555) 345-6789',
    plan: 'Starter',
    lastActivity: '2024-01-16',
    apiKeys: 1,
    complianceScore: 91,
    address: '777 Shopping St, Chicago, IL 60601',
    website: 'https://retailmart.com'
  },
  {
    id: 'COMP008',
    name: 'LogisticsPro',
    industry: 'Logistics',
    registrationDate: '2023-10-12',
    status: 'active',
    kycVolume: 3200,
    successRate: 95.4,
    contactPerson: 'David Martinez',
    email: 'david.m@logisticspro.com',
    phone: '+1 (555) 567-8901',
    plan: 'Business',
    lastActivity: '2024-01-15',
    apiKeys: 2,
    complianceScore: 93,
    address: '444 Transport Ave, Houston, TX 77002',
    website: 'https://logisticspro.com'
  }
]

export default function Companies() {
  // Initialize with mock companies only, load from localStorage in useEffect
  const [companies, setCompanies] = useState(mockCompanies)
  const [selectedCompany, setSelectedCompany] = useState<typeof mockCompanies[0] | null>(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPlan, setFilterPlan] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [sortBy, setSortBy] = useState('name')

  // Load approved companies from localStorage after component mounts (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const approvedCompanies = JSON.parse(localStorage.getItem('approvedCompanies') || '[]')
        if (approvedCompanies.length > 0) {
          setCompanies([...mockCompanies, ...approvedCompanies])
        }
      } catch (error) {
        console.error('Error loading companies from localStorage:', error)
      }
    }
  }, [])

  const filteredCompanies = companies.filter(company => {
    const matchesStatus = filterStatus === 'all' || company.status === filterStatus
    const matchesPlan = filterPlan === 'all' || company.plan === filterPlan
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.email.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesPlan && matchesSearch
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name)
    if (sortBy === 'volume') return b.kycVolume - a.kycVolume
    if (sortBy === 'successRate') return b.successRate - a.successRate
    if (sortBy === 'registrationDate') return new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime()
    return 0
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'Enterprise': return 'bg-purple-100 text-purple-800'
      case 'Professional': return 'bg-blue-100 text-blue-800'
      case 'Business': return 'bg-indigo-100 text-indigo-800'
      case 'Starter': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getComplianceScoreColor = (score: number) => {
    if (score >= 95) return 'text-green-600'
    if (score >= 90) return 'text-yellow-600'
    return 'text-red-600'
  }

  const handleStatusUpdate = (companyId: string, newStatus: string) => {
    setCompanies(prev => prev.map(company => 
      company.id === companyId ? { ...company, status: newStatus } : company
    ))
    setShowDetailsModal(false)
  }

  const handleDeleteCompany = (companyId: string) => {
    if (window.confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
      setCompanies(prev => prev.filter(company => company.id !== companyId))
      setShowDetailsModal(false)
    }
  }

  const stats = {
    total: companies.length,
    active: companies.filter(c => c.status === 'active').length,
    inactive: companies.filter(c => c.status === 'inactive').length,
    suspended: companies.filter(c => c.status === 'suspended').length,
    totalVolume: companies.reduce((sum, c) => sum + c.kycVolume, 0),
    avgSuccessRate: Number((companies.reduce((sum, c) => sum + c.successRate, 0) / companies.length).toFixed(1))
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Registered Companies</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Manage and monitor all registered companies</p>
        </div>
        <button className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors w-full sm:w-auto">
          Add New Company
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 hover:border-gray-300">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Total Companies</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">{mockStats.totalCompanies.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 ml-2">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 hover:border-gray-300">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Approved Companies</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">{mockStats.approvedCompanies.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0 ml-2">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 hover:border-gray-300">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pending Companies</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">{mockStats.pendingCompanies.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-50 rounded-xl flex items-center justify-center flex-shrink-0 ml-2">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Overview Section */}
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Total Collection</h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Revenue collected over time</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs sm:text-sm text-gray-500">Last 6 months</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-xs text-gray-600">Revenue</span>
            </div>
          </div>
        </div>

        {/* Total Collection Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
          <div className="text-center mb-3 sm:mb-4 lg:mb-6">
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total Collection</p>
            <p className="text-xl sm:text-2xl lg:text-4xl font-bold text-blue-600">$989,000</p>
            <p className="text-xs sm:text-sm text-green-600 mt-1 sm:mt-2">↑ 15.2% vs last period</p>
          </div>
          
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={financialData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                stroke="#6B7280" 
                fontSize={10}
                tick={{ fill: '#6B7280' }}
              />
              <YAxis 
                stroke="#6B7280" 
                fontSize={10}
                tick={{ fill: '#6B7280' }}
                tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`} 
                width={50}
              />
              <Tooltip 
                formatter={(value: any) => [`$${value.toLocaleString()}`, 'Revenue']}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  fontSize: '12px',
                  padding: '8px'
                }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Company List</h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Manage and monitor registered companies</p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 w-full"
                />
                <svg className="absolute left-3 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 w-full sm:w-auto"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
                <select
                  value={filterPlan}
                  onChange={(e) => setFilterPlan(e.target.value)}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 w-full sm:w-auto"
                >
                  <option value="all">All Plans</option>
                  <option value="Enterprise">Enterprise</option>
                  <option value="Professional">Professional</option>
                  <option value="Business">Business</option>
                  <option value="Starter">Starter</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-full sm:min-w-0">
            {/* Mobile Card View */}
            <div className="sm:hidden space-y-3 px-4 py-4">
              {filteredCompanies.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">No companies found</p>
                </div>
              ) : (
                filteredCompanies.map((company) => (
                  <div key={company.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 shadow-sm">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">{company.name}</h4>
                        <p className="text-xs text-gray-600 mt-0.5 truncate">{company.industry}</p>
                        <p className="text-xs text-gray-500 mt-0.5">ID: {company.id}</p>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap flex-shrink-0 ${
                        company.status === 'active' ? 'bg-green-100 text-green-800' :
                        company.status === 'inactive' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {company.status}
                      </span>
                    </div>

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                        <p className="text-xs text-gray-500 mb-1">Plan</p>
                        <span className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ${
                          company.plan === 'Enterprise' ? 'bg-purple-100 text-purple-800' :
                          company.plan === 'Professional' ? 'bg-blue-100 text-blue-800' :
                          company.plan === 'Business' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {company.plan}
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                        <p className="text-xs text-gray-500 mb-1">Volume</p>
                        <p className="text-sm font-semibold text-gray-900">{company.kycVolume.toLocaleString()}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                        <p className="text-xs text-gray-500 mb-1">Success Rate</p>
                        <p className="text-sm font-semibold text-gray-900">{company.successRate}%</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                        <p className="text-xs text-gray-500 mb-1">Compliance</p>
                        <span className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ${
                          company.complianceScore >= 95 ? 'bg-green-100 text-green-800' :
                          company.complianceScore >= 90 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {company.complianceScore}%
                        </span>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-1.5 border-t border-gray-100 pt-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-xs text-gray-600 truncate">{company.contactPerson}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 0v4m0 0l-8 8-4-4-6 6" />
                        </svg>
                        <span className="text-xs text-gray-600">{company.registrationDate}</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-1">
                      <button 
                        onClick={() => {
                          setSelectedCompany(company)
                          setShowDetailsModal(true)
                        }}
                        className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full table-fixed min-w-[800px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">Company</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-20">Industry</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-16">Plan</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-20">Volume</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-20">Success</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-20">Compliance</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-16">Status</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-16">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredCompanies.map((company) => (
                    <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-3">
                        <div>
                          <div className="text-sm font-semibold text-gray-900 truncate">{company.name}</div>
                          <div className="text-xs text-gray-500 truncate">ID: {company.id}</div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-sm text-gray-900 truncate block">{company.industry}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex px-1 py-0.5 text-xs font-semibold rounded-full ${
                          company.plan === 'Enterprise' ? 'bg-purple-100 text-purple-800' :
                          company.plan === 'Business' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {company.plan}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-sm text-gray-900 truncate block">{company.kycVolume}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-sm text-gray-900 truncate block">{company.successRate}%</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex px-1 py-0.5 text-xs font-semibold rounded-full ${
                          company.complianceScore >= 90 ? 'bg-green-100 text-green-800' :
                          company.complianceScore >= 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {company.complianceScore}%
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex px-1 py-0.5 text-xs font-semibold rounded-full ${
                          company.status === 'active' ? 'bg-green-100 text-green-800' :
                          company.status === 'inactive' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {company.status}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <button 
                          onClick={() => {
                            setSelectedCompany(company)
                            setShowDetailsModal(true)
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedCompany && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen px-0 pt-0 pb-0 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowDetailsModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-t-2xl sm:rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full w-full max-h-[95vh] sm:max-h-[90vh]">
              {/* Mobile Header */}
              <div className="sm:hidden sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
                <h3 className="text-base font-semibold text-gray-900 truncate flex-1 pr-2">
                  {selectedCompany.name}
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="bg-white px-4 pt-4 pb-4 sm:p-6 sm:pb-4 max-h-[calc(95vh-80px)] sm:max-h-[70vh] overflow-y-auto">
                <div className="sm:flex sm:items-start">
                  <div className="w-full">
                    <div className="hidden sm:flex items-start justify-between mb-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 pr-2">
                        {selectedCompany.name}
                      </h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getStatusColor(selectedCompany.status)}`}>
                        {selectedCompany.status.charAt(0).toUpperCase() + selectedCompany.status.slice(1)}
                      </span>
                    </div>
                    
                    {/* Mobile Status Badge */}
                    <div className="sm:hidden mb-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedCompany.status)}`}>
                        {selectedCompany.status.charAt(0).toUpperCase() + selectedCompany.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Company Information</h4>
                        <div className="space-y-2.5">
                          <div>
                            <span className="text-xs text-gray-500 block mb-0.5">Company ID</span>
                            <span className="text-sm text-gray-900">{selectedCompany.id}</span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 block mb-0.5">Industry</span>
                            <span className="text-sm text-gray-900">{selectedCompany.industry}</span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 block mb-0.5">Plan</span>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPlanColor(selectedCompany.plan)}`}>
                              {selectedCompany.plan}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 block mb-0.5">Registration Date</span>
                            <span className="text-sm text-gray-900">{selectedCompany.registrationDate}</span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 block mb-0.5">Website</span>
                            <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">
                              {selectedCompany.website}
                            </a>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 block mb-0.5">Address</span>
                            <span className="text-sm text-gray-900 break-words">{selectedCompany.address}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Performance Metrics</h4>
                        <div className="space-y-2.5">
                          <div>
                            <span className="text-xs text-gray-500 block mb-0.5">KYC Volume</span>
                            <span className="text-sm text-gray-900">{selectedCompany.kycVolume.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 block mb-0.5">Success Rate</span>
                            <span className="text-sm text-gray-900">{selectedCompany.successRate}%</span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 block mb-0.5">Compliance Score</span>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              selectedCompany.complianceScore >= 95 ? 'bg-green-100 text-green-800' :
                              selectedCompany.complianceScore >= 90 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {selectedCompany.complianceScore}%
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 block mb-0.5">API Keys</span>
                            <span className="text-sm text-gray-900">{selectedCompany.apiKeys}</span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 block mb-0.5">Last Activity</span>
                            <span className="text-sm text-gray-900">{selectedCompany.lastActivity}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 sm:mt-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Contact Information</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2.5">
                          <div>
                            <span className="text-xs text-gray-500 block mb-0.5">Contact Person</span>
                            <span className="text-sm text-gray-900">{selectedCompany.contactPerson}</span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 block mb-0.5">Email</span>
                            <a href={`mailto:${selectedCompany.email}`} className="text-sm text-blue-600 hover:underline break-all">
                              {selectedCompany.email}
                            </a>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 block mb-0.5">Phone</span>
                            <a href={`tel:${selectedCompany.phone}`} className="text-sm text-blue-600 hover:underline">
                              {selectedCompany.phone}
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2 border-t border-gray-200">
                <button
                  onClick={() => handleDeleteCompany(selectedCompany.id)}
                  className="w-full inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm px-4 py-2.5 bg-red-600 text-sm font-medium text-white hover:bg-red-700 active:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto touch-manipulation transition-colors"
                >
                  Delete Company
                </button>
                {selectedCompany.status === 'active' && (
                  <button
                    onClick={() => handleStatusUpdate(selectedCompany.id, 'suspended')}
                    className="w-full inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm px-4 py-2.5 bg-yellow-600 text-sm font-medium text-white hover:bg-yellow-700 active:bg-yellow-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 sm:ml-3 sm:w-auto touch-manipulation transition-colors"
                  >
                    Suspend
                  </button>
                )}
                {selectedCompany.status === 'suspended' && (
                  <button
                    onClick={() => handleStatusUpdate(selectedCompany.id, 'active')}
                    className="w-full inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm px-4 py-2.5 bg-green-600 text-sm font-medium text-white hover:bg-green-700 active:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto touch-manipulation transition-colors"
                  >
                    Reactivate
                  </button>
                )}
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="mt-2 sm:mt-0 w-full inline-flex justify-center items-center rounded-lg border border-gray-300 shadow-sm px-4 py-2.5 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:ml-3 sm:w-auto touch-manipulation transition-colors"
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

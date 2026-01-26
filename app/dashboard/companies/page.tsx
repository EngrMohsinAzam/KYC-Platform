'use client'

import { useState } from 'react'
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
  // Load approved companies from localStorage on component mount
  const [companies, setCompanies] = useState(() => {
    const approvedCompanies = JSON.parse(localStorage.getItem('approvedCompanies') || '[]')
    return [...mockCompanies, ...approvedCompanies]
  })
  const [selectedCompany, setSelectedCompany] = useState<typeof mockCompanies[0] | null>(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPlan, setFilterPlan] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [sortBy, setSortBy] = useState('name')

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registered Companies</h1>
          <p className="text-sm text-gray-600 mt-1">Manage and monitor all registered companies</p>
        </div>
        <button className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
          Add New Company
        </button>
      </div>

      {/* Stats Cards */}
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

      {/* Financial Overview Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Total Collection</h3>
            <p className="text-sm text-gray-600 mt-1">Revenue collected over time</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Last 6 months</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-xs text-gray-600">Revenue</span>
            </div>
          </div>
        </div>

        {/* Total Collection Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center mb-6">
            <p className="text-sm font-medium text-gray-600 mb-1">Total Collection</p>
            <p className="text-4xl font-bold text-blue-600">$989,000</p>
            <p className="text-sm text-green-600 mt-2">↑ 15.2% vs last period</p>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={financialData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`} />
              <Tooltip 
                formatter={(value: any) => [`$${value.toLocaleString()}`, 'Revenue']}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Company List</h3>
              <p className="text-sm text-gray-600 mt-1">Manage and monitor registered companies</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 w-48"
                />
                <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
                <select
                  value={filterPlan}
                  onChange={(e) => setFilterPlan(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
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
            <div className="sm:hidden space-y-4">
              {filteredCompanies.map((company) => (
                <div key={company.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-900">{company.name}</h4>
                      <p className="text-xs text-gray-600 mt-1">{company.industry}</p>
                      <p className="text-xs text-gray-500">ID: {company.id}</p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      company.status === 'active' ? 'bg-green-100 text-green-800' :
                      company.status === 'inactive' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {company.status}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className={`inline-flex px-1 py-0.5 text-xs font-semibold rounded-full ${
                        company.plan === 'Enterprise' ? 'bg-purple-100 text-purple-800' :
                        company.plan === 'Business' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {company.plan}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span className="text-xs text-gray-600">Volume: {company.kycVolume}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs text-gray-600">Success: {company.successRate}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className={`inline-flex px-1 py-0.5 text-xs font-semibold rounded-full ${
                        company.complianceScore >= 90 ? 'bg-green-100 text-green-800' :
                        company.complianceScore >= 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {company.complianceScore}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-xs text-gray-600">{company.contactPerson}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 0v4m0 0l-8 8-4-4-6 6" />
                      </svg>
                      <span className="text-xs text-gray-600">{company.registrationDate}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={() => {
                        setSelectedCompany(company)
                        setShowDetailsModal(true)
                      }}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                    >
                      View Details
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
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowDetailsModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {selectedCompany.name}
                      </h3>
                      <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedCompany.status)}`}>
                        {selectedCompany.status.charAt(0).toUpperCase() + selectedCompany.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Company Information</h4>
                        <div className="space-y-2">
                          <p><span className="text-xs text-gray-500">Company ID:</span> {selectedCompany.id}</p>
                          <p><span className="text-xs text-gray-500">Industry:</span> {selectedCompany.industry}</p>
                          <p><span className="text-xs text-gray-500">Plan:</span> 
                            <span className={`ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPlanColor(selectedCompany.plan)}`}>
                              {selectedCompany.plan}
                            </span>
                          </p>
                          <p><span className="text-xs text-gray-500">Registration Date:</span> {selectedCompany.registrationDate}</p>
                          <p><span className="text-xs text-gray-500">Website:</span> 
                            <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                              {selectedCompany.website}
                            </a>
                          </p>
                          <p><span className="text-xs text-gray-500">Address:</span> {selectedCompany.address}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Contact Information</h4>
                        <div className="space-y-2">
                          <p><span className="text-xs text-gray-500">Contact Person:</span> {selectedCompany.contactPerson}</p>
                          <p><span className="text-xs text-gray-500">Email:</span> {selectedCompany.email}</p>
                          <p><span className="text-xs text-gray-500">Phone:</span> {selectedCompany.phone}</p>
                          <p><span className="text-xs text-gray-500">Last Activity:</span> {selectedCompany.lastActivity}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Performance Metrics</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">KYC Volume</p>
                          <p className="text-lg font-bold text-gray-900">{selectedCompany.kycVolume.toLocaleString()}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Success Rate</p>
                          <p className="text-lg font-bold text-gray-900">{selectedCompany.successRate}%</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Compliance Score</p>
                          <p className={`text-lg font-bold ${getComplianceScoreColor(selectedCompany.complianceScore)}`}>
                            {selectedCompany.complianceScore}/100
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">API Keys</p>
                          <p className="text-lg font-bold text-gray-900">{selectedCompany.apiKeys}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                <button
                  onClick={() => handleDeleteCompany(selectedCompany.id)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Delete Company
                </button>
                {selectedCompany.status === 'active' && (
                  <button
                    onClick={() => handleStatusUpdate(selectedCompany.id, 'suspended')}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-yellow-600 text-base font-medium text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Suspend
                  </button>
                )}
                {selectedCompany.status === 'suspended' && (
                  <button
                    onClick={() => handleStatusUpdate(selectedCompany.id, 'active')}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Reactivate
                  </button>
                )}
                <button
                  onClick={() => setShowDetailsModal(false)}
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

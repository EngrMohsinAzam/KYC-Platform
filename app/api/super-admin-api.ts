// Super Admin API utilities
import { API_BASE_URL } from '@/app/(public)/config'

const SUPER_ADMIN_TOKEN_KEY = 'superAdminToken'
const SUPER_ADMIN_INFO_KEY = 'superAdminInfo'

export type SuperAdminInfo = {
  id: string
  username?: string
  email?: string
  role?: string
  lastLogin?: string
}

export const getSuperAdminToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(SUPER_ADMIN_TOKEN_KEY)
}

export const setSuperAdminToken = (token: string): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem(SUPER_ADMIN_TOKEN_KEY, token)
}

export const removeSuperAdminToken = (): void => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SUPER_ADMIN_TOKEN_KEY)
  localStorage.removeItem(SUPER_ADMIN_INFO_KEY)
}

export const getSuperAdminInfo = (): SuperAdminInfo | null => {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(SUPER_ADMIN_INFO_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as SuperAdminInfo
  } catch {
    return null
  }
}

export interface SuperAdminLoginRequest {
  username: string
  password: string
}

export interface SuperAdminLoginResponse {
  success: boolean
  message?: string
  data?: {
    token: string
    admin?: SuperAdminInfo
    superAdmin?: SuperAdminInfo
  }
}

export const superAdminLogin = async (
  credentials: SuperAdminLoginRequest
): Promise<SuperAdminLoginResponse> => {
  try {
    const response = await fetch('/api/super-admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    })

    const data = (await response.json()) as SuperAdminLoginResponse

    if (data.success && data.data?.token) {
      setSuperAdminToken(data.data.token)
      const info = data.data.superAdmin || data.data.admin
      if (info && typeof window !== 'undefined') {
        localStorage.setItem(SUPER_ADMIN_INFO_KEY, JSON.stringify(info))
      }
    }

    return data
  } catch (error: any) {
    console.error('Super admin login error:', error)
    return { success: false, message: error.message || 'Failed to connect to server' }
  }
}

export type AdminPermissions = {
  canApproveRejectKYC: boolean
  canViewAllUsers: boolean
  canViewFinancialGraph: boolean
  canViewSupportIssues: boolean
  canViewWallets: boolean
  canSendEmails?: boolean
}

export type AdminAccount = {
  id: string
  email: string
  username: string
  role?: string
  permissions: AdminPermissions
  createdAt?: string
  lastLogin?: string
}

export const superAdminListAdmins = async (params: { page?: number; limit?: number } = {}) => {
  const token = getSuperAdminToken()
  if (!token) return { success: false, message: 'Not authenticated' }
  const qp = new URLSearchParams()
  if (params.page) qp.append('page', String(params.page))
  if (params.limit) qp.append('limit', String(params.limit))

  const response = await fetch(`/api/super-admin/admins?${qp.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  const data = await response.json()
  return data
}

export const superAdminCreateAdmin = async (body: {
  email: string
  password: string
  username?: string
  permissions?: Partial<AdminPermissions>
}) => {
  const token = getSuperAdminToken()
  if (!token) return { success: false, message: 'Not authenticated' }

  const response = await fetch('/api/super-admin/admins', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = await response.json()
  return data
}

export const superAdminDeleteAdmin = async (id: string) => {
  const token = getSuperAdminToken()
  if (!token) return { success: false, message: 'Not authenticated' }

  const response = await fetch(`/api/super-admin/admins/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  const data = await response.json().catch(() => ({}))
  return response.ok ? data : { success: false, message: data?.message || `HTTP ${response.status}` }
}

export const superAdminUpdateAdmin = async (id: string, body: {
  email?: string
  username?: string
  password?: string
  permissions?: Partial<AdminPermissions>
  isActive?: boolean
}) => {
  const token = getSuperAdminToken()
  if (!token) return { success: false, message: 'Not authenticated' }

  const response = await fetch(`/api/super-admin/admins/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = await response.json().catch(() => ({}))
  return response.ok ? data : { success: false, message: data?.message || `HTTP ${response.status}` }
}

export const getKycPausedStatus = async (): Promise<{ success: boolean; data?: any; message?: string }> => {
  try {
    const response = await fetch('/api/kyc/paused-status', { method: 'GET' })
    const data = await response.json()
    return data
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to fetch paused status' }
  }
}

export const superAdminSetKycPaused = async (body: {
  kycPaused: boolean
  pauseStartAt?: string
  pauseEndAt?: string
}) => {
  const token = getSuperAdminToken()
  if (!token) return { success: false, message: 'Not authenticated' }

  console.log('📤 [superAdminSetKycPaused] Sending request body:', JSON.stringify(body, null, 2))
  
  const response = await fetch('/api/super-admin/settings/kyc', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  
  console.log('📥 [superAdminSetKycPaused] Response status:', response.status)
  const data = await response.json().catch(() => ({}))
  console.log('📥 [superAdminSetKycPaused] Response data:', JSON.stringify(data, null, 2))
  
  return response.ok ? data : { success: false, message: data?.message || `HTTP ${response.status}` }
}

export type TimeRange = 'week' | 'month' | 'year'

export type SuperAdminDashboardSummary = {
  totalUsers: number
  totalAdmins: number
  totalApprovedApplications: number
  totalRejectedApplications: number
  totalCancelledApplications: number
  totalAmountCollected: number
}

export const superAdminDashboardSummary = async (): Promise<{ success: boolean; data?: SuperAdminDashboardSummary; message?: string }> => {
  const token = getSuperAdminToken()
  if (!token) return { success: false, message: 'Not authenticated' }

  const response = await fetch('/api/super-admin/dashboard/summary', {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  const data = await response.json().catch(() => ({}))
  return data
}

export const superAdminAnalyticsTime = async (range: TimeRange) => {
  const token = getSuperAdminToken()
  if (!token) return { success: false, message: 'Not authenticated' }

  const qp = new URLSearchParams({ range })
  const response = await fetch(`/api/super-admin/analytics/time?${qp.toString()}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  const data = await response.json().catch(() => ({}))
  return data
}

export type WalletRecord = {
  id?: string
  _id?: string
  address?: string
  walletAddress?: string
  label?: string
  createdAt?: string
}

export const superAdminListWallets = async (params: { page?: number; limit?: number } = {}) => {
  const token = getSuperAdminToken()
  if (!token) return { success: false, message: 'Not authenticated' }

  const qp = new URLSearchParams()
  if (params.page) qp.append('page', String(params.page))
  if (params.limit) qp.append('limit', String(params.limit))

  const response = await fetch(`/api/super-admin/wallets?${qp.toString()}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  const data = await response.json().catch(() => ({}))
  return data
}

export const superAdminWalletsTotal = async () => {
  const token = getSuperAdminToken()
  if (!token) return { success: false, message: 'Not authenticated' }
  const response = await fetch('/api/super-admin/wallets/total', {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  const data = await response.json().catch(() => ({}))
  return data
}

export const superAdminAddWallet = async (body: { address?: string; walletAddress?: string; label?: string }) => {
  const token = getSuperAdminToken()
  if (!token) return { success: false, message: 'Not authenticated' }
  const response = await fetch('/api/super-admin/wallets', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await response.json().catch(() => ({}))
  return data
}

export const superAdminRemoveWallet = async (id: string) => {
  const token = getSuperAdminToken()
  if (!token) return { success: false, message: 'Not authenticated' }
  const response = await fetch(`/api/super-admin/wallets/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  const data = await response.json().catch(() => ({}))
  return response.ok ? data : { success: false, message: data?.message || `HTTP ${response.status}` }
}

export const superAdminReplySupportIssue = async (issueId: string, body: { to: string; subject: string; message: string }) => {
  const token = getSuperAdminToken()
  if (!token) return { success: false, message: 'Not authenticated' }

  const response = await fetch(`/api/super-admin/support/issues/${encodeURIComponent(issueId)}/reply`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await response.json().catch(() => ({}))
  return response.ok ? data : { success: false, message: data?.message || `HTTP ${response.status}` }
}



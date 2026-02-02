/**
 * Company API client (DigiPortID backend).
 * Use after company login; token from POST /api/company/login.
 */

const COMPANY_TOKEN_KEY = 'companyToken'

export const getCompanyToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(COMPANY_TOKEN_KEY)
}

export const setCompanyToken = (token: string): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem(COMPANY_TOKEN_KEY, token)
}

export const removeCompanyToken = (): void => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(COMPANY_TOKEN_KEY)
}

async function withAuth(path: string, opts: RequestInit = {}) {
  const token = getCompanyToken()
  if (!token) return { success: false, message: 'Not authenticated' }
  const res = await fetch(path, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...opts.headers,
    },
  })
  const data = await res.json().catch(() => ({}))
  return res.ok ? data : { success: false, message: data?.message || `HTTP ${res.status}` }
}

export const companyLogin = async (body: { email: string; password: string }) => {
  const res = await fetch('/api/company/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (data?.success && data?.data?.token) {
    setCompanyToken(data.data.token)
  }
  return data
}

export const companyProfile = () => withAuth('/api/company/profile')
export const companyDashboardStats = () => withAuth('/api/company/dashboard/stats')

export const companyPackageGet = () => withAuth('/api/company/package')
export const companyPackageUpdate = async (body: { selectedPackage?: string; extraChargePerUser?: number }) => {
  const token = getCompanyToken()
  if (!token) return { success: false, message: 'Not authenticated' }
  const res = await fetch('/api/company/package', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  return res.ok ? data : { success: false, message: data?.message || `HTTP ${res.status}` }
}

export const companyKycList = (params: { status?: string; page?: number; limit?: number; search?: string } = {}) => {
  const qp = new URLSearchParams()
  if (params.status) qp.append('status', params.status)
  if (params.page) qp.append('page', String(params.page))
  if (params.limit) qp.append('limit', String(params.limit))
  if (params.search) qp.append('search', params.search)
  return withAuth(`/api/company/kyc?${qp.toString()}`)
}

function safeDecodeUserId(id: string): string {
  try {
    return decodeURIComponent(id)
  } catch {
    return id
  }
}

export const companyKycByUserId = (userId: string) =>
  withAuth(`/api/company/kyc/${encodeURIComponent(safeDecodeUserId(userId))}`)

export const companyKycUserStatus = async (userId: string, body: { status: string; reason?: string; allowResubmit?: boolean }) => {
  const token = getCompanyToken()
  if (!token) return { success: false, message: 'Not authenticated' }
  const raw = safeDecodeUserId(userId)
  const res = await fetch(`/api/company/kyc/${encodeURIComponent(raw)}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  return res.ok ? data : { success: false, message: data?.message || `HTTP ${res.status}` }
}

export const companySupportStats = () => withAuth('/api/company/support/stats')
export const companySupportUserIssues = (params: { status?: string; page?: number; limit?: number } = {}) => {
  const qp = new URLSearchParams()
  if (params.status) qp.append('status', params.status || '')
  if (params.page) qp.append('page', String(params.page))
  if (params.limit) qp.append('limit', String(params.limit))
  return withAuth(`/api/company/support/user-issues?${qp.toString()}`)
}
export const companySupportMyIssuesList = () => withAuth('/api/company/support/my-issues')
export const companySupportCreateIssue = (body: { subject: string; description: string; category: string }) =>
  withAuth('/api/company/support/my-issues', { method: 'POST', body: JSON.stringify(body) })

const KYC_COMPANY_KEY = 'kyc_company_context'

export type CompanyContext = { companyId: string; companySlug: string; companyName: string }

export function getCompanyContext(): CompanyContext | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(KYC_COMPANY_KEY)
    return raw ? (JSON.parse(raw) as CompanyContext) : null
  } catch {
    return null
  }
}

export function setCompanyContext(ctx: CompanyContext): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(KYC_COMPANY_KEY, JSON.stringify(ctx))
}

export function clearCompanyContext(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(KYC_COMPANY_KEY)
}

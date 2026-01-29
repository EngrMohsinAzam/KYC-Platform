# KYC Platform — Routes & API Reference

Complete reference for all **page routes**, **API routes**, and how **Dashboard**, **Admin**, and **Super Admin** fit together.

---

## 1. Dashboard vs Admin vs Super Admin (Overview)

| Area | Base route | Purpose | Who uses it |
|------|------------|---------|-------------|
| **Company dashboard** | `/dashboard` | Company-level UI: companies overview, pending company requests, etc. | Company users |
| **KYC Admin** | `/admin` | KYC management: user verifications, support issues, approve/reject, stats. | KYC admins (company staff) |
| **Super Admin** | `/super-admin` | Platform-level: company applications (approve/reject), companies list, per-company detail (financial, users), support, financials, KYC pause. | Platform super admins |

- **`/dashboard`** and **`/admin`** are separate. Dashboard = company stuff; Admin = KYC verification and support.
- **`/admin`** is the “admin” you use for KYC: login at `/admin`, then `/admin/dashboard`, `/admin/support`, `/admin/users/...`.

---

## 2. All Page Routes (Frontend)

Route groups `(public)`, `(company)`, `(user)`, `(super-admin)` do **not** appear in the URL.

### 2.1 Public (no auth)

| Route | File | Purpose |
|-------|------|---------|
| `/` | `(public)/page.tsx` | Landing / home |
| `/signin` | `(public)/signin/page.tsx` | Sign in |
| `/signup` | `(public)/signup/page.tsx` | Sign up |
| `/forgot-password` | `(public)/forgot-password/page.tsx` | Forgot password |
| `/forgot-password/confirm` | `(public)/forgot-password/confirm/page.tsx` | Forgot password confirmation |
| `/reset-password` | `(public)/reset-password/page.tsx` | Reset password (with token) |
| `/reset-password/success` | `(public)/reset-password/success/page.tsx` | Reset success |
| `/support` | `(public)/support/page.tsx` | Public support form |
| `/company/register` | `(public)/company/register/page.tsx` | Company registration (apply for API key) |
| `/company/register/pending` | `(public)/company/register/pending/page.tsx` | Pending approval message after register |
| `/privacy` | `(public)/privacy/page.tsx` | Privacy policy |
| `/terms` | `(public)/terms/page.tsx` | Terms of service |

### 2.2 Company dashboard (`/dashboard`)

| Route | File | Purpose |
|-------|------|---------|
| `/dashboard` | `(company)/dashboard/page.tsx` | Company dashboard: companies, pending requests |

Uses `(company)/dashboard/layout.tsx` (sidebar with Dashboard, Companies).

### 2.3 KYC Admin (`/admin`)

| Route | File | Purpose |
|-------|------|---------|
| `/admin` | `(company)/admin/page.tsx` | Admin login (Admin Portal) |
| `/admin/dashboard` | `(company)/admin/dashboard/page.tsx` | KYC dashboard: stats, users, support link |
| `/admin/support` | `(company)/admin/support/page.tsx` | Support issues list |
| `/admin/support/[id]` | `(company)/admin/support/[id]/page.tsx` | Support issue detail, reply, mark resolved |
| `/admin/users/[userId]` | `(company)/admin/users/[userId]/page.tsx` | User details (email = `userId`) |

Auth: **Admin token** in `localStorage` (`adminToken`). Login via `/api/admin/login`, then use token for all admin APIs.

### 2.4 Super Admin (`/super-admin`)

| Route | File | Purpose |
|-------|------|---------|
| `/super-admin` | `(super-admin)/super-admin/page.tsx` | Super admin login |
| `/super-admin/dashboard` | `(super-admin)/super-admin/dashboard/page.tsx` | Platform overview (KPIs, charts, support notifications) |
| `/super-admin/companies` | `(super-admin)/super-admin/companies/page.tsx` | Company applications (pending approve/reject) + approved companies list |
| `/super-admin/companies/[companyId]` | `(super-admin)/super-admin/companies/[companyId]/page.tsx` | Company detail: info, financial graph, total users |
| `/super-admin/support` | `(super-admin)/super-admin/support/page.tsx` | All support issues (platform-wide) |
| `/super-admin/support/[id]` | `(super-admin)/super-admin/support/[id]/page.tsx` | Support issue detail, reply, mark resolved |
| `/super-admin/financial` | `(super-admin)/super-admin/financial/page.tsx` | Financial view (platform) |
| `/super-admin/pause-kyc` | `(super-admin)/super-admin/pause-kyc/page.tsx` | Pause KYC |
| `/super-admin/profile` | `(super-admin)/super-admin/profile/page.tsx` | Profile |
| `/super-admin/logout` | `(super-admin)/super-admin/logout/page.tsx` | Logout |
| `/super-admin/admins` | `(super-admin)/super-admin/admins/page.tsx` | Redirects to `/super-admin/companies` (admins removed) |

Auth: **Super-admin token** (stored similarly, different key). Login via `/api/super-admin/login`.

### 2.5 User (KYC flow, account, wallet)

| Route | File | Purpose |
|-------|------|---------|
| `/account-status` | `(user)/account-status/page.tsx` | Account status |
| `/account-status/account-status` | `(user)/account-status/account-status/page.tsx` | Nested duplicate |
| `/otp-verification` | `(user)/otp-verification/page.tsx` | OTP verification |
| `/otp-verification/otp-verification` | `(user)/otp-verification/otp-verification/page.tsx` | Nested duplicate |
| `/wallet-connect` | `(user)/wallet-connect/page.tsx` | Wallet connect |
| `/wallet-connect/wallet-connect` | `(user)/wallet-connect/wallet-connect/page.tsx` | Nested duplicate |
| `/decentralized-id/connect` | `(user)/decentralized-id/connect/page.tsx` | Decentralized ID connect |
| `/decentralized-id/confirm` | `(user)/decentralized-id/confirm/page.tsx` | Decentralized ID confirm |
| `/decentralized-id/complete` | `(user)/decentralized-id/complete/page.tsx` | Decentralized ID complete |
| `/verify/start` | `(user)/verify/start/page.tsx` | Start verification (no company) |
| `/verify/start/[companySlug]/[companyId]` | `(user)/verify/start/[companySlug]/[companyId]/page.tsx` | Start verification with company (validate, “Powered by”, KYC URL) |
| `/verify/select-id-type` | `(user)/verify/select-id-type/page.tsx` | Select ID type |
| `/verify/resident-selection` | `(user)/verify/resident-selection/page.tsx` | Resident selection |
| `/verify/identity` | `(user)/verify/identity/page.tsx` | Identity step |
| `/verify/personal-info` | `(user)/verify/personal-info/page.tsx` | Personal info |
| `/verify/upload-document` | `(user)/verify/upload-document/page.tsx` | Upload document |
| `/verify/upload-selfie` | `(user)/verify/upload-selfie/page.tsx` | Upload selfie |
| `/verify/otp-verification` | `(user)/verify/otp-verification/page.tsx` | OTP (verify flow) |
| `/verify/review` | `(user)/verify/review/page.tsx` | Review submission |
| `/verify/check-status` | `(user)/verify/check-status/page.tsx` | Check status |
| `/verify/under-review` | `(user)/verify/under-review/page.tsx` | Under review |
| `/verify/rejected` | `(user)/verify/rejected/page.tsx` | Rejected |

---

## 3. All API Routes (Next.js → Backend proxy)

All `/api/*` routes **proxy** to the backend at `API_BASE_URL`  
(config: `app/(public)/config.ts` → `NEXT_PUBLIC_API_URL` or default `https://api.digiportid.com`).

### 3.1 Admin API (`/api/admin/*`)

Used by **KYC Admin** (`/admin`, `/admin/dashboard`, etc.). Auth: `Authorization: Bearer <adminToken>`.

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| `POST` | `/api/admin/login` | Admin login | No |
| `GET` | `/api/admin/capabilities` | Admin capabilities / permissions | Yes |
| `GET` | `/api/admin/dashboard/stats` | Dashboard stats (users, etc.) | Yes |
| `POST` | `/api/admin/email` | Send email (e.g. support reply) | Yes |
| `GET` | `/api/admin/users` | List users (query: page, limit, status, search, etc.) | Yes |
| `GET` | `/api/admin/users/[userId]` | User details by email | Yes |
| `PATCH` | `/api/admin/users/status-by-email` | Update user status by email | Yes |

**Client:** `app/api/admin-api.ts` (e.g. `adminLogin`, `getAdminToken`, `getDashboardStats`, `getUsers`, `getUserDetails`, `updateUserStatus`, `adminSendEmail`, `getAdminCapabilities`).

### 3.2 Auth API (`/api/auth/*`)

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| `POST` | `/api/auth/send-otp` | Send OTP to email (body: `email`) | No |
| `POST` | `/api/auth/verify-otp` | Verify OTP (body: `email`, `otp`) | No |

### 3.3 Company API (`/api/company/*`)

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| `POST` | `/api/company/register` | Company registration (apply for API key) | No |
| `POST` | `/api/company/login` | Company login (approved companies only) | No |
| `POST` | `/api/company/check-status` | Check registration status by email | No |
| `GET` | `/api/company/validate/[companySlug]/[companyId]` | Validate company KYC URL | No |
| `GET` | `/api/company/profile` | Company profile | Company token |
| `GET` | `/api/company/dashboard/stats` | Company dashboard stats | Company token |
| `GET` | `/api/company/kyc` | List KYC submissions (query: status, page, limit, search) | Company token |
| `GET` | `/api/company/kyc/[userId]` | Single KYC details | Company token |
| `GET` | `/api/company/support/stats` | Company support stats | Company token |
| `GET` | `/api/company/support/user-issues` | List user-reported issues | Company token |
| `GET` | `/api/company/support/my-issues` | List company’s own issues | Company token |
| `POST` | `/api/company/support/my-issues` | Create company support issue | Company token |

**Client:** `app/api/company-api.ts` (company login, profile, dashboard, KYC, support).

### 3.4 Support API (`/api/support/*`)

Used by **admin support** pages and **public support** form.  
- Admin: `Authorization: Bearer <adminToken>`.  
- Public form: `POST /api/support/issues` has no Bearer (submits as guest).

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| `GET` | `/api/support/issues` | List support issues (query: page, limit, status) | Admin token |
| `POST` | `/api/support/issues` | Create support issue (public form) | No |
| `GET` | `/api/support/issues/[id]` | Get issue by id | Admin token |
| `PATCH` | `/api/support/issues/[id]/status` | Update issue status (e.g. resolved) | Admin token |

### 3.5 KYC API (`/api/kyc/*`)

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| `GET` | `/api/kyc/paused-status` | Check if KYC is paused | No |
| `GET` | `/api/kyc/status` | Get KYC status (query: companyId, email or userId) | No |
| `POST` | `/api/kyc/check-status-by-email` | Check KYC status by email (body: email, companyId?) | No |
| `POST` | `/api/kyc/check-status-by-cnic` | Check KYC status by CNIC (body: cnic, companyId?) | No |
| `POST` | `/api/kyc/all-by-email` | All KYC records by email (across companies) | No |
| `POST` | `/api/kyc/submit` | Submit KYC (multipart/form-data) | No |
| `PUT` | `/api/kyc/update-documents` | Update KYC documents (multipart) | No |

### 3.6 Super Admin API (`/api/super-admin/*`)

Used by **Super Admin** UI. Auth: `Authorization: Bearer <superAdminToken>`.

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| `POST` | `/api/super-admin/login` | Super admin login | No |
| `GET` | `/api/super-admin/dashboard/summary` | Dashboard summary | Yes |
| `GET` | `/api/super-admin/companies/stats` | Company stats | Yes |
| `GET` | `/api/super-admin/companies` | List companies (status, search, page, limit) | Yes |
| `GET` | `/api/super-admin/companies/[id]` | Company detail | Yes |
| `PATCH` | `/api/super-admin/companies/[id]/approve` | Approve company | Yes |
| `PATCH` | `/api/super-admin/companies/[id]/reject` | Reject company (body: `reason?`) | Yes |
| `GET` | `/api/super-admin/analytics/time` | Analytics over time | Yes |
| `GET` | `/api/super-admin/admins` | List admins | Yes |
| `POST` | `/api/super-admin/admins` | Create admin | Yes |
| `PATCH` | `/api/super-admin/admins/[id]` | Update admin | Yes |
| `DELETE` | `/api/super-admin/admins/[id]` | Delete admin | Yes |
| `GET` | `/api/super-admin/wallets` | List wallets | Yes |
| `POST` | `/api/super-admin/wallets` | Create wallet | Yes |
| `DELETE` | `/api/super-admin/wallets/[id]` | Delete wallet | Yes |
| `GET` | `/api/super-admin/wallets/total` | Wallets total | Yes |
| `PATCH` | `/api/super-admin/settings/kyc` | KYC settings (e.g. pause) | Yes |
| `GET` | `/api/super-admin/kyc/stats` | KYC stats (query: companyId?) | Yes |
| `GET` | `/api/super-admin/users` | List users (query: companyId, status, search, page, limit) | Yes |
| `GET` | `/api/super-admin/users/[userId]` | User details | Yes |
| `PATCH` | `/api/super-admin/users/[userId]/status` | Update user KYC status (body: status, reason?) | Yes |
| `GET` | `/api/super-admin/support/stats` | Support stats (query: companyId?, issueType?) | Yes |
| `GET` | `/api/super-admin/support/issues` | List support issues (query: issueType, companyId, status, search, page, limit) | Yes |
| `GET` | `/api/super-admin/support/issues/[id]` | Get support issue | Yes |
| `POST` | `/api/super-admin/support/issues/[id]/reply` | Reply to support issue | Yes |
| `PATCH` | `/api/super-admin/support/issues/[id]/status` | Update issue status (body: status) | Yes |
| `POST` | `/api/super-admin/email` | Send email (body: to, subject, message) | Yes |

**Client:** `app/api/super-admin-api.ts`. Super-admin support uses `/api/super-admin/support/*` (not `/api/support/*`).

### 3.7 Geocode API

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| `GET` | `/api/geocode/search` | Address search (query: `q`) | No |

---

## 4. Backend (External API)

- **Base URL:** `API_BASE_URL` from `app/(public)/config.ts`.  
  - Env: `NEXT_PUBLIC_API_URL` (optional).  
  - Default: `https://api.digiportid.com`
- Next.js API routes under `/api/*` call `API_BASE_URL` (e.g. `${API_BASE_URL}/api/admin/login`, `${API_BASE_URL}/api/support/issues`, etc.).
- The **backend** implements the real logic; Next.js only proxies and forwards headers (e.g. `Authorization`).

---

## 5. Auth & Tokens

| Token | Storage | Set by | Used for |
|-------|---------|--------|----------|
| Admin | `localStorage.adminToken` | `POST /api/admin/login` | `/api/admin/*` (except login), `/admin/*` pages |
| Super Admin | Similar (super-admin login) | `POST /api/super-admin/login` | `/api/super-admin/*`, `/super-admin/*` |
| Company | `localStorage.companyToken` | `POST /api/company/login` | `/api/company/profile`, `/api/company/dashboard/*`, `/api/company/kyc`, `/api/company/support/*` |

- **Admin:** `getAdminToken`, `setAdminToken`, `removeAdminToken` in `admin-api.ts`.
- **Company:** `getCompanyToken`, `setCompanyToken`, `removeCompanyToken` in `company-api.ts`.
- Login responses include `data.token`; frontend stores it and sends `Authorization: Bearer <token>` on subsequent requests.

---

## 6. Key Files

| File | Purpose |
|------|---------|
| `app/(public)/config.ts` | `API_BASE_URL` |
| `app/api/admin-api.ts` | Admin client (login, users, stats, email, capabilities) |
| `app/api/company-api.ts` | Company client (login, profile, dashboard, KYC, support) |
| `app/api/super-admin-api.ts` | Super-admin client (companies, users, support, kyc stats, email, etc.) |
| `app/api/api.ts` | KYC submit, status, check-status-by-email, check-status-by-cnic, update-documents, etc. |
| `app/api/auth.ts` | Auth helpers (uses admin login) |
| `app/api/index.ts` | Re-exports api, admin-api, auth |

---

## 7. Quick Reference: “Where do I go?”

| Goal | Route |
|------|--------|
| Company dashboard (companies, pending requests) | `/dashboard` |
| KYC admin login | `/admin` |
| KYC admin dashboard (users, stats, support) | `/admin/dashboard` |
| Support issues (admin) | `/admin/support` |
| User details (admin) | `/admin/users/[email]` |
| Super admin | `/super-admin` → `/super-admin/dashboard`; companies → `/super-admin/companies` |
| User KYC flow | `/verify/start` → … → `/verify/review` |
| Public support form | `/support` |

---

## 8. Route → File Map (App Router)

```
app/
├── (public)/
│   ├── page.tsx                    → /
│   ├── signin/page.tsx             → /signin
│   ├── signup/page.tsx             → /signup
│   ├── forgot-password/...
│   ├── reset-password/...
│   ├── support/page.tsx            → /support
│   ├── privacy/page.tsx            → /privacy
│   ├── terms/page.tsx              → /terms
│   └── config.ts                   → API_BASE_URL
├── (company)/
│   ├── dashboard/
│   │   ├── page.tsx                → /dashboard
│   │   └── layout.tsx
│   └── admin/
│       ├── page.tsx                → /admin
│       ├── dashboard/page.tsx      → /admin/dashboard
│       ├── support/page.tsx        → /admin/support
│       ├── support/[id]/page.tsx   → /admin/support/[id]
│       └── users/[userId]/page.tsx → /admin/users/[userId]
├── (super-admin)/super-admin/
│   ├── companies/page.tsx          → /super-admin/companies
│   ├── companies/[companyId]/...   → /super-admin/companies/[id]
│   ├── support/page.tsx            → /super-admin/support
│   ├── support/[id]/page.tsx       → /super-admin/support/[id]
│   └── ...                         → /super-admin/*
├── (user)/...                      → /account-status, /verify/*, etc.
└── api/
    ├── admin/...                   → /api/admin/*
    ├── support/...                 → /api/support/*
    ├── kyc/...                     → /api/kyc/*
    ├── super-admin/...             → /api/super-admin/*
    └── geocode/...                 → /api/geocode/*
```

---

*Generated for KYC Platform. Update this doc when adding or changing routes or APIs.*

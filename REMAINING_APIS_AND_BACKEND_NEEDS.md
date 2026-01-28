# Remaining APIs & Backend Needs

## 1. APIs we use that are **NOT** in the DigiPortID API doc

These are called by the frontend today. The doc you shared does **not** list them.

| API | Used where | Request | Notes |
|-----|------------|---------|-------|
| **`POST /api/kyc/check-status-by-wallet`** | `api.ts` → `checkStatusByWallet()`; `decentralized-id/connect` page | `{ "walletAddress": "0x..." }` | We call the backend directly (no Next.js proxy). **You need this from backend** if wallet-based KYC status check is required. |
| **`GET /api/geocode/search?q=...`** | Signup page, Verify → Personal Info (address search) | Query `q`, optional country | We proxy to backend (or external service). **You need** either this endpoint on your backend or a doc for the external geocode service we use. |
| **`POST /api/admin/login`** | Company/KYC Admin login (`/admin`) | e.g. `{ "email", "password" }` | See “Admin vs Company” below. |
| **`GET /api/admin/capabilities`** | Admin dashboard | — | |
| **`GET /api/admin/dashboard/stats`** | Admin dashboard | — | |
| **`GET /api/admin/users`** | Admin users list | query: page, limit, status, search, etc. | |
| **`GET /api/admin/users/[userId]`** | Admin user detail | — | Doc uses `userId`; we sometimes use email as id. |
| **`PATCH /api/admin/users/status-by-email`** | Admin user status update | body: email, status, etc. | |
| **`POST /api/admin/email`** | Admin send email (e.g. support reply) | `{ "to", "subject", "message" }` | |
| **`GET /api/support/issues`** | Admin support list | query: page, limit, status | Used by **Admin** (company) support. Doc has `GET /api/company/support/user-issues` for company and `GET /api/super-admin/support/issues` for super-admin. |
| **`GET /api/support/issues/[id]`** | Admin support issue detail | — | |
| **`PATCH /api/support/issues/[id]/status`** | Admin support status update | `{ "status": "resolved" }` etc. | |

---

## 2. What we **need from backend**

### 2.1 KYC – wallet-based status

- **Endpoint:** `POST /api/kyc/check-status-by-wallet`
- **Body:** `{ "walletAddress": "0x..." }`
- **Used for:** Decentralized-ID connect flow, wallet-based KYC status.
- **Please:** Either add this endpoint and document it, or tell us to remove/hide wallet-based status check.

### 2.2 Geocode / address search

- **Endpoint:** `GET /api/geocode/search?q=...` (and optional country).
- **Used for:** Signup and Verify → Personal Info address search.
- **Please:** Confirm whether this is (a) your backend, or (b) an external service—and send doc/URL for (b) if so.

### 2.3 Admin vs Company (clarification)

- **Doc:** Companies use `POST /api/company/login` and then `/api/company/*` (profile, dashboard, KYC, support).
- **App today:** “Admin” (KYC Admin / company dashboard) uses `POST /api/admin/login` and `/api/admin/*`.

We need to know:

1. Is **Admin** the same as **Company**?
   - If **yes:** we should eventually switch Admin UI to `company/login` + `/api/company/*` and drop `/api/admin/*`. You can keep `/api/admin/*` for backward compatibility until we migrate.
   - If **no:** we need a **separate Admin API doc** (login, capabilities, dashboard, users, email, etc.) so we can align the frontend.

2. For **support:**
   - Doc: company → `GET /api/company/support/user-issues`; super-admin → `GET /api/super-admin/support/issues`.
   - We use `GET /api/support/issues` for Admin. Is that a **separate** “admin support” API, or should Admin use **company** support (`user-issues`) when logged in as company?

### 2.4 Super-admin support – get single issue

- We use `GET /api/super-admin/support/issues/[id]` to fetch one issue. The doc explicitly lists list/reply/status only.
- **Please confirm** your backend supports this, or add it.

### 2.5 Support reply payload

- **Doc:** `POST .../support/issues/:id/reply` body: `{ "subject", "message", "status" }`.
- **We send:** `{ "to", "subject", "message" }` (e.g. `to` = issue email).
- **Please confirm** you accept `to` or that you use the issue’s email from your side, so we can align.

---

## 3. DigiPortID doc – all covered

Everything in the DigiPortID API doc you shared is implemented and wired:

- Auth: `send-otp`, `verify-otp`
- Company: `register`, `login`, `check-status`, `validate`, `profile`, `dashboard/stats`, `kyc`, `kyc/:userId`, `support/stats`, `user-issues`, `my-issues` (GET + POST)
- KYC: `submit`, `status`, `check-status-by-email`, `check-status-by-cnic`, `all-by-email`, `update-documents`, `paused-status`
- Support: `POST /api/support/issues` (create, public)
- Super-admin: login, dashboard, companies, users, KYC stats, support (stats, issues, reply, status), wallets, settings, analytics, email

---

## 4. Summary

| Item | Status | Action |
|------|--------|--------|
| Doc’d DigiPortID APIs | Done | None |
| `check-status-by-wallet` | Missing in doc, we use it | **Backend:** add + doc, or we remove usage |
| Geocode search | Missing in doc, we use it | **Backend:** confirm source + doc |
| Admin API | Not in Doc, we use it | **Backend:** clarify Admin vs Company; provide Admin API doc if separate |
| Support (Admin vs Company vs Super-admin) | Unclear | **Backend:** clarify which endpoints Admin should use |
| Super-admin `GET` issue by id | Used, not explicit in doc | **Backend:** confirm support |
| Reply body `to` vs `subject`/`message`/`status` | Small mismatch | **Backend:** confirm accepted payload |

Once you confirm the above, we can align the frontend (and optionally add a proxy for `check-status-by-wallet` if you add that endpoint).

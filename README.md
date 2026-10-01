# ABCD of JNVST — Phase 0 Security-Hardened Foundation

> **Paid JNVST Class 6 Entrance Exam Preparation Platform**  
> Designed for a focused cohort of ~500 students with a configurable ₹500 preparation package.

---

## 📌 Product Context & Security Posture

- **Parent/Guardian Centric Model:** Accounts belong to parents or guardians who can register and manage one or more student profiles.
- **Strict Privacy & Server Authorization:**
  - Student names are never used as usernames; mobile numbers are never used as passwords.
  - User roles are strictly verified from the server-controlled `public.application_roles` table (`admin` and `guardian` only). Client-editable `user_metadata` is never trusted for authorization.
  - Plaintext passwords, access tokens, and database secrets are never logged or exposed to the client.
- **Configurable Subscription Model:**
  - Configurable preparation plan (default ₹500 / 365 days) configured in `src/lib/constants.ts` via `APP_CONFIG` and environment overrides (`SUBSCRIPTION_PRICE_INR`, `DEFAULT_SUBSCRIPTION_DURATION_DAYS`).
  - No live payment processing is active in Phase 0 (mock boundary `PaymentProvider` in place).
- **Single Administrator Model:** Administrators manage cohort capacity (500 limit), inspect platform statistics, grant student entitlements, and review audit trails.
- **Theme & Aesthetics:** Follows the **60-30-10 Color Rule** with a clean light theme:
  - **60% Canvas & Surfaces:** `#F8FAFC` (Slate-50) & pure `#FFFFFF` cards with subtle `#E2E8F0` borders.
  - **30% Structural Secondary:** Deep Teal / Emerald (`#0F766E` / `#115E59`) & rich slate typography (`#0F172A`).
  - **10% High-Energy Accent:** Warm Saffron / Amber (`#D97706` / `#B45309`) for primary CTAs, ₹500 price badges, and focus rings.

---

## 🏗️ Project Architecture & Hardened Service Boundaries

```
ABCD of JNVST/
├── src/
│   ├── app/                      # Next.js App Router (Layout, Landing, Dashboards, Auth)
│   │   ├── (auth)/               # Sign-in, Sign-up, Forgot-password pages
│   │   ├── admin/                # Administrator console & audit trail
│   │   ├── auth/callback/        # Supabase SSR code exchange handler
│   │   ├── dashboard/            # Guardian dashboard & student management
│   │   │   └── students/         # Student registration & editing
│   │   ├── unauthorized/         # 401/403 Forbidden state handling
│   │   ├── not-found.tsx         # Custom 404 page
│   │   ├── error.tsx             # Application error boundary
│   │   └── globals.css           # 60-30-10 design system tokens
│   ├── components/               # Accessible UI primitives (Button, Input, Select, Card, Badge, Alert)
│   │   └── layout/               # Header, Footer, DevRoleSwitcher (dev-only guard)
│   ├── features/                 # Modular domain features
│   │   ├── auth/                 # Sign-in/up forms, auth server actions
│   │   ├── guardians/            # Guardian profile cards and actions
│   │   ├── students/             # Student cards, forms, and actions
│   │   └── admin/                # Admin tables, stats, audit viewers
│   ├── server/                   # Server-side business layer
│   │   ├── auth/                 # Supabase SSR clients (server, middleware, route)
│   │   ├── authorization/        # Role enforcement, access predicates
│   │   ├── db/                   # Database types (no in-memory store in app paths)
│   │   ├── validation/           # Zod schemas (auth, student, guardian)
│   │   └── services/             # StudentService, GuardianService, AdminService, AuditService
│   └── lib/                      # Shared utilities & integration boundaries
│       ├── env.ts                # Zod environment validation
│       ├── constants.ts          # Configurable pricing, Indian States, JNVST criteria
│       └── providers/            # Mock boundaries: PaymentProvider, OtpProvider, FileStorageProvider, NotificationProvider
├── supabase/
│   └── migrations/               # PostgreSQL schema & seed migrations
│       ├── 20261001000000_init_schema.sql
│       └── 20261001000001_seed_data.sql
├── tests/
│   ├── unit/                     # Validation, provider, and audit sanitization tests
│   ├── integration/              # Real PostgreSQL Row Level Security (RLS) tests
│   └── browser/                  # Playwright browser E2E tests
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── vitest.config.ts
```

---

## 🗄️ Database Foundation & Row Level Security (RLS)

All application services (`StudentService`, `GuardianService`, `AdminService`, `AuditService`) query the real PostgreSQL / Supabase database. If the database is unreachable, queries fail clearly with descriptive errors rather than silently falling back to mock fixtures.

### RLS Policies & Security Guarantees

1. **Student Isolation:**
   - Guardians can **only** read and update students linked to their own account via `guardian_student_links`.
   - Direct read or update attempts on another guardian's student yield 0 rows / are rejected.
2. **Anonymous Access Blocking:**
   - Anonymous requests cannot read `student_profiles`, `guardian_profiles`, or `audit_logs`.
3. **Role Escalation Protection:**
   - Role modifications on `public.application_roles` are restricted to administrators. Normal users cannot self-assign the `admin` role.
4. **Append-Only Audit Logs:**
   - Authenticated users can insert audit records for their own actions.
   - Normal users **cannot** read, update, or delete audit logs.
   - Only administrators can query audit logs.

### Audit Log Retention & Redaction Policy

- **Sensitive Metadata Redaction:** `AuditService.log()` recursively scrubs keys matching `password`, `token`, `secret`, `accessToken`, `refreshToken`, `apiKey`, `creditCard`, `cvv`, `panNumber`, and `otp`, replacing their values with `"[REDACTED]"`.
- **IP Address & Audit Retention:**
  - Client IP addresses (`x-forwarded-for` / `x-real-ip`) are captured for security auditing.
  - **Hot Storage:** 90 days in the PostgreSQL `audit_logs` table.
  - **Cold Storage:** Automated monthly partition export to write-once compliant cloud archive for 1 year, after which records are purged in accordance with data retention regulations.

---

## 🚀 Local Setup & Database Initialization

### 1. Prerequisites

- Node.js 20+
- PostgreSQL 16+ or Supabase CLI

### 2. Environment Configuration

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

### 3. Initialize Local PostgreSQL Database

```bash
# Create local database
createdb abcd_jnvst_test

# Apply migrations
psql -d abcd_jnvst_test -f supabase/migrations/20261001000000_init_schema.sql
psql -d abcd_jnvst_test -f supabase/migrations/20261001000001_seed_data.sql
```

### 4. Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🛡️ Development vs Production Safeguards

- **`DevRoleSwitcher` Guard:** Strictly disabled outside development (`process.env.NODE_ENV !== "development"` returns `null` and is omitted from root layout).
- **Demo Quick-Fill Guard:** Login helper buttons are only rendered when `NODE_ENV === "development"`.
- **Server Role Enforcement:** Protected routes call `requireGuardian()` / `requireAdmin()` on the server, querying `public.application_roles`.
- **Service Role Key Isolation:** `SUPABASE_SERVICE_ROLE_KEY` is strictly server-only and never prefixed with `NEXT_PUBLIC_`.

---

## 🧪 Testing & Verification

Run the full verification suite:

```bash
# 1. Type check
npm run typecheck

# 2. Lint check
npm run lint

# 3. Format check
npm run format

# 4. Unit & RLS Integration Tests (Real PostgreSQL)
npm run test

# 5. Playwright Browser E2E Tests
npm run test:e2e

# 6. Production Bundle Build
npm run build
```

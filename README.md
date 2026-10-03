# ABCD of JNVST — Class 6 Entrance Exam Prep Platform

> **Paid JNVST Class 6 Entrance Exam Preparation Platform**  
> Designed for a focused cohort of ~500 students with a configurable ₹500 preparation package.

---

## 📌 Product Context & Architecture Overview

- **Parent/Guardian Centric Model:** Accounts belong to parents or guardians who can register and manage one or more student profiles.
- **Strict Privacy & Server Authorization:**
  - User roles are strictly verified from the server-controlled `public.application_roles` table (`admin` and `guardian` only). Client-editable `user_metadata` is never trusted for authorization.
  - Plaintext passwords, access tokens, and database secrets are never logged or exposed to the client.
- **Configurable Subscription Model:**
  - Configurable preparation plan (default ₹500 / 365 days) configured in `src/lib/constants.ts` via `APP_CONFIG` and environment overrides (`SUBSCRIPTION_PRICE_INR`, `DEFAULT_SUBSCRIPTION_DURATION_DAYS`).
- **Single Administrator Model:** Administrators manage cohort capacity (500 limit), author bilingual questions, manage reading passages, inspect statistics, and review audit trails.
- **Theme & Aesthetics:** Follows the **60-30-10 Color Rule** with a clean light theme:
  - **60% Canvas & Surfaces:** `#F8FAFC` (Slate-50) & pure `#FFFFFF` cards with subtle `#E2E8F0` borders.
  - **30% Structural Secondary:** Deep Teal / Emerald (`#0F766E` / `#115E59`) & rich slate typography (`#0F172A`).
  - **10% High-Energy Accent:** Warm Saffron / Amber (`#D97706` / `#B45309`) for primary CTAs, ₹500 price badges, and focus rings.

---

## 📚 Phase 1: Question Bank & Content Engine

The question bank powers all practice drills, sectional quizzes, and full-length mock examinations matching the official JNVST pattern.

### 1. Bilingual Question Authoring (English & Hindi)
- Every question supports simultaneous **English and Hindi statements, option labels, and step-by-step explanations**.
- Students can toggle between Hindi and English mediums on-the-fly.
- Built-in mathematical symbols toolbar (`½`, `¾`, `÷`, `×`, `²`, `√`, `π`, `₹`, `°`, `%`) for fast Arithmetic authoring.

### 2. Mental Ability Diagram / Image Manager
- Specialized categorization across all **10 official JNVST MAT categories**:
  1. `odd_man_out` (Odd-Man-Out / असंगत को अलग करना)
  2. `figure_matching` (Figure Matching / आकृति मिलान)
  3. `pattern_completion` (Pattern Completion / पैटर्न पूरा करना)
  4. `figure_series_completion` (Figure Series Completion / आकृति श्रृंखला पूर्ति)
  5. `analogy` (Analogy / सादृश्यता)
  6. `geometrical_figure_completion` (Geometrical Figure Completion - Triangle/Square/Circle)
  7. `mirror_imaging` (Mirror Imaging / दर्पण प्रतिबिम्ब)
  8. `punched_hole_pattern` (Paper Folding & Cutting)
  9. `space_visualization` (Space Visualization)
  10. `embedded_figure` (Embedded Figures / सन्निहित आकृति)
- Diagram URL input with instant preview for problem figures and individual option figures.

### 3. Reading Comprehension Passage Manager (Language Section)
- Group multiple multiple-choice questions under a single reading passage.
- Passages support bilingual titles and full reading text.

### 4. Previous Year Questions (PYQ) & Metadata Tagging
- Tag questions by exam year (`JNVST 2025`, `2024`, `2023`, `2022`, `2021`, `2020`).
- Difficulty classification (`easy`, `medium`, `hard`).
- Standard JNVST scoring: **1.25 Marks per question**, **0.00 negative marks**.

### 5. Bulk Question Importer (JSON)
- Fast batch uploading with downloadable schema template and automatic Zod validation.

---

## 🏗️ Project Architecture

```
ABCD of JNVST/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Sign-in, Sign-up, Forgot-password pages
│   │   ├── admin/                # Administrator console & audit trail
│   │   │   └── questions/        # Question Bank Manager (New, Edit, Filter)
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
│   │   ├── admin/                # Admin tables, stats, audit viewers
│   │   └── questions/            # Question authoring form, preview modal, passage manager, bulk importer
│   ├── server/                   # Server-side business layer
│   │   ├── auth/                 # Supabase SSR clients (server, middleware, route)
│   │   ├── authorization/        # Role enforcement, access predicates
│   │   ├── db/                   # Database types (no in-memory store in app paths)
│   │   ├── validation/           # Zod schemas (auth, student, guardian, question, passage)
│   │   └── services/             # StudentService, GuardianService, AdminService, AuditService, QuestionService
│   └── lib/                      # Shared utilities & integration boundaries
│       ├── env.ts                # Zod environment validation
│       ├── constants.ts          # Syllabus metadata, Indian States, JNVST criteria
│       └── providers/            # Mock boundaries: PaymentProvider, OtpProvider, FileStorageProvider, NotificationProvider
├── supabase/
│   └── migrations/               # PostgreSQL schema & seed migrations
│       ├── 20261001000000_init_schema.sql
│       ├── 20261001000001_seed_data.sql
│       ├── 20261003000000_question_bank_schema.sql
│       └── 20261003000001_seed_questions.sql
├── tests/
│   ├── unit/                     # Validation, provider, and question schemas
│   ├── integration/              # Real PostgreSQL Row Level Security (RLS) tests
│   └── browser/                  # Playwright browser E2E tests
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── vitest.config.ts
```

---

## 🗄️ Database Foundation & Row Level Security (RLS)

All application services query the real PostgreSQL / Supabase database with RLS policies enforced:

1. **Student Isolation:** Guardians can **only** read and update students linked to their own account.
2. **Question Bank Protection:** Authenticated users can view active questions and passages; only administrators can insert, update, or delete questions and passages.
3. **Role Escalation Protection:** Normal users cannot self-assign the `admin` role.
4. **Append-Only Audit Logs:** Authenticated users can insert audit logs; only administrators can query audit logs.

---

## 🚀 Local Setup & Database Initialization

### 1. Prerequisites

- Node.js 20+
- PostgreSQL 16+ or Supabase CLI

### 2. Initialize Local PostgreSQL Database

```bash
# Create local database
createdb abcd_jnvst_test

# Apply schema migrations
psql -d abcd_jnvst_test -f supabase/migrations/20261001000000_init_schema.sql
psql -d abcd_jnvst_test -f supabase/migrations/20261001000001_seed_data.sql
psql -d abcd_jnvst_test -f supabase/migrations/20261003000000_question_bank_schema.sql
psql -d abcd_jnvst_test -f supabase/migrations/20261003000001_seed_questions.sql
```

### 3. Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

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

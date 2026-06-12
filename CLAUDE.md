# SLAMS SACCO Management System

Full-stack SACCO (Savings & Credit Cooperative) management system.

## Tech Stack

- **Frontend:** `frontend/` — Next.js 16 (App Router, Turbopack), React 19, TypeScript
  (strict, no `any`), Tailwind CSS v4, shadcn/ui, Redux Toolkit, React Query, axios.
  Based on the NextAdmin template (sidebar/header/dark-mode chrome, ApexCharts).
- **Backend:** `backend/` — Laravel 12 REST API under `/api/v1/`, Sanctum SPA cookie auth.
  (Laravel 11 from the spec is blocked by Composer security advisories; 12 has the same skeleton.)
- **Database:** PostgreSQL — app DB `slams_sacco` (local); legacy `sacco` DB is reference-only
- **Roles:** Admin (SACCO staff) and Member portals, RBAC enforced at API and UI layers
- **Multi-tenancy:** YES (decided 2026-06-11) — like the legacy DB, every tenant-owned
  table carries an org reference; a SACCO = an org. Scope all queries by org.

## Frontend Structure & Conventions

### Routing (real path segments, not route groups)
- `(auth)` group → `/login`, `/register` (no sidebar layout)
- `/admin/*` — admin portal, layout uses `Sidebar` (default `ADMIN_NAV_DATA`)
- `/member/*` — member portal, layout uses `MemberSidebar` client wrapper
  (nav data contains icon functions → cannot cross server→client prop boundary)
- `src/proxy.ts` — Next 16 middleware (renamed from middleware.ts): presence check on
  `slams_session` cookie (configurable via `NEXT_PUBLIC_SESSION_COOKIE`); redirects
  unauthenticated → /login with `callbackUrl`. API is the real authority.
- Template demo pages kept under `/admin/{calendar,forms,tables,charts,ui-elements,pages/settings,profile}`
  as living component reference — labeled "TEMPLATE REFERENCE" in sidebar; remove before production.

### Key frontend files
- `src/lib/api.ts` — axios client (`api`), envelope types, `ensureCsrfCookie()`,
  `extractApiError()`, `extractFieldErrors()` (422 → inline form errors)
- `src/lib/auth/auth-client.ts` — Laravel-backed auth keeping better-auth's surface:
  `signIn.email`, `signUp.email`, `signOut`, `useSession` (React Query), `getSession`,
  `authClient.updateUser`. Server-side: `src/lib/auth/index.ts` (`auth.api.getSession`).
- `src/store/` — Redux Toolkit store; `app` slice holds `activeOrgId` (multi-tenancy)
- `src/config/branding.ts` — org branding for print/PDF exports (per-org via API later)
- `src/components/Layouts/sidebar/data/index.ts` — `ADMIN_NAV_DATA`, `MEMBER_NAV_DATA`
- `.env.example` — `NEXT_PUBLIC_API_URL` (Laravel base URL, client appends `/api/v1`),
  `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SESSION_COOKIE` (must match backend `SESSION_COOKIE`)

### Components
- shadcn/ui is the base (`src/components/ui/` — button, input, dropdown-menu added;
  template's table.tsx is already shadcn-compatible). Custom components override shadcn:
  - `src/components/DataTable.tsx` — user's TanStack table (filters, resizing, column
    visibility, Excel/CSV/PDF/JSON export, branded print). Toasts via **sonner** (template's
    toaster; react-toastify was swapped out). Client-side pagination — revisit for
    server-side pagination on large datasets.
  - `src/components/Forms/SelectInput.tsx` — user's react-select wrapper (green theme)
  - `src/components/Forms/DateInput.tsx` — flatpickr wrapper (built to match DataTable's API)
  - `src/components/Forms/NumberInput.tsx`, `src/components/data-table-helpers/DataTablePagination.tsx`
- shadcn theme tokens appended to `src/css/style.css`; the template's `--color-primary`
  (#5750f1) is intentionally kept as shadcn's primary — don't add a competing mapping.
- React Query for all API calls; inline API validation errors on every form
- Persistent sidebar layouts both portals; modals for simple create/edit, full pages for complex forms

## Workflow Preferences

- **Skip spec/code-quality reviews and tests by default** when using subagent-driven development or any implementation skill. Only run reviews or write tests when the user explicitly asks.
- Apply this to all phases and modules — do not run `php artisan test`, spec reviewer subagents, or code quality reviewer subagents unless asked.

## Backend Structure & Conventions
- PSR-12, thin controllers, business logic in Service classes
- Laravel Form Requests for validation, Laravel Resources for all responses
- Response envelope: `{ success, data, message, errors?, meta? }` — extend
  `App\Http\Controllers\Api\V1\ApiController` (`respond`, `respondCreated`, `respondError`)
- Layout: controllers `app/Http/Controllers/Api/V1/`, requests `app/Http/Requests/Api/V1/`,
  resources `app/Http/Resources/V1/`, tests `tests/Feature/Api/V1/`
- Auth: Sanctum SPA mode — `statefulApi()` middleware in `bootstrap/app.php`;
  CORS locked to `FRONTEND_URL` with credentials; login/register throttled 5/min.
  Endpoints: POST `/api/v1/auth/{login,register,logout}`, GET `me`, PUT `profile`
- Feature tests must send `Origin: http://localhost:3000` so Sanctum's stateful
  (session) path runs — see `AuthTest::setUp()`
- Run tests: `cd backend && php artisan test`; serve: `php artisan serve` (port 8000)
- Monetary values: DECIMAL(15,2) in DB, bcmath/Money library in PHP — never floats
- Queued jobs for all SMS/email notifications; PHPUnit feature tests for critical endpoints

## Database
- The legacy `sacco` PostgreSQL database (local, 151 base tables + 127 views) is a
  **functional reference only** — we map concepts and relationships from it, not table
  names. New Laravel migrations follow this project's conventions: UUID PKs, soft
  deletes, clean domain-prefixed names (`members`, `loan_products`, `petty_cash_requests`
  — not `entitys`, `loan_configs`, `pc_*`).
- **Schema reference docs:** `docs/db-reference/` — one compact file per domain.
  When building a module, read ONLY the relevant domain file (1–6 KB each), never the
  whole set. See `docs/db-reference/INDEX.md`. Regenerate with
  `python3 scripts/generate-db-reference.py`.
- For ambiguous columns, query the live DB directly (e.g. sample rows, distinct values).
- Write migrations for every schema change — no manual DB edits

## Loan Lifecycle

draft → applied → (guarantors confirm) → approved → disbursed/active → repaid
Side paths: rejected, defaulted (overdue)

## Task Breakdown & Progress

### Status: auth scaffold complete with role-aware routing (2026-06-11); next: full database schema (Phase 1)

- [x] Legacy DB reference docs generated (`docs/db-reference/`, 2026-06-11)
- [x] Custom components received & integrated (SelectInput, DataTable; DateInput/NumberInput/DataTablePagination built to match)
- [x] Frontend scaffold: NextAdmin template → `frontend/`, Prisma/better-auth stripped,
      shadcn init, React Query + Redux + axios, (auth)/admin/member routing, proxy
      middleware, Laravel-shaped auth client. `npm run build` passes (17 routes).
- [x] Laravel 12 backend scaffold: PostgreSQL (`slams_sacco`), Sanctum SPA + CORS,
      `/api/v1/auth/*` endpoints with envelope responses, 9 passing feature tests
- [x] Auth scaffold extras (2026-06-11):
      - Interim `role` column on `users` table (migration); `admin` + `member` demo seeds
      - `UserResource` exposes `role`; `User` model fills `role`
      - Root `/` does role-aware redirect (member → `/member/dashboard`, admin → `/admin/dashboard`)
      - `auth/index.ts` server-side session forwards cookies to Laravel and reads `role`
      - `proxy.ts` corrected to `slams_session` cookie; adds `callbackUrl` on login redirect
      - `api.ts` — `ApiMeta` type added; `withXSRFToken: true` for cross-origin Sanctum CSRF
      - Both `.env.example` files aligned with `SESSION_COOKIE`/`NEXT_PUBLIC_SESSION_COOKIE`
      - `/admin/members` and `/admin/members/archived` placeholder pages (unblock nav 404s)
- [x] Phase 1: Database schema & migrations — 27 migrations, 26 models, UUID PKs,
      soft deletes, org scoping, approval_logs audit table (2026-06-11)
- [x] Phase 2: Authentication polish — inline field errors, session invalidation on login/logout, register page removed (2026-06-12)
- [x] Phase 3: RBAC — Spatie permissions, `manage_members` + `manage_configurations`, CASL UI gating (2026-06-12)
- [x] Phase 4: Configurations module — 6 new migrations/models, BaseCrudController, 13 API controllers, 38+ frontend hooks, 14 admin pages (2026-06-12)
- [x] Phase 5: Members module — MemberService, full CRUD controller, approval workflow, photo upload, kins; 4 frontend components, 5 pages (2026-06-12)
- [x] Phase 6: SACCO accounts & transactions — AccountService, DepositAccountController, AccountTransactionController, full frontend CRUD + transaction posting, transfer support (2026-06-12)
- [x] Phase 7: Loans module — LoanService, full lifecycle (apply/approve/disburse/repay/default), repayment schedule generation (flat + reducing balance), frontend CRUD + schedule table with inline payment (2026-06-12)
- [x] Phase 8: Contributions module — ContributionService (generate/pay/waive), ContributionController, frontend table with inline pay/waive + generate modal (FY → Period picker) (2026-06-12)
- [x] Phase 9: Journals & ledger — AccountType + ChartOfAccount CRUD (under configurations), JournalService (balanced entry validation, post, reverse), JournalController + ledger endpoint, frontend: chart-of-accounts page, journal list/create/detail pages, ledger view with running balance (2026-06-12)
- [x] Phase 10: Petty cash module — categories + items (under configurations), PettyCashService (allocate, approve/reject allocation, create/approve/reject request with bcmath balance tracking), allocation + request controllers; frontend: allocations list, create allocation, allocation detail with inline request form + approve/reject, all-requests page (2026-06-12)
- [ ] Phase 11: Issue tracking
- [ ] Phase 12: Member portal (service desk, statements, guarantees)
- [ ] Phase 13: Reports (filters + PDF/CSV export)
- [ ] Phase 14: SMS & email notifications
- [ ] Phase 15: Member exit workflow
- [ ] Phase 16: Testing, performance tuning, final QA

### Known follow-ups
- Replace placeholder branding values in `src/config/branding.ts` with real SACCO details
- `authClient.updateUser` points at `PUT /auth/profile` (TODO: real endpoint)
- Remove "TEMPLATE REFERENCE" demo pages before production
- Password reset flow (forgot-password + reset-password with email) — deferred; requires email infrastructure (Phase 14)




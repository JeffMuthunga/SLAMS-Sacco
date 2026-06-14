# Design: Shares, Dividends, Commodities, CSV Import, Access Controls
**Date:** 2026-06-14  
**Status:** Approved  
**Phases:** 15–19

---

## Overview

Five independent modules to be built sequentially. Each follows the established project pattern: Laravel Service + Controller + Resource + Form Request on the backend; React Query hooks + admin pages + member portal pages on the frontend.

---

## Phase 15 — Shares

### What it does
Members purchase shares in the SACCO. Each share has a nominal price. A member's share balance represents their ownership stake. Share purchases post to the Chart of Accounts (debit member account, credit Share Capital).

### Database

**`share_products`** (admin-configured)
- `id` uuid PK
- `org_id` uuid → orgs
- `name` varchar(120)
- `price_per_share` decimal(15,2)
- `min_shares` int (minimum a member must hold)
- `max_shares` int nullable (cap per member)
- `share_capital_account_id` uuid → chart_of_accounts (CR side)
- `is_active` bool default true
- `deleted_at` (soft delete)
- timestamps

**`member_shares`** (per-member purchase records)
- `id` uuid PK
- `org_id` uuid → orgs
- `member_id` uuid → members
- `share_product_id` uuid → share_products
- `deposit_account_id` uuid → deposit_accounts (source of payment)
- `quantity` int
- `price_per_share` decimal(15,2) (snapshot at time of purchase)
- `total_amount` decimal(15,2) (quantity × price_per_share)
- `purchase_date` date
- `status` varchar(20) — `pending` | `approved` | `rejected`
- `approved_by` uuid → users nullable
- `approved_at` timestamp nullable
- `notes` text nullable
- `deleted_at` (soft delete)
- timestamps

### Backend
- **`ShareService`**: `purchaseShares(Member, array, orgId)` — validates balance, creates `MemberShare`, deducts from deposit account, posts journal entry; `approvePurchase(MemberShare)`, `rejectPurchase(MemberShare)`, `memberBalance(memberId, orgId)` — aggregates approved shares by product.
- **`ShareProductController`** — CRUD under `manage_configurations` permission.
- **`MemberShareController`** — list, create (admin on behalf of member), approve, reject; under `manage_members` permission.
- **Member portal**: `GET /me/shares` — returns share balance + purchase history.

### API Routes
```
# Under manage_configurations
GET/POST   /share-products
GET/PUT/DELETE /share-products/{id}

# Under manage_members
GET    /member-shares            (filterable by member_id, status)
POST   /member-shares            (admin creates purchase)
POST   /member-shares/{id}/approve
POST   /member-shares/{id}/reject

# Member portal (auth:sanctum)
GET    /me/shares
```

### Frontend
- **Admin config:** `/admin/configurations/share-products` — list + create/edit modal (name, price, min/max shares, linked CoA account picker)
- **Admin member detail** (`/admin/members/[id]`): new "Shares" tab showing balance per product + purchase history + "Record Purchase" form
- **Admin list:** `/admin/shares` — all purchases across members, filterable by status; inline approve/reject
- **Member portal:** `/member/account-statement/shares` — balance cards + purchase history table; add "Shares" link to member sidebar under Account Statement

---

## Phase 16 — Dividends

### What it does
At year-end the SACCO declares a dividend rate. A dividend run calculates each member's entitlement based on their approved share balance (weighted by months held if desired — initial implementation uses flat end-of-year balance for simplicity). Admin approves the run, then posts bulk journal entries crediting each member's deposit account.

### Database

**`dividend_runs`**
- `id` uuid PK
- `org_id` uuid → orgs
- `fiscal_year_id` uuid → fiscal_years
- `rate` decimal(7,4) — e.g. 0.1000 = 10%
- `status` varchar(20) — `draft` | `approved` | `posted`
- `total_dividend` decimal(15,2) — computed at approval
- `approved_by` uuid → users nullable
- `approved_at` timestamp nullable
- `posted_at` timestamp nullable
- `notes` text nullable
- `deleted_at` (soft delete)
- timestamps

**`dividend_entries`**
- `id` uuid PK
- `org_id` uuid → orgs
- `dividend_run_id` uuid → dividend_runs
- `member_id` uuid → members
- `share_balance` decimal(15,2) — snapshot at calculation time
- `dividend_amount` decimal(15,2)
- `credited_account_id` uuid → deposit_accounts nullable (set when posted)
- `posted_at` timestamp nullable
- timestamps

### Backend
- **`DividendService`**:
  - `calculate(orgId, fiscalYearId, rate)` — creates a `draft` run + one entry per member with approved share balance, returns the run.
  - `approve(DividendRun)` — validates total, transitions to `approved`.
  - `post(DividendRun)` — DB transaction: for each entry, credits member deposit account + posts a balanced journal (DR Dividend Expense, CR Member Deposit Account); marks run as `posted`.
- **`DividendController`** — CRUD for runs, `POST /{id}/approve`, `POST /{id}/post`; under `manage_journals` permission.
- **Member portal**: `GET /me/dividends` — history of entries for the authenticated member.

### API Routes
```
# Under manage_journals
GET/POST   /dividend-runs
GET        /dividend-runs/{id}           (includes entries)
POST       /dividend-runs/{id}/approve
POST       /dividend-runs/{id}/post
DELETE     /dividend-runs/{id}           (only draft)

# Member portal
GET   /me/dividends
```

### Frontend
- **Admin:** `/admin/dividends` — list all runs with status badges; "New Dividend Run" modal (pick fiscal year, enter rate → backend calculates).
- **Admin:** `/admin/dividends/[id]` — detail page: rate, total, status; DataTable of per-member entries (member name, share balance, dividend amount); Approve button (draft→approved); Post button (approved→posted).
- **Member portal:** add "Dividends" entry to Account Statement section in sidebar → `/member/account-statement/dividends` — table of dividend entries per year.

---

## Phase 17 — Commodities

### What it does
The SACCO stocks physical goods (e.g., groceries, appliances). Members can request commodities on credit. The SACCO issues the goods; the member repays in installments (similar to a micro-loan). Admin manages stock, prices, and member requests.

### Database

**`commodity_types`** (admin-configured categories)
- `id` uuid PK
- `org_id` uuid → orgs
- `name` varchar(120)
- `deleted_at`
- timestamps

**`commodities`** (specific items)
- `id` uuid PK
- `org_id` uuid → orgs
- `commodity_type_id` uuid → commodity_types
- `name` varchar(120)
- `unit_price` decimal(15,2)
- `stock_quantity` int default 0
- `commodity_account_id` uuid → chart_of_accounts nullable
- `is_active` bool default true
- `deleted_at`
- timestamps

**`commodity_requests`**
- `id` uuid PK
- `org_id` uuid → orgs
- `member_id` uuid → members
- `request_number` varchar(20) — auto-generated
- `status` varchar(20) — `pending` | `approved` | `rejected` | `issued` | `repaid`
- `total_amount` decimal(15,2)
- `repayment_period` int (months)
- `approved_by` uuid → users nullable
- `approved_at` timestamp nullable
- `issued_at` timestamp nullable
- `notes` text nullable
- `deleted_at`
- timestamps

**`commodity_request_items`**
- `id` uuid PK
- `org_id` uuid → orgs
- `commodity_request_id` uuid → commodity_requests
- `commodity_id` uuid → commodities
- `quantity` int
- `unit_price` decimal(15,2) (snapshot)
- `subtotal` decimal(15,2)
- timestamps

### Backend
- **`CommodityService`**: `createRequest(Member, array items, repaymentPeriod, orgId)`, `approve(CommodityRequest)` — checks stock, `issue(CommodityRequest)` — decrements stock + posts journal, `reject(CommodityRequest)`.
- **`CommodityTypeController`** and **`CommodityController`** — CRUD under `manage_configurations`.
- **`CommodityRequestController`** — list, create (admin on behalf or member portal), approve, reject, issue; under `manage_members`.
- **Member portal**: `GET /me/commodities` (requests), `POST /me/commodities` (create request).

### API Routes
```
# Under manage_configurations
GET/POST        /commodity-types
GET/PUT/DELETE  /commodity-types/{id}
GET/POST        /commodities
GET/PUT/DELETE  /commodities/{id}

# Under manage_members
GET   /commodity-requests
POST  /commodity-requests
GET   /commodity-requests/{id}
POST  /commodity-requests/{id}/approve
POST  /commodity-requests/{id}/reject
POST  /commodity-requests/{id}/issue

# Member portal
GET   /me/commodities
POST  /me/commodities
```

### Frontend
- **Admin config:** `/admin/configurations/commodity-types` and `/admin/configurations/commodities` — CRUD pages following existing configuration pattern.
- **Admin:** `/admin/commodities/requests` — DataTable of all requests, filterable by status; detail drawer with approve/reject/issue actions.
- **Member portal:** `/member/service-desk/commodities` — list available commodities (browse by type); "Request" form with item picker + quantity; table of own requests with status.

### Repayment (V1 scope)
For V1, commodity repayment is not tracked as installments. Admin manually marks a request as `repaid` once the member has settled the balance (e.g., via salary deduction outside the system). A future iteration can add a `commodity_repayments` table mirroring `loan_repayments`. The `repayment_period` field is stored for reference and display only in V1.

---

## Phase 18 — CSV / Excel Import

### What it does
Admin uploads a spreadsheet to bulk-import records. Two modes: **dry run** (validate only, return errors) and **commit** (actually insert). Supported entities on day one: Members, Member Accounts (DepositAccount), and historical Loan records.

### Approach
Use **Laravel Excel (Maatwebsite/Excel)** package — already widely used with Laravel, handles xlsx + csv, row-by-row validation hooks, chunked reading for large files.

### Backend
- Install `maatwebsite/excel` via Composer.
- **Import classes** (one per entity):
  - `MembersImport` — validates required columns (full_name, id_number, phone, gender, date_of_birth, entry_date), creates `Member` records in `approved` state. Skips duplicates by `id_number`.
  - `DepositAccountsImport` — requires member_number or id_number to resolve member, then creates `DepositAccount`.
  - `LoansImport` — requires member_number, loan_product_name, principal_amount, disbursed_date, outstanding_balance; creates `Loan` in `active` status.
- Each import class implements `WithValidation`, `WithHeadingRow`, `SkipsOnError`, `SkipsOnFailure`.
- **`ImportController`**:
  - `POST /imports/{entity}/dry-run` — runs the import class with `dryRun: true`, returns row count + array of validation errors (row number + field + message).
  - `POST /imports/{entity}/commit` — runs the actual import, returns inserted count + skipped count.
  - `GET /imports/templates/{entity}` — returns a downloadable CSV template with correct column headers.
- Under `manage_members` permission (covers all entity imports for now).

### API Routes
```
GET   /imports/templates/{entity}         (entity: members | accounts | loans)
POST  /imports/{entity}/dry-run           (multipart: file)
POST  /imports/{entity}/commit            (multipart: file)
```

### Frontend
- **Admin:** `/admin/import` — tabbed page (Members | Accounts | Loans).
- Each tab:
  1. "Download Template" button → CSV template
  2. File upload dropzone (accept .csv, .xlsx)
  3. "Validate" → calls dry-run; shows summary card (rows found, errors) + DataTable of errors if any
  4. "Import" button (enabled only when dry-run passes) → calls commit; shows success toast with counts
- No intermediate storage — file sent directly to API.

---

## Phase 19 — Access Controls (Granular Admin Roles)

### What it does
Currently all admin users have every permission. This phase adds named sub-roles for admin staff (loans officer, teller, auditor, etc.) and a UI for assigning permissions to roles and roles to users.

### New Permissions (additions to RbacSeeder)
```
manage_shares
manage_dividends
manage_commodities
manage_imports
manage_reports       (currently reports are under manage_members — move to own permission)
```

### New Built-in Sub-Roles
| Role | Permissions |
|------|-------------|
| `admin` | All permissions (unchanged) |
| `loans_officer` | manage_loans, manage_members (read), manage_reports |
| `teller` | manage_accounts, manage_contributions, manage_reports |
| `auditor` | manage_journals, manage_reports (read-only enforced at service layer) |
| `manager` | All except manage_configurations |
| `member` | view_own_data (unchanged) |

### Backend
- Add new permissions to `RbacSeeder` (idempotent — uses `firstOrCreate`).
- Seed the built-in sub-roles with their permission sets.
- **`RoleController`**: `index` (list roles + their permissions), `show`, `update` (sync permissions on a role — only custom roles, built-in roles are protected). Under `manage_configurations`.
- **`AdminUserController`**: list admin users (`users` table where role ≠ member), create admin user, update role assignment, deactivate. Under `manage_configurations`.
- All existing permission middleware already works — no changes needed to controllers.

### API Routes
```
# Under manage_configurations
GET        /roles                        (roles + permissions)
GET        /roles/{id}
PUT        /roles/{id}/permissions       (sync permissions — only custom roles)
POST       /roles                        (create custom role)
DELETE     /roles/{id}                   (only custom roles)

GET        /admin-users
POST       /admin-users                  (create, assign role)
PUT        /admin-users/{id}/role        (change role)
DELETE     /admin-users/{id}             (deactivate)
```

### Frontend
- **Admin config:** `/admin/configurations/roles` — list of roles with permission chips; edit modal to toggle permissions (checkboxes per permission).
- **Admin config:** `/admin/configurations/admin-users` — table of admin staff; "Add Staff" modal (name, email, role); change role dropdown.
- **CASL update:** `src/lib/auth/ability.ts` — update ability builder to consume the user's permissions array from the session response; existing `<Can>` gates automatically scope UI.

---

## Cross-Cutting Concerns

### Permissions matrix (new permissions mapped to new modules)
| Module | Permission |
|--------|-----------|
| Share Products (config) | `manage_configurations` |
| Share Purchases (admin) | `manage_members` → later `manage_shares` after Phase 19 |
| Dividend Runs | `manage_journals` → later `manage_dividends` |
| Commodity Config | `manage_configurations` |
| Commodity Requests | `manage_members` → later `manage_commodities` |
| Import | `manage_members` → later `manage_imports` |
| Roles / Admin Users | `manage_configurations` |

Phase 19 retroactively tightens these by introducing the granular permissions.

### Sidebar nav additions
**Admin sidebar** — add groups:
- Shares → Share Products (config), Member Shares
- Dividends → Dividend Runs
- Commodities → Commodity Types (config), Commodities (config), Requests
- Import → Import Data

**Member sidebar** — add or activate:
- Account Statement → Shares, Dividends
- Service Desk → My Commodities (already in nav, currently placeholder)

### Notification hooks
- Share purchase approved → notify member (SMS/email via existing `NotificationService`)
- Dividend posted → notify all members
- Commodity request status change → notify member

---

## Implementation Order

```
Phase 15: Shares         (migrations, models, service, controller, frontend)
Phase 16: Dividends      (depends on shares being in place)
Phase 17: Commodities    (independent of 15/16)
Phase 18: CSV Import     (independent, install maatwebsite/excel)
Phase 19: Access Controls (independent, but run last to tighten all previous phases)
```

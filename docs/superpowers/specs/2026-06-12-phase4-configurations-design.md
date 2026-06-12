# Phase 4: Configurations Module Design

**Date:** 2026-06-12
**Status:** Approved

---

## Goal

Build the Configurations module so admins can manage SACCO-wide settings, financial products, and fiscal calendar before other operational modules (Members, Loans, Accounts) go live.

---

## Scope

| Section | Description |
|---------|-------------|
| Org Profile | Edit the `orgs` row (name, contact info, currency, reg details) |
| SACCO Settings | New `sacco_settings` table — financial defaults used by downstream modules |
| Loan Products | CRUD for `loan_products` |
| Saving Products | CRUD for `saving_products` |
| Fiscal Years | Create/open/close fiscal years; auto-generate 12 monthly periods on create |
| Periods | Open/close individual periods within a fiscal year |

**Out of scope:** Chart of Accounts (seeded with defaults, editing deferred to Phase 9). SMS/email settings (Phase 14).

---

## Decisions

| Question | Decision |
|----------|----------|
| Org settings storage | Separate `sacco_settings` table (one row per org) |
| COA | Seeded with standard SACCO accounts; no admin UI in Phase 4 |
| Periods creation | Auto-generated (12 monthly periods) when a fiscal year is created |
| Frontend structure | Sub-pages under `/admin/configurations/` — Option B |
| Permission | New `manage_configurations` permission, assigned to `admin` role |

---

## Backend

### 1. New migration: `sacco_settings`

```php
Schema::create('sacco_settings', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
    $table->decimal('registration_fee', 15, 2)->default(0);
    $table->decimal('min_share_capital', 15, 2)->default(0);
    $table->decimal('min_monthly_contribution', 15, 2)->default(0);
    $table->decimal('loan_limit_multiplier', 5, 2)->default(3.00);
    $table->timestamps();
});
```

One row per org. `loan_limit_multiplier` is used by the loans module to cap loan amount at X× member savings.

### 2. New model: `SaccoSetting`

- `HasUuids`
- `$fillable`: `org_id`, `registration_fee`, `min_share_capital`, `min_monthly_contribution`, `loan_limit_multiplier`
- Casts: all decimal fields cast to `string` (bcmath-safe)

### 3. New permission

`manage_configurations` added to `RbacSeeder`, assigned to `admin` role.

### 4. Controllers

All under `app/Http/Controllers/Api/V1/`, all extend `ApiController`, all gated by `['auth:sanctum', 'permission:manage_configurations']`.

| Controller | Responsibility |
|------------|----------------|
| `OrgProfileController` | `show()`, `update()` — reads/updates the authenticated user's org |
| `SaccoSettingsController` | `show()`, `update()` — auto-creates the row on first `show()` if absent |
| `LoanProductController` | `index()`, `store()`, `show()`, `update()`, `destroy()` (soft-delete) |
| `SavingProductController` | same as above |
| `FiscalYearController` | `index()`, `store()`, `open()`, `close()` |
| `PeriodController` | `index()` (by fiscal year), `open()`, `close()` |

### 5. Routes

```php
Route::middleware(['auth:sanctum', 'permission:manage_configurations'])->prefix('v1/configurations')->group(function () {
    Route::get('org-profile',  [OrgProfileController::class, 'show']);
    Route::put('org-profile',  [OrgProfileController::class, 'update']);

    Route::get('sacco-settings', [SaccoSettingsController::class, 'show']);
    Route::put('sacco-settings', [SaccoSettingsController::class, 'update']);

    Route::apiResource('loan-products',   LoanProductController::class);
    Route::apiResource('saving-products', SavingProductController::class);

    Route::get('fiscal-years',                    [FiscalYearController::class, 'index']);
    Route::post('fiscal-years',                   [FiscalYearController::class, 'store']);
    Route::put('fiscal-years/{fiscalYear}/open',  [FiscalYearController::class, 'open']);
    Route::put('fiscal-years/{fiscalYear}/close', [FiscalYearController::class, 'close']);

    Route::get('fiscal-years/{fiscalYear}/periods', [PeriodController::class, 'index']);
    Route::put('periods/{period}/open',             [PeriodController::class, 'open']);
    Route::put('periods/{period}/close',            [PeriodController::class, 'close']);
});
```

### 6. Service classes

Business logic lives in service classes, not controllers:

**`FiscalYearService`**
- `create(array $data, Org $org): FiscalYear` — creates fiscal year + 12 monthly periods in one transaction
- `open(FiscalYear $fy): void` — sets `is_opened = true`; throws if another fiscal year is already open for the org
- `close(FiscalYear $fy): void` — throws if any period on this fiscal year is still open; sets `is_closed = true`, `closed_at`, `closed_by`

**`PeriodService`**
- `open(Period $period): void` — sets `is_opened = true`
- `close(Period $period): void` — sets `is_closed = true`

### 7. Resources

| Resource | Fields exposed |
|----------|---------------|
| `OrgResource` | id, name, full_name, suffix, email, phone, website, address, town, country_code, currency_code, pin, reg_number, member_limit |
| `SaccoSettingResource` | id, org_id, registration_fee, min_share_capital, min_monthly_contribution, loan_limit_multiplier |
| `LoanProductResource` | all columns except deleted_at |
| `SavingProductResource` | all columns except deleted_at |
| `FiscalYearResource` | id, org_id, name, start_date, end_date, is_opened, is_closed, closed_at, periods_count |
| `PeriodResource` | id, fiscal_year_id, name, start_date, end_date, is_opened, is_closed, is_posted |

### 8. Business rules

- A fiscal year cannot be closed if any of its periods are still open (`is_closed = false` and `is_opened = true`)
- Only one fiscal year can be open per org at a time
- Loan and saving products are soft-deleted only; hard delete is not exposed
- `sacco_settings` row is auto-created with defaults on first `GET` if the row doesn't exist
- Monetary fields in requests validated as `numeric|min:0`; stored as DECIMAL(15,2)
- `loan_limit_multiplier` validated as `numeric|min:1|max:10`

---

## Frontend

### Routes

```
/admin/configurations/org-profile
/admin/configurations/sacco-settings
/admin/configurations/loan-products
/admin/configurations/saving-products
/admin/configurations/fiscal-years
/admin/configurations/fiscal-years/[id]   ← periods sub-view
```

### Sidebar

New "Configurations" group in `ADMIN_NAV_DATA` with sub-items:
- Org Profile → `/admin/configurations/org-profile`
- SACCO Settings → `/admin/configurations/sacco-settings`
- Loan Products → `/admin/configurations/loan-products`
- Saving Products → `/admin/configurations/saving-products`
- Fiscal Years → `/admin/configurations/fiscal-years`

### Page patterns

**Org Profile & SACCO Settings:** Single-form pages. React Query `useQuery` to load current values, `useMutation` to submit. Inline field errors (same pattern as login/register). Toast on success.

**Loan Products & Saving Products:** DataTable + "Add Product" button. Create and Edit use modals (same pattern as Members module). Archive triggers soft-delete with confirmation toast. Archived products hidden by default; no archived view needed in Phase 4.

**Fiscal Years:** Table listing all fiscal years with status badges (Draft / Open / Closed). "New Fiscal Year" button → modal (name, start date, end date). Row has "Open" / "Close" action buttons. Clicking a fiscal year name navigates to `/fiscal-years/[id]`.

**Fiscal Year Detail (`/fiscal-years/[id]`):** Shows fiscal year info + a table of its 12 periods. Each period row shows name, date range, status, and Open/Close action button.

### API client

New functions in `src/lib/api.ts` (or a new `src/lib/configurations-api.ts`):
- `getOrgProfile()`, `updateOrgProfile(data)`
- `getSaccoSettings()`, `updateSaccoSettings(data)`
- `getLoanProducts()`, `createLoanProduct(data)`, `updateLoanProduct(id, data)`, `deleteLoanProduct(id)`
- `getSavingProducts()`, `createSavingProduct(data)`, `updateSavingProduct(id, data)`, `deleteSavingProduct(id)`
- `getFiscalYears()`, `createFiscalYear(data)`, `openFiscalYear(id)`, `closeFiscalYear(id)`
- `getFiscalYearPeriods(fiscalYearId)`, `openPeriod(id)`, `closePeriod(id)`

### CASL

All configurations pages are under `/admin/`, which is already wrapped in `AbilityProvider`. Wrap create/edit/delete/open/close controls in `<Can I="manage_configurations" a="all">`.

---

## Data Flow

1. Admin navigates to a configurations sub-page
2. React Query fetches current data via `GET` endpoint
3. Admin edits form / opens modal / clicks action
4. `useMutation` sends `PUT`/`POST`/`DELETE` to API
5. On success: React Query cache invalidated, toast shown
6. On 422: inline field errors displayed
7. On 403: toast error ("You don't have permission")

---

## Testing

### Backend — `ConfigurationsTest`

- Admin can read and update org profile
- Admin can read and update SACCO settings (auto-create on first GET)
- Admin can create, update, list, and soft-delete loan products
- Admin can create, update, list, and soft-delete saving products
- Creating a fiscal year generates exactly 12 periods with correct date ranges
- Opening a fiscal year fails if another is already open
- Closing a fiscal year fails if any period is still open
- Opening and closing periods sets correct state
- Non-admin gets 403 on all endpoints

### Existing tests

`AuthTest`, `MemberTest`, `RbacTest` continue to pass. `RbacSeeder` updated to include `manage_configurations`.

---

## Out of Scope for Phase 4

- Chart of Accounts editing (seeded with defaults; editable in Phase 9)
- SMS/email settings (Phase 14)
- Hard-delete of products
- Archived products view
- Fiscal year period editing (dates fixed on creation)

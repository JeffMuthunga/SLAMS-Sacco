# Phase 4: Configurations Module Design

**Date:** 2026-06-12
**Status:** Approved

---

## Goal

Build the Configurations module so admins can manage SACCO-wide settings, financial products, reference data, and fiscal calendar before other operational modules (Members, Loans, Accounts) go live.

---

## Scope

| Section | Description |
|---------|-------------|
| Org Profile | Edit the `orgs` row (name, contact info, currency, reg details) |
| SACCO Settings | New `sacco_settings` table — financial defaults used by downstream modules |
| Loan Products | CRUD for `loan_products` |
| Saving Products | CRUD for `saving_products` |
| Collateral Types | New `collateral_types` table — referenced by Phase 7 loan collaterals |
| Activity Types | New `activity_types` table — transaction type classification for Phase 6 accounts |
| Banks | New `banks` table — bank reference data per org |
| Bank Accounts | New `bank_accounts` table — SACCO's own bank accounts (used for loan disbursement) |
| Departments | New `departments` table — used by Phase 10 petty cash |
| Fiscal Years | Create/open/close fiscal years; auto-generate 12 monthly periods on create |
| Periods | Open/close individual periods within a fiscal year |

**Out of scope:** Chart of Accounts editing (Phase 9), SMS/email settings (Phase 14), Items/stores (Phase 10), Commodities (deferred), Members additional fields (deferred).

---

## Decisions

| Question | Decision |
|----------|----------|
| Org settings storage | Separate `sacco_settings` table (one row per org) |
| COA | Seeded with standard SACCO accounts; no admin UI in Phase 4 |
| Periods creation | Auto-generated (12 monthly periods) when a fiscal year is created |
| Frontend structure | Sub-pages under `/admin/configurations/` |
| Permission | New `manage_configurations` permission, assigned to `admin` role |
| Activity types → COA linkage | `dr_account_id` / `cr_account_id` nullable FKs; filled in Phase 9 |
| Banks scope | Per-org (consistent with multi-tenancy) |

---

## Backend

### 1. New migrations

**`sacco_settings`**
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

One row per org. `loan_limit_multiplier` caps loan amount at X× member savings in Phase 7.

**`collateral_types`**
```php
Schema::create('collateral_types', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
    $table->string('name', 120);
    $table->text('description')->nullable();
    $table->boolean('is_active')->default(true);
    $table->timestamps();
    $table->softDeletes();
});
```

**`activity_types`**
```php
Schema::create('activity_types', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
    $table->string('name', 120);
    $table->string('code', 50)->nullable();
    $table->foreignUuid('dr_account_id')->nullable()->constrained('chart_of_accounts')->nullOnDelete();
    $table->foreignUuid('cr_account_id')->nullable()->constrained('chart_of_accounts')->nullOnDelete();
    $table->boolean('is_active')->default(true);
    $table->timestamps();
    $table->softDeletes();
});
```

`dr_account_id` / `cr_account_id` are nullable — filled when Phase 9 wires up account linkages.

**`banks`**
```php
Schema::create('banks', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
    $table->string('name', 120);
    $table->string('code', 20)->nullable();
    $table->boolean('is_active')->default(true);
    $table->timestamps();
    $table->softDeletes();
});
```

**`bank_accounts`**
```php
Schema::create('bank_accounts', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
    $table->foreignUuid('bank_id')->constrained('banks')->restrictOnDelete();
    $table->string('account_name', 120);
    $table->string('account_number', 50);
    $table->string('branch', 100)->nullable();
    $table->boolean('is_active')->default(true);
    $table->timestamps();
    $table->softDeletes();
});
```

**`departments`**
```php
Schema::create('departments', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
    $table->string('name', 120);
    $table->boolean('is_active')->default(true);
    $table->timestamps();
    $table->softDeletes();
});
```

### 2. New models

| Model | Traits | Fillable |
|-------|--------|----------|
| `SaccoSetting` | `HasUuids` | org_id, registration_fee, min_share_capital, min_monthly_contribution, loan_limit_multiplier |
| `CollateralType` | `HasUuids`, `SoftDeletes` | org_id, name, description, is_active |
| `ActivityType` | `HasUuids`, `SoftDeletes` | org_id, name, code, dr_account_id, cr_account_id, is_active |
| `Bank` | `HasUuids`, `SoftDeletes` | org_id, name, code, is_active |
| `BankAccount` | `HasUuids`, `SoftDeletes` | org_id, bank_id, account_name, account_number, branch, is_active |
| `Department` | `HasUuids`, `SoftDeletes` | org_id, name, is_active |

All decimal fields on `SaccoSetting` cast to `string` (bcmath-safe).

### 3. New permission

`manage_configurations` added to `RbacSeeder`, assigned to `admin` role.

### 4. Controllers

All under `app/Http/Controllers/Api/V1/`, all extend `ApiController`, all gated by `['auth:sanctum', 'permission:manage_configurations']`.

| Controller | Methods |
|------------|---------|
| `OrgProfileController` | `show()`, `update()` |
| `SaccoSettingsController` | `show()`, `update()` — auto-creates row on first `show()` if absent |
| `LoanProductController` | `index()`, `store()`, `show()`, `update()`, `destroy()` (soft-delete) |
| `SavingProductController` | same as above |
| `CollateralTypeController` | `index()`, `store()`, `show()`, `update()`, `destroy()` (soft-delete) |
| `ActivityTypeController` | same as above |
| `BankController` | same as above |
| `BankAccountController` | same as above |
| `DepartmentController` | same as above |
| `FiscalYearController` | `index()`, `store()`, `open()`, `close()` |
| `PeriodController` | `index()` (by fiscal year), `open()`, `close()` |

### 5. Routes

```php
Route::middleware(['auth:sanctum', 'permission:manage_configurations'])
    ->prefix('v1/configurations')
    ->group(function () {
        Route::get('org-profile', [OrgProfileController::class, 'show']);
        Route::put('org-profile', [OrgProfileController::class, 'update']);

        Route::get('sacco-settings', [SaccoSettingsController::class, 'show']);
        Route::put('sacco-settings', [SaccoSettingsController::class, 'update']);

        Route::apiResource('loan-products',    LoanProductController::class);
        Route::apiResource('saving-products',  SavingProductController::class);
        Route::apiResource('collateral-types', CollateralTypeController::class);
        Route::apiResource('activity-types',   ActivityTypeController::class);
        Route::apiResource('banks',            BankController::class);
        Route::apiResource('bank-accounts',    BankAccountController::class);
        Route::apiResource('departments',      DepartmentController::class);

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

**`FiscalYearService`**
- `create(array $data, Org $org): FiscalYear` — creates fiscal year + 12 monthly periods in one DB transaction
- `open(FiscalYear $fy): void` — sets `is_opened = true`; throws `ConflictException` if another fiscal year is already open for the org
- `close(FiscalYear $fy): void` — throws if any period is still open; sets `is_closed = true`, `closed_at`, `closed_by`

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
| `CollateralTypeResource` | id, org_id, name, description, is_active |
| `ActivityTypeResource` | id, org_id, name, code, dr_account_id, cr_account_id, is_active |
| `BankResource` | id, org_id, name, code, is_active |
| `BankAccountResource` | id, org_id, bank_id, bank (nested BankResource), account_name, account_number, branch, is_active |
| `DepartmentResource` | id, org_id, name, is_active |
| `FiscalYearResource` | id, org_id, name, start_date, end_date, is_opened, is_closed, closed_at, periods_count |
| `PeriodResource` | id, fiscal_year_id, name, start_date, end_date, is_opened, is_closed, is_posted |

### 8. Business rules

- A fiscal year cannot be closed if any of its periods have `is_opened = true` and `is_closed = false`
- Only one fiscal year can be open per org at a time
- All products and reference data (collateral types, activity types, banks, bank accounts, departments) are soft-deleted only
- `bank_accounts.bank_id` uses `restrictOnDelete` — cannot delete a bank that has accounts
- `sacco_settings` row is auto-created with defaults on first `GET` if absent
- Monetary fields validated as `numeric|min:0`; stored as `DECIMAL(15,2)`
- `loan_limit_multiplier` validated as `numeric|min:1|max:10`

---

## Frontend

### Routes

```
/admin/configurations/org-profile
/admin/configurations/sacco-settings
/admin/configurations/loan-products
/admin/configurations/saving-products
/admin/configurations/collateral-types
/admin/configurations/activity-types
/admin/configurations/banks
/admin/configurations/bank-accounts
/admin/configurations/departments
/admin/configurations/fiscal-years
/admin/configurations/fiscal-years/[id]    ← periods sub-view
```

### Sidebar

New "Configurations" group in `ADMIN_NAV_DATA` (collapsed by default) with sub-items:

- Org Profile
- SACCO Settings
- Loan Products
- Saving Products
- Collateral Types
- Activity Types
- Banks
- Bank Accounts
- Departments
- Fiscal Years

### Page patterns

**Org Profile & SACCO Settings:** Single-form pages. `useQuery` loads current values; `useMutation` submits. Inline field errors. Toast on success.

**All reference data tables (Loan Products, Saving Products, Collateral Types, Activity Types, Banks, Bank Accounts, Departments):** DataTable + "Add" button → create modal; row actions: Edit (modal), Archive (soft-delete with confirmation). Archived items hidden by default.

**Bank Accounts** form includes a bank selector (dropdown populated from the Banks list).

**Fiscal Years:** Table with status badges (Draft / Open / Closed). "New Fiscal Year" button → modal (name, start date, end date). Row has Open / Close actions. Row name links to `/fiscal-years/[id]`.

**Fiscal Year Detail (`/fiscal-years/[id]`):** Fiscal year info + table of 12 periods. Each period row shows name, date range, status badge, and Open/Close action.

### API client (`src/lib/configurations-api.ts`)

```ts
// Org & settings
getOrgProfile(), updateOrgProfile(data)
getSaccoSettings(), updateSaccoSettings(data)

// Products & reference data (same shape for each)
getLoanProducts(), createLoanProduct(data), updateLoanProduct(id, data), deleteLoanProduct(id)
getSavingProducts(), createSavingProduct(data), updateSavingProduct(id, data), deleteSavingProduct(id)
getCollateralTypes(), createCollateralType(data), updateCollateralType(id, data), deleteCollateralType(id)
getActivityTypes(), createActivityType(data), updateActivityType(id, data), deleteActivityType(id)
getBanks(), createBank(data), updateBank(id, data), deleteBank(id)
getBankAccounts(), createBankAccount(data), updateBankAccount(id, data), deleteBankAccount(id)
getDepartments(), createDepartment(data), updateDepartment(id, data), deleteDepartment(id)

// Fiscal calendar
getFiscalYears(), createFiscalYear(data), openFiscalYear(id), closeFiscalYear(id)
getFiscalYearPeriods(fiscalYearId), openPeriod(id), closePeriod(id)
```

### CASL

All configurations pages are under `/admin/` (already wrapped in `AbilityProvider`). Wrap create/edit/delete/open/close controls in `<Can I="manage_configurations" a="all">`.

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
- Admin can read and update SACCO settings (auto-creates on first GET)
- Admin can create, update, list, and soft-delete loan products
- Admin can create, update, list, and soft-delete saving products
- Admin can create, update, list, and soft-delete collateral types
- Admin can create, update, list, and soft-delete activity types
- Admin can create, update, list, and soft-delete banks
- Admin can create bank accounts linked to a bank; cannot delete a bank that has accounts
- Admin can create, update, list, and soft-delete departments
- Creating a fiscal year generates exactly 12 periods with correct date ranges
- Opening a fiscal year fails if another is already open for the org
- Closing a fiscal year fails if any period is still open
- Opening and closing periods sets correct state
- Non-admin gets 403 on all endpoints

### Existing tests

`AuthTest`, `MemberTest`, `RbacTest` continue to pass. `RbacSeeder` updated to include `manage_configurations`.

---

## Out of Scope for Phase 4

- Chart of Accounts editing (seeded with defaults; editable in Phase 9)
- Activity type → COA account linkage UI (nullable FKs exist; wired in Phase 9)
- SMS/email settings (Phase 14)
- Items, item categories, stores, tax types (Phase 10)
- Commodities (deferred)
- Members additional fields (deferred)
- Hard-delete of any entity
- Archived items view
- Fiscal year period date editing (dates fixed on creation)

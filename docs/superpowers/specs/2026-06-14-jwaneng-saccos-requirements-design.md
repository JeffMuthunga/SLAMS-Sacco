# Jwaneng SACCOS Requirements — Implementation Design

**Date:** 2026-06-14  
**Scope:** 4 targeted changes derived from Jwaneng SACCOS gap analysis

---

## Change 1 — Medical Boarding Exit Type

### Problem
`member_exits.exit_type` only supports `voluntary`, `death`, `expulsion`, `transfer`. Jwaneng SACCOS requires a `medical` (Medical Boarding) exit type.

### Backend
- **Migration:** Drop and recreate the CHECK constraint on `member_exits.exit_type` to include `'medical'`.
  - Use `DB::statement` to drop the old constraint and add the new one with all 5 values: `voluntary`, `death`, `expulsion`, `transfer`, `medical`.
- **`StoreMemberExitRequest`:** Update validation rule to `'in:voluntary,death,expulsion,transfer,medical'`.
- **`MemberExitService`:** No changes required — exit_type is stored as-is.

### Frontend
- **`/admin/member-exit/page.tsx`:** Add `{ value: "medical", label: "Medical Boarding" }` to `EXIT_TYPE_OPTIONS`.
- Update any label/display maps that render the exit_type string (e.g. the table column label formatter).

---

## Change 2 + 4 — Saving Product Flags (`is_mandatory`, `block_withdrawal_on_active_loan`)

### Problem
- No way to mark a saving product as mandatory (Ordinary Savings must be), so the UI cannot surface this distinction.
- No way to enforce the rule that Ordinary Savings cannot be withdrawn while the member has an active loan.

### Backend

#### Migration
Single migration adds two columns to `saving_products`:
```
is_mandatory                   BOOLEAN DEFAULT false NOT NULL
block_withdrawal_on_active_loan BOOLEAN DEFAULT false NOT NULL
```

#### Model — `SavingProduct`
- Add both fields to `$fillable`.
- Add both to `$casts` as `'boolean'`.

#### Resource — `SavingProductResource`
- Expose both fields in the resource array.

#### Controller — `SavingProductController`
- Add `'is_mandatory' => ['sometimes', 'boolean']` and `'block_withdrawal_on_active_loan' => ['sometimes', 'boolean']` to `StoreSavingProductRequest` and `UpdateSavingProductRequest` (or inline rules if no separate request classes).

#### Service — `AccountService::postTransaction`
After the existing `is_locked` guard (line 83), add:

```php
$debitTypes = ['withdrawal', 'transfer_out'];
if (in_array($type, $debitTypes, true)) {
    $product = $account->load('product')->product;
    if ($product && $product->block_withdrawal_on_active_loan) {
        $hasActiveLoan = \App\Models\Loan::where('member_id', $account->member_id)
            ->whereIn('loan_status', ['disbursed', 'active'])
            ->exists();
        abort_if($hasActiveLoan, 422, 'Withdrawals are not permitted while the member has an active loan.');
    }
}
```

Note: `$debitTypes` already defined further down in the method — the check should use a local variable scoped to this guard block, not conflict with the existing broader `$debitTypes` array that also includes `fee` and `loan_disbursement`.

### Frontend

#### API types/hooks — `configurations.ts`
- Add `is_mandatory: boolean` and `block_withdrawal_on_active_loan: boolean` to the `SavingProduct` interface.
- Add both to `CreateSavingProductPayload`.

#### Saving Products page — `saving-products/page.tsx`
- `FormState`: add `is_mandatory: boolean` and `block_withdrawal_on_active_loan: boolean`.
- `INITIAL_FORM`: both default to `false`.
- Form: two new checkboxes below the existing "Is Active" checkbox:
  - "Mandatory (members must hold this account)"
  - "Block withdrawals when member has an active loan"
- `handleEdit`: map both fields from the product.
- `handleSubmit` payload: include both fields.
- Table: add a "Mandatory" badge column (green "Mandatory" / gray "Optional").

---

## Change 3 — Eligible Employers Configuration Module

### Problem
No way to define and display the list of employers whose employees are eligible for SACCO membership. The member form needs to warn staff when an entered employer is not on the approved list.

### Backend

#### Migration
```sql
CREATE TABLE eligible_employers (
    id          UUID PRIMARY KEY,
    org_id      UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    name        VARCHAR(150) NOT NULL,
    is_active   BOOLEAN DEFAULT true NOT NULL,
    created_at  TIMESTAMP,
    updated_at  TIMESTAMP,
    deleted_at  TIMESTAMP  -- soft delete
)
```
Index on `org_id`.

#### Model — `EligibleEmployer`
- Traits: `HasUuids`, `SoftDeletes`
- `$fillable`: `['org_id', 'name', 'is_active']`
- `$casts`: `['is_active' => 'boolean']`
- `org()` belongs-to relation

#### Controller — `EligibleEmployerController extends BaseCrudController`
```php
protected function modelClass(): string   { return EligibleEmployer::class; }
protected function resourceClass(): string { return EligibleEmployerResource::class; }

protected function storeRules(string $orgId): array {
    return [
        'name'      => ['required', 'string', 'max:150'],
        'is_active' => ['sometimes', 'boolean'],
    ];
}
protected function updateRules(string $id, string $orgId): array {
    return [
        'name'      => ['required', 'string', 'max:150'],
        'is_active' => ['sometimes', 'boolean'],
    ];
}
```

#### Resource — `EligibleEmployerResource`
Exposes: `id`, `name`, `is_active`, `created_at`.

#### Route — `api.php`
Under the `manage_configurations` middleware group:
```php
Route::apiResource('configurations/eligible-employers', EligibleEmployerController::class);
```

### Frontend

#### API hooks — `configurations.ts`
New section following the Departments pattern:
- `EligibleEmployer` interface: `{ id, name, is_active, created_at }`
- `CreateEligibleEmployerPayload`, `UpdateEligibleEmployerPayload`
- `ELIGIBLE_EMPLOYERS_KEY` query key
- `useEligibleEmployers()`, `useCreateEligibleEmployer()`, `useUpdateEligibleEmployer(id)`, `useDeleteEligibleEmployer()`
- API endpoint: `/configurations/eligible-employers`

#### Page — `(dashboard)/admin/configurations/eligible-employers/page.tsx`
Follows the Departments page pattern exactly:
- Header with "Add Eligible Employer" button
- Inline create/edit form with Name field and Is Active checkbox
- Table with Name, Active badge, Edit/Archive actions

#### Sidebar — `sidebar/data/index.ts`
Add to the Configurations section:
```ts
{ title: "Eligible Employers", url: "/admin/configurations/eligible-employers" }
```

#### Member form — soft warning
In `src/components/Members/MemberForm.tsx` (used by both create and edit pages):
- Call `useEligibleEmployers()` to load the approved list.
- After the `employer_name` text input (around line 407), render a yellow warning banner when all of the following are true:
  1. `employer_name` field has a non-empty value
  2. The list of eligible employers has loaded and is non-empty
  3. The typed value does NOT case-insensitively match any `eligible_employer.name`

Warning text: `"This employer is not on the approved eligible employers list. The member application may be rejected."`

- The warning does NOT block form submission.
- If the eligible employers list is empty (not configured yet), show no warning.

---

## File Change Summary

### Backend files
| File | Action |
|---|---|
| `database/migrations/..._add_medical_to_member_exits_exit_type.php` | New |
| `database/migrations/..._add_flags_to_saving_products.php` | New |
| `database/migrations/..._create_eligible_employers_table.php` | New |
| `app/Http/Requests/Api/V1/MemberExit/StoreMemberExitRequest.php` | Edit |
| `app/Models/SavingProduct.php` | Edit |
| `app/Http/Resources/V1/Configurations/SavingProductResource.php` | Edit |
| `app/Http/Requests/Api/V1/Configurations/StoreSavingProductRequest.php` | Edit |
| `app/Http/Requests/Api/V1/Configurations/UpdateSavingProductRequest.php` | Edit |
| `app/Services/AccountService.php` | Edit |
| `app/Models/EligibleEmployer.php` | New |
| `app/Http/Controllers/Api/V1/Configurations/EligibleEmployerController.php` | New |
| `app/Http/Resources/V1/Configurations/EligibleEmployerResource.php` | New |
| `routes/api.php` | Edit |

### Frontend files
| File | Action |
|---|---|
| `src/app/admin/member-exit/page.tsx` | Edit |
| `src/app/(dashboard)/admin/configurations/saving-products/page.tsx` | Edit |
| `src/app/(dashboard)/admin/configurations/eligible-employers/page.tsx` | New |
| `src/lib/api/configurations.ts` | Edit |
| `src/components/Layouts/sidebar/data/index.ts` | Edit |
| `src/components/Members/MemberForm.tsx` | Edit |

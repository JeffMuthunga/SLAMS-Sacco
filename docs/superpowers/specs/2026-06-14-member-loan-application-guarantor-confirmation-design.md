# Member Loan Application + Guarantor Confirmation Design

**Date:** 2026-06-14  
**Scope:** Member self-service loan application from the member portal, plus guarantor Accept/Decline workflow, feeding into the admin approval queue.

---

## Loan Status Flow

```
member applies
     ↓
  applied  ←──────────────────────────────────────────────┐
     ↓ all guarantors accept                               │
guarantors_confirmed  → admin approves → approved → disbursed
     ↓ any guarantor declines                              │
  (blocked — needs replacement)                            │
     ↓ member or admin nominates replacement guarantor ────┘
```

The `loans.loan_status` enum gains one new value: `guarantors_confirmed`. This is the signal to admin that the loan is ready for review. The existing `applied` status continues to mean "waiting for guarantors".

No new columns needed on `loan_guarantees`. Existing fields cover all states:
- **Pending:** `is_active = true, is_accepted = false, approval_status = 'pending'`
- **Accepted:** `is_active = true, is_accepted = true, approval_status = 'approved', accepted_at = <timestamp>`
- **Declined:** `is_active = false, is_accepted = false, approval_status = 'rejected'`

---

## Backend

### Schema change

**Migration:** Add `'guarantors_confirmed'` to the `loans.loan_status` CHECK constraint.

```sql
-- Drop and recreate the CHECK constraint to include guarantors_confirmed
ALTER TABLE loans DROP CONSTRAINT IF EXISTS loans_loan_status_check;
ALTER TABLE loans ADD CONSTRAINT loans_loan_status_check CHECK (
  loan_status IN ('draft','applied','guarantors_confirmed','approved','rejected','disbursed','active','repaid','defaulted')
);
```

### LoanService changes

**`store(array $data, string $orgId, $user): Loan`** — no changes. Already handles guarantors. Called from both admin and member portal paths.

**New private helper `checkAndConfirmGuarantors(Loan $loan): void`**  
Called whenever a guarantee is accepted. If the loan product `requires_guarantor = true` AND all active guarantees (`is_active = true`) have `is_accepted = true` AND at least one guarantee exists → update `loan_status` to `guarantors_confirmed`. If the product does not require guarantors, this is a no-op.

**Updated `approve(Loan $loan, $user): void`**  
Add guard at the top: if loan product `requires_guarantor = true`, check that all active guarantees (`is_active = true`) have `is_accepted = true`. If not, abort 422 with `"All guarantors must confirm before this loan can be approved."`. This protects the admin path against bypassing the guarantor step.

**New `addGuarantor(Loan $loan, array $data, string $orgId): LoanGuarantee`**  
Creates a new `LoanGuarantee` record (`is_accepted = false, is_active = true, approval_status = 'pending'`). Resets `loan_status` back to `applied` if it was `guarantors_confirmed` (since a new unconfirmed guarantor was added). Only callable when `loan_status IN ['applied', 'guarantors_confirmed']`.

### New API endpoints

#### Member portal — `MemberPortalController`

**`POST /api/v1/me/loans`** — Member applies for a loan.  
- Auth: `auth:sanctum` (member portal group)  
- Request validation (new `ApplyLoanRequest`):
  ```
  loan_product_id   required uuid exists:loan_products,id
  principal_amount  required numeric min:1
  repayment_period  required integer min:1
  disburse_account_id  nullable uuid exists:deposit_accounts,id
  guarantors        array
  guarantors.*.member_id          required uuid exists:members,id
  guarantors.*.guaranteed_amount  required numeric min:0
  ```
- Resolves `member_id` from `$request->user()->member->id` (the authenticated user's linked member record).
- Calls `LoanService::store($data + ['member_id' => $memberId], $orgId, $user)`.
- Returns `LoanResource`.

**`POST /api/v1/me/loans/{loanId}/guarantors`** — Member adds a replacement guarantor.  
- Verifies loan belongs to the authenticated member and `loan_status IN ['applied', 'guarantors_confirmed']`.
- Request: `{ member_id, guaranteed_amount }`.
- Calls `LoanService::addGuarantor()`.
- Returns the updated `LoanGuarantee`.

**`POST /api/v1/me/guarantees/{guaranteeId}/accept`** — Guarantor accepts.  
- Verifies the `LoanGuarantee` belongs to the authenticated member (`guarantee.member_id == auth member id`).
- Verifies `is_active = true` and `is_accepted = false`.
- Updates: `is_accepted = true, accepted_at = now(), approval_status = 'approved'`.
- Calls `LoanService::checkAndConfirmGuarantors($guarantee->loan)`.
- Returns updated guarantee data.

**`POST /api/v1/me/guarantees/{guaranteeId}/decline`** — Guarantor declines.  
- Verifies the guarantee belongs to the authenticated member.
- Verifies `is_active = true` and `is_accepted = false`.
- Optional request body: `{ reason?: string }`.
- Updates: `is_active = false, approval_status = 'rejected'`.
- If loan was `guarantors_confirmed`, resets it back to `applied`.
- Returns updated guarantee data.

**`GET /api/v1/me/members/search?q=`** — Lightweight member search for guarantor nomination.  
- Auth: `auth:sanctum` (member portal group).  
- Returns id, full_name, member_number for approved, active members matching the query (min 2 chars). Excludes the authenticated member themselves.  
- Used by the loan application form and the replacement guarantor picker.

#### Admin portal — `LoanController`

**`POST /api/v1/loans/{loanId}/guarantors`** — Admin adds a replacement guarantor.  
- Auth: `auth:sanctum` + `manage_loans` permission (existing middleware).
- Request: `{ member_id, guaranteed_amount }`.
- Calls `LoanService::addGuarantor()`.
- Returns updated loan resource.

### Loan model

Add `'guarantors_confirmed'` to the `$casts` / `loan_status` enum list.

### LoanResource

Already exposes `guarantees` with `is_accepted` and `approval_status`. No changes needed.

---

## Frontend

### Member portal — Loan application

**File:** `frontend/src/app/member/service-desk/loans/page.tsx`

Add an "Apply for Loan" button at the top of the page. Clicking it reveals an inline form (same pattern as the admin create form but scoped to the member):

- **Loan Product** — `SelectInput` from active loan products (`useLoanProducts()`)
- **Amount** — `NumberInput`, validated against product `min_amount`/`max_amount`
- **Repayment Period (months)** — `NumberInput`, validated against product `min_period_months`/`max_period_months`
- **Guarantors section** — search members by name/number, enter guaranteed amount, add row. Same as admin form.
- **Submit** → `POST /me/loans` via new `useApplyLoan()` hook.

When the form is open, the loan list is hidden. Cancel returns to the list.

On a loan card, if any guarantee has `approval_status = 'rejected'` (declined), show a yellow banner: _"One or more guarantors declined. Nominate a replacement to proceed."_ with an inline search row to add a replacement (`POST /me/loans/{id}/guarantors` via `useAddMemberLoanGuarantor(loanId)`).

### Member portal — Guarantor requests

**File:** `frontend/src/app/member/guarantees/requests/page.tsx`  
Currently renders `<GuaranteesView status="pending" />` which is read-only.

Replace with a new dedicated component `GuaranteeRequestsPage` that fetches the same data but renders action buttons per row:

- **Accept** button → `POST /me/guarantees/{id}/accept` via `useAcceptGuarantee()`. On success, show toast "Guarantee accepted." and refetch.
- **Decline** button → opens a small inline confirm with optional reason text → `POST /me/guarantees/{id}/decline` via `useDeclineGuarantee()`. On success, show toast "Guarantee declined." and refetch.

### Admin portal — Loan detail page

**File:** `frontend/src/app/admin/loans/[id]/page.tsx`

In the guarantors table (already rendered), add a status column showing:
- Green tick — accepted
- Red cross — declined  
- Amber clock — pending

When loan `loan_status = 'applied'` and any guarantee is declined, show an "Add Guarantor" button that opens an inline search row (same pattern as admin create form) → `POST /loans/{id}/guarantors` via `useAddLoanGuarantor(loanId)`.

The **Approve** button: when `loan_status = 'applied'` (i.e. not yet `guarantors_confirmed`), disable it with tooltip: _"Waiting for all guarantors to confirm."_

---

## API hooks (frontend)

**`frontend/src/lib/api/member-portal.ts`** — add:
- `useApplyLoan()` → `POST /me/loans`
- `useAddMemberLoanGuarantor(loanId)` → `POST /me/loans/{id}/guarantors`
- `useAcceptGuarantee()` → `POST /me/guarantees/{id}/accept`
- `useDeclineGuarantee()` → `POST /me/guarantees/{id}/decline`
- `useMemberSearch(q: string)` → `GET /me/members/search?q=` (for guarantor picker)

**`frontend/src/lib/api/loans.ts`** — add:
- `useAddLoanGuarantor(loanId)` → `POST /loans/{id}/guarantors`

---

## File Change Summary

### Backend
| File | Action |
|---|---|
| `database/migrations/2026_06_14_000004_add_guarantors_confirmed_to_loans_status.php` | New |
| `app/Services/LoanService.php` | Edit — add `addGuarantor()`, `checkAndConfirmGuarantors()`, update `approve()` |
| `app/Models/Loan.php` | Edit — add `guarantors_confirmed` to loan_status cast/enum |
| `app/Http/Controllers/Api/V1/MemberPortalController.php` | Edit — add `applyLoan()`, `addLoanGuarantor()`, `acceptGuarantee()`, `declineGuarantee()`, `memberSearch()` |
| `app/Http/Requests/Api/V1/MemberPortal/ApplyLoanRequest.php` | New |
| `app/Http/Controllers/Api/V1/LoanController.php` | Edit — add `addGuarantor()` action |
| `routes/api.php` | Edit — register 5 new routes |

### Frontend
| File | Action |
|---|---|
| `frontend/src/lib/api/member-portal.ts` | Edit — 4 new hooks |
| `frontend/src/lib/api/loans.ts` | Edit — 1 new hook |
| `frontend/src/app/member/service-desk/loans/page.tsx` | Edit — add apply form + replacement guarantor UI |
| `frontend/src/app/member/guarantees/requests/page.tsx` | Edit — replace read-only view with accept/decline actions |
| `frontend/src/app/admin/loans/[id]/page.tsx` | Edit — guarantor status column, add guarantor action, approve button guard |

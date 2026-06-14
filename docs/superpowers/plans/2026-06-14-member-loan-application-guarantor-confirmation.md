# Member Loan Application + Guarantor Confirmation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable members to apply for loans from the member portal and allow guarantors to Accept/Decline via the guarantees page, with a hard block on admin approval until all guarantors confirm.

**Architecture:** New `guarantors_confirmed` loan status signals admin readiness. LoanService gains `addGuarantor()` and `checkAndConfirmGuarantors()` helpers. Five new member-portal endpoints + one admin endpoint handle the workflow. Frontend gains an Apply form on the member loans page, action buttons on the guarantees requests page, and a status column + approval guard on the admin loan detail page.

**Tech Stack:** Laravel 12 (LoanService, MemberPortalController, LoanController), PostgreSQL CHECK constraint migration, Next.js 16 (React Query hooks, TypeScript strict)

---

## File Change Map

### Backend
| File | Action |
|---|---|
| `backend/database/migrations/2026_06_14_000004_add_guarantors_confirmed_to_loans_status.php` | New — DROP/recreate CHECK constraint |
| `backend/app/Models/Loan.php` | Edit — no code change needed (no enum cast, just string) |
| `backend/app/Services/LoanService.php` | Edit — add `checkAndConfirmGuarantors()`, `addGuarantor()`, update `approve()` |
| `backend/app/Http/Requests/Api/V1/MemberPortal/ApplyLoanRequest.php` | New — validation for member loan application |
| `backend/app/Http/Controllers/Api/V1/MemberPortalController.php` | Edit — 5 new methods: `applyLoan`, `addLoanGuarantor`, `acceptGuarantee`, `declineGuarantee`, `memberSearch` |
| `backend/app/Http/Controllers/Api/V1/LoanController.php` | Edit — add `addGuarantor()` action |
| `backend/routes/api.php` | Edit — 6 new routes |

### Frontend
| File | Action |
|---|---|
| `frontend/src/lib/api/loans.ts` | Edit — add `'guarantors_confirmed'` to `LoanStatus`, add `useAddLoanGuarantor()` hook |
| `frontend/src/lib/api/member-portal.ts` | Edit — 5 new hooks + `MemberSearchResult` type + `ME_MEMBER_SEARCH_KEY` |
| `frontend/src/app/member/service-desk/loans/page.tsx` | Edit — add Apply form, guarantor declined banner + replacement UI |
| `frontend/src/app/member/guarantees/requests/page.tsx` | Edit — replace read-only view with Accept/Decline actions |
| `frontend/src/app/admin/loans/[id]/page.tsx` | Edit — guarantor status column, Add Guarantor button, Approve button guard |

---

## Task 1: Migration — add `guarantors_confirmed` to loans status CHECK constraint

**Files:**
- Create: `backend/database/migrations/2026_06_14_000004_add_guarantors_confirmed_to_loans_status.php`

- [ ] **Step 1: Create the migration**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE loans DROP CONSTRAINT IF EXISTS loans_loan_status_check');
        DB::statement("ALTER TABLE loans ADD CONSTRAINT loans_loan_status_check CHECK (
            loan_status IN ('draft','applied','guarantors_confirmed','approved','rejected','disbursed','active','repaid','defaulted')
        )");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE loans DROP CONSTRAINT IF EXISTS loans_loan_status_check');
        DB::statement("ALTER TABLE loans ADD CONSTRAINT loans_loan_status_check CHECK (
            loan_status IN ('draft','applied','approved','rejected','disbursed','active','repaid','defaulted')
        )");
    }
};
```

- [ ] **Step 2: Run the migration**

```bash
cd backend && php artisan migrate
```

Expected: `Migrating: 2026_06_14_000004_add_guarantors_confirmed_to_loans_status` then `Migrated`.

- [ ] **Step 3: Commit**

```bash
git add backend/database/migrations/2026_06_14_000004_add_guarantors_confirmed_to_loans_status.php
git commit -m "feat(loans): add guarantors_confirmed to loan_status CHECK constraint"
```

---

## Task 2: Update `LoanStatus` TypeScript type

**Files:**
- Modify: `frontend/src/lib/api/loans.ts` (line 52–54)

- [ ] **Step 1: Add `guarantors_confirmed` to `LoanStatus`**

In `frontend/src/lib/api/loans.ts`, replace:
```ts
export type LoanStatus =
  | "draft" | "applied" | "approved" | "rejected"
  | "disbursed" | "active" | "repaid" | "defaulted";
```

With:
```ts
export type LoanStatus =
  | "draft" | "applied" | "guarantors_confirmed" | "approved" | "rejected"
  | "disbursed" | "active" | "repaid" | "defaulted";
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/lib/api/loans.ts
git commit -m "feat(loans): add guarantors_confirmed to LoanStatus TS type"
```

---

## Task 3: LoanService — add `checkAndConfirmGuarantors()`, `addGuarantor()`, update `approve()`

**Files:**
- Modify: `backend/app/Services/LoanService.php`

This task adds three changes to `LoanService`:
1. New private method `checkAndConfirmGuarantors(Loan $loan): void`
2. New public method `addGuarantor(Loan $loan, array $data, string $orgId): LoanGuarantee`
3. Update `approve()` to guard against unconfirmed guarantors

- [ ] **Step 1: Update `approve()` to add the guarantor guard**

In `backend/app/Services/LoanService.php`, replace the `approve()` method:

```php
public function approve(Loan $loan, $user): void
{
    $product = $loan->loanProduct ?? $loan->load('loanProduct')->loanProduct;
    if ($product && $product->requires_guarantor) {
        $allAccepted = $loan->guarantees()
            ->where('is_active', true)
            ->where('is_accepted', false)
            ->doesntExist();
        $hasAny = $loan->guarantees()->where('is_active', true)->exists();
        abort_if(!$allAccepted || !$hasAny, 422, 'All guarantors must confirm before this loan can be approved.');
    }

    $loan->update([
        'loan_status'     => 'approved',
        'approval_status' => 'approved',
        'approved_by'     => $user->id,
        'approved_at'     => now(),
    ]);

    $loan->load('member');
    $this->notifications->loanApproved($loan);
}
```

- [ ] **Step 2: Add `checkAndConfirmGuarantors()` and `addGuarantor()` methods**

Add these two methods to `LoanService` after the `addNote()` method and before `// ── Private helpers ─`:

```php
public function checkAndConfirmGuarantors(Loan $loan): void
{
    $product = $loan->loanProduct ?? $loan->load('loanProduct')->loanProduct;
    if (!$product || !$product->requires_guarantor) {
        return;
    }

    $hasActive = $loan->guarantees()->where('is_active', true)->exists();
    $allAccepted = $loan->guarantees()
        ->where('is_active', true)
        ->where('is_accepted', false)
        ->doesntExist();

    if ($hasActive && $allAccepted) {
        $loan->update(['loan_status' => 'guarantors_confirmed']);
    }
}

public function addGuarantor(Loan $loan, array $data, string $orgId): LoanGuarantee
{
    abort_unless(
        in_array($loan->loan_status, ['applied', 'guarantors_confirmed'], true),
        422,
        'Guarantors can only be added to applied or guarantors_confirmed loans.'
    );

    $guarantee = LoanGuarantee::create([
        'org_id'            => $orgId,
        'loan_id'           => $loan->id,
        'member_id'         => $data['member_id'],
        'guaranteed_amount' => $data['guaranteed_amount'],
        'approval_status'   => 'pending',
        'is_accepted'       => false,
        'is_active'         => true,
    ]);

    // A new unconfirmed guarantor resets back to applied
    if ($loan->loan_status === 'guarantors_confirmed') {
        $loan->update(['loan_status' => 'applied']);
    }

    return $guarantee->load('member');
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/Services/LoanService.php
git commit -m "feat(loans): add checkAndConfirmGuarantors, addGuarantor, update approve guard"
```

---

## Task 4: New `ApplyLoanRequest` form request

**Files:**
- Create: `backend/app/Http/Requests/Api/V1/MemberPortal/ApplyLoanRequest.php`

- [ ] **Step 1: Create the request class**

```php
<?php

namespace App\Http\Requests\Api\V1\MemberPortal;

use Illuminate\Foundation\Http\FormRequest;

class ApplyLoanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'loan_product_id'             => ['required', 'uuid', 'exists:loan_products,id'],
            'principal_amount'            => ['required', 'numeric', 'min:1'],
            'repayment_period'            => ['required', 'integer', 'min:1'],
            'disburse_account_id'         => ['nullable', 'uuid', 'exists:deposit_accounts,id'],
            'guarantors'                  => ['nullable', 'array'],
            'guarantors.*.member_id'      => ['required', 'uuid', 'exists:members,id'],
            'guarantors.*.guaranteed_amount' => ['required', 'numeric', 'min:0'],
        ];
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/Http/Requests/Api/V1/MemberPortal/ApplyLoanRequest.php
git commit -m "feat(member-portal): add ApplyLoanRequest form request"
```

---

## Task 5: MemberPortalController — 5 new methods

**Files:**
- Modify: `backend/app/Http/Controllers/Api/V1/MemberPortalController.php`

Add 5 new public methods to `MemberPortalController`. Also inject `LoanService` in the constructor.

- [ ] **Step 1: Update the constructor and add `use` imports**

Replace the top of `MemberPortalController.php` (the `use` block and constructor) with:

```php
<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\V1\MemberResource;
use App\Http\Resources\V1\DepositAccountResource;
use App\Http\Resources\V1\AccountTransactionResource;
use App\Http\Resources\V1\LoanResource;
use App\Http\Resources\V1\ContributionResource;
use App\Http\Resources\V1\IssueResource;
use App\Http\Resources\V1\PettyCashAllocationResource;
use App\Http\Resources\V1\PettyCashRequestResource;
use App\Http\Requests\Api\V1\Issue\StoreIssueRequest;
use App\Http\Requests\Api\V1\MemberPortal\ApplyLoanRequest;
use App\Models\DepositAccount;
use App\Models\Loan;
use App\Models\LoanGuarantee;
use App\Models\Member;
use App\Models\AccountTransaction;
use App\Models\Contribution;
use App\Models\Issue;
use App\Models\IssueComment;
use App\Models\PettyCashAllocation;
use App\Models\PettyCashRequest;
use App\Services\IssueService;
use App\Services\LoanService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MemberPortalController extends ApiController
{
    public function __construct(
        private IssueService $issueService,
        private LoanService $loanService,
    ) {}
```

- [ ] **Step 2: Add the 5 new methods before the closing `}`**

Add these methods at the end of the class, before the final `}`:

```php
    public function applyLoan(ApplyLoanRequest $request): JsonResponse
    {
        $member  = $this->resolveMember($request);
        $data    = $request->validated();
        $data['member_id'] = $member->id;

        $loan = $this->loanService->store($data, $request->user()->org_id, $request->user());

        return $this->respondCreated(new LoanResource($loan), 'Loan application submitted.');
    }

    public function addLoanGuarantor(Request $request, string $loanId): JsonResponse
    {
        $member = $this->resolveMember($request);
        $loan   = Loan::where('id', $loanId)
            ->where('member_id', $member->id)
            ->where('org_id', $request->user()->org_id)
            ->firstOrFail();

        $request->validate([
            'member_id'         => ['required', 'uuid', 'exists:members,id'],
            'guaranteed_amount' => ['required', 'numeric', 'min:0'],
        ]);

        $guarantee = $this->loanService->addGuarantor($loan, $request->only('member_id', 'guaranteed_amount'), $request->user()->org_id);

        return $this->respondCreated([
            'id'               => $guarantee->id,
            'member'           => $guarantee->member ? [
                'id'            => $guarantee->member->id,
                'full_name'     => $guarantee->member->full_name,
                'member_number' => $guarantee->member->member_number,
            ] : null,
            'guaranteed_amount' => $guarantee->guaranteed_amount,
            'is_accepted'       => $guarantee->is_accepted,
            'is_active'         => $guarantee->is_active,
            'approval_status'   => $guarantee->approval_status,
        ], 'Guarantor added.');
    }

    public function acceptGuarantee(Request $request, string $guaranteeId): JsonResponse
    {
        $member    = $this->resolveMember($request);
        $guarantee = LoanGuarantee::where('id', $guaranteeId)
            ->where('member_id', $member->id)
            ->firstOrFail();

        abort_if(!$guarantee->is_active,   422, 'This guarantee is no longer active.');
        abort_if($guarantee->is_accepted,  422, 'This guarantee has already been accepted.');

        $guarantee->update([
            'is_accepted'     => true,
            'accepted_at'     => now(),
            'approval_status' => 'approved',
        ]);

        $this->loanService->checkAndConfirmGuarantors($guarantee->loan);

        return $this->respond([
            'id'             => $guarantee->id,
            'is_accepted'    => true,
            'accepted_at'    => $guarantee->fresh()->accepted_at,
            'approval_status'=> 'approved',
        ], 'Guarantee accepted.');
    }

    public function declineGuarantee(Request $request, string $guaranteeId): JsonResponse
    {
        $member    = $this->resolveMember($request);
        $guarantee = LoanGuarantee::where('id', $guaranteeId)
            ->where('member_id', $member->id)
            ->firstOrFail();

        abort_if(!$guarantee->is_active,  422, 'This guarantee is no longer active.');
        abort_if($guarantee->is_accepted, 422, 'This guarantee has already been accepted.');

        $request->validate(['reason' => ['nullable', 'string', 'max:500']]);

        $guarantee->update([
            'is_active'       => false,
            'approval_status' => 'rejected',
        ]);

        $loan = $guarantee->loan;
        if ($loan && $loan->loan_status === 'guarantors_confirmed') {
            $loan->update(['loan_status' => 'applied']);
        }

        return $this->respond([
            'id'             => $guarantee->id,
            'is_active'      => false,
            'approval_status'=> 'rejected',
        ], 'Guarantee declined.');
    }

    public function memberSearch(Request $request): JsonResponse
    {
        $request->validate(['q' => ['required', 'string', 'min:2', 'max:100']]);
        $member  = $this->resolveMember($request);
        $orgId   = $request->user()->org_id;
        $q       = strtolower($request->input('q'));

        $members = Member::where('org_id', $orgId)
            ->where('id', '!=', $member->id)
            ->where('approval_status', 'approved')
            ->where('is_active', true)
            ->where(function ($query) use ($q) {
                $query->whereRaw('LOWER(full_name) LIKE ?', ["%{$q}%"])
                      ->orWhereRaw('LOWER(member_number) LIKE ?', ["%{$q}%"]);
            })
            ->select('id', 'full_name', 'member_number')
            ->limit(20)
            ->get();

        return $this->respond($members->map(fn($m) => [
            'id'            => $m->id,
            'full_name'     => $m->full_name,
            'member_number' => $m->member_number,
        ]));
    }
```

Note: The `acceptGuarantee` method calls `$guarantee->loan` — ensure the `LoanGuarantee` model has a `loan()` BelongsTo relation (it already does from Phase 7).

- [ ] **Step 3: Commit**

```bash
git add backend/app/Http/Controllers/Api/V1/MemberPortalController.php
git commit -m "feat(member-portal): add applyLoan, addLoanGuarantor, acceptGuarantee, declineGuarantee, memberSearch"
```

---

## Task 6: LoanController — add `addGuarantor()` action

**Files:**
- Modify: `backend/app/Http/Controllers/Api/V1/LoanController.php`

- [ ] **Step 1: Add the `addGuarantor()` method**

Add this method to `LoanController` before the `destroy()` method:

```php
    public function addGuarantor(Request $request, Loan $loan): JsonResponse
    {
        abort_unless($loan->org_id === $request->user()->org_id, 404);

        $request->validate([
            'member_id'         => ['required', 'uuid', 'exists:members,id'],
            'guaranteed_amount' => ['required', 'numeric', 'min:0'],
        ]);

        $guarantee = $this->loanService->addGuarantor(
            $loan,
            $request->only('member_id', 'guaranteed_amount'),
            $request->user()->org_id
        );

        return $this->respondCreated([
            'id'               => $guarantee->id,
            'member'           => $guarantee->member ? [
                'id'            => $guarantee->member->id,
                'full_name'     => $guarantee->member->full_name,
                'member_number' => $guarantee->member->member_number,
            ] : null,
            'guaranteed_amount' => $guarantee->guaranteed_amount,
            'is_accepted'       => $guarantee->is_accepted,
            'is_active'         => $guarantee->is_active,
            'approval_status'   => $guarantee->approval_status,
        ], 'Guarantor added.');
    }
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/Http/Controllers/Api/V1/LoanController.php
git commit -m "feat(loans): add admin addGuarantor endpoint"
```

---

## Task 7: Register new routes

**Files:**
- Modify: `backend/routes/api.php`

- [ ] **Step 1: Add loan addGuarantor route to admin loans group**

In the `manage_loans` middleware group (around line 61), add this line after `Route::post('loans/{loan}/notes', ...)`:

```php
Route::post('loans/{loan}/guarantors',   [LoanController::class, 'addGuarantor']);
```

- [ ] **Step 2: Add member portal routes**

In the `me` prefix group (around line 155), add these routes after `Route::get('loans/{loanId}', ...)`:

```php
Route::post('loans',                                  [MemberPortalController::class, 'applyLoan']);
Route::post('loans/{loanId}/guarantors',              [MemberPortalController::class, 'addLoanGuarantor']);
Route::post('guarantees/{guaranteeId}/accept',        [MemberPortalController::class, 'acceptGuarantee']);
Route::post('guarantees/{guaranteeId}/decline',       [MemberPortalController::class, 'declineGuarantee']);
Route::get('members/search',                          [MemberPortalController::class, 'memberSearch']);
```

- [ ] **Step 3: Commit**

```bash
git add backend/routes/api.php
git commit -m "feat(routes): register member loan application and guarantor confirmation endpoints"
```

---

## Task 8: Frontend API hooks — loans.ts and member-portal.ts

**Files:**
- Modify: `frontend/src/lib/api/loans.ts`
- Modify: `frontend/src/lib/api/member-portal.ts`

### loans.ts — add `useAddLoanGuarantor()`

- [ ] **Step 1: Add `useAddLoanGuarantor` to `frontend/src/lib/api/loans.ts`**

Add this hook at the end of `loans.ts`, after `useRecordRepayment()`:

```ts
export function useAddLoanGuarantor(loanId: string) {
  const qc = useQueryClient();
  return useMutation<
    { id: string; member: { id: string; full_name: string; member_number: string } | null; guaranteed_amount: string; is_accepted: boolean; is_active: boolean; approval_status: string },
    Error,
    { member_id: string; guaranteed_amount: string }
  >({
    mutationFn: async (payload) => {
      const { data } = await api.post(`/loans/${loanId}/guarantors`, payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...LOANS_KEY, loanId] });
    },
  });
}
```

### member-portal.ts — add 5 hooks and MemberSearchResult type

- [ ] **Step 2: Add `MemberSearchResult` type and `ME_MEMBER_SEARCH_KEY` to `frontend/src/lib/api/member-portal.ts`**

After the existing interfaces (around line 60), add:

```ts
export interface MemberSearchResult {
  id: string;
  full_name: string;
  member_number: string;
}
```

After `ME_TRANSACTIONS_KEY`, add:

```ts
export const ME_MEMBER_SEARCH_KEY = ["me", "members", "search"] as const;
```

- [ ] **Step 3: Add the 5 new hooks at the end of `member-portal.ts`**

```ts
// ── Loan application ──────────────────────────────────────────────────────

export interface ApplyLoanPayload {
  loan_product_id: string;
  principal_amount: string;
  repayment_period: number;
  disburse_account_id?: string;
  guarantors?: Array<{ member_id: string; guaranteed_amount: string }>;
}

export function useApplyLoan() {
  const qc = useQueryClient();
  return useMutation<Loan, Error, ApplyLoanPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<Loan>>("/me/loans", payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ME_LOANS_KEY });
    },
  });
}

export function useAddMemberLoanGuarantor(loanId: string) {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { member_id: string; guaranteed_amount: string }>({
    mutationFn: async (payload) => {
      const { data } = await api.post(`/me/loans/${loanId}/guarantors`, payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ME_LOANS_KEY });
    },
  });
}

export function useAcceptGuarantee() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, string>({
    mutationFn: async (guaranteeId) => {
      const { data } = await api.post(`/me/guarantees/${guaranteeId}/accept`);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ME_GUARANTEES_KEY });
    },
  });
}

export function useDeclineGuarantee() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { guaranteeId: string; reason?: string }>({
    mutationFn: async ({ guaranteeId, reason }) => {
      const { data } = await api.post(`/me/guarantees/${guaranteeId}/decline`, { reason });
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ME_GUARANTEES_KEY });
    },
  });
}

export function useMemberSearch(q: string) {
  return useQuery<MemberSearchResult[]>({
    queryKey: [...ME_MEMBER_SEARCH_KEY, q],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<MemberSearchResult[]>>("/me/members/search", { params: { q } });
      return data.data;
    },
    enabled: q.length >= 2,
    staleTime: 30_000,
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/api/loans.ts frontend/src/lib/api/member-portal.ts
git commit -m "feat(hooks): add useApplyLoan, useAddMemberLoanGuarantor, useAcceptGuarantee, useDeclineGuarantee, useMemberSearch, useAddLoanGuarantor"
```

---

## Task 9: Member portal — guarantees/requests page (Accept/Decline)

**Files:**
- Modify: `frontend/src/app/member/guarantees/requests/page.tsx`

The current file renders `<GuaranteesView status="pending" />` which is read-only. Replace it with a fully interactive page with Accept/Decline buttons.

- [ ] **Step 1: Replace the page content**

```tsx
"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  useMemberGuarantees,
  useAcceptGuarantee,
  useDeclineGuarantee,
  type Guarantee,
} from "@/lib/api/member-portal";
import { extractApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";

function fmtAmount(v: string) {
  return parseFloat(v).toLocaleString("en-KE", { minimumFractionDigits: 2 });
}

function GuaranteeRow({ guarantee }: { guarantee: Guarantee }) {
  const accept  = useAcceptGuarantee();
  const decline = useDeclineGuarantee();
  const [showDecline,  setShowDecline]  = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  const isPending = guarantee.is_active && !guarantee.is_accepted;

  function handleAccept() {
    accept.mutate(guarantee.id, {
      onSuccess: () => toast.success("Guarantee accepted."),
      onError:   (err) => toast.error(extractApiError(err)),
    });
  }

  function handleDecline() {
    decline.mutate(
      { guaranteeId: guarantee.id, reason: declineReason || undefined },
      {
        onSuccess: () => {
          toast.success("Guarantee declined.");
          setShowDecline(false);
          setDeclineReason("");
        },
        onError: (err) => toast.error(extractApiError(err)),
      }
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-dark">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-dark dark:text-white">
            {guarantee.loan?.member?.full_name ?? "—"}
            <span className="ml-1 text-xs text-gray-400">({guarantee.loan?.member?.member_number ?? "—"})</span>
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            {guarantee.loan?.loan_product?.name ?? "Loan"} · {guarantee.loan?.account_number ?? "—"}
          </p>
          <p className="mt-1 text-sm font-mono text-dark dark:text-white">
            KES {fmtAmount(guarantee.guaranteed_amount)}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          {isPending ? (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-green-500 text-green-600 hover:bg-green-50"
                disabled={accept.isPending}
                onClick={handleAccept}
              >
                {accept.isPending ? "Accepting…" : "Accept"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-red-400 text-red-600 hover:bg-red-50"
                onClick={() => setShowDecline(true)}
              >
                Decline
              </Button>
            </div>
          ) : (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              guarantee.is_accepted
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-600"
            }`}>
              {guarantee.is_accepted ? "Accepted" : "Declined"}
            </span>
          )}
        </div>
      </div>

      {showDecline && (
        <div className="mt-3 flex flex-col gap-2 border-t border-gray-200 pt-3 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Optionally provide a reason for declining:
          </p>
          <textarea
            rows={2}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder="Reason (optional)…"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              disabled={decline.isPending}
              onClick={handleDecline}
            >
              {decline.isPending ? "Declining…" : "Confirm Decline"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowDecline(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GuaranteeRequestsPage() {
  const { data, isLoading, error } = useMemberGuarantees({ status: "pending", per_page: 50 });
  const guarantees = data?.data ?? [];

  if (isLoading) return <p className="p-6 text-gray-500">Loading…</p>;
  if (error)     return <p className="p-6 text-red-500">{extractApiError(error)}</p>;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-dark dark:text-white">Guarantee Requests</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Loans where you have been nominated as a guarantor.
        </p>
      </div>

      {!guarantees.length ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-dark">
          <p className="text-gray-400">No pending guarantee requests.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {guarantees.map((g) => (
            <GuaranteeRow key={g.id} guarantee={g} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/app/member/guarantees/requests/page.tsx
git commit -m "feat(member-portal): replace read-only guarantees page with Accept/Decline actions"
```

---

## Task 10: Member portal — loans page (Apply form + replacement guarantor)

**Files:**
- Modify: `frontend/src/app/member/service-desk/loans/page.tsx`

This is the most complex frontend task. The page gains:
1. An "Apply for Loan" button that toggles an inline Apply form
2. The Apply form with loan product, amount, period, and guarantors search
3. A warning banner on each loan card when a guarantor has declined, with an inline replacement guarantor row

The page needs hooks from `configurations.ts` for loan products and `member-portal.ts` for the new mutations.

- [ ] **Step 1: Read the loan products hook to know the interface**

In `frontend/src/lib/api/configurations.ts`, the `LoanProduct` interface and `useLoanProducts()` hook already exist. `LoanProduct` has: `id`, `name`, `min_amount`, `max_amount`, `min_period_months`, `max_period_months`, `requires_guarantor`, `interest_rate`, `interest_method`, `repayment_frequency`.

- [ ] **Step 2: Replace `frontend/src/app/member/service-desk/loans/page.tsx`**

```tsx
"use client";

import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import { useMemberLoans, useMemberLoan, useApplyLoan, useAddMemberLoanGuarantor, useMemberSearch, type ApplyLoanPayload } from "@/lib/api/member-portal";
import { useLoanProducts } from "@/lib/api/configurations";
import { extractApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import SelectInput from "@/components/Forms/SelectInput";
import NumberInput from "@/components/Forms/NumberInput";
import type { Loan, LoanStatus } from "@/lib/api/loans";

const STATUS_CFG: Record<LoanStatus, { label: string; className: string }> = {
  draft:               { label: "Draft",               className: "bg-gray-100 text-gray-600" },
  applied:             { label: "Applied",             className: "bg-blue-100 text-blue-700" },
  guarantors_confirmed:{ label: "Guarantors Confirmed",className: "bg-teal-100 text-teal-700" },
  approved:            { label: "Approved",            className: "bg-yellow-100 text-yellow-700" },
  rejected:            { label: "Rejected",            className: "bg-red-100 text-red-700" },
  disbursed:           { label: "Disbursed",           className: "bg-green-100 text-green-700" },
  active:              { label: "Active",              className: "bg-green-100 text-green-700" },
  repaid:              { label: "Repaid",              className: "bg-gray-100 text-gray-600" },
  defaulted:           { label: "Defaulted",           className: "bg-red-100 text-red-700" },
};

// ── Guarantor search row ─────────────────────────────────────────────────

interface GuarantorRow {
  member_id: string;
  full_name: string;
  member_number: string;
  guaranteed_amount: string;
}

function GuarantorPickerRow({
  onAdd,
}: {
  onAdd: (row: GuarantorRow) => void;
}) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<{ value: string; label: string } | null>(null);
  const [amount, setAmount] = useState("");
  const { data: results = [] } = useMemberSearch(q);

  const options = results.map((m) => ({
    value: m.id,
    label: `${m.full_name} (${m.member_number})`,
    meta: m,
  }));

  function handleAdd() {
    if (!selected || !amount) { toast.error("Select a member and enter an amount."); return; }
    const meta = results.find((m) => m.id === selected.value);
    if (!meta) return;
    onAdd({ member_id: meta.id, full_name: meta.full_name, member_number: meta.member_number, guaranteed_amount: amount });
    setSelected(null);
    setQ("");
    setAmount("");
  }

  return (
    <div className="flex flex-wrap gap-2 items-end">
      <div className="flex-1 min-w-[200px]">
        <SelectInput
          options={options}
          value={selected}
          onChange={(opt) => setSelected(opt as { value: string; label: string } | null)}
          onInputChange={(val) => setQ(val)}
          placeholder="Search member by name or number…"
        />
      </div>
      <div className="w-36">
        <NumberInput
          value={amount}
          onChange={(v) => setAmount(v)}
          placeholder="Amount"
        />
      </div>
      <Button type="button" size="sm" variant="outline" onClick={handleAdd}>
        + Add
      </Button>
    </div>
  );
}

// ── Apply loan form ──────────────────────────────────────────────────────

function ApplyLoanForm({ onClose }: { onClose: () => void }) {
  const { data: products = [] } = useLoanProducts({ is_active: true, per_page: 100 });
  const applyLoan = useApplyLoan();

  const [productId, setProductId]   = useState("");
  const [amount, setAmount]         = useState("");
  const [period, setPeriod]         = useState("");
  const [guarantors, setGuarantors] = useState<GuarantorRow[]>([]);

  const selectedProduct = products.find((p) => p.id === productId) ?? null;

  const productOptions = products.map((p) => ({ value: p.id, label: p.name }));

  function removeGuarantor(idx: number) {
    setGuarantors((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId || !amount || !period) { toast.error("Product, amount, and period are required."); return; }

    const payload: ApplyLoanPayload = {
      loan_product_id:  productId,
      principal_amount: amount,
      repayment_period: parseInt(period, 10),
      guarantors: guarantors.map((g) => ({ member_id: g.member_id, guaranteed_amount: g.guaranteed_amount })),
    };

    applyLoan.mutate(payload, {
      onSuccess: () => {
        toast.success("Loan application submitted.");
        onClose();
      },
      onError: (err) => toast.error(extractApiError(err)),
    });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-dark">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dark dark:text-white">Apply for a Loan</h2>
        <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600">✕ Cancel</button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Loan Product <span className="text-red-500">*</span>
          </label>
          <SelectInput
            options={productOptions}
            value={productOptions.find((o) => o.value === productId) ?? null}
            onChange={(opt) => setProductId((opt as { value: string } | null)?.value ?? "")}
            placeholder="Select product…"
          />
          {selectedProduct && (
            <p className="mt-1 text-xs text-gray-400">
              {selectedProduct.interest_rate}% p.a. · {selectedProduct.interest_method} · {selectedProduct.min_amount}–{selectedProduct.max_amount} · {selectedProduct.min_period_months}–{selectedProduct.max_period_months} months
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount (KES) <span className="text-red-500">*</span>
            </label>
            <NumberInput value={amount} onChange={setAmount} placeholder="e.g. 50000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Repayment Period (months) <span className="text-red-500">*</span>
            </label>
            <NumberInput value={period} onChange={setPeriod} placeholder="e.g. 12" />
          </div>
        </div>

        {(selectedProduct?.requires_guarantor || guarantors.length > 0) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Guarantors{selectedProduct?.requires_guarantor ? " *" : ""}
            </label>
            {guarantors.length > 0 && (
              <div className="mb-2 flex flex-col gap-1">
                {guarantors.map((g, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-1.5 text-sm dark:bg-gray-800">
                    <span>{g.full_name} ({g.member_number})</span>
                    <span className="font-mono">KES {parseFloat(g.guaranteed_amount).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</span>
                    <button type="button" onClick={() => removeGuarantor(i)} className="text-red-400 hover:text-red-600 text-xs ml-2">Remove</button>
                  </div>
                ))}
              </div>
            )}
            <GuarantorPickerRow onAdd={(row) => setGuarantors((prev) => [...prev, row])} />
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={applyLoan.isPending}>
            {applyLoan.isPending ? "Submitting…" : "Submit Application"}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

// ── Replacement guarantor row ────────────────────────────────────────────

function ReplacementGuarantorRow({ loanId }: { loanId: string }) {
  const [q, setQ]           = useState("");
  const [selected, setSelected] = useState<{ value: string; label: string; meta?: { id: string; full_name: string; member_number: string } } | null>(null);
  const [amount, setAmount] = useState("");
  const { data: results = [] } = useMemberSearch(q);
  const addGuarantor = useAddMemberLoanGuarantor(loanId);

  const options = results.map((m) => ({ value: m.id, label: `${m.full_name} (${m.member_number})`, meta: m }));

  function handleAdd() {
    if (!selected || !amount) { toast.error("Select a member and enter an amount."); return; }
    addGuarantor.mutate(
      { member_id: selected.value, guaranteed_amount: amount },
      {
        onSuccess: () => { toast.success("Replacement guarantor added."); setSelected(null); setQ(""); setAmount(""); },
        onError:   (err) => toast.error(extractApiError(err)),
      }
    );
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2 items-end">
      <div className="flex-1 min-w-[200px]">
        <SelectInput
          options={options}
          value={selected}
          onChange={(opt) => setSelected(opt as typeof selected)}
          onInputChange={(val) => setQ(val)}
          placeholder="Search replacement guarantor…"
        />
      </div>
      <div className="w-36">
        <NumberInput value={amount} onChange={setAmount} placeholder="Amount" />
      </div>
      <Button type="button" size="sm" onClick={handleAdd} disabled={addGuarantor.isPending}>
        {addGuarantor.isPending ? "Adding…" : "Add"}
      </Button>
    </div>
  );
}

// ── Loan card ────────────────────────────────────────────────────────────

function LoanCard({ loan, selected, onClick }: { loan: Loan; selected: boolean; onClick: () => void }) {
  const cfg = STATUS_CFG[loan.loan_status] ?? { label: loan.loan_status, className: "bg-gray-100 text-gray-600" };
  const hasDeclined = loan.guarantees?.some((g) => g.approval_status === "rejected") ?? false;

  return (
    <div className="flex flex-col gap-0">
      <button
        onClick={onClick}
        className={`w-full rounded-xl border p-4 text-left transition-colors ${
          selected ? "border-primary bg-primary/5" : "border-gray-200 bg-white hover:border-primary/50 dark:border-gray-700 dark:bg-gray-dark"
        } ${hasDeclined ? "rounded-b-none border-b-0" : ""}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-mono text-sm text-gray-500">{loan.account_number}</p>
            <p className="mt-0.5 text-sm font-medium text-dark dark:text-white">
              {(loan.loan_product as { name?: string } | null)?.name ?? "Loan"}
            </p>
          </div>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>{cfg.label}</span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-gray-500">Principal</p>
            <p className="font-medium">KES {Number(loan.principal_amount).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-gray-500">Outstanding</p>
            <p className="font-medium">KES {Number(loan.outstanding_balance).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </button>

      {hasDeclined && ["applied", "guarantors_confirmed"].includes(loan.loan_status) && (
        <div className="rounded-b-xl border border-t-0 border-yellow-300 bg-yellow-50 px-4 py-3 dark:border-yellow-700 dark:bg-yellow-900/20">
          <p className="text-xs font-medium text-yellow-800 dark:text-yellow-300">
            One or more guarantors declined. Nominate a replacement to proceed.
          </p>
          <ReplacementGuarantorRow loanId={loan.id} />
        </div>
      )}
    </div>
  );
}

// ── Loan detail panel ────────────────────────────────────────────────────

function LoanDetail({ loanId }: { loanId: string }) {
  const { data: loan, isLoading, error } = useMemberLoan(loanId);

  if (isLoading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (error)     return <p className="text-sm text-red-500">{extractApiError(error)}</p>;
  if (!loan)     return null;

  const cfg = STATUS_CFG[loan.loan_status] ?? { label: loan.loan_status, className: "bg-gray-100 text-gray-600" };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm text-gray-500">{loan.account_number}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>{cfg.label}</span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        {[
          ["Principal",         `KES ${Number(loan.principal_amount).toLocaleString("en-KE", { minimumFractionDigits: 2 })}`],
          ["Outstanding",       `KES ${Number(loan.outstanding_balance).toLocaleString("en-KE", { minimumFractionDigits: 2 })}`],
          ["Interest Rate",     `${loan.interest_rate}% p.a.`],
          ["Repayment Period",  `${loan.repayment_period} months`],
          ["Repayment Amount",  `KES ${Number(loan.repayment_amount).toLocaleString("en-KE", { minimumFractionDigits: 2 })}`],
          ["Disbursed Date",    loan.disbursed_date ? new Date(loan.disbursed_date).toLocaleDateString("en-KE") : "—"],
          ["Maturity Date",     loan.maturity_date ? new Date(loan.maturity_date).toLocaleDateString("en-KE") : "—"],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="font-medium text-dark dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      {loan.guarantees && loan.guarantees.length > 0 && (
        <div>
          <h3 className="mb-2 font-semibold text-dark dark:text-white">Guarantors</h3>
          <div className="flex flex-col gap-1">
            {loan.guarantees.map((g) => (
              <div key={g.id} className="flex items-center justify-between text-xs border-b pb-1.5 last:border-0">
                <span>{g.member?.full_name ?? "—"} ({g.member?.member_number ?? "—"})</span>
                <span className="font-mono">KES {Number(g.guaranteed_amount).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</span>
                <span className={
                  g.is_accepted ? "text-green-600" :
                  g.approval_status === "rejected" ? "text-red-500" :
                  "text-yellow-600"
                }>
                  {g.is_accepted ? "Accepted" : g.approval_status === "rejected" ? "Declined" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {loan.repayments && loan.repayments.length > 0 && (
        <div>
          <h3 className="mb-2 font-semibold text-dark dark:text-white">Repayment Schedule</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-2 text-left text-gray-500">Due Date</th>
                  <th className="pb-2 text-right text-gray-500">Total Due</th>
                  <th className="pb-2 text-right text-gray-500">Total Paid</th>
                  <th className="pb-2 text-right text-gray-500">Balance</th>
                  <th className="pb-2 text-left text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {loan.repayments.map((r) => {
                  const statusCfg: Record<string, string> = {
                    pending: "text-gray-600", partial: "text-yellow-600",
                    paid:    "text-green-600", overdue: "text-red-600",
                  };
                  return (
                    <tr key={r.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <td className="py-1.5">{new Date(r.due_date).toLocaleDateString("en-KE")}</td>
                      <td className="py-1.5 text-right">KES {Number(r.total_due).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</td>
                      <td className="py-1.5 text-right">KES {Number(r.total_paid).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</td>
                      <td className="py-1.5 text-right">KES {Number(r.balance).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</td>
                      <td className={`py-1.5 capitalize font-medium ${statusCfg[r.repayment_status] ?? ""}`}>
                        {r.repayment_status}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function MemberLoansPage() {
  const { data, isLoading, error } = useMemberLoans({ per_page: 20 });
  const [selectedId,  setSelectedId]  = useState<string | null>(null);
  const [showApply,   setShowApply]   = useState(false);

  if (isLoading) return <p className="p-6 text-gray-500">Loading…</p>;
  if (error)     return <p className="p-6 text-red-500">{extractApiError(error)}</p>;

  const loans      = data?.data ?? [];
  const effectiveId = selectedId ?? loans[0]?.id ?? null;

  if (showApply) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold text-dark dark:text-white">My Loans</h1>
        <ApplyLoanForm onClose={() => setShowApply(false)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-dark dark:text-white">My Loans</h1>
        <Button onClick={() => setShowApply(true)}>+ Apply for Loan</Button>
      </div>

      {!loans.length ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-dark">
          <p className="text-gray-400 mb-4">No loans yet.</p>
          <Button onClick={() => setShowApply(true)}>Apply for Your First Loan</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-3">
            {loans.map((loan) => (
              <LoanCard
                key={loan.id}
                loan={loan}
                selected={effectiveId === loan.id}
                onClick={() => setSelectedId(loan.id)}
              />
            ))}
          </div>
          <div className="lg:col-span-2">
            {effectiveId && (
              <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-dark">
                <h2 className="mb-4 font-semibold text-dark dark:text-white">Loan Details</h2>
                <LoanDetail loanId={effectiveId} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/member/service-desk/loans/page.tsx
git commit -m "feat(member-portal): add loan apply form and replacement guarantor UI"
```

---

## Task 11: Admin loan detail page — guarantor status column, Add Guarantor, Approve guard

**Files:**
- Modify: `frontend/src/app/admin/loans/[id]/page.tsx`

Three targeted changes to the existing page:
1. Update the guarantors section to show a 3-state status icon (✓ accepted / ✕ declined / ⏱ pending)
2. Add "Add Guarantor" button + inline search row when `loan_status = 'applied'` and a guarantor has declined
3. Disable the Approve button with a tooltip when `loan_status = 'applied'` (not yet `guarantors_confirmed`)

- [ ] **Step 1: Add imports for new hooks and state**

At the top of `frontend/src/app/admin/loans/[id]/page.tsx`, add to the existing imports:

```ts
import { useAddLoanGuarantor } from "@/lib/api/loans";
// (already imported) import { useMembers } from "@/lib/api/members"; — NOT needed; we use member search differently
```

Also add `useMembers` from `@/lib/api/members` (for the admin guarantor picker — admin uses the full members list):

```ts
import { useMembers } from "@/lib/api/members";
```

- [ ] **Step 2: Add state variables for the Add Guarantor UI**

In `LoanDetailPage`, after existing `useState` declarations, add:

```ts
const [showAddGuarantor,  setShowAddGuarantor]  = useState(false);
const [guarantorSearch,   setGuarantorSearch]   = useState("");
const [guarantorMemberId, setGuarantorMemberId] = useState("");
const [guarantorAmount,   setGuarantorAmount]   = useState("");
const addGuarantorMutation = useAddLoanGuarantor(id);
const { data: guarantorMembersData } = useMembers(
  guarantorSearch.length >= 2 ? { search: guarantorSearch, per_page: 20 } : undefined
);
const guarantorMemberOptions = (guarantorMembersData?.data ?? []).map((m) => ({
  value: m.id,
  label: `${m.full_name} (${m.member_number})`,
}));
```

- [ ] **Step 3: Add `handleAddGuarantor` handler**

```ts
const handleAddGuarantor = async () => {
  if (!guarantorMemberId || !guarantorAmount) { toast.error("Select a member and enter an amount."); return; }
  try {
    await addGuarantorMutation.mutateAsync({ member_id: guarantorMemberId, guaranteed_amount: guarantorAmount });
    toast.success("Guarantor added.");
    setShowAddGuarantor(false);
    setGuarantorMemberId("");
    setGuarantorAmount("");
    setGuarantorSearch("");
  } catch (err) {
    toast.error(extractApiError(err));
  }
};
```

- [ ] **Step 4: Update the Approve button to guard on `guarantors_confirmed`**

Replace the existing Approve button (lines ~134–138):

```tsx
{isPending && (
  <>
    {loan.loan_status === 'applied' ? (
      <button
        disabled
        title="Waiting for all guarantors to confirm."
        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white opacity-50 cursor-not-allowed"
      >
        Approve
      </button>
    ) : (
      <button onClick={handleApprove} disabled={approveMutation.isPending}
        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60">
        Approve
      </button>
    )}
    <button onClick={() => setShowRejectModal(true)}
      className="rounded-lg border border-red-400 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
      Reject
    </button>
  </>
)}
```

- [ ] **Step 5: Update the Guarantors section with 3-state status + Add Guarantor button**

Replace the existing guarantors block (lines ~199–214):

```tsx
{loan.guarantees.length > 0 && (
  <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
    <div className="mb-3 flex items-center justify-between">
      <h2 className="font-semibold text-dark dark:text-white">Guarantors</h2>
      {["applied", "guarantors_confirmed"].includes(loan.loan_status) &&
        loan.guarantees.some((g) => g.approval_status === "rejected") && (
          <button
            onClick={() => setShowAddGuarantor((v) => !v)}
            className="text-sm rounded-lg border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50"
          >
            + Add Guarantor
          </button>
        )}
    </div>
    <div className="flex flex-col gap-2">
      {loan.guarantees.map((g) => (
        <div key={g.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
          <span>{g.member?.full_name ?? "—"} ({g.member?.member_number ?? "—"})</span>
          <span className="font-mono">{fmt(g.guaranteed_amount)}</span>
          <span className={
            g.is_accepted
              ? "text-green-600 font-medium"
              : g.approval_status === "rejected"
                ? "text-red-500 font-medium"
                : "text-yellow-600"
          }>
            {g.is_accepted ? "✓ Accepted" : g.approval_status === "rejected" ? "✕ Declined" : "⏱ Pending"}
          </span>
        </div>
      ))}
    </div>

    {showAddGuarantor && (
      <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-700 flex flex-col gap-3">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Add Replacement Guarantor</p>
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[200px]">
            <SelectInput
              options={guarantorMemberOptions}
              value={guarantorMemberOptions.find((o) => o.value === guarantorMemberId) ?? null}
              onChange={(opt) => setGuarantorMemberId((opt as { value: string } | null)?.value ?? "")}
              onInputChange={(val) => setGuarantorSearch(val)}
              placeholder="Search member…"
            />
          </div>
          <div className="w-36">
            <input
              type="number"
              min="0"
              step="0.01"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              placeholder="Amount"
              value={guarantorAmount}
              onChange={(e) => setGuarantorAmount(e.target.value)}
            />
          </div>
          <button
            onClick={handleAddGuarantor}
            disabled={addGuarantorMutation.isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-60"
          >
            {addGuarantorMutation.isPending ? "Adding…" : "Add"}
          </button>
        </div>
      </div>
    )}
  </div>
)}
```

- [ ] **Step 6: Import NumberInput if needed, or use plain `<input type="number">` as above (already done above)**

- [ ] **Step 7: Commit**

```bash
git add frontend/src/app/admin/loans/[id]/page.tsx
git commit -m "feat(admin-loans): guarantor status icons, add guarantor UI, approve guard for unconfirmed guarantors"
```

---

## Task 12: Verify TypeScript compiles

- [ ] **Step 1: Run TypeScript check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: No errors. If errors appear, fix them (common issues: missing `guarantors_confirmed` in STATUS_CFG, wrong import paths).

- [ ] **Step 2: Commit any fixes**

```bash
git add -p
git commit -m "fix(types): resolve TypeScript errors from guarantor confirmation feature"
```

---

## Done

All tasks complete. The member loan application + guarantor confirmation workflow is fully implemented:
- Members can apply for loans from the member portal
- Guarantors see pending requests and can Accept/Decline
- Declined guarantors trigger a replacement flow (both member and admin)
- Admin cannot approve a loan requiring guarantors until all active guarantees are accepted (`guarantors_confirmed` status gates the Approve button)

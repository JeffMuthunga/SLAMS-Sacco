# Phase 6: SACCO Accounts & Transactions

## Context

Full-stack SACCO management system. Backend: Laravel 12, PostgreSQL, Sanctum SPA auth,
`/api/v1/` prefix, envelope responses `{ success, data, message, errors?, meta? }`.
Frontend: Next.js 16 App Router, React Query, TypeScript strict (no `any`), shadcn/ui,
Tailwind CSS v4, DataTable (TanStack), sonner toasts.

Working directory: `/Users/wainaina/Development/Sacco/SLAMS Sacco`
Backend: `backend/`  Frontend: `frontend/`

### Schema already in place (Phase 1 migrations)
- `deposit_accounts` — uuid PK, org_id, member_id, product_id (→saving_products),
  account_number, balance DECIMAL(15,2), interest_rate DECIMAL(6,4),
  opening_date, last_activity_date, is_active, is_locked, locked_until_date,
  approval_status (draft|pending|approved|rejected), approved_by, approved_at,
  timestamps, soft_deletes
- `account_transactions` — uuid PK, org_id, deposit_account_id, period_id,
  transaction_type (deposit|withdrawal|interest_credit|fee|transfer_in|transfer_out|
  loan_disbursement|loan_repayment|contribution),
  amount DECIMAL(15,2), balance_after DECIMAL(15,2), reference_number,
  transaction_date, value_date, narration, created_by (→users),
  linked_transaction_id (self-FK), approval_status, approved_by, approved_at,
  timestamps, soft_deletes

### Existing models
`backend/app/Models/DepositAccount.php` — already has all fillable, casts,
belongsTo(Member, SavingProduct), hasMany(AccountTransaction, Contribution)
`backend/app/Models/AccountTransaction.php` — already has all fillable, casts,
belongsTo(DepositAccount, Period), belongsTo(linked)

### Conventions
- Controllers extend `ApiController` (`respond`, `respondCreated`, `respondError`)
- Org scoping: `where('org_id', $request->user()->org_id)` on every query
- UUID routes use model binding; soft-deleted routes use `onlyTrashed()`
- Permissions via Spatie (`permission:manage_accounts` middleware)
- bcmath for all monetary arithmetic (never floats)
- Frontend: React Query v5, `api` axios client (`/api/v1` base), `ApiEnvelope<T>` type
- Frontend routing: `src/app/admin/accounts/` (not a route group wrapper)

---

## Task 1 — Backend: AccountService + DepositAccountController

### Files to create
- `backend/app/Services/AccountService.php`
- `backend/app/Http/Controllers/Api/V1/AccountController.php`
- `backend/app/Http/Requests/Api/V1/Account/StoreDepositAccountRequest.php`
- `backend/app/Http/Requests/Api/V1/Account/UpdateDepositAccountRequest.php`
- `backend/app/Http/Resources/V1/DepositAccountResource.php`

### Files to modify
- `backend/app/Http/Controllers/Api/V1/MemberController.php` — no change needed
- `backend/database/seeders/RbacSeeder.php` — add `manage_accounts` permission, grant to admin
- `backend/routes/api.php` — add accounts routes

### AccountService
```php
namespace App\Services;

use App\Models\DepositAccount;
use App\Models\Period;
use Illuminate\Support\Facades\DB;

class AccountService
{
    public function generateAccountNumber(string $orgId): string
    {
        // Format: ACC-YYYYMMDD-{5 digit sequence per org per day}
        $prefix = 'ACC-' . now()->format('Ymd') . '-';
        $last = DepositAccount::withTrashed()
            ->where('org_id', $orgId)
            ->where('account_number', 'like', $prefix . '%')
            ->orderByDesc('account_number')
            ->value('account_number');
        $seq = $last ? ((int) substr($last, -5)) + 1 : 1;
        return $prefix . str_pad($seq, 5, '0', STR_PAD_LEFT);
    }

    public function store(array $data, string $orgId): DepositAccount
    {
        return DB::transaction(function () use ($data, $orgId) {
            return DepositAccount::create([
                'org_id'          => $orgId,
                'member_id'       => $data['member_id'],
                'product_id'      => $data['product_id'],
                'account_number'  => $this->generateAccountNumber($orgId),
                'interest_rate'   => $data['interest_rate'] ?? 0,
                'opening_date'    => $data['opening_date'],
                'approval_status' => 'pending',
                'is_active'       => false,
                'balance'         => '0.00',
            ]);
        });
    }

    public function approve(DepositAccount $account, $user): void
    {
        $account->update([
            'approval_status' => 'approved',
            'is_active'       => true,
            'approved_by'     => $user->id,
            'approved_at'     => now(),
        ]);
    }

    public function reject(DepositAccount $account, string $reason, $user): void
    {
        // Store reason in narration field of a phantom note (or just update status)
        $account->update([
            'approval_status' => 'rejected',
            'approved_by'     => $user->id,
            'approved_at'     => now(),
        ]);
    }
}
```

### AccountController
- `index` — paginated list, filter by member_id, status, search (account_number)
- `store` — delegates to AccountService::store(); respondCreated
- `show` — loads member, product; org scope check
- `update` — only editable fields: interest_rate, is_locked, locked_until_date (not balance, not account_number)
- `destroy` — soft delete (close account)
- `approve` — sets approved, activates
- `reject` — sets rejected
- `statement` — returns account + paginated transactions for that account (GET accounts/{account}/statement)

### StoreDepositAccountRequest validation
```
member_id: required|uuid|exists:members,id
product_id: required|uuid|exists:saving_products,id
opening_date: required|date
interest_rate: nullable|numeric|min:0|max:100
```

### UpdateDepositAccountRequest validation
```
interest_rate: nullable|numeric|min:0|max:100
is_locked: nullable|boolean
locked_until_date: nullable|date|after_or_equal:today
```

### DepositAccountResource
Return these fields:
```
id, account_number, balance, interest_rate,
opening_date (date string), last_activity_date (date string or null),
is_active, is_locked, locked_until_date (date string or null),
approval_status, approved_by, approved_at (ISO or null),
org_id,
member: { id, full_name, member_number } (whenLoaded),
product: { id, name } (whenLoaded),
created_at (ISO)
```

### RbacSeeder — add manage_accounts
```php
$manageAccounts = Permission::firstOrCreate(['name' => 'manage_accounts', 'guard_name' => 'web']);
$admin->syncPermissions([$manageMembers, $manageConfigurations, $manageAccounts]);
```

### Routes to add in api.php
```php
Route::middleware(['auth:sanctum', 'permission:manage_accounts'])->group(function () {
    Route::get('accounts/{account}/statement', [AccountController::class, 'statement']);
    Route::post('accounts/{account}/approve', [AccountController::class, 'approve']);
    Route::post('accounts/{account}/reject',  [AccountController::class, 'reject']);
    Route::apiResource('accounts', AccountController::class)->except(['destroy']);
    Route::delete('accounts/{account}', [AccountController::class, 'destroy']); // soft-delete/close
});
```

### Commit message
`feat(accounts): AccountService, DepositAccountController, DepositAccountResource, manage_accounts RBAC`

---

## Task 2 — Backend: AccountTransactionController

### Files to create
- `backend/app/Http/Controllers/Api/V1/AccountTransactionController.php`
- `backend/app/Http/Requests/Api/V1/Account/StoreTransactionRequest.php`
- `backend/app/Http/Resources/V1/AccountTransactionResource.php`
- Add service method `AccountService::postTransaction()`

### AccountService::postTransaction()
This is the critical method. It MUST use a DB transaction and bcmath.

```php
public function postTransaction(
    DepositAccount $account,
    array $data,
    $user
): AccountTransaction {
    return DB::transaction(function () use ($account, $data, $user) {
        // Lock the account row for update
        $account = DepositAccount::lockForUpdate()->findOrFail($account->id);

        abort_if(!$account->is_active, 422, 'Account is not active.');
        abort_if($account->is_locked, 422, 'Account is locked.');

        $amount = $data['amount']; // string from bcmath, already validated as positive
        $type   = $data['transaction_type']; // deposit | withdrawal

        if ($type === 'withdrawal') {
            $newBalance = bcsub($account->balance, $amount, 2);
            abort_if(bccomp($newBalance, '0', 2) < 0, 422, 'Insufficient balance.');
        } else {
            // deposit / interest_credit / fee (fee can be negative charge, but store as positive amount)
            $newBalance = bcadd($account->balance, $amount, 2);
        }

        $tx = AccountTransaction::create([
            'org_id'             => $account->org_id,
            'deposit_account_id' => $account->id,
            'period_id'          => $this->currentPeriodId($account->org_id),
            'transaction_type'   => $type,
            'amount'             => $amount,
            'balance_after'      => $newBalance,
            'reference_number'   => $data['reference_number'] ?? null,
            'transaction_date'   => $data['transaction_date'],
            'value_date'         => $data['value_date'] ?? $data['transaction_date'],
            'narration'          => $data['narration'] ?? null,
            'created_by'         => $user->id,
            'approval_status'    => 'approved',
            'approved_by'        => $user->id,
            'approved_at'        => now(),
        ]);

        $account->update([
            'balance'            => $newBalance,
            'last_activity_date' => $data['transaction_date'],
        ]);

        return $tx;
    });
}

private function currentPeriodId(string $orgId): ?string
{
    return \App\Models\Period::where('org_id', $orgId)
        ->where('status', 'open')
        ->orderByDesc('start_date')
        ->value('id');
}
```

For **transfers** (transfer_in / transfer_out), create a `postTransfer()` method that
calls `postTransaction()` twice — once with `transfer_out` on source, once with
`transfer_in` on destination — and sets each `linked_transaction_id` to the other's id.
Both must be inside one DB::transaction().

```php
public function postTransfer(
    DepositAccount $from,
    DepositAccount $to,
    array $data,
    $user
): array {
    return DB::transaction(function () use ($from, $to, $data, $user) {
        $outData = array_merge($data, ['transaction_type' => 'transfer_out']);
        $inData  = array_merge($data, ['transaction_type' => 'transfer_in']);

        $out = $this->postTransaction($from, $outData, $user);
        $in  = $this->postTransaction($to,   $inData,  $user);

        $out->update(['linked_transaction_id' => $in->id]);
        $in->update(['linked_transaction_id'  => $out->id]);

        return [$out, $in];
    });
}
```

### AccountTransactionController
- `index` — paginated, filter by deposit_account_id, transaction_type, date range
  (from_date / to_date), search reference_number or narration
- `show` — single transaction; org scope via account
- `store` — validates, calls AccountService::postTransaction() or postTransfer()
  (if type is 'transfer_out' validate `to_account_id` additionally)
- `destroy` — **not implemented** (transactions are immutable; no delete endpoint)

### StoreTransactionRequest validation
```
deposit_account_id: required|uuid|exists:deposit_accounts,id
transaction_type: required|in:deposit,withdrawal,transfer_out
to_account_id: required_if:transaction_type,transfer_out|uuid|exists:deposit_accounts,id
amount: required|numeric|min:0.01|max:9999999999.99
reference_number: nullable|string|max:50
transaction_date: required|date
value_date: nullable|date
narration: nullable|string|max:255
```

### AccountTransactionResource
```
id, deposit_account_id, transaction_type, amount, balance_after,
reference_number, transaction_date, value_date, narration,
linked_transaction_id, approval_status, approved_at,
created_by, created_at
```

### Routes to add (under same manage_accounts middleware group)
```php
Route::apiResource('account-transactions', AccountTransactionController::class)->only(['index','show','store']);
```

### Commit message
`feat(accounts): AccountTransactionController, postTransaction/postTransfer in AccountService`

---

## Task 3 — Frontend: API hooks

### File to create
`frontend/src/lib/api/accounts.ts`

Model the file exactly after `frontend/src/lib/api/members.ts` — same pattern.

### Types
```ts
export interface DepositAccount {
  id: string;
  account_number: string;
  balance: string;
  interest_rate: string;
  opening_date: string;
  last_activity_date: string | null;
  is_active: boolean;
  is_locked: boolean;
  locked_until_date: string | null;
  approval_status: 'draft' | 'pending' | 'approved' | 'rejected';
  approved_by: string | null;
  approved_at: string | null;
  org_id: string;
  member: { id: string; full_name: string; member_number: string } | null;
  product: { id: string; name: string } | null;
  created_at: string;
}

export interface AccountTransaction {
  id: string;
  deposit_account_id: string;
  transaction_type: 'deposit' | 'withdrawal' | 'interest_credit' | 'fee' |
    'transfer_in' | 'transfer_out' | 'loan_disbursement' | 'loan_repayment' | 'contribution';
  amount: string;
  balance_after: string;
  reference_number: string | null;
  transaction_date: string;
  value_date: string;
  narration: string | null;
  linked_transaction_id: string | null;
  approval_status: string;
  approved_at: string | null;
  created_by: string;
  created_at: string;
}

export interface AccountsParams {
  search?: string;
  status?: string;
  member_id?: string;
  per_page?: number;
  page?: number;
}

export interface TransactionsParams {
  deposit_account_id?: string;
  transaction_type?: string;
  from_date?: string;
  to_date?: string;
  per_page?: number;
  page?: number;
}

export type CreateDepositAccountPayload = {
  member_id: string;
  product_id: string;
  opening_date: string;
  interest_rate?: string;
};

export type UpdateDepositAccountPayload = {
  interest_rate?: string;
  is_locked?: boolean;
  locked_until_date?: string | null;
};

export type CreateTransactionPayload = {
  deposit_account_id: string;
  transaction_type: 'deposit' | 'withdrawal' | 'transfer_out';
  to_account_id?: string;
  amount: string;
  reference_number?: string;
  transaction_date: string;
  value_date?: string;
  narration?: string;
};
```

### Query keys & hooks
```ts
export const ACCOUNTS_KEY = ['accounts'] as const;
export const TRANSACTIONS_KEY = ['account-transactions'] as const;

// Queries
useAccounts(params?) → paginated DepositAccount[]
useAccount(id) → DepositAccount
useAccountTransactions(params?) → paginated AccountTransaction[]

// Mutations
useCreateAccount() → POST /accounts
useUpdateAccount(id) → PUT /accounts/:id
useApproveAccount() → POST /accounts/:id/approve
useRejectAccount() → POST /accounts/:id/reject
useCloseAccount() → DELETE /accounts/:id
useCreateTransaction() → POST /account-transactions
```

### Commit message
`feat(accounts): React Query hooks for deposit accounts and transactions`

---

## Task 4 — Frontend: Components

### Directory: `frontend/src/components/Accounts/`

### AccountStatusBadge.tsx
Similar to the ApprovalStatusBadge in Members. Map status → badge variant:
- `draft` → secondary
- `pending` → warning (yellow/amber)
- `approved` → success (green)
- `rejected` → destructive (red)

Also export a `TransactionTypeBadge` that maps transaction_type to a badge color:
- `deposit`, `transfer_in`, `loan_repayment`, `contribution` → green
- `withdrawal`, `transfer_out`, `loan_disbursement`, `fee` → red  
- `interest_credit` → blue

Use shadcn `Badge` component (variant prop).

### AccountsTable.tsx
`'use client'` component using DataTable.
Columns:
- Account Number
- Member (member.full_name + member_number)
- Product (product.name)
- Balance (right-aligned, formatted as currency with 2 decimals)
- Status (AccountStatusBadge)
- Active (Yes/No)
- Opening Date
- Actions: View (link to /admin/accounts/[id])

Props: `data: DepositAccount[], isLoading: boolean`
Include search (by account number) and status filter dropdown (all/pending/approved/rejected).
Use debounced search (300ms) via useState + useEffect.
Accept `onSearchChange`, `onStatusChange`, `searchValue`, `statusValue` props.

### TransactionsTable.tsx
`'use client'` component using DataTable.
Columns:
- Date (transaction_date)
- Reference
- Type (TransactionTypeBadge)
- Narration
- Amount (colored: green for credits, red for debits)
- Balance After

Credits = deposit, transfer_in, interest_credit, contribution
Debits = withdrawal, transfer_out, fee, loan_disbursement

Props: `data: AccountTransaction[], isLoading: boolean`

### TransactionForm.tsx
`'use client'` form for posting deposit/withdrawal/transfer.
Uses react-hook-form.
Fields:
- transaction_type: SelectInput (deposit | withdrawal | transfer_out)
- deposit_account_id: hidden (passed as prop `accountId`)
- to_account_id: shown only when type === 'transfer_out'; text input for account number
  (the backend will look up by account_number — add a GET /accounts?search={number} lookup)
  Actually: just pass to_account_id as UUID. The form will search accounts via the
  `useAccounts` hook and show a react-select dropdown of accounts filtered by account_number.
  Exclude the current account from the list.
- amount: NumberInput
- transaction_date: DateInput (default today)
- reference_number: text input (optional)
- narration: textarea (optional)

On submit: calls `useCreateTransaction()` mutation.
Prop: `accountId: string`, `onSuccess: () => void`

### Commit message
`feat(accounts): AccountStatusBadge, TransactionTypeBadge, AccountsTable, TransactionsTable, TransactionForm`

---

## Task 5 — Frontend: Pages

### Pages to create

#### `/admin/accounts/page.tsx`
`'use client'` page.
- Uses `useAccounts(params)` with search + status filter state.
- Renders `<AccountsTable>` with controlled search/filter.
- Header: "Deposit Accounts" + "Open Account" button (→ /admin/accounts/create).

#### `/admin/accounts/create/page.tsx`
`'use client'` page.
- Form fields: member_id (react-select searching useMembers), product_id (react-select from useSavingProducts — you'll need to add that hook from configurations or use a direct API call), opening_date (DateInput), interest_rate (NumberInput, optional).
- For `useSavingProducts`: import from `@/lib/api/configurations` — this hook already exists since Phase 4.
- For `useMembers`: import from `@/lib/api/members`.
- On submit: calls `useCreateAccount()` and redirects to `/admin/accounts/[id]`.

#### `/admin/accounts/[id]/page.tsx`
`'use client'` page — the account detail / statement page.
Layout:
- Top section: account info card (member name, account number, balance, product, status badges, opening date).
- Action buttons: Approve, Reject (if pending), Close Account (if approved), Edit (always).
- Reject shows a modal with reason textarea.
- Bottom section: `<TransactionsTable>` with `useAccountTransactions({ deposit_account_id: id })`.
- "+ Post Transaction" button that opens a dialog/modal containing `<TransactionForm accountId={id}>`.
  Use shadcn Dialog for the modal.

#### `/admin/accounts/[id]/edit/page.tsx`
`'use client'` page.
- Loads account via `useAccount(id)`.
- Form: interest_rate (NumberInput), is_locked (checkbox), locked_until_date (DateInput, shown if locked).
- Submit: `useUpdateAccount(id)` → toast success → router.push back to detail page.

### Sidebar update
In `frontend/src/components/Layouts/sidebar/data/index.ts`, update the "Transactions" nav item:
```ts
{
  title: "Transactions",
  icon: Icons.PieChart,
  items: [
    { title: "Deposit Accounts", url: "/admin/accounts" },
    { title: "SACCO Core Accounts", url: "/admin/transactions/core-accounts" },
    { title: "Contribution Accounts", url: "/admin/transactions/contributions" },
    { title: "Other Accounts", url: "/admin/transactions/other" },
  ],
},
```
Remove the old "Transaction Accounts" item and replace with "Deposit Accounts → /admin/accounts".

### Commit message
`feat(accounts): deposit account pages (list, create, detail, edit) and sidebar nav`

---

## Task 6 — CLAUDE.md update

Update `/Users/wainaina/Development/Sacco/SLAMS Sacco/CLAUDE.md` — change:
```
- [ ] Phase 6: SACCO accounts & transactions
```
to:
```
- [x] Phase 6: SACCO accounts & transactions — AccountService, DepositAccountController, AccountTransactionController, full frontend CRUD + transaction posting (2026-06-12)
```

Commit: `docs: mark Phase 6 complete in CLAUDE.md`

# Jwaneng SACCOS Requirements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement four targeted changes — medical exit type, saving product flags (mandatory + loan-withdrawal block), and eligible employers configuration module with soft warning on member form.

**Architecture:** Backend changes follow the existing PSR-12 Laravel 12 pattern (thin controllers, Form Requests, Resources, Services). Frontend changes follow the existing React Query + TypeScript pattern in `configurations.ts` and matching page components. All changes are additive with no breaking modifications.

**Tech Stack:** Laravel 12, PostgreSQL, PHP 8.3, Next.js 16, TypeScript, React Query, Tailwind CSS, shadcn/ui.

---

## Task 1: Medical exit type — DB migration

**Files:**
- Create: `backend/database/migrations/2026_06_14_000001_add_medical_to_member_exits_exit_type.php`

- [ ] **Step 1: Create the migration**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE member_exits DROP CONSTRAINT IF EXISTS member_exits_exit_type_check");
        DB::statement("ALTER TABLE member_exits ADD CONSTRAINT member_exits_exit_type_check CHECK (exit_type IN ('voluntary', 'death', 'expulsion', 'transfer', 'medical'))");
    }

    public function down(): void
    {
        DB::statement("UPDATE member_exits SET exit_type = 'voluntary' WHERE exit_type = 'medical'");
        DB::statement("ALTER TABLE member_exits DROP CONSTRAINT IF EXISTS member_exits_exit_type_check");
        DB::statement("ALTER TABLE member_exits ADD CONSTRAINT member_exits_exit_type_check CHECK (exit_type IN ('voluntary', 'death', 'expulsion', 'transfer'))");
    }
};
```

- [ ] **Step 2: Run the migration**

```bash
cd backend && php artisan migrate
```

Expected: `Migrating: 2026_06_14_000001_add_medical_to_member_exits_exit_type` then `Migrated`.

---

## Task 2: Medical exit type — validation and frontend

**Files:**
- Modify: `backend/app/Http/Requests/Api/V1/MemberExit/StoreMemberExitRequest.php:15`
- Modify: `frontend/src/lib/api/member-exit.ts:5`
- Modify: `frontend/src/app/admin/member-exit/page.tsx:37-41`

- [ ] **Step 1: Update the Laravel validation rule**

In `backend/app/Http/Requests/Api/V1/MemberExit/StoreMemberExitRequest.php`, change line 15:

```php
'exit_type' => ['required', 'in:voluntary,death,expulsion,transfer,medical'],
```

- [ ] **Step 2: Update the TypeScript ExitType union**

In `frontend/src/lib/api/member-exit.ts`, change line 5:

```typescript
export type ExitType = "voluntary" | "death" | "expulsion" | "transfer" | "medical";
```

- [ ] **Step 3: Add the option to the dropdown**

In `frontend/src/app/admin/member-exit/page.tsx`, update `EXIT_TYPE_OPTIONS` (lines 37–41):

```typescript
const EXIT_TYPE_OPTIONS = [
  { value: "voluntary", label: "Voluntary" },
  { value: "death", label: "Death" },
  { value: "expulsion", label: "Expulsion" },
  { value: "transfer", label: "Transfer" },
  { value: "medical", label: "Medical Boarding" },
];
```

- [ ] **Step 4: Commit**

```bash
cd backend && git add database/migrations/2026_06_14_000001_add_medical_to_member_exits_exit_type.php app/Http/Requests/Api/V1/MemberExit/StoreMemberExitRequest.php
cd ../frontend && git add src/lib/api/member-exit.ts src/app/admin/member-exit/page.tsx
git commit -m "feat: add medical boarding exit type"
```

---

## Task 3: Saving product flags — migration and backend

**Files:**
- Create: `backend/database/migrations/2026_06_14_000002_add_flags_to_saving_products.php`
- Modify: `backend/app/Models/SavingProduct.php`
- Modify: `backend/app/Http/Resources/V1/Configurations/SavingProductResource.php`
- Modify: `backend/app/Http/Requests/Api/V1/Configurations/StoreSavingProductRequest.php`
- Modify: `backend/app/Http/Requests/Api/V1/Configurations/UpdateSavingProductRequest.php`

- [ ] **Step 1: Create the migration**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('saving_products', function (Blueprint $table) {
            $table->boolean('is_mandatory')->default(false)->after('is_active');
            $table->boolean('block_withdrawal_on_active_loan')->default(false)->after('is_mandatory');
        });
    }

    public function down(): void
    {
        Schema::table('saving_products', function (Blueprint $table) {
            $table->dropColumn(['is_mandatory', 'block_withdrawal_on_active_loan']);
        });
    }
};
```

- [ ] **Step 2: Run the migration**

```bash
cd backend && php artisan migrate
```

Expected: `Migrated: 2026_06_14_000002_add_flags_to_saving_products`.

- [ ] **Step 3: Update the SavingProduct model**

Replace `$fillable` and `casts()` in `backend/app/Models/SavingProduct.php`:

```php
protected $fillable = [
    'org_id', 'name', 'description', 'interest_rate',
    'min_opening_balance', 'min_balance', 'max_balance',
    'min_deposit', 'max_deposit', 'min_withdrawal', 'max_withdrawal',
    'lock_in_months', 'withdrawal_frequency', 'is_active',
    'is_mandatory', 'block_withdrawal_on_active_loan',
];

protected function casts(): array
{
    return [
        'interest_rate'                   => 'decimal:4',
        'min_opening_balance'             => 'decimal:2',
        'min_balance'                     => 'decimal:2',
        'max_balance'                     => 'decimal:2',
        'min_deposit'                     => 'decimal:2',
        'max_deposit'                     => 'decimal:2',
        'min_withdrawal'                  => 'decimal:2',
        'max_withdrawal'                  => 'decimal:2',
        'lock_in_months'                  => 'integer',
        'is_active'                       => 'boolean',
        'is_mandatory'                    => 'boolean',
        'block_withdrawal_on_active_loan' => 'boolean',
    ];
}
```

- [ ] **Step 4: Update SavingProductResource**

Add the two new fields to `toArray()` in `backend/app/Http/Resources/V1/Configurations/SavingProductResource.php`, after `'is_active'`:

```php
'is_mandatory'                    => $this->is_mandatory,
'block_withdrawal_on_active_loan' => $this->block_withdrawal_on_active_loan,
```

Full `toArray()` after the change:

```php
public function toArray(Request $request): array
{
    return [
        'id'                              => $this->id,
        'org_id'                          => $this->org_id,
        'name'                            => $this->name,
        'description'                     => $this->description,
        'interest_rate'                   => $this->interest_rate,
        'min_opening_balance'             => $this->min_opening_balance,
        'min_balance'                     => $this->min_balance,
        'max_balance'                     => $this->max_balance,
        'min_deposit'                     => $this->min_deposit,
        'max_deposit'                     => $this->max_deposit,
        'min_withdrawal'                  => $this->min_withdrawal,
        'max_withdrawal'                  => $this->max_withdrawal,
        'lock_in_months'                  => $this->lock_in_months,
        'withdrawal_frequency'            => $this->withdrawal_frequency,
        'is_active'                       => $this->is_active,
        'is_mandatory'                    => $this->is_mandatory,
        'block_withdrawal_on_active_loan' => $this->block_withdrawal_on_active_loan,
        'created_at'                      => $this->created_at?->toIso8601String(),
        'updated_at'                      => $this->updated_at?->toIso8601String(),
    ];
}
```

- [ ] **Step 5: Update StoreSavingProductRequest**

Add two rules to `backend/app/Http/Requests/Api/V1/Configurations/StoreSavingProductRequest.php`, after the `'is_active'` rule:

```php
'is_mandatory'                    => ['sometimes', 'boolean'],
'block_withdrawal_on_active_loan' => ['sometimes', 'boolean'],
```

- [ ] **Step 6: Update UpdateSavingProductRequest**

Add the same two rules to `backend/app/Http/Requests/Api/V1/Configurations/UpdateSavingProductRequest.php`, after the `'is_active'` rule:

```php
'is_mandatory'                    => ['sometimes', 'boolean'],
'block_withdrawal_on_active_loan' => ['sometimes', 'boolean'],
```

- [ ] **Step 7: Commit**

```bash
cd backend && git add database/migrations/2026_06_14_000002_add_flags_to_saving_products.php app/Models/SavingProduct.php app/Http/Resources/V1/Configurations/SavingProductResource.php app/Http/Requests/Api/V1/Configurations/StoreSavingProductRequest.php app/Http/Requests/Api/V1/Configurations/UpdateSavingProductRequest.php
git commit -m "feat: add is_mandatory and block_withdrawal_on_active_loan to saving products"
```

---

## Task 4: Withdrawal loan block — AccountService

**Files:**
- Modify: `backend/app/Services/AccountService.php:83-86`

- [ ] **Step 1: Add the loan block check in `postTransaction`**

In `backend/app/Services/AccountService.php`, inside the `DB::transaction` closure in `postTransaction()`, add the block after the `$type` assignment (after line 86 in the original file). The full updated block from the two guards through to `$debitTypes`:

```php
abort_if(!$account->is_active, 422, 'Account is not active.');
abort_if($account->is_locked, 422, 'Account is locked.');

$amount = (string) $data['amount'];
$type   = $data['transaction_type'];

if (in_array($type, ['withdrawal', 'transfer_out'], true)) {
    $product = $account->product ?? $account->load('product')->product;
    if ($product && $product->block_withdrawal_on_active_loan) {
        $hasActiveLoan = \App\Models\Loan::where('member_id', $account->member_id)
            ->whereIn('loan_status', ['disbursed', 'active'])
            ->exists();
        abort_if($hasActiveLoan, 422, 'Withdrawals are not permitted while the member has an active loan.');
    }
}

$debitTypes = ['withdrawal', 'transfer_out', 'fee', 'loan_disbursement'];
```

- [ ] **Step 2: Commit**

```bash
cd backend && git add app/Services/AccountService.php
git commit -m "feat: block savings withdrawal when member has active loan"
```

---

## Task 5: Saving product flags — frontend

**Files:**
- Modify: `frontend/src/lib/api/configurations.ts:188-210`
- Modify: `frontend/src/app/(dashboard)/admin/configurations/saving-products/page.tsx`

- [ ] **Step 1: Update the SavingProduct interface in `configurations.ts`**

In `frontend/src/lib/api/configurations.ts`, add two fields to `SavingProduct` (after `is_active` on line 203):

```typescript
export interface SavingProduct {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  interest_rate: string;
  min_opening_balance: string;
  min_balance: string;
  max_balance: string | null;
  min_deposit: string;
  max_deposit: string | null;
  min_withdrawal: string;
  max_withdrawal: string | null;
  lock_in_months: number;
  withdrawal_frequency: "any" | "daily" | "weekly" | "monthly";
  is_active: boolean;
  is_mandatory: boolean;
  block_withdrawal_on_active_loan: boolean;
  created_at: string;
  updated_at: string;
}
```

`CreateSavingProductPayload` is `Omit<SavingProduct, "id" | "org_id" | "created_at" | "updated_at">` — no change needed; the new fields are automatically included.

- [ ] **Step 2: Update `FormState` in the saving products page**

In `frontend/src/app/(dashboard)/admin/configurations/saving-products/page.tsx`, add the two fields to `FormState` and `INITIAL_FORM`:

```typescript
type FormState = {
  name: string;
  description: string;
  interest_rate: string;
  min_opening_balance: string;
  min_balance: string;
  max_balance: string;
  min_deposit: string;
  max_deposit: string;
  min_withdrawal: string;
  max_withdrawal: string;
  lock_in_months: string;
  withdrawal_frequency: "any" | "daily" | "weekly" | "monthly";
  is_active: boolean;
  is_mandatory: boolean;
  block_withdrawal_on_active_loan: boolean;
};

const INITIAL_FORM: FormState = {
  name: "",
  description: "",
  interest_rate: "0",
  min_opening_balance: "0",
  min_balance: "0",
  max_balance: "",
  min_deposit: "0",
  max_deposit: "",
  min_withdrawal: "0",
  max_withdrawal: "",
  lock_in_months: "0",
  withdrawal_frequency: "any",
  is_active: true,
  is_mandatory: false,
  block_withdrawal_on_active_loan: false,
};
```

- [ ] **Step 3: Add the two checkboxes to `SavingProductForm`**

In the `SavingProductForm` component in the same file, replace the existing "Is Active" checkbox block (the `sm:col-span-2` div at the bottom of the grid) with:

```tsx
{/* Is Active */}
<div className="sm:col-span-2">
  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
    <input
      type="checkbox"
      checked={form.is_active}
      onChange={(e) => onChange({ is_active: e.target.checked })}
      className="h-4 w-4 rounded border-gray-300 text-primary"
    />
    Is Active
  </label>
</div>

{/* Is Mandatory */}
<div className="sm:col-span-2">
  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
    <input
      type="checkbox"
      checked={form.is_mandatory}
      onChange={(e) => onChange({ is_mandatory: e.target.checked })}
      className="h-4 w-4 rounded border-gray-300 text-primary"
    />
    Mandatory (all members must hold this account)
  </label>
</div>

{/* Block withdrawal on active loan */}
<div className="sm:col-span-2">
  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
    <input
      type="checkbox"
      checked={form.block_withdrawal_on_active_loan}
      onChange={(e) => onChange({ block_withdrawal_on_active_loan: e.target.checked })}
      className="h-4 w-4 rounded border-gray-300 text-primary"
    />
    Block withdrawals when member has an active loan
  </label>
</div>
```

- [ ] **Step 4: Update `handleEdit` to map the new fields**

In `handleEdit`, add after `is_active: product.is_active`:

```typescript
is_mandatory: product.is_mandatory,
block_withdrawal_on_active_loan: product.block_withdrawal_on_active_loan,
```

- [ ] **Step 5: Update `handleSubmit` payload**

In `handleSubmit`, the `payload` object is built field-by-field. Add the two new fields after `is_active: form.is_active`:

```typescript
is_mandatory: form.is_mandatory,
block_withdrawal_on_active_loan: form.block_withdrawal_on_active_loan,
```

- [ ] **Step 6: Add a "Mandatory" column to the table**

In the table header, add after the "Status" `<th>`:

```tsx
<th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">
  Mandatory
</th>
```

In the table body row, add after the `<ActiveBadge>` cell:

```tsx
<td className="whitespace-nowrap px-3 py-4 text-sm">
  {product.is_mandatory ? (
    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
      Mandatory
    </span>
  ) : (
    <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/20">
      Optional
    </span>
  )}
</td>
```

Also update the `colSpan` on the empty-state row from `5` to `6`.

- [ ] **Step 7: Commit**

```bash
cd frontend && git add src/lib/api/configurations.ts src/app/\(dashboard\)/admin/configurations/saving-products/page.tsx
git commit -m "feat: add mandatory and loan-withdrawal-block flags to saving products UI"
```

---

## Task 6: Eligible Employers — backend

**Files:**
- Create: `backend/database/migrations/2026_06_14_000003_create_eligible_employers_table.php`
- Create: `backend/app/Models/EligibleEmployer.php`
- Create: `backend/app/Http/Resources/V1/Configurations/EligibleEmployerResource.php`
- Create: `backend/app/Http/Controllers/Api/V1/Configurations/EligibleEmployerController.php`
- Modify: `backend/routes/api.php:95`

- [ ] **Step 1: Create the migration**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('eligible_employers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->string('name', 150);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('org_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('eligible_employers');
    }
};
```

- [ ] **Step 2: Run the migration**

```bash
cd backend && php artisan migrate
```

Expected: `Migrated: 2026_06_14_000003_create_eligible_employers_table`.

- [ ] **Step 3: Create the EligibleEmployer model**

Create `backend/app/Models/EligibleEmployer.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class EligibleEmployer extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = ['org_id', 'name', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function org(): BelongsTo
    {
        return $this->belongsTo(Org::class);
    }
}
```

- [ ] **Step 4: Create the resource**

Create `backend/app/Http/Resources/V1/Configurations/EligibleEmployerResource.php`:

```php
<?php

namespace App\Http\Resources\V1\Configurations;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EligibleEmployerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'name'       => $this->name,
            'is_active'  => $this->is_active,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
```

- [ ] **Step 5: Create the controller**

Create `backend/app/Http/Controllers/Api/V1/Configurations/EligibleEmployerController.php`:

```php
<?php

namespace App\Http\Controllers\Api\V1\Configurations;

use App\Http\Resources\V1\Configurations\EligibleEmployerResource;
use App\Models\EligibleEmployer;

class EligibleEmployerController extends BaseCrudController
{
    protected function modelClass(): string
    {
        return EligibleEmployer::class;
    }

    protected function resourceClass(): string
    {
        return EligibleEmployerResource::class;
    }

    protected function storeRules(string $orgId): array
    {
        return [
            'name'      => ['required', 'string', 'max:150'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    protected function updateRules(string $id, string $orgId): array
    {
        return [
            'name'      => ['required', 'string', 'max:150'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
```

- [ ] **Step 6: Register the route**

In `backend/routes/api.php`, add after the `'departments'` line (line 95):

```php
Route::apiResource('eligible-employers', \App\Http\Controllers\Api\V1\Configurations\EligibleEmployerController::class);
```

- [ ] **Step 7: Commit**

```bash
cd backend && git add database/migrations/2026_06_14_000003_create_eligible_employers_table.php app/Models/EligibleEmployer.php app/Http/Resources/V1/Configurations/EligibleEmployerResource.php app/Http/Controllers/Api/V1/Configurations/EligibleEmployerController.php routes/api.php
git commit -m "feat: eligible employers configuration — backend"
```

---

## Task 7: Eligible Employers — frontend

**Files:**
- Modify: `frontend/src/lib/api/configurations.ts`
- Create: `frontend/src/app/(dashboard)/admin/configurations/eligible-employers/page.tsx`
- Modify: `frontend/src/components/Layouts/sidebar/data/index.ts`
- Modify: `frontend/src/components/Members/MemberForm.tsx`

- [ ] **Step 1: Add types and query key to `configurations.ts`**

In `frontend/src/lib/api/configurations.ts`:

After line 226 (`export const SAVING_PRODUCTS_KEY = ...`), add:

```typescript
export const ELIGIBLE_EMPLOYERS_KEY = [...CONFIGURATIONS_KEY, "eligible-employers"] as const;
```

After `export interface Department { ... }` block (around line 128), add the new interface and payload types:

```typescript
export interface EligibleEmployer {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}
export type CreateEligibleEmployerPayload = Pick<EligibleEmployer, "name" | "is_active">;
export type UpdateEligibleEmployerPayload = Partial<CreateEligibleEmployerPayload>;
```

- [ ] **Step 2: Add hooks to `configurations.ts`**

At the end of the file (after the `useUploadOrgLogo` block), add:

```typescript
// ── Eligible Employers ─────────────────────────────────────────────────

export function useEligibleEmployers() {
  return useQuery<EligibleEmployer[]>({
    queryKey: ELIGIBLE_EMPLOYERS_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<EligibleEmployer[]>>(
        "/configurations/eligible-employers",
      );
      return data.data;
    },
    staleTime: 300_000,
  });
}

export function useCreateEligibleEmployer() {
  const qc = useQueryClient();
  return useMutation<EligibleEmployer, Error, CreateEligibleEmployerPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<EligibleEmployer>>(
        "/configurations/eligible-employers",
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ELIGIBLE_EMPLOYERS_KEY });
    },
  });
}

export function useUpdateEligibleEmployer(id: string) {
  const qc = useQueryClient();
  return useMutation<EligibleEmployer, Error, UpdateEligibleEmployerPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.put<ApiEnvelope<EligibleEmployer>>(
        `/configurations/eligible-employers/${id}`,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ELIGIBLE_EMPLOYERS_KEY });
    },
  });
}

export function useDeleteEligibleEmployer() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/configurations/eligible-employers/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ELIGIBLE_EMPLOYERS_KEY });
    },
  });
}
```

- [ ] **Step 3: Create the eligible employers configuration page**

Create `frontend/src/app/(dashboard)/admin/configurations/eligible-employers/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  EligibleEmployer,
  CreateEligibleEmployerPayload,
  useEligibleEmployers,
  useCreateEligibleEmployer,
  useUpdateEligibleEmployer,
  useDeleteEligibleEmployer,
} from "@/lib/api/configurations";

type FormData = {
  name: string;
  is_active: boolean;
};

const defaultForm: FormData = { name: "", is_active: true };

function ActiveBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
      Active
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
      Inactive
    </span>
  );
}

export default function EligibleEmployersPage() {
  const { data: items, isLoading } = useEligibleEmployers();
  const createMutation = useCreateEligibleEmployer();
  const deleteMutation = useDeleteEligibleEmployer();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultForm);

  const updateMutation = useUpdateEligibleEmployer(editingId ?? "");

  const resetForm = () => {
    setFormData(defaultForm);
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (item: EligibleEmployer) => {
    setFormData({ name: item.name, is_active: item.is_active });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateEligibleEmployerPayload = {
      name: formData.name,
      is_active: formData.is_active,
    };

    if (editingId) {
      updateMutation.mutate(payload, {
        onSuccess: () => { toast.success("Employer updated."); resetForm(); },
        onError: (err) => toast.error(err.message ?? "Update failed."),
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => { toast.success("Employer added."); resetForm(); },
        onError: (err) => toast.error(err.message ?? "Create failed."),
      });
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Archive this eligible employer?")) return;
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Employer archived."),
      onError: (err) => toast.error(err.message ?? "Archive failed."),
    });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Eligible Employers</h1>
          <p className="mt-1 text-sm text-gray-500">
            Employees of these organisations are eligible for SACCO membership.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none"
        >
          Add Employer
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            {editingId ? "Edit Employer" : "New Eligible Employer"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Organisation Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                maxLength={150}
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="is_active"
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Active
              </label>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {isPending ? "Saving..." : editingId ? "Update" : "Create"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-hidden bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Organisation Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Active
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {isLoading && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-500">
                  Loading...
                </td>
              </tr>
            )}
            {!isLoading && (!items || items.length === 0) && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-500">
                  No eligible employers configured yet.
                </td>
              </tr>
            )}
            {items?.map((item) => (
              <tr key={item.id}>
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                  {item.name}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  <ActiveBadge active={item.is_active} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                  <button
                    onClick={() => handleEdit(item)}
                    className="mr-3 text-indigo-600 hover:text-indigo-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Archive
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Add link to sidebar**

In `frontend/src/components/Layouts/sidebar/data/index.ts`, add after the `Departments` entry:

```typescript
{ title: "Eligible Employers", url: "/admin/configurations/eligible-employers" },
```

- [ ] **Step 5: Add soft warning to MemberForm**

In `frontend/src/components/Members/MemberForm.tsx`:

Add the import at the top (after the existing `members` import block, line 16):

```typescript
import { useEligibleEmployers } from "@/lib/api/configurations";
```

Inside the component body, add the hook call and derived value near the top of the component function (after the existing state/hooks):

```typescript
const { data: eligibleEmployers } = useEligibleEmployers();

const employerNotOnList =
  !!form.employer_name &&
  !!eligibleEmployers &&
  eligibleEmployers.length > 0 &&
  !eligibleEmployers.some(
    (e) =>
      e.is_active &&
      e.name.toLowerCase() === form.employer_name.toLowerCase(),
  );
```

After the employer_name `<input>` (around line 409), add the warning:

```tsx
{employerNotOnList && (
  <p className="mt-1 text-xs text-amber-600">
    This employer is not on the approved eligible employers list. The member application may be rejected.
  </p>
)}
```

- [ ] **Step 6: Commit**

```bash
cd frontend && git add src/lib/api/configurations.ts src/app/\(dashboard\)/admin/configurations/eligible-employers/page.tsx src/components/Layouts/sidebar/data/index.ts src/components/Members/MemberForm.tsx
git commit -m "feat: eligible employers configuration — frontend with member form warning"
```

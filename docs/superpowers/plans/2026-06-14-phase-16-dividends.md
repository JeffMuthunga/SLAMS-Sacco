# Phase 16: Dividends Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow admins to run annual dividend calculations based on member share balances, approve them, and post bulk journal entries crediting each member's account.

**Architecture:** `DividendRun` (one per fiscal year, holds rate + status) → `DividendEntry` (one per member per run, holds share snapshot + amount). `DividendService` handles calculate/approve/post with bcmath precision. Depends on Phase 15 (member_shares table must exist).

**Tech Stack:** Laravel 12, PostgreSQL (uuid PKs, soft deletes, bcmath for money), Next.js 16, React Query, shadcn/ui, TanStack Table.

**Prerequisite:** Phase 15 (Shares) must be complete — dividend calculation reads `member_shares` where `status = 'approved'`.

---

## File Map

**Create (backend):**
- `backend/database/migrations/2026_06_14_210000_create_dividend_runs_table.php`
- `backend/database/migrations/2026_06_14_210001_create_dividend_entries_table.php`
- `backend/app/Models/DividendRun.php`
- `backend/app/Models/DividendEntry.php`
- `backend/app/Services/DividendService.php`
- `backend/app/Http/Controllers/Api/V1/DividendController.php`
- `backend/app/Http/Resources/V1/DividendRunResource.php`
- `backend/app/Http/Resources/V1/DividendEntryResource.php`

**Modify (backend):**
- `backend/routes/api.php` — add dividend routes
- `backend/database/seeders/RbacSeeder.php` — add `manage_dividends` permission
- `backend/app/Http/Controllers/Api/V1/MemberPortalController.php` — add `dividends()` method

**Create (frontend):**
- `frontend/src/lib/api/dividends.ts`
- `frontend/src/app/admin/dividends/page.tsx`
- `frontend/src/app/admin/dividends/[id]/page.tsx`
- `frontend/src/app/member/account-statement/dividends/page.tsx`

**Modify (frontend):**
- `frontend/src/components/Layouts/sidebar/data/index.ts` — add Dividends nav group

---

## Task 1: Database migrations

**Files:**
- Create: `backend/database/migrations/2026_06_14_210000_create_dividend_runs_table.php`
- Create: `backend/database/migrations/2026_06_14_210001_create_dividend_entries_table.php`

- [ ] Create `backend/database/migrations/2026_06_14_210000_create_dividend_runs_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dividend_runs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('fiscal_year_id')->constrained('fiscal_years')->cascadeOnDelete();
            $table->decimal('rate', 7, 4); // e.g. 0.1000 = 10%
            $table->string('status', 20)->default('draft'); // draft | approved | posted
            $table->decimal('total_dividend', 15, 2)->default('0.00');
            $table->foreignUuid('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('posted_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dividend_runs');
    }
};
```

- [ ] Create `backend/database/migrations/2026_06_14_210001_create_dividend_entries_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dividend_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('dividend_run_id')->constrained('dividend_runs')->cascadeOnDelete();
            $table->foreignUuid('member_id')->constrained('members')->cascadeOnDelete();
            $table->decimal('share_balance', 15, 2); // snapshot
            $table->decimal('dividend_amount', 15, 2);
            $table->foreignUuid('credited_account_id')->nullable()->constrained('deposit_accounts')->nullOnDelete();
            $table->timestamp('posted_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dividend_entries');
    }
};
```

- [ ] Run migrations:

```bash
cd backend && php artisan migrate
```

Expected: two new tables with no errors.

- [ ] Commit:

```bash
git add backend/database/migrations/2026_06_14_210000_create_dividend_runs_table.php \
        backend/database/migrations/2026_06_14_210001_create_dividend_entries_table.php
git commit -m "feat(dividends): add dividend_runs and dividend_entries migrations"
```

---

## Task 2: Models

**Files:**
- Create: `backend/app/Models/DividendRun.php`
- Create: `backend/app/Models/DividendEntry.php`

- [ ] Create `backend/app/Models/DividendRun.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class DividendRun extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'fiscal_year_id', 'rate', 'status', 'total_dividend',
        'approved_by', 'approved_at', 'posted_at', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'rate'           => 'decimal:4',
            'total_dividend' => 'decimal:2',
            'approved_at'    => 'datetime',
            'posted_at'      => 'datetime',
        ];
    }

    public function fiscalYear(): BelongsTo
    {
        return $this->belongsTo(FiscalYear::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function entries(): HasMany
    {
        return $this->hasMany(DividendEntry::class);
    }
}
```

- [ ] Create `backend/app/Models/DividendEntry.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DividendEntry extends Model
{
    use HasUuids;

    protected $fillable = [
        'org_id', 'dividend_run_id', 'member_id',
        'share_balance', 'dividend_amount', 'credited_account_id', 'posted_at',
    ];

    protected function casts(): array
    {
        return [
            'share_balance'   => 'decimal:2',
            'dividend_amount' => 'decimal:2',
            'posted_at'       => 'datetime',
        ];
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function dividendRun(): BelongsTo
    {
        return $this->belongsTo(DividendRun::class);
    }

    public function creditedAccount(): BelongsTo
    {
        return $this->belongsTo(DepositAccount::class, 'credited_account_id');
    }
}
```

- [ ] Commit:

```bash
git add backend/app/Models/DividendRun.php backend/app/Models/DividendEntry.php
git commit -m "feat(dividends): add DividendRun and DividendEntry models"
```

---

## Task 3: Resources

**Files:**
- Create: `backend/app/Http/Resources/V1/DividendRunResource.php`
- Create: `backend/app/Http/Resources/V1/DividendEntryResource.php`

- [ ] Create `backend/app/Http/Resources/V1/DividendRunResource.php`:

```php
<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DividendRunResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'fiscal_year_id' => $this->fiscal_year_id,
            'fiscal_year'    => $this->whenLoaded('fiscalYear', fn () => [
                'id'          => $this->fiscalYear->id,
                'fiscal_year' => $this->fiscalYear->fiscal_year,
            ]),
            'rate'           => $this->rate,
            'status'         => $this->status,
            'total_dividend' => $this->total_dividend,
            'notes'          => $this->notes,
            'approved_by'    => $this->approved_by,
            'approved_at'    => $this->approved_at?->toIso8601String(),
            'posted_at'      => $this->posted_at?->toIso8601String(),
            'entries_count'  => $this->whenLoaded('entries', fn () => $this->entries->count()),
            'entries'        => DividendEntryResource::collection($this->whenLoaded('entries')),
            'created_at'     => $this->created_at?->toIso8601String(),
        ];
    }
}
```

- [ ] Create `backend/app/Http/Resources/V1/DividendEntryResource.php`:

```php
<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DividendEntryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'dividend_run_id'  => $this->dividend_run_id,
            'member_id'        => $this->member_id,
            'member'           => $this->whenLoaded('member', fn () => [
                'id'            => $this->member->id,
                'full_name'     => $this->member->full_name,
                'member_number' => $this->member->member_number,
            ]),
            'share_balance'    => $this->share_balance,
            'dividend_amount'  => $this->dividend_amount,
            'credited_account_id' => $this->credited_account_id,
            'posted_at'        => $this->posted_at?->toIso8601String(),
            'created_at'       => $this->created_at?->toIso8601String(),
        ];
    }
}
```

- [ ] Commit:

```bash
git add backend/app/Http/Resources/V1/DividendRunResource.php \
        backend/app/Http/Resources/V1/DividendEntryResource.php
git commit -m "feat(dividends): add DividendRun and DividendEntry resources"
```

---

## Task 4: DividendService

**Files:**
- Create: `backend/app/Services/DividendService.php`

- [ ] Create `backend/app/Services/DividendService.php`:

```php
<?php

namespace App\Services;

use App\Models\DepositAccount;
use App\Models\DividendEntry;
use App\Models\DividendRun;
use App\Models\FiscalYear;
use App\Models\MemberShare;
use Illuminate\Support\Facades\DB;

class DividendService
{
    /**
     * Create a draft dividend run for a fiscal year.
     * Calculates each member's share balance (sum of approved shares) and
     * derives their dividend: balance × rate.
     */
    public function calculate(string $orgId, string $fiscalYearId, string $rate): DividendRun
    {
        FiscalYear::where('org_id', $orgId)->findOrFail($fiscalYearId);

        abort_if(
            DividendRun::where('org_id', $orgId)
                ->where('fiscal_year_id', $fiscalYearId)
                ->whereIn('status', ['approved', 'posted'])
                ->exists(),
            422,
            'An approved or posted dividend run already exists for this fiscal year.'
        );

        return DB::transaction(function () use ($orgId, $fiscalYearId, $rate) {
            // Delete any existing draft for this year before recalculating
            DividendRun::where('org_id', $orgId)
                ->where('fiscal_year_id', $fiscalYearId)
                ->where('status', 'draft')
                ->delete();

            $run = DividendRun::create([
                'org_id'         => $orgId,
                'fiscal_year_id' => $fiscalYearId,
                'rate'           => $rate,
                'status'         => 'draft',
                'total_dividend' => '0.00',
            ]);

            // Per member: sum of approved share total_amount
            $memberTotals = MemberShare::where('org_id', $orgId)
                ->where('status', 'approved')
                ->selectRaw('member_id, SUM(total_amount) as total_shares')
                ->groupBy('member_id')
                ->get();

            $grandTotal = '0.00';

            foreach ($memberTotals as $row) {
                $shareBalance  = (string) $row->total_shares;
                $dividendAmt   = bcmul($shareBalance, $rate, 2);

                // Find primary deposit account for this member
                $account = DepositAccount::where('org_id', $orgId)
                    ->where('member_id', $row->member_id)
                    ->where('is_active', true)
                    ->orderByDesc('created_at')
                    ->first();

                DividendEntry::create([
                    'org_id'              => $orgId,
                    'dividend_run_id'     => $run->id,
                    'member_id'           => $row->member_id,
                    'share_balance'       => $shareBalance,
                    'dividend_amount'     => $dividendAmt,
                    'credited_account_id' => $account?->id,
                ]);

                $grandTotal = bcadd($grandTotal, $dividendAmt, 2);
            }

            $run->update(['total_dividend' => $grandTotal]);

            return $run->load(['fiscalYear', 'entries.member']);
        });
    }

    public function approve(DividendRun $run, $user): DividendRun
    {
        abort_unless($run->status === 'draft', 422, 'Only draft runs can be approved.');

        $run->update([
            'status'      => 'approved',
            'approved_by' => $user->id,
            'approved_at' => now(),
        ]);

        return $run->fresh()->load(['fiscalYear', 'entries.member']);
    }

    /**
     * Post dividend: credit each member's deposit account and mark as posted.
     */
    public function post(DividendRun $run): DividendRun
    {
        abort_unless($run->status === 'approved', 422, 'Only approved runs can be posted.');

        DB::transaction(function () use ($run) {
            $entries = $run->entries()->with('creditedAccount')->get();

            foreach ($entries as $entry) {
                if (! $entry->credited_account_id) continue;

                $account = DepositAccount::lockForUpdate()->findOrFail($entry->credited_account_id);
                $newBal  = bcadd((string) $account->balance, (string) $entry->dividend_amount, 2);
                $account->update(['balance' => $newBal]);

                $entry->update(['posted_at' => now()]);
            }

            $run->update(['status' => 'posted', 'posted_at' => now()]);
        });

        return $run->fresh()->load(['fiscalYear', 'entries.member']);
    }
}
```

- [ ] Commit:

```bash
git add backend/app/Services/DividendService.php
git commit -m "feat(dividends): add DividendService with calculate, approve, post"
```

---

## Task 5: Controller + Routes + RBAC

**Files:**
- Create: `backend/app/Http/Controllers/Api/V1/DividendController.php`
- Modify: `backend/routes/api.php`
- Modify: `backend/database/seeders/RbacSeeder.php`

- [ ] Create `backend/app/Http/Controllers/Api/V1/DividendController.php`:

```php
<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\V1\DividendRunResource;
use App\Models\DividendRun;
use App\Services\DividendService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DividendController extends ApiController
{
    public function __construct(private DividendService $dividendService) {}

    public function index(Request $request): JsonResponse
    {
        $runs = DividendRun::where('org_id', $request->user()->org_id)
            ->with('fiscalYear')
            ->withCount('entries')
            ->latest()
            ->paginate($request->integer('per_page', 25));

        return $this->respond(
            DividendRunResource::collection($runs)->response()->getData(true)
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'fiscal_year_id' => ['required', 'uuid', 'exists:fiscal_years,id'],
            'rate'           => ['required', 'numeric', 'min:0.0001', 'max:1'],
            'notes'          => ['nullable', 'string', 'max:500'],
        ]);

        $run = $this->dividendService->calculate(
            $request->user()->org_id,
            $data['fiscal_year_id'],
            (string) $data['rate']
        );

        if (isset($data['notes'])) {
            $run->update(['notes' => $data['notes']]);
        }

        return $this->respondCreated(new DividendRunResource($run), 'Dividend run calculated.');
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $run = DividendRun::where('org_id', $request->user()->org_id)
            ->with(['fiscalYear', 'entries.member', 'entries.creditedAccount'])
            ->findOrFail($id);

        return $this->respond(new DividendRunResource($run));
    }

    public function approve(Request $request, string $id): JsonResponse
    {
        $run = DividendRun::where('org_id', $request->user()->org_id)->findOrFail($id);
        $run = $this->dividendService->approve($run, $request->user());

        return $this->respond(new DividendRunResource($run), 'Dividend run approved.');
    }

    public function post(Request $request, string $id): JsonResponse
    {
        $run = DividendRun::where('org_id', $request->user()->org_id)->findOrFail($id);
        $run = $this->dividendService->post($run);

        return $this->respond(new DividendRunResource($run), 'Dividend posted to member accounts.');
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $run = DividendRun::where('org_id', $request->user()->org_id)->findOrFail($id);
        abort_unless($run->status === 'draft', 422, 'Only draft runs can be deleted.');
        $run->delete();

        return $this->respond(null, 'Dividend run deleted.');
    }
}
```

- [ ] Add `manage_dividends` to `RbacSeeder.php` (after the `manage_shares` line from Phase 15):

```php
$manageDividends      = Permission::firstOrCreate(['name' => 'manage_dividends',      'guard_name' => 'web']);
```

Update the admin `syncPermissions` call to include `$manageDividends`.

- [ ] Add dividend routes to `api.php` in a new middleware group:

```php
Route::middleware(['auth:sanctum', 'permission:manage_dividends'])->prefix('dividend-runs')->group(function () {
    Route::get('/',          [\App\Http\Controllers\Api\V1\DividendController::class, 'index']);
    Route::post('/',         [\App\Http\Controllers\Api\V1\DividendController::class, 'store']);
    Route::get('/{id}',      [\App\Http\Controllers\Api\V1\DividendController::class, 'show']);
    Route::post('/{id}/approve', [\App\Http\Controllers\Api\V1\DividendController::class, 'approve']);
    Route::post('/{id}/post',    [\App\Http\Controllers\Api\V1\DividendController::class, 'post']);
    Route::delete('/{id}',   [\App\Http\Controllers\Api\V1\DividendController::class, 'destroy']);
});
```

- [ ] Re-run seeder:

```bash
cd backend && php artisan db:seed --class=RbacSeeder
```

- [ ] Commit:

```bash
git add backend/app/Http/Controllers/Api/V1/DividendController.php \
        backend/routes/api.php \
        backend/database/seeders/RbacSeeder.php
git commit -m "feat(dividends): add DividendController, routes, manage_dividends permission"
```

---

## Task 6: Member portal endpoint

**Files:**
- Modify: `backend/app/Http/Controllers/Api/V1/MemberPortalController.php`

- [ ] Add imports at top of `MemberPortalController.php`:

```php
use App\Models\DividendEntry;
use App\Http\Resources\V1\DividendEntryResource;
```

- [ ] Add the `dividends()` method to `MemberPortalController`:

```php
public function dividends(Request $request): JsonResponse
{
    $member = $this->resolveMember($request);

    $entries = DividendEntry::where('org_id', $request->user()->org_id)
        ->where('member_id', $member->id)
        ->with('dividendRun.fiscalYear')
        ->latest()
        ->get();

    return $this->respond(DividendEntryResource::collection($entries));
}
```

- [ ] Add route in `api.php` inside the `/me` group:

```php
Route::get('dividends', [MemberPortalController::class, 'dividends']);
```

- [ ] Commit:

```bash
git add backend/app/Http/Controllers/Api/V1/MemberPortalController.php \
        backend/routes/api.php
git commit -m "feat(dividends): add GET /me/dividends member portal endpoint"
```

---

## Task 7: Frontend API hooks

**Files:**
- Create: `frontend/src/lib/api/dividends.ts`

- [ ] Create `frontend/src/lib/api/dividends.ts`:

```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiEnvelope, ApiMeta } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────

export interface DividendEntry {
  id: string;
  dividend_run_id: string;
  member_id: string;
  member: { id: string; full_name: string; member_number: string } | null;
  share_balance: string;
  dividend_amount: string;
  credited_account_id: string | null;
  posted_at: string | null;
  created_at: string;
}

export interface DividendRun {
  id: string;
  fiscal_year_id: string;
  fiscal_year: { id: string; fiscal_year: string } | null;
  rate: string;
  status: "draft" | "approved" | "posted";
  total_dividend: string;
  notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  posted_at: string | null;
  entries_count?: number;
  entries?: DividendEntry[];
  created_at: string;
}

export type CreateDividendRunPayload = {
  fiscal_year_id: string;
  rate: string;
  notes?: string;
};

// ── Query keys ─────────────────────────────────────────────────────────

export const DIVIDEND_RUNS_KEY = ["dividend-runs"] as const;

// ── Queries ────────────────────────────────────────────────────────────

export function useDividendRuns() {
  return useQuery<{ data: DividendRun[]; meta: ApiMeta }>({
    queryKey: DIVIDEND_RUNS_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<DividendRun[]>>("/dividend-runs");
      return { data: data.data, meta: data.meta! };
    },
    staleTime: 30_000,
  });
}

export function useDividendRun(id: string) {
  return useQuery<DividendRun>({
    queryKey: [...DIVIDEND_RUNS_KEY, id],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<DividendRun>>(`/dividend-runs/${id}`);
      return data.data;
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useMyDividends() {
  return useQuery<DividendEntry[]>({
    queryKey: ["me", "dividends"],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<DividendEntry[]>>("/me/dividends");
      return data.data;
    },
    staleTime: 60_000,
  });
}

// ── Mutations ──────────────────────────────────────────────────────────

export function useCreateDividendRun() {
  const qc = useQueryClient();
  return useMutation<DividendRun, Error, CreateDividendRunPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<DividendRun>>("/dividend-runs", payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: DIVIDEND_RUNS_KEY }),
  });
}

export function useApproveDividendRun() {
  const qc = useQueryClient();
  return useMutation<DividendRun, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.post<ApiEnvelope<DividendRun>>(`/dividend-runs/${id}/approve`);
      return data.data;
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: DIVIDEND_RUNS_KEY });
      qc.invalidateQueries({ queryKey: [...DIVIDEND_RUNS_KEY, id] });
    },
  });
}

export function usePostDividendRun() {
  const qc = useQueryClient();
  return useMutation<DividendRun, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.post<ApiEnvelope<DividendRun>>(`/dividend-runs/${id}/post`);
      return data.data;
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: DIVIDEND_RUNS_KEY });
      qc.invalidateQueries({ queryKey: [...DIVIDEND_RUNS_KEY, id] });
    },
  });
}

export function useDeleteDividendRun() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => { await api.delete(`/dividend-runs/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: DIVIDEND_RUNS_KEY }),
  });
}
```

- [ ] Commit:

```bash
git add frontend/src/lib/api/dividends.ts
git commit -m "feat(dividends): add frontend API hooks for dividends"
```

---

## Task 8: Admin — Dividend Runs list page

**Files:**
- Create: `frontend/src/app/admin/dividends/page.tsx`

- [ ] Create `frontend/src/app/admin/dividends/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  useDividendRuns, useCreateDividendRun, useDeleteDividendRun, DividendRun,
} from "@/lib/api/dividends";
import { useFiscalYears } from "@/lib/api/fiscal-years";
import { extractApiError, extractFieldErrors } from "@/lib/api";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ColumnDef } from "@tanstack/react-table";

const fmt = (v: string) =>
  new Intl.NumberFormat("en-BW", { style: "currency", currency: "BWP" }).format(Number(v));

export default function DividendRunsPage() {
  const { data, isLoading }    = useDividendRuns();
  const { data: fyData }       = useFiscalYears();
  const createMut              = useCreateDividendRun();
  const deleteMut              = useDeleteDividendRun();
  const fiscalYears            = fyData ?? [];

  const [open, setOpen]       = useState(false);
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [form, setForm]       = useState({ fiscal_year_id: "", rate: "", notes: "" });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    try {
      await createMut.mutateAsync({
        fiscal_year_id: form.fiscal_year_id,
        rate: String(Number(form.rate) / 100), // UI takes %, API takes decimal
        notes: form.notes || undefined,
      });
      toast.success("Dividend run calculated.");
      setOpen(false);
    } catch (err) {
      const fe = extractFieldErrors(err);
      if (Object.keys(fe).length) { setErrors(fe); return; }
      toast.error(extractApiError(err));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this draft dividend run?")) return;
    try {
      await deleteMut.mutateAsync(id);
      toast.success("Deleted.");
    } catch (err) { toast.error(extractApiError(err)); }
  }

  const runs = data?.data ?? [];

  const STATUS_COLOR: Record<string, string> = {
    draft: "text-yellow-600",
    approved: "text-blue-600 font-medium",
    posted: "text-green-600 font-medium",
  };

  const columns: ColumnDef<DividendRun>[] = [
    { accessorKey: "fiscal_year.fiscal_year", header: "Fiscal Year" },
    {
      accessorKey: "rate",
      header: "Rate",
      cell: ({ row }) => `${(Number(row.original.rate) * 100).toFixed(2)}%`,
    },
    {
      accessorKey: "total_dividend",
      header: "Total Dividend",
      cell: ({ row }) => fmt(row.original.total_dividend),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span className={STATUS_COLOR[row.original.status] ?? ""}>
          {row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Link href={`/admin/dividends/${row.original.id}`}>
            <Button size="sm" variant="outline">View</Button>
          </Link>
          {row.original.status === "draft" && (
            <Button size="sm" variant="destructive" onClick={() => handleDelete(row.original.id)}>
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dividend Runs</h1>
        <Button onClick={() => { setForm({ fiscal_year_id: "", rate: "", notes: "" }); setErrors({}); setOpen(true); }}>
          + New Dividend Run
        </Button>
      </div>

      <DataTable columns={columns} data={runs} isLoading={isLoading} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Dividend Run</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label>Fiscal Year</Label>
              <select className="w-full border rounded p-2 text-sm" value={form.fiscal_year_id}
                onChange={e => setForm(f => ({ ...f, fiscal_year_id: e.target.value }))} required>
                <option value="">Select fiscal year…</option>
                {fiscalYears.map((fy: { id: string; fiscal_year: string }) => (
                  <option key={fy.id} value={fy.id}>{fy.fiscal_year}</option>
                ))}
              </select>
              {errors.fiscal_year_id && <p className="text-red-500 text-xs">{errors.fiscal_year_id}</p>}
            </div>
            <div>
              <Label>Dividend Rate (%)</Label>
              <Input type="number" step="0.01" min="0.01" max="100" placeholder="e.g. 10 for 10%"
                value={form.rate} onChange={e => setForm(f => ({ ...f, rate: e.target.value }))} required />
              {errors.rate && <p className="text-red-500 text-xs">{errors.rate}</p>}
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMut.isPending}>Calculate</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] Commit:

```bash
git add frontend/src/app/admin/dividends/page.tsx
git commit -m "feat(dividends): add admin dividend runs list page"
```

---

## Task 9: Admin — Dividend Run detail page

**Files:**
- Create: `frontend/src/app/admin/dividends/[id]/page.tsx`

- [ ] Create `frontend/src/app/admin/dividends/[id]/page.tsx`:

```tsx
"use client";

import { use } from "react";
import { toast } from "sonner";
import {
  useDividendRun, useApproveDividendRun, usePostDividendRun, DividendEntry,
} from "@/lib/api/dividends";
import { extractApiError } from "@/lib/api";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";

const fmt = (v: string) =>
  new Intl.NumberFormat("en-BW", { style: "currency", currency: "BWP" }).format(Number(v));

export default function DividendRunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: run, isLoading } = useDividendRun(id);
  const approveMut = useApproveDividendRun();
  const postMut    = usePostDividendRun();

  async function handleApprove() {
    if (!confirm("Approve this dividend run?")) return;
    try {
      await approveMut.mutateAsync(id);
      toast.success("Dividend run approved.");
    } catch (err) { toast.error(extractApiError(err)); }
  }

  async function handlePost() {
    if (!confirm("Post dividends? This will credit all member accounts and cannot be undone.")) return;
    try {
      await postMut.mutateAsync(id);
      toast.success("Dividends posted to member accounts.");
    } catch (err) { toast.error(extractApiError(err)); }
  }

  const entries = run?.entries ?? [];

  const columns: ColumnDef<DividendEntry>[] = [
    { accessorKey: "member.member_number", header: "Member #" },
    { accessorKey: "member.full_name", header: "Name" },
    { accessorKey: "share_balance", header: "Share Balance", cell: ({ row }) => fmt(row.original.share_balance) },
    { accessorKey: "dividend_amount", header: "Dividend", cell: ({ row }) => fmt(row.original.dividend_amount) },
    {
      accessorKey: "posted_at",
      header: "Posted",
      cell: ({ row }) => row.original.posted_at ? new Date(row.original.posted_at).toLocaleDateString("en-BW") : "—",
    },
  ];

  if (isLoading) return <div className="p-6">Loading…</div>;
  if (!run) return <div className="p-6 text-red-500">Dividend run not found.</div>;

  const STATUS_COLOR: Record<string, string> = {
    draft: "bg-yellow-100 text-yellow-700",
    approved: "bg-blue-100 text-blue-700",
    posted: "bg-green-100 text-green-700",
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dividend Run — {run.fiscal_year?.fiscal_year}</h1>
          <p className="text-gray-500 text-sm">Rate: {(Number(run.rate) * 100).toFixed(2)}%</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLOR[run.status] ?? ""}`}>
          {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="rounded border p-4">
          <p className="text-sm text-gray-500">Total Dividend</p>
          <p className="text-xl font-bold">{fmt(run.total_dividend)}</p>
        </div>
        <div className="rounded border p-4">
          <p className="text-sm text-gray-500">Members</p>
          <p className="text-xl font-bold">{entries.length}</p>
        </div>
        {run.approved_at && (
          <div className="rounded border p-4">
            <p className="text-sm text-gray-500">Approved</p>
            <p className="text-sm font-medium">{new Date(run.approved_at).toLocaleDateString("en-BW")}</p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {run.status === "draft" && (
          <Button onClick={handleApprove} disabled={approveMut.isPending}>Approve Run</Button>
        )}
        {run.status === "approved" && (
          <Button onClick={handlePost} disabled={postMut.isPending}>
            Post to Member Accounts
          </Button>
        )}
      </div>

      <h2 className="text-lg font-semibold">Per-Member Entries ({entries.length})</h2>
      <DataTable columns={columns} data={entries} />
    </div>
  );
}
```

- [ ] Commit:

```bash
git add frontend/src/app/admin/dividends/[id]/page.tsx
git commit -m "feat(dividends): add admin dividend run detail page"
```

---

## Task 10: Member portal dividends page + nav

**Files:**
- Create: `frontend/src/app/member/account-statement/dividends/page.tsx`
- Modify: `frontend/src/components/Layouts/sidebar/data/index.ts`

- [ ] Create `frontend/src/app/member/account-statement/dividends/page.tsx`:

```tsx
"use client";

import { useMyDividends } from "@/lib/api/dividends";
import DataTable from "@/components/DataTable";
import { ColumnDef } from "@tanstack/react-table";

const fmt = (v: string) =>
  new Intl.NumberFormat("en-BW", { style: "currency", currency: "BWP" }).format(Number(v));

type Entry = Awaited<ReturnType<typeof useMyDividends>>["data"] extends (infer T)[] | undefined ? T : never;

export default function MemberDividendsPage() {
  const { data: entries = [], isLoading } = useMyDividends();

  const columns: ColumnDef<NonNullable<typeof entries>[number]>[] = [
    {
      id: "fiscal_year",
      header: "Fiscal Year",
      cell: ({ row }) => (row.original as unknown as { dividend_run?: { fiscal_year?: { fiscal_year?: string } } }).dividend_run?.fiscal_year?.fiscal_year ?? "—",
    },
    {
      accessorKey: "share_balance",
      header: "Share Balance",
      cell: ({ row }) => fmt(row.original.share_balance),
    },
    {
      accessorKey: "dividend_amount",
      header: "Dividend",
      cell: ({ row }) => fmt(row.original.dividend_amount),
    },
    {
      accessorKey: "posted_at",
      header: "Credited",
      cell: ({ row }) =>
        row.original.posted_at
          ? new Date(row.original.posted_at).toLocaleDateString("en-BW")
          : "Pending",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">My Dividends</h1>
      <DataTable columns={columns} data={entries} isLoading={isLoading} />
    </div>
  );
}
```

- [ ] In `frontend/src/components/Layouts/sidebar/data/index.ts`, add to the admin MAIN MENU under the `Operations` group (or as a new group after Transactions):

```typescript
{
  title: "Dividends",
  icon: Icons.PieChart,
  items: [
    { title: "Dividend Runs", url: "/admin/dividends" },
  ],
},
```

Add to MEMBER_NAV_DATA under `Account Statement`:

```typescript
{ title: "Dividends", url: "/member/account-statement/dividends" },
```

- [ ] Check for `useFiscalYears` hook — it may already exist. Run:

```bash
grep -r "useFiscalYears" frontend/src/lib/api/
```

If missing, add to an existing `fiscal-years.ts` or create `frontend/src/lib/api/fiscal-years.ts`:

```typescript
import { useQuery } from "@tanstack/react-query";
import { api, ApiEnvelope } from "@/lib/api";

export interface FiscalYear { id: string; fiscal_year: string; year_opened: boolean; year_closed: boolean; }

export function useFiscalYears() {
  return useQuery<FiscalYear[]>({
    queryKey: ["fiscal-years"],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<FiscalYear[]>>("/fiscal-years");
      return data.data;
    },
    staleTime: 120_000,
  });
}
```

- [ ] Run TypeScript check:

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] Commit:

```bash
git add frontend/src/app/member/account-statement/dividends/page.tsx \
        frontend/src/components/Layouts/sidebar/data/index.ts \
        frontend/src/lib/api/fiscal-years.ts
git commit -m "feat(dividends): add member portal dividends page and nav entries"
```

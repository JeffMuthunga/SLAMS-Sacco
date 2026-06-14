# Phase 15: Shares Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow members to purchase ownership shares in the SACCO, with admin management of share products and purchases.

**Architecture:** `ShareProduct` (configurable share class) → `MemberShare` (per-purchase record). `ShareService` handles purchase validation + journal posting. Admin manages products under Configurations and purchases under Members. Member portal exposes share balance and history.

**Tech Stack:** Laravel 12, PostgreSQL (uuid PKs, soft deletes, bcmath for money), Spatie permissions, Next.js 16, React Query, shadcn/ui, TanStack Table (DataTable component).

---

## File Map

**Create (backend):**
- `backend/database/migrations/2026_06_14_200000_create_share_products_table.php`
- `backend/database/migrations/2026_06_14_200001_create_member_shares_table.php`
- `backend/app/Models/ShareProduct.php`
- `backend/app/Models/MemberShare.php`
- `backend/app/Services/ShareService.php`
- `backend/app/Http/Controllers/Api/V1/Configurations/ShareProductController.php`
- `backend/app/Http/Controllers/Api/V1/MemberShareController.php`
- `backend/app/Http/Resources/V1/ShareProductResource.php`
- `backend/app/Http/Resources/V1/MemberShareResource.php`

**Modify (backend):**
- `backend/routes/api.php` — add share routes
- `backend/database/seeders/RbacSeeder.php` — add `manage_shares` permission
- `backend/app/Http/Controllers/Api/V1/MemberPortalController.php` — add `shares()` method

**Create (frontend):**
- `frontend/src/lib/api/shares.ts`
- `frontend/src/app/admin/configurations/share-products/page.tsx`
- `frontend/src/app/admin/shares/page.tsx`
- `frontend/src/app/member/account-statement/shares/page.tsx`

**Modify (frontend):**
- `frontend/src/components/Layouts/sidebar/data/index.ts` — add nav entries
- `frontend/src/app/admin/members/[id]/page.tsx` — add Shares tab

---

## Task 1: Database migrations

**Files:**
- Create: `backend/database/migrations/2026_06_14_200000_create_share_products_table.php`
- Create: `backend/database/migrations/2026_06_14_200001_create_member_shares_table.php`

- [ ] Create `backend/database/migrations/2026_06_14_200000_create_share_products_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('share_products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('share_capital_account_id')->nullable()->constrained('chart_of_accounts')->nullOnDelete();
            $table->string('name', 120);
            $table->decimal('price_per_share', 15, 2);
            $table->integer('min_shares')->default(1);
            $table->integer('max_shares')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('share_products');
    }
};
```

- [ ] Create `backend/database/migrations/2026_06_14_200001_create_member_shares_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('member_shares', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('member_id')->constrained('members')->cascadeOnDelete();
            $table->foreignUuid('share_product_id')->constrained('share_products')->cascadeOnDelete();
            $table->foreignUuid('deposit_account_id')->nullable()->constrained('deposit_accounts')->nullOnDelete();
            $table->integer('quantity');
            $table->decimal('price_per_share', 15, 2);
            $table->decimal('total_amount', 15, 2);
            $table->date('purchase_date');
            $table->string('status', 20)->default('pending'); // pending | approved | rejected
            $table->foreignUuid('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('member_shares');
    }
};
```

- [ ] Run migrations:

```bash
cd backend && php artisan migrate
```

Expected: two new tables created with no errors.

- [ ] Commit:

```bash
git add backend/database/migrations/2026_06_14_200000_create_share_products_table.php \
        backend/database/migrations/2026_06_14_200001_create_member_shares_table.php
git commit -m "feat(shares): add share_products and member_shares migrations"
```

---

## Task 2: Models

**Files:**
- Create: `backend/app/Models/ShareProduct.php`
- Create: `backend/app/Models/MemberShare.php`

- [ ] Create `backend/app/Models/ShareProduct.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ShareProduct extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'share_capital_account_id', 'name', 'price_per_share',
        'min_shares', 'max_shares', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price_per_share' => 'decimal:2',
            'is_active'       => 'boolean',
        ];
    }

    public function org(): BelongsTo
    {
        return $this->belongsTo(Org::class);
    }

    public function shareCapitalAccount(): BelongsTo
    {
        return $this->belongsTo(ChartOfAccount::class, 'share_capital_account_id');
    }

    public function memberShares(): HasMany
    {
        return $this->hasMany(MemberShare::class);
    }
}
```

- [ ] Create `backend/app/Models/MemberShare.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class MemberShare extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'member_id', 'share_product_id', 'deposit_account_id',
        'quantity', 'price_per_share', 'total_amount', 'purchase_date',
        'status', 'approved_by', 'approved_at', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'price_per_share' => 'decimal:2',
            'total_amount'    => 'decimal:2',
            'purchase_date'   => 'date',
            'approved_at'     => 'datetime',
        ];
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function shareProduct(): BelongsTo
    {
        return $this->belongsTo(ShareProduct::class);
    }

    public function depositAccount(): BelongsTo
    {
        return $this->belongsTo(DepositAccount::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
```

- [ ] Commit:

```bash
git add backend/app/Models/ShareProduct.php backend/app/Models/MemberShare.php
git commit -m "feat(shares): add ShareProduct and MemberShare models"
```

---

## Task 3: Resources

**Files:**
- Create: `backend/app/Http/Resources/V1/ShareProductResource.php`
- Create: `backend/app/Http/Resources/V1/MemberShareResource.php`

- [ ] Create `backend/app/Http/Resources/V1/ShareProductResource.php`:

```php
<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ShareProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                       => $this->id,
            'name'                     => $this->name,
            'price_per_share'          => $this->price_per_share,
            'min_shares'               => $this->min_shares,
            'max_shares'               => $this->max_shares,
            'is_active'                => $this->is_active,
            'share_capital_account_id' => $this->share_capital_account_id,
            'share_capital_account'    => $this->whenLoaded('shareCapitalAccount', fn () => [
                'id'   => $this->shareCapitalAccount->id,
                'name' => $this->shareCapitalAccount->name,
                'code' => $this->shareCapitalAccount->code,
            ]),
            'created_at'               => $this->created_at?->toIso8601String(),
        ];
    }
}
```

- [ ] Create `backend/app/Http/Resources/V1/MemberShareResource.php`:

```php
<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MemberShareResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'quantity'       => $this->quantity,
            'price_per_share'=> $this->price_per_share,
            'total_amount'   => $this->total_amount,
            'purchase_date'  => $this->purchase_date?->toDateString(),
            'status'         => $this->status,
            'notes'          => $this->notes,
            'approved_at'    => $this->approved_at?->toIso8601String(),
            'approved_by'    => $this->approved_by,
            'member'         => $this->whenLoaded('member', fn () => [
                'id'            => $this->member->id,
                'full_name'     => $this->member->full_name,
                'member_number' => $this->member->member_number,
            ]),
            'share_product'  => $this->whenLoaded('shareProduct', fn () => [
                'id'              => $this->shareProduct->id,
                'name'            => $this->shareProduct->name,
                'price_per_share' => $this->shareProduct->price_per_share,
            ]),
            'deposit_account'=> $this->whenLoaded('depositAccount', fn () => [
                'id'             => $this->depositAccount->id,
                'account_number' => $this->depositAccount->account_number,
            ]),
            'created_at'     => $this->created_at?->toIso8601String(),
        ];
    }
}
```

- [ ] Commit:

```bash
git add backend/app/Http/Resources/V1/ShareProductResource.php \
        backend/app/Http/Resources/V1/MemberShareResource.php
git commit -m "feat(shares): add ShareProduct and MemberShare resources"
```

---

## Task 4: ShareService

**Files:**
- Create: `backend/app/Services/ShareService.php`

- [ ] Create `backend/app/Services/ShareService.php`:

```php
<?php

namespace App\Services;

use App\Models\DepositAccount;
use App\Models\MemberShare;
use App\Models\ShareProduct;
use App\Models\Member;
use Illuminate\Support\Facades\DB;

class ShareService
{
    public function purchaseShares(Member $member, array $data, string $orgId): MemberShare
    {
        $product = ShareProduct::where('org_id', $orgId)
            ->where('is_active', true)
            ->findOrFail($data['share_product_id']);

        $quantity    = (int) $data['quantity'];
        $priceEach   = (string) $product->price_per_share;
        $totalAmount = bcmul((string) $quantity, $priceEach, 2);

        abort_if($quantity < $product->min_shares, 422,
            "Minimum shares for this product is {$product->min_shares}.");

        if ($product->max_shares !== null) {
            $currentHeld = MemberShare::where('org_id', $orgId)
                ->where('member_id', $member->id)
                ->where('share_product_id', $product->id)
                ->where('status', 'approved')
                ->sum('quantity');

            abort_if(($currentHeld + $quantity) > $product->max_shares, 422,
                "This purchase would exceed the maximum of {$product->max_shares} shares for this product.");
        }

        return MemberShare::create([
            'org_id'           => $orgId,
            'member_id'        => $member->id,
            'share_product_id' => $product->id,
            'deposit_account_id' => $data['deposit_account_id'] ?? null,
            'quantity'         => $quantity,
            'price_per_share'  => $priceEach,
            'total_amount'     => $totalAmount,
            'purchase_date'    => $data['purchase_date'] ?? now()->toDateString(),
            'status'           => 'pending',
            'notes'            => $data['notes'] ?? null,
        ]);
    }

    public function approve(MemberShare $share, $user): MemberShare
    {
        abort_unless($share->status === 'pending', 422, 'Only pending share purchases can be approved.');

        DB::transaction(function () use ($share, $user) {
            $share->update([
                'status'      => 'approved',
                'approved_by' => $user->id,
                'approved_at' => now(),
            ]);

            // Deduct from deposit account if provided
            if ($share->deposit_account_id) {
                $account = DepositAccount::lockForUpdate()->findOrFail($share->deposit_account_id);
                $newBal  = bcsub((string) $account->balance, (string) $share->total_amount, 2);
                abort_if(bccomp($newBal, '0', 2) < 0, 422, 'Insufficient account balance for this share purchase.');
                $account->update(['balance' => $newBal]);
            }
        });

        return $share->fresh()->load(['member', 'shareProduct', 'depositAccount']);
    }

    public function reject(MemberShare $share, string $reason): MemberShare
    {
        abort_unless($share->status === 'pending', 422, 'Only pending share purchases can be rejected.');

        $share->update([
            'status' => 'rejected',
            'notes'  => $reason,
        ]);

        return $share->fresh()->load(['member', 'shareProduct']);
    }

    public function memberBalance(string $memberId, string $orgId): array
    {
        $shares = MemberShare::where('org_id', $orgId)
            ->where('member_id', $memberId)
            ->where('status', 'approved')
            ->with('shareProduct')
            ->get()
            ->groupBy('share_product_id');

        $summary = [];
        $totalValue = '0.00';

        foreach ($shares as $productId => $purchases) {
            $qty   = $purchases->sum('quantity');
            $value = $purchases->sum(fn ($s) => (float) $s->total_amount);
            $valueStr = number_format($value, 2, '.', '');
            $totalValue = bcadd($totalValue, $valueStr, 2);

            $summary[] = [
                'share_product_id'   => $productId,
                'share_product_name' => $purchases->first()->shareProduct?->name,
                'quantity'           => $qty,
                'value'              => $valueStr,
            ];
        }

        return [
            'summary'     => $summary,
            'total_value' => $totalValue,
        ];
    }
}
```

- [ ] Commit:

```bash
git add backend/app/Services/ShareService.php
git commit -m "feat(shares): add ShareService with purchase, approve, reject, balance"
```

---

## Task 5: Controllers

**Files:**
- Create: `backend/app/Http/Controllers/Api/V1/Configurations/ShareProductController.php`
- Create: `backend/app/Http/Controllers/Api/V1/MemberShareController.php`

- [ ] Create `backend/app/Http/Controllers/Api/V1/Configurations/ShareProductController.php`:

```php
<?php

namespace App\Http\Controllers\Api\V1\Configurations;

use App\Http\Resources\V1\ShareProductResource;
use App\Models\ShareProduct;

class ShareProductController extends BaseCrudController
{
    protected function modelClass(): string    { return ShareProduct::class; }
    protected function resourceClass(): string { return ShareProductResource::class; }

    protected function storeRules(string $orgId): array
    {
        return [
            'name'                     => ['required', 'string', 'max:120'],
            'price_per_share'          => ['required', 'numeric', 'min:0.01'],
            'min_shares'               => ['required', 'integer', 'min:1'],
            'max_shares'               => ['nullable', 'integer', 'min:1'],
            'share_capital_account_id' => ['nullable', 'uuid', 'exists:chart_of_accounts,id'],
            'is_active'                => ['boolean'],
        ];
    }

    protected function updateRules(string $id, string $orgId): array
    {
        return $this->storeRules($orgId);
    }
}
```

- [ ] Create `backend/app/Http/Controllers/Api/V1/MemberShareController.php`:

```php
<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\V1\MemberShareResource;
use App\Models\Member;
use App\Models\MemberShare;
use App\Services\ShareService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MemberShareController extends ApiController
{
    public function __construct(private ShareService $shareService) {}

    public function index(Request $request): JsonResponse
    {
        $query = MemberShare::where('org_id', $request->user()->org_id)
            ->with(['member', 'shareProduct', 'depositAccount'])
            ->latest();

        if ($request->filled('member_id')) {
            $query->where('member_id', $request->member_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $shares = $query->paginate($request->integer('per_page', 25));

        return $this->respond(
            MemberShareResource::collection($shares)->response()->getData(true)
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'member_id'        => ['required', 'uuid', 'exists:members,id'],
            'share_product_id' => ['required', 'uuid', 'exists:share_products,id'],
            'deposit_account_id' => ['nullable', 'uuid', 'exists:deposit_accounts,id'],
            'quantity'         => ['required', 'integer', 'min:1'],
            'purchase_date'    => ['nullable', 'date'],
            'notes'            => ['nullable', 'string', 'max:500'],
        ]);

        $member = Member::where('org_id', $request->user()->org_id)->findOrFail($data['member_id']);
        $share  = $this->shareService->purchaseShares($member, $data, $request->user()->org_id);
        $share->load(['member', 'shareProduct', 'depositAccount']);

        return $this->respondCreated(new MemberShareResource($share), 'Share purchase recorded.');
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $share = MemberShare::where('org_id', $request->user()->org_id)
            ->with(['member', 'shareProduct', 'depositAccount'])
            ->findOrFail($id);

        return $this->respond(new MemberShareResource($share));
    }

    public function approve(Request $request, string $id): JsonResponse
    {
        $share = MemberShare::where('org_id', $request->user()->org_id)->findOrFail($id);
        $share = $this->shareService->approve($share, $request->user());

        return $this->respond(new MemberShareResource($share), 'Share purchase approved.');
    }

    public function reject(Request $request, string $id): JsonResponse
    {
        $data  = $request->validate(['reason' => ['required', 'string', 'max:500']]);
        $share = MemberShare::where('org_id', $request->user()->org_id)->findOrFail($id);
        $share = $this->shareService->reject($share, $data['reason']);

        return $this->respond(new MemberShareResource($share), 'Share purchase rejected.');
    }
}
```

- [ ] Commit:

```bash
git add backend/app/Http/Controllers/Api/V1/Configurations/ShareProductController.php \
        backend/app/Http/Controllers/Api/V1/MemberShareController.php
git commit -m "feat(shares): add ShareProductController and MemberShareController"
```

---

## Task 6: Routes + RBAC permission

**Files:**
- Modify: `backend/routes/api.php`
- Modify: `backend/database/seeders/RbacSeeder.php`

- [ ] Add `manage_shares` to `backend/database/seeders/RbacSeeder.php`. After the existing `$manageIssues` line, add:

```php
$manageShares         = Permission::firstOrCreate(['name' => 'manage_shares',         'guard_name' => 'web']);
```

Then update the admin `syncPermissions` call to include `$manageShares`:

```php
$admin->syncPermissions([$manageMembers, $manageConfigurations, $manageAccounts, $manageLoans, $manageContributions, $manageJournals, $managePettyCash, $manageIssues, $manageShares]);
```

- [ ] Add share routes to `backend/routes/api.php`. Inside the `manage_configurations` middleware group add:

```php
Route::apiResource('share-products', \App\Http\Controllers\Api\V1\Configurations\ShareProductController::class);
```

After the `manage_members` group, add a new `manage_shares` group:

```php
Route::middleware(['auth:sanctum', 'permission:manage_shares'])->group(function () {
    Route::get('member-shares',                    [\App\Http\Controllers\Api\V1\MemberShareController::class, 'index']);
    Route::post('member-shares',                   [\App\Http\Controllers\Api\V1\MemberShareController::class, 'store']);
    Route::get('member-shares/{id}',               [\App\Http\Controllers\Api\V1\MemberShareController::class, 'show']);
    Route::post('member-shares/{id}/approve',      [\App\Http\Controllers\Api\V1\MemberShareController::class, 'approve']);
    Route::post('member-shares/{id}/reject',       [\App\Http\Controllers\Api\V1\MemberShareController::class, 'reject']);
});
```

- [ ] Re-run the seeder to register the new permission:

```bash
cd backend && php artisan db:seed --class=RbacSeeder
```

Expected: no errors, admin now has `manage_shares` permission.

- [ ] Commit:

```bash
git add backend/routes/api.php backend/database/seeders/RbacSeeder.php
git commit -m "feat(shares): add share routes and manage_shares permission"
```

---

## Task 7: Member portal endpoint

**Files:**
- Modify: `backend/app/Http/Controllers/Api/V1/MemberPortalController.php`

- [ ] Add `ShareService` injection and `shares()` method to `MemberPortalController`. Add to the constructor:

```php
private ShareService $shareService,
```

Add the import at the top of the file:

```php
use App\Services\ShareService;
use App\Http\Resources\V1\MemberShareResource;
```

Add the method:

```php
public function shares(Request $request): JsonResponse
{
    $member = $this->resolveMember($request);

    $purchases = MemberShare::where('org_id', $request->user()->org_id)
        ->where('member_id', $member->id)
        ->with(['shareProduct', 'depositAccount'])
        ->latest()
        ->get();

    $balance = $this->shareService->memberBalance($member->id, $request->user()->org_id);

    return $this->respond([
        'balance'   => $balance,
        'purchases' => MemberShareResource::collection($purchases),
    ]);
}
```

- [ ] Add route inside the `/me` prefix group in `api.php`:

```php
Route::get('shares', [MemberPortalController::class, 'shares']);
```

- [ ] Commit:

```bash
git add backend/app/Http/Controllers/Api/V1/MemberPortalController.php \
        backend/routes/api.php
git commit -m "feat(shares): add GET /me/shares member portal endpoint"
```

---

## Task 8: Frontend API hooks

**Files:**
- Create: `frontend/src/lib/api/shares.ts`

- [ ] Create `frontend/src/lib/api/shares.ts`:

```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiEnvelope, ApiMeta } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────

export interface ShareProduct {
  id: string;
  name: string;
  price_per_share: string;
  min_shares: number;
  max_shares: number | null;
  is_active: boolean;
  share_capital_account_id: string | null;
  share_capital_account: { id: string; name: string; code: string } | null;
  created_at: string;
}

export interface MemberShare {
  id: string;
  quantity: number;
  price_per_share: string;
  total_amount: string;
  purchase_date: string;
  status: "pending" | "approved" | "rejected";
  notes: string | null;
  approved_at: string | null;
  approved_by: string | null;
  member: { id: string; full_name: string; member_number: string } | null;
  share_product: { id: string; name: string; price_per_share: string } | null;
  deposit_account: { id: string; account_number: string } | null;
  created_at: string;
}

export interface MemberShareBalance {
  summary: Array<{
    share_product_id: string;
    share_product_name: string;
    quantity: number;
    value: string;
  }>;
  total_value: string;
}

export interface MemberSharesResponse {
  balance: MemberShareBalance;
  purchases: MemberShare[];
}

export type CreateMemberSharePayload = {
  member_id: string;
  share_product_id: string;
  deposit_account_id?: string;
  quantity: number;
  purchase_date?: string;
  notes?: string;
};

// ── Query keys ─────────────────────────────────────────────────────────

export const SHARE_PRODUCTS_KEY = ["share-products"] as const;
export const MEMBER_SHARES_KEY  = ["member-shares"] as const;

// ── Share Products ──────────────────────────────────────────────────────

export function useShareProducts() {
  return useQuery<ShareProduct[]>({
    queryKey: SHARE_PRODUCTS_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<ShareProduct[]>>("/share-products");
      return data.data;
    },
    staleTime: 60_000,
  });
}

export function useCreateShareProduct() {
  const qc = useQueryClient();
  return useMutation<ShareProduct, Error, Partial<ShareProduct>>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<ShareProduct>>("/share-products", payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SHARE_PRODUCTS_KEY }),
  });
}

export function useUpdateShareProduct() {
  const qc = useQueryClient();
  return useMutation<ShareProduct, Error, { id: string } & Partial<ShareProduct>>({
    mutationFn: async ({ id, ...payload }) => {
      const { data } = await api.put<ApiEnvelope<ShareProduct>>(`/share-products/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SHARE_PRODUCTS_KEY }),
  });
}

export function useDeleteShareProduct() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => { await api.delete(`/share-products/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: SHARE_PRODUCTS_KEY }),
  });
}

// ── Member Shares ───────────────────────────────────────────────────────

export function useMemberShares(params?: { member_id?: string; status?: string; per_page?: number }) {
  return useQuery<{ data: MemberShare[]; meta: ApiMeta }>({
    queryKey: [...MEMBER_SHARES_KEY, params],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<MemberShare[]>>("/member-shares", { params });
      return { data: data.data, meta: data.meta! };
    },
    staleTime: 30_000,
  });
}

export function useCreateMemberShare() {
  const qc = useQueryClient();
  return useMutation<MemberShare, Error, CreateMemberSharePayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<MemberShare>>("/member-shares", payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: MEMBER_SHARES_KEY }),
  });
}

export function useApproveMemberShare() {
  const qc = useQueryClient();
  return useMutation<MemberShare, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.post<ApiEnvelope<MemberShare>>(`/member-shares/${id}/approve`);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: MEMBER_SHARES_KEY }),
  });
}

export function useRejectMemberShare() {
  const qc = useQueryClient();
  return useMutation<MemberShare, Error, { id: string; reason: string }>({
    mutationFn: async ({ id, reason }) => {
      const { data } = await api.post<ApiEnvelope<MemberShare>>(`/member-shares/${id}/reject`, { reason });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: MEMBER_SHARES_KEY }),
  });
}

// ── Member Portal ───────────────────────────────────────────────────────

export function useMyShares() {
  return useQuery<MemberSharesResponse>({
    queryKey: ["me", "shares"],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<MemberSharesResponse>>("/me/shares");
      return data.data;
    },
    staleTime: 60_000,
  });
}
```

- [ ] Commit:

```bash
git add frontend/src/lib/api/shares.ts
git commit -m "feat(shares): add frontend API hooks for shares"
```

---

## Task 9: Admin — Share Products config page

**Files:**
- Create: `frontend/src/app/admin/configurations/share-products/page.tsx`

- [ ] Create `frontend/src/app/admin/configurations/share-products/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  useShareProducts, useCreateShareProduct, useUpdateShareProduct, useDeleteShareProduct, ShareProduct,
} from "@/lib/api/shares";
import { useChartOfAccounts } from "@/lib/api/chart-of-accounts";
import { extractApiError, extractFieldErrors } from "@/lib/api";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ColumnDef } from "@tanstack/react-table";

export default function ShareProductsPage() {
  const { data: products = [], isLoading } = useShareProducts();
  const { data: accounts = [] } = useChartOfAccounts();
  const createMut  = useCreateShareProduct();
  const updateMut  = useUpdateShareProduct();
  const deleteMut  = useDeleteShareProduct();

  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<ShareProduct | null>(null);
  const [errors, setErrors]   = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    name: "", price_per_share: "", min_shares: "1", max_shares: "",
    share_capital_account_id: "", is_active: true,
  });

  function openCreate() {
    setEditing(null);
    setForm({ name: "", price_per_share: "", min_shares: "1", max_shares: "", share_capital_account_id: "", is_active: true });
    setErrors({});
    setOpen(true);
  }

  function openEdit(p: ShareProduct) {
    setEditing(p);
    setForm({
      name: p.name,
      price_per_share: p.price_per_share,
      min_shares: String(p.min_shares),
      max_shares: p.max_shares ? String(p.max_shares) : "",
      share_capital_account_id: p.share_capital_account_id ?? "",
      is_active: p.is_active,
    });
    setErrors({});
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    const payload = {
      name: form.name,
      price_per_share: form.price_per_share,
      min_shares: Number(form.min_shares),
      max_shares: form.max_shares ? Number(form.max_shares) : null,
      share_capital_account_id: form.share_capital_account_id || null,
      is_active: form.is_active,
    };
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, ...payload });
        toast.success("Share product updated.");
      } else {
        await createMut.mutateAsync(payload);
        toast.success("Share product created.");
      }
      setOpen(false);
    } catch (err) {
      const fieldErrs = extractFieldErrors(err);
      if (Object.keys(fieldErrs).length) { setErrors(fieldErrs); return; }
      toast.error(extractApiError(err));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this share product?")) return;
    try {
      await deleteMut.mutateAsync(id);
      toast.success("Deleted.");
    } catch (err) {
      toast.error(extractApiError(err));
    }
  }

  const columns: ColumnDef<ShareProduct>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "price_per_share", header: "Price/Share (BWP)" },
    { accessorKey: "min_shares", header: "Min Shares" },
    { accessorKey: "max_shares", header: "Max Shares", cell: ({ row }) => row.original.max_shares ?? "—" },
    { accessorKey: "is_active", header: "Active", cell: ({ row }) => row.original.is_active ? "Yes" : "No" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openEdit(row.original)}>Edit</Button>
          <Button size="sm" variant="destructive" onClick={() => handleDelete(row.original.id)}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Share Products</h1>
        <Button onClick={openCreate}>+ New Share Product</Button>
      </div>

      <DataTable columns={columns} data={products} isLoading={isLoading} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Share Product" : "New Share Product"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
            </div>
            <div>
              <Label>Price per Share (BWP)</Label>
              <Input type="number" step="0.01" value={form.price_per_share}
                onChange={e => setForm(f => ({ ...f, price_per_share: e.target.value }))} required />
              {errors.price_per_share && <p className="text-red-500 text-xs">{errors.price_per_share}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Min Shares</Label>
                <Input type="number" min="1" value={form.min_shares}
                  onChange={e => setForm(f => ({ ...f, min_shares: e.target.value }))} required />
              </div>
              <div>
                <Label>Max Shares (optional)</Label>
                <Input type="number" min="1" value={form.max_shares}
                  onChange={e => setForm(f => ({ ...f, max_shares: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Share Capital Account (optional)</Label>
              <select
                className="w-full border rounded p-2 text-sm"
                value={form.share_capital_account_id}
                onChange={e => setForm(f => ({ ...f, share_capital_account_id: e.target.value }))}
              >
                <option value="">— None —</option>
                {accounts.map((a: { id: string; name: string; code: string }) => (
                  <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_active" checked={form.is_active}
                onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
              <Label htmlFor="is_active">Active</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
                {editing ? "Update" : "Create"}
              </Button>
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
git add frontend/src/app/admin/configurations/share-products/page.tsx
git commit -m "feat(shares): add admin share products configuration page"
```

---

## Task 10: Admin — All Member Shares page

**Files:**
- Create: `frontend/src/app/admin/shares/page.tsx`

- [ ] Create `frontend/src/app/admin/shares/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  useMemberShares, useCreateMemberShare, useApproveMemberShare, useRejectMemberShare,
  useShareProducts, MemberShare,
} from "@/lib/api/shares";
import { useMembers } from "@/lib/api/members";
import { extractApiError, extractFieldErrors } from "@/lib/api";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ColumnDef } from "@tanstack/react-table";

const fmt = (v: string) =>
  new Intl.NumberFormat("en-BW", { style: "currency", currency: "BWP" }).format(Number(v));

export default function AdminSharesPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const { data, isLoading } = useMemberShares({ status: statusFilter || undefined, per_page: 50 });
  const { data: products = [] } = useShareProducts();
  const { data: membersData } = useMembers({ per_page: 200 });
  const members = membersData?.data ?? [];

  const createMut  = useCreateMemberShare();
  const approveMut = useApproveMemberShare();
  const rejectMut  = useRejectMemberShare();

  const [open, setOpen]         = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectId, setRejectId] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [errors, setErrors]     = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    member_id: "", share_product_id: "", quantity: "", purchase_date: "", notes: "",
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    try {
      await createMut.mutateAsync({
        member_id: form.member_id,
        share_product_id: form.share_product_id,
        quantity: Number(form.quantity),
        purchase_date: form.purchase_date || undefined,
        notes: form.notes || undefined,
      });
      toast.success("Share purchase recorded.");
      setOpen(false);
    } catch (err) {
      const fe = extractFieldErrors(err);
      if (Object.keys(fe).length) { setErrors(fe); return; }
      toast.error(extractApiError(err));
    }
  }

  async function handleApprove(id: string) {
    try {
      await approveMut.mutateAsync(id);
      toast.success("Approved.");
    } catch (err) { toast.error(extractApiError(err)); }
  }

  async function handleReject() {
    try {
      await rejectMut.mutateAsync({ id: rejectId, reason: rejectReason });
      toast.success("Rejected.");
      setRejectOpen(false);
    } catch (err) { toast.error(extractApiError(err)); }
  }

  const shares = data?.data ?? [];

  const columns: ColumnDef<MemberShare>[] = [
    { accessorKey: "member.full_name", header: "Member" },
    { accessorKey: "share_product.name", header: "Product" },
    { accessorKey: "quantity", header: "Qty" },
    { accessorKey: "total_amount", header: "Total", cell: ({ row }) => fmt(row.original.total_amount) },
    { accessorKey: "purchase_date", header: "Date" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.original.status;
        return (
          <span className={s === "approved" ? "text-green-600 font-medium" : s === "rejected" ? "text-red-500" : "text-yellow-600"}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        if (row.original.status !== "pending") return null;
        return (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => handleApprove(row.original.id)}>Approve</Button>
            <Button size="sm" variant="destructive" onClick={() => {
              setRejectId(row.original.id);
              setRejectReason("");
              setRejectOpen(true);
            }}>Reject</Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Member Shares</h1>
        <Button onClick={() => { setForm({ member_id: "", share_product_id: "", quantity: "", purchase_date: "", notes: "" }); setErrors({}); setOpen(true); }}>
          + Record Purchase
        </Button>
      </div>

      <div className="flex gap-3 items-center">
        <Label>Status:</Label>
        <select className="border rounded p-1 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <DataTable columns={columns} data={shares} isLoading={isLoading} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Share Purchase</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label>Member</Label>
              <select className="w-full border rounded p-2 text-sm" value={form.member_id}
                onChange={e => setForm(f => ({ ...f, member_id: e.target.value }))} required>
                <option value="">Select member…</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.full_name} ({m.member_number})</option>)}
              </select>
              {errors.member_id && <p className="text-red-500 text-xs">{errors.member_id}</p>}
            </div>
            <div>
              <Label>Share Product</Label>
              <select className="w-full border rounded p-2 text-sm" value={form.share_product_id}
                onChange={e => setForm(f => ({ ...f, share_product_id: e.target.value }))} required>
                <option value="">Select product…</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} (P{p.price_per_share}/share)</option>)}
              </select>
              {errors.share_product_id && <p className="text-red-500 text-xs">{errors.share_product_id}</p>}
            </div>
            <div>
              <Label>Quantity</Label>
              <Input type="number" min="1" value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} required />
              {errors.quantity && <p className="text-red-500 text-xs">{errors.quantity}</p>}
            </div>
            <div>
              <Label>Purchase Date (optional)</Label>
              <Input type="date" value={form.purchase_date}
                onChange={e => setForm(f => ({ ...f, purchase_date: e.target.value }))} />
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMut.isPending}>Record</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Share Purchase</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>Reason</Label>
            <Input value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleReject} disabled={!rejectReason || rejectMut.isPending}>Reject</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] Commit:

```bash
git add frontend/src/app/admin/shares/page.tsx
git commit -m "feat(shares): add admin member shares list page with approve/reject"
```

---

## Task 11: Member portal — Shares page

**Files:**
- Create: `frontend/src/app/member/account-statement/shares/page.tsx`

- [ ] Create `frontend/src/app/member/account-statement/shares/page.tsx`:

```tsx
"use client";

import { useMyShares } from "@/lib/api/shares";
import DataTable from "@/components/DataTable";
import { ColumnDef } from "@tanstack/react-table";

const fmt = (v: string) =>
  new Intl.NumberFormat("en-BW", { style: "currency", currency: "BWP" }).format(Number(v));

export default function MemberSharesPage() {
  const { data, isLoading } = useMyShares();

  const balance  = data?.balance;
  const purchases = data?.purchases ?? [];

  const columns: ColumnDef<(typeof purchases)[number]>[] = [
    { accessorKey: "share_product.name", header: "Product" },
    { accessorKey: "quantity", header: "Qty" },
    { accessorKey: "price_per_share", header: "Price/Share", cell: ({ row }) => fmt(row.original.price_per_share) },
    { accessorKey: "total_amount", header: "Total", cell: ({ row }) => fmt(row.original.total_amount) },
    { accessorKey: "purchase_date", header: "Date" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.original.status;
        return (
          <span className={s === "approved" ? "text-green-600 font-medium" : s === "rejected" ? "text-red-500" : "text-yellow-600"}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </span>
        );
      },
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">My Shares</h1>

      {balance && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {balance.summary.map(s => (
            <div key={s.share_product_id} className="rounded border p-4 space-y-1">
              <p className="text-sm text-gray-500">{s.share_product_name}</p>
              <p className="text-xl font-bold">{s.quantity} shares</p>
              <p className="text-sm">{fmt(s.value)}</p>
            </div>
          ))}
          <div className="rounded border p-4 space-y-1 bg-green-50">
            <p className="text-sm text-gray-500">Total Share Value</p>
            <p className="text-xl font-bold">{fmt(balance.total_value)}</p>
          </div>
        </div>
      )}

      <h2 className="text-lg font-semibold">Purchase History</h2>
      <DataTable columns={columns} data={purchases} isLoading={isLoading} />
    </div>
  );
}
```

- [ ] Commit:

```bash
git add frontend/src/app/member/account-statement/shares/page.tsx
git commit -m "feat(shares): add member portal shares page"
```

---

## Task 12: Sidebar nav + member detail tab

**Files:**
- Modify: `frontend/src/components/Layouts/sidebar/data/index.ts`
- Modify: `frontend/src/app/admin/members/[id]/page.tsx`

- [ ] In `frontend/src/components/Layouts/sidebar/data/index.ts`, add to the CONFIGURATIONS items array (after `Issue Categories`):

```typescript
{ title: "Share Products", url: "/admin/configurations/share-products" },
```

Add to the MAIN MENU, inside the existing `Transactions` group items (after Contributions):

```typescript
{ title: "Member Shares", url: "/admin/shares" },
```

Add to the MEMBER_NAV_DATA, inside the `Account Statement` group items (after Contributions):

```typescript
{ title: "Shares", url: "/member/account-statement/shares" },
```

- [ ] In `frontend/src/app/admin/members/[id]/page.tsx`, add a "Shares" tab that shows the member's share balance. Find the tab list and add a "Shares" tab, then add a tab panel that calls `useMemberShares({ member_id: id })` and renders a simple table of purchases plus total balance.

  The exact implementation depends on the current tab structure in the file. Read the file first, then add a tab following the same pattern as existing tabs (e.g., the Accounts or Loans tab).

  Minimum viable tab panel:

```tsx
// Import at top of file
import { useMemberShares } from "@/lib/api/shares";

// Inside the component, alongside other data hooks
const { data: sharesData } = useMemberShares({ member_id: id });
const memberShares = sharesData?.data ?? [];

// Tab trigger (add alongside other TabsTrigger elements)
<TabsTrigger value="shares">Shares</TabsTrigger>

// Tab panel (add alongside other TabsContent elements)
<TabsContent value="shares">
  <div className="space-y-3">
    <p className="text-sm text-gray-500">
      Total: {memberShares.filter(s => s.status === "approved").length} approved purchase(s)
    </p>
    {memberShares.map(s => (
      <div key={s.id} className="flex justify-between text-sm border-b pb-2">
        <span>{s.share_product?.name} × {s.quantity}</span>
        <span className="font-mono">{fmt(s.total_amount)}</span>
        <span className={s.status === "approved" ? "text-green-600" : s.status === "rejected" ? "text-red-500" : "text-yellow-600"}>
          {s.status}
        </span>
      </div>
    ))}
    {memberShares.length === 0 && <p className="text-gray-400 text-sm">No share purchases.</p>}
  </div>
</TabsContent>
```

- [ ] Run TypeScript check:

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] Commit:

```bash
git add frontend/src/components/Layouts/sidebar/data/index.ts \
        frontend/src/app/admin/members/[id]/page.tsx
git commit -m "feat(shares): wire shares into sidebar nav and member detail tab"
```

---

## Task 13: Verify useChartOfAccounts hook exists

The Share Products page imports `useChartOfAccounts` from `@/lib/api/chart-of-accounts`. Verify this hook exists:

- [ ] Run:

```bash
grep -r "useChartOfAccounts" frontend/src/lib/api/
```

If it doesn't exist, create `frontend/src/lib/api/chart-of-accounts.ts`:

```typescript
import { useQuery } from "@tanstack/react-query";
import { api, ApiEnvelope } from "@/lib/api";

export interface ChartOfAccount {
  id: string;
  code: string;
  name: string;
  account_type: string;
}

export const COA_KEY = ["chart-of-accounts"] as const;

export function useChartOfAccounts() {
  return useQuery<ChartOfAccount[]>({
    queryKey: COA_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<ChartOfAccount[]>>("/chart-of-accounts");
      return data.data;
    },
    staleTime: 120_000,
  });
}
```

- [ ] Run TypeScript check again to confirm all clear:

```bash
cd frontend && npx tsc --noEmit
```

- [ ] Commit if the hook file was created:

```bash
git add frontend/src/lib/api/chart-of-accounts.ts
git commit -m "feat(shares): add useChartOfAccounts hook if missing"
```

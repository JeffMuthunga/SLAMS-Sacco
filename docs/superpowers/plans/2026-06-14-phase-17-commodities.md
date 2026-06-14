# Phase 17: Commodities Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable members to request goods (commodities) on credit from the SACCO. Admin manages stock and approves/issues requests. The existing "My Commodities" nav entry on the member portal becomes a working page.

**Architecture:** `CommodityType` (category) → `Commodity` (item with price + stock) → `CommodityRequest` + `CommodityRequestItem` (member's request with line items). `CommodityService` handles create/approve/reject/issue. Repayment is manual in V1 (admin marks as `repaid`).

**Tech Stack:** Laravel 12, PostgreSQL (uuid PKs, soft deletes, bcmath for money), Next.js 16, React Query, shadcn/ui, TanStack Table.

---

## File Map

**Create (backend):**
- `backend/database/migrations/2026_06_14_220000_create_commodity_types_table.php`
- `backend/database/migrations/2026_06_14_220001_create_commodities_table.php`
- `backend/database/migrations/2026_06_14_220002_create_commodity_requests_table.php`
- `backend/database/migrations/2026_06_14_220003_create_commodity_request_items_table.php`
- `backend/app/Models/CommodityType.php`
- `backend/app/Models/Commodity.php`
- `backend/app/Models/CommodityRequest.php`
- `backend/app/Models/CommodityRequestItem.php`
- `backend/app/Services/CommodityService.php`
- `backend/app/Http/Controllers/Api/V1/Configurations/CommodityTypeController.php`
- `backend/app/Http/Controllers/Api/V1/Configurations/CommodityController.php`
- `backend/app/Http/Controllers/Api/V1/CommodityRequestController.php`
- `backend/app/Http/Resources/V1/CommodityTypeResource.php`
- `backend/app/Http/Resources/V1/CommodityResource.php`
- `backend/app/Http/Resources/V1/CommodityRequestResource.php`

**Modify (backend):**
- `backend/routes/api.php`
- `backend/database/seeders/RbacSeeder.php` — add `manage_commodities`
- `backend/app/Http/Controllers/Api/V1/MemberPortalController.php`

**Create (frontend):**
- `frontend/src/lib/api/commodities.ts`
- `frontend/src/app/admin/configurations/commodity-types/page.tsx`
- `frontend/src/app/admin/configurations/commodities/page.tsx`
- `frontend/src/app/admin/commodities/requests/page.tsx`
- `frontend/src/app/member/service-desk/commodities/page.tsx`

**Modify (frontend):**
- `frontend/src/components/Layouts/sidebar/data/index.ts`

---

## Task 1: Database migrations

- [ ] Create `backend/database/migrations/2026_06_14_220000_create_commodity_types_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commodity_types', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->string('name', 120);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void { Schema::dropIfExists('commodity_types'); }
};
```

- [ ] Create `backend/database/migrations/2026_06_14_220001_create_commodities_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commodities', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('commodity_type_id')->constrained('commodity_types')->cascadeOnDelete();
            $table->string('name', 120);
            $table->decimal('unit_price', 15, 2);
            $table->integer('stock_quantity')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void { Schema::dropIfExists('commodities'); }
};
```

- [ ] Create `backend/database/migrations/2026_06_14_220002_create_commodity_requests_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commodity_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('member_id')->constrained('members')->cascadeOnDelete();
            $table->string('request_number', 20)->unique();
            $table->string('status', 20)->default('pending'); // pending|approved|rejected|issued|repaid
            $table->decimal('total_amount', 15, 2)->default('0.00');
            $table->integer('repayment_period')->nullable(); // months, informational only in V1
            $table->foreignUuid('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('issued_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void { Schema::dropIfExists('commodity_requests'); }
};
```

- [ ] Create `backend/database/migrations/2026_06_14_220003_create_commodity_request_items_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commodity_request_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('org_id')->constrained('orgs')->cascadeOnDelete();
            $table->foreignUuid('commodity_request_id')->constrained('commodity_requests')->cascadeOnDelete();
            $table->foreignUuid('commodity_id')->constrained('commodities')->cascadeOnDelete();
            $table->integer('quantity');
            $table->decimal('unit_price', 15, 2); // snapshot at request time
            $table->decimal('subtotal', 15, 2);
            $table->timestamps();
        });
    }

    public function down(): void { Schema::dropIfExists('commodity_request_items'); }
};
```

- [ ] Run migrations:

```bash
cd backend && php artisan migrate
```

- [ ] Commit:

```bash
git add backend/database/migrations/2026_06_14_220000_create_commodity_types_table.php \
        backend/database/migrations/2026_06_14_220001_create_commodities_table.php \
        backend/database/migrations/2026_06_14_220002_create_commodity_requests_table.php \
        backend/database/migrations/2026_06_14_220003_create_commodity_request_items_table.php
git commit -m "feat(commodities): add commodity migrations"
```

---

## Task 2: Models

- [ ] Create `backend/app/Models/CommodityType.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class CommodityType extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = ['org_id', 'name'];

    public function commodities(): HasMany
    {
        return $this->hasMany(Commodity::class);
    }
}
```

- [ ] Create `backend/app/Models/Commodity.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Commodity extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'commodity_type_id', 'name', 'unit_price', 'stock_quantity', 'is_active',
    ];

    protected function casts(): array
    {
        return ['unit_price' => 'decimal:2', 'is_active' => 'boolean'];
    }

    public function commodityType(): BelongsTo
    {
        return $this->belongsTo(CommodityType::class);
    }
}
```

- [ ] Create `backend/app/Models/CommodityRequest.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class CommodityRequest extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'member_id', 'request_number', 'status', 'total_amount',
        'repayment_period', 'approved_by', 'approved_at', 'issued_at', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'total_amount'  => 'decimal:2',
            'approved_at'   => 'datetime',
            'issued_at'     => 'datetime',
        ];
    }

    public function member(): BelongsTo   { return $this->belongsTo(Member::class); }
    public function approvedBy(): BelongsTo { return $this->belongsTo(User::class, 'approved_by'); }

    public function items(): HasMany
    {
        return $this->hasMany(CommodityRequestItem::class);
    }
}
```

- [ ] Create `backend/app/Models/CommodityRequestItem.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommodityRequestItem extends Model
{
    use HasUuids;

    protected $fillable = [
        'org_id', 'commodity_request_id', 'commodity_id', 'quantity', 'unit_price', 'subtotal',
    ];

    protected function casts(): array
    {
        return ['unit_price' => 'decimal:2', 'subtotal' => 'decimal:2'];
    }

    public function commodity(): BelongsTo { return $this->belongsTo(Commodity::class); }
    public function request(): BelongsTo   { return $this->belongsTo(CommodityRequest::class, 'commodity_request_id'); }
}
```

- [ ] Commit:

```bash
git add backend/app/Models/CommodityType.php backend/app/Models/Commodity.php \
        backend/app/Models/CommodityRequest.php backend/app/Models/CommodityRequestItem.php
git commit -m "feat(commodities): add commodity models"
```

---

## Task 3: Resources

- [ ] Create `backend/app/Http/Resources/V1/CommodityTypeResource.php`:

```php
<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommodityTypeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'name'       => $this->name,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
```

- [ ] Create `backend/app/Http/Resources/V1/CommodityResource.php`:

```php
<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommodityResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'commodity_type_id' => $this->commodity_type_id,
            'commodity_type'    => $this->whenLoaded('commodityType', fn () => [
                'id'   => $this->commodityType->id,
                'name' => $this->commodityType->name,
            ]),
            'name'              => $this->name,
            'unit_price'        => $this->unit_price,
            'stock_quantity'    => $this->stock_quantity,
            'is_active'         => $this->is_active,
            'created_at'        => $this->created_at?->toIso8601String(),
        ];
    }
}
```

- [ ] Create `backend/app/Http/Resources/V1/CommodityRequestResource.php`:

```php
<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommodityRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'request_number'   => $this->request_number,
            'status'           => $this->status,
            'total_amount'     => $this->total_amount,
            'repayment_period' => $this->repayment_period,
            'notes'            => $this->notes,
            'approved_at'      => $this->approved_at?->toIso8601String(),
            'issued_at'        => $this->issued_at?->toIso8601String(),
            'member'           => $this->whenLoaded('member', fn () => [
                'id'            => $this->member->id,
                'full_name'     => $this->member->full_name,
                'member_number' => $this->member->member_number,
            ]),
            'items'            => $this->whenLoaded('items', fn () =>
                $this->items->map(fn ($item) => [
                    'id'          => $item->id,
                    'commodity'   => $item->commodity ? [
                        'id'   => $item->commodity->id,
                        'name' => $item->commodity->name,
                    ] : null,
                    'quantity'    => $item->quantity,
                    'unit_price'  => $item->unit_price,
                    'subtotal'    => $item->subtotal,
                ])
            ),
            'created_at'       => $this->created_at?->toIso8601String(),
        ];
    }
}
```

- [ ] Commit:

```bash
git add backend/app/Http/Resources/V1/CommodityTypeResource.php \
        backend/app/Http/Resources/V1/CommodityResource.php \
        backend/app/Http/Resources/V1/CommodityRequestResource.php
git commit -m "feat(commodities): add commodity resources"
```

---

## Task 4: CommodityService

- [ ] Create `backend/app/Services/CommodityService.php`:

```php
<?php

namespace App\Services;

use App\Models\Commodity;
use App\Models\CommodityRequest;
use App\Models\CommodityRequestItem;
use App\Models\Member;
use Illuminate\Support\Facades\DB;

class CommodityService
{
    private function generateRequestNumber(string $orgId): string
    {
        $year   = now()->year;
        $prefix = "CMR-{$year}-";
        $last   = CommodityRequest::withTrashed()
            ->where('org_id', $orgId)
            ->where('request_number', 'like', $prefix . '%')
            ->max('request_number');
        $next = $last ? ((int) substr($last, -4)) + 1 : 1;
        return $prefix . str_pad($next, 4, '0', STR_PAD_LEFT);
    }

    /**
     * @param array $items  Each item: ['commodity_id', 'quantity']
     */
    public function createRequest(Member $member, array $items, ?int $repaymentPeriod, string $orgId): CommodityRequest
    {
        abort_if(empty($items), 422, 'At least one item is required.');

        return DB::transaction(function () use ($member, $items, $repaymentPeriod, $orgId) {
            $request = CommodityRequest::create([
                'org_id'           => $orgId,
                'member_id'        => $member->id,
                'request_number'   => $this->generateRequestNumber($orgId),
                'status'           => 'pending',
                'total_amount'     => '0.00',
                'repayment_period' => $repaymentPeriod,
            ]);

            $total = '0.00';

            foreach ($items as $line) {
                $commodity = Commodity::where('org_id', $orgId)
                    ->where('is_active', true)
                    ->findOrFail($line['commodity_id']);

                $qty      = (int) $line['quantity'];
                $subtotal = bcmul((string) $commodity->unit_price, (string) $qty, 2);

                CommodityRequestItem::create([
                    'org_id'               => $orgId,
                    'commodity_request_id' => $request->id,
                    'commodity_id'         => $commodity->id,
                    'quantity'             => $qty,
                    'unit_price'           => (string) $commodity->unit_price,
                    'subtotal'             => $subtotal,
                ]);

                $total = bcadd($total, $subtotal, 2);
            }

            $request->update(['total_amount' => $total]);

            return $request->load(['member', 'items.commodity']);
        });
    }

    public function approve(CommodityRequest $request, $user): CommodityRequest
    {
        abort_unless($request->status === 'pending', 422, 'Only pending requests can be approved.');

        $request->update([
            'status'      => 'approved',
            'approved_by' => $user->id,
            'approved_at' => now(),
        ]);

        return $request->fresh()->load(['member', 'items.commodity']);
    }

    public function reject(CommodityRequest $request, string $reason): CommodityRequest
    {
        abort_unless($request->status === 'pending', 422, 'Only pending requests can be rejected.');

        $request->update(['status' => 'rejected', 'notes' => $reason]);

        return $request->fresh()->load(['member', 'items.commodity']);
    }

    public function issue(CommodityRequest $request): CommodityRequest
    {
        abort_unless($request->status === 'approved', 422, 'Only approved requests can be issued.');

        DB::transaction(function () use ($request) {
            // Decrement stock for each item
            foreach ($request->items as $item) {
                $commodity = Commodity::lockForUpdate()->findOrFail($item->commodity_id);
                abort_if(
                    $commodity->stock_quantity < $item->quantity,
                    422,
                    "Insufficient stock for {$commodity->name}. Available: {$commodity->stock_quantity}."
                );
                $commodity->decrement('stock_quantity', $item->quantity);
            }

            $request->update(['status' => 'issued', 'issued_at' => now()]);
        });

        return $request->fresh()->load(['member', 'items.commodity']);
    }

    public function markRepaid(CommodityRequest $request): CommodityRequest
    {
        abort_unless($request->status === 'issued', 422, 'Only issued requests can be marked as repaid.');
        $request->update(['status' => 'repaid']);
        return $request->fresh()->load(['member', 'items.commodity']);
    }
}
```

- [ ] Commit:

```bash
git add backend/app/Services/CommodityService.php
git commit -m "feat(commodities): add CommodityService"
```

---

## Task 5: Controllers, Routes, RBAC

- [ ] Create `backend/app/Http/Controllers/Api/V1/Configurations/CommodityTypeController.php`:

```php
<?php

namespace App\Http\Controllers\Api\V1\Configurations;

use App\Http\Resources\V1\CommodityTypeResource;
use App\Models\CommodityType;

class CommodityTypeController extends BaseCrudController
{
    protected function modelClass(): string    { return CommodityType::class; }
    protected function resourceClass(): string { return CommodityTypeResource::class; }

    protected function storeRules(string $orgId): array
    {
        return ['name' => ['required', 'string', 'max:120']];
    }

    protected function updateRules(string $id, string $orgId): array
    {
        return $this->storeRules($orgId);
    }
}
```

- [ ] Create `backend/app/Http/Controllers/Api/V1/Configurations/CommodityController.php`:

```php
<?php

namespace App\Http\Controllers\Api\V1\Configurations;

use App\Http\Resources\V1\CommodityResource;
use App\Models\Commodity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommodityController extends BaseCrudController
{
    protected function modelClass(): string    { return Commodity::class; }
    protected function resourceClass(): string { return CommodityResource::class; }

    public function index(Request $request): JsonResponse
    {
        $items = Commodity::where('org_id', $request->user()->org_id)
            ->with('commodityType')
            ->get();
        return $this->respond(CommodityResource::collection($items), 'Retrieved successfully.');
    }

    protected function storeRules(string $orgId): array
    {
        return [
            'commodity_type_id' => ['required', 'uuid', 'exists:commodity_types,id'],
            'name'              => ['required', 'string', 'max:120'],
            'unit_price'        => ['required', 'numeric', 'min:0'],
            'stock_quantity'    => ['integer', 'min:0'],
            'is_active'         => ['boolean'],
        ];
    }

    protected function updateRules(string $id, string $orgId): array
    {
        return $this->storeRules($orgId);
    }
}
```

- [ ] Create `backend/app/Http/Controllers/Api/V1/CommodityRequestController.php`:

```php
<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\V1\CommodityRequestResource;
use App\Models\CommodityRequest;
use App\Models\Member;
use App\Services\CommodityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommodityRequestController extends ApiController
{
    public function __construct(private CommodityService $commodityService) {}

    public function index(Request $request): JsonResponse
    {
        $query = CommodityRequest::where('org_id', $request->user()->org_id)
            ->with(['member', 'items.commodity'])
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('member_id')) {
            $query->where('member_id', $request->member_id);
        }

        $results = $query->paginate($request->integer('per_page', 25));

        return $this->respond(
            CommodityRequestResource::collection($results)->response()->getData(true)
        );
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $req = CommodityRequest::where('org_id', $request->user()->org_id)
            ->with(['member', 'items.commodity'])
            ->findOrFail($id);

        return $this->respond(new CommodityRequestResource($req));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'member_id'        => ['required', 'uuid', 'exists:members,id'],
            'items'            => ['required', 'array', 'min:1'],
            'items.*.commodity_id' => ['required', 'uuid', 'exists:commodities,id'],
            'items.*.quantity'     => ['required', 'integer', 'min:1'],
            'repayment_period' => ['nullable', 'integer', 'min:1'],
        ]);

        $member = Member::where('org_id', $request->user()->org_id)->findOrFail($data['member_id']);
        $req    = $this->commodityService->createRequest(
            $member,
            $data['items'],
            $data['repayment_period'] ?? null,
            $request->user()->org_id
        );

        return $this->respondCreated(new CommodityRequestResource($req), 'Commodity request created.');
    }

    public function approve(Request $request, string $id): JsonResponse
    {
        $req = CommodityRequest::where('org_id', $request->user()->org_id)->findOrFail($id);
        $req = $this->commodityService->approve($req, $request->user());

        return $this->respond(new CommodityRequestResource($req), 'Request approved.');
    }

    public function reject(Request $request, string $id): JsonResponse
    {
        $data = $request->validate(['reason' => ['required', 'string', 'max:500']]);
        $req  = CommodityRequest::where('org_id', $request->user()->org_id)->findOrFail($id);
        $req  = $this->commodityService->reject($req, $data['reason']);

        return $this->respond(new CommodityRequestResource($req), 'Request rejected.');
    }

    public function issue(Request $request, string $id): JsonResponse
    {
        $req = CommodityRequest::where('org_id', $request->user()->org_id)
            ->with('items')
            ->findOrFail($id);
        $req = $this->commodityService->issue($req);

        return $this->respond(new CommodityRequestResource($req), 'Items issued.');
    }

    public function markRepaid(Request $request, string $id): JsonResponse
    {
        $req = CommodityRequest::where('org_id', $request->user()->org_id)->findOrFail($id);
        $req = $this->commodityService->markRepaid($req);

        return $this->respond(new CommodityRequestResource($req), 'Marked as repaid.');
    }
}
```

- [ ] Add `manage_commodities` to `RbacSeeder.php` and include in admin `syncPermissions`.

- [ ] Add routes to `api.php`:

Inside `manage_configurations` group:
```php
Route::apiResource('commodity-types', \App\Http\Controllers\Api\V1\Configurations\CommodityTypeController::class);
Route::apiResource('commodities',      \App\Http\Controllers\Api\V1\Configurations\CommodityController::class);
```

New `manage_commodities` group:
```php
Route::middleware(['auth:sanctum', 'permission:manage_commodities'])->group(function () {
    Route::get('commodity-requests',              [\App\Http\Controllers\Api\V1\CommodityRequestController::class, 'index']);
    Route::post('commodity-requests',             [\App\Http\Controllers\Api\V1\CommodityRequestController::class, 'store']);
    Route::get('commodity-requests/{id}',         [\App\Http\Controllers\Api\V1\CommodityRequestController::class, 'show']);
    Route::post('commodity-requests/{id}/approve',    [\App\Http\Controllers\Api\V1\CommodityRequestController::class, 'approve']);
    Route::post('commodity-requests/{id}/reject',     [\App\Http\Controllers\Api\V1\CommodityRequestController::class, 'reject']);
    Route::post('commodity-requests/{id}/issue',      [\App\Http\Controllers\Api\V1\CommodityRequestController::class, 'issue']);
    Route::post('commodity-requests/{id}/mark-repaid',[\App\Http\Controllers\Api\V1\CommodityRequestController::class, 'markRepaid']);
});
```

- [ ] Re-run seeder:

```bash
cd backend && php artisan db:seed --class=RbacSeeder
```

- [ ] Commit:

```bash
git add backend/app/Http/Controllers/Api/V1/Configurations/CommodityTypeController.php \
        backend/app/Http/Controllers/Api/V1/Configurations/CommodityController.php \
        backend/app/Http/Controllers/Api/V1/CommodityRequestController.php \
        backend/routes/api.php \
        backend/database/seeders/RbacSeeder.php
git commit -m "feat(commodities): add controllers, routes, manage_commodities permission"
```

---

## Task 6: Member portal endpoint

- [ ] Add imports to `MemberPortalController.php`:

```php
use App\Models\CommodityRequest;
use App\Http\Resources\V1\CommodityRequestResource;
use App\Models\Commodity;
use App\Http\Resources\V1\CommodityResource;
use App\Services\CommodityService;
```

- [ ] Add `CommodityService` to constructor injection:

```php
private CommodityService $commodityService,
```

- [ ] Add methods to `MemberPortalController`:

```php
public function myCommodities(Request $request): JsonResponse
{
    $member = $this->resolveMember($request);

    $requests = CommodityRequest::where('org_id', $request->user()->org_id)
        ->where('member_id', $member->id)
        ->with(['items.commodity'])
        ->latest()
        ->get();

    $available = Commodity::where('org_id', $request->user()->org_id)
        ->where('is_active', true)
        ->where('stock_quantity', '>', 0)
        ->with('commodityType')
        ->get();

    return $this->respond([
        'requests'  => CommodityRequestResource::collection($requests),
        'available' => CommodityResource::collection($available),
    ]);
}

public function createCommodityRequest(Request $request): JsonResponse
{
    $member = $this->resolveMember($request);

    $data = $request->validate([
        'items'            => ['required', 'array', 'min:1'],
        'items.*.commodity_id' => ['required', 'uuid', 'exists:commodities,id'],
        'items.*.quantity'     => ['required', 'integer', 'min:1'],
        'repayment_period' => ['nullable', 'integer', 'min:1'],
    ]);

    $req = $this->commodityService->createRequest(
        $member,
        $data['items'],
        $data['repayment_period'] ?? null,
        $request->user()->org_id
    );

    return $this->respondCreated(new CommodityRequestResource($req), 'Commodity request submitted.');
}
```

- [ ] Add routes in `api.php` inside `/me` group:

```php
Route::get('commodities',  [MemberPortalController::class, 'myCommodities']);
Route::post('commodities', [MemberPortalController::class, 'createCommodityRequest']);
```

- [ ] Commit:

```bash
git add backend/app/Http/Controllers/Api/V1/MemberPortalController.php \
        backend/routes/api.php
git commit -m "feat(commodities): add GET/POST /me/commodities member portal endpoints"
```

---

## Task 7: Frontend API hooks

- [ ] Create `frontend/src/lib/api/commodities.ts`:

```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiEnvelope, ApiMeta } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────

export interface CommodityType { id: string; name: string; created_at: string; }

export interface Commodity {
  id: string;
  commodity_type_id: string;
  commodity_type: { id: string; name: string } | null;
  name: string;
  unit_price: string;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
}

export interface CommodityRequestItem {
  id: string;
  commodity: { id: string; name: string } | null;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

export interface CommodityRequest {
  id: string;
  request_number: string;
  status: "pending" | "approved" | "rejected" | "issued" | "repaid";
  total_amount: string;
  repayment_period: number | null;
  notes: string | null;
  approved_at: string | null;
  issued_at: string | null;
  member: { id: string; full_name: string; member_number: string } | null;
  items: CommodityRequestItem[];
  created_at: string;
}

export interface MyCommoditiesResponse {
  requests: CommodityRequest[];
  available: Commodity[];
}

// ── Query keys ─────────────────────────────────────────────────────────

export const COMMODITY_TYPES_KEY = ["commodity-types"] as const;
export const COMMODITIES_KEY     = ["commodities"] as const;
export const COMMODITY_REQS_KEY  = ["commodity-requests"] as const;

// ── Commodity Types ─────────────────────────────────────────────────────

export function useCommodityTypes() {
  return useQuery<CommodityType[]>({
    queryKey: COMMODITY_TYPES_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<CommodityType[]>>("/commodity-types");
      return data.data;
    },
    staleTime: 60_000,
  });
}

export function useCreateCommodityType() {
  const qc = useQueryClient();
  return useMutation<CommodityType, Error, { name: string }>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<CommodityType>>("/commodity-types", payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: COMMODITY_TYPES_KEY }),
  });
}

export function useUpdateCommodityType() {
  const qc = useQueryClient();
  return useMutation<CommodityType, Error, { id: string; name: string }>({
    mutationFn: async ({ id, ...p }) => {
      const { data } = await api.put<ApiEnvelope<CommodityType>>(`/commodity-types/${id}`, p);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: COMMODITY_TYPES_KEY }),
  });
}

export function useDeleteCommodityType() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => { await api.delete(`/commodity-types/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: COMMODITY_TYPES_KEY }),
  });
}

// ── Commodities ─────────────────────────────────────────────────────────

export function useCommodities() {
  return useQuery<Commodity[]>({
    queryKey: COMMODITIES_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<Commodity[]>>("/commodities");
      return data.data;
    },
    staleTime: 30_000,
  });
}

export function useCreateCommodity() {
  const qc = useQueryClient();
  return useMutation<Commodity, Error, Partial<Commodity>>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<Commodity>>("/commodities", payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: COMMODITIES_KEY }),
  });
}

export function useUpdateCommodity() {
  const qc = useQueryClient();
  return useMutation<Commodity, Error, { id: string } & Partial<Commodity>>({
    mutationFn: async ({ id, ...p }) => {
      const { data } = await api.put<ApiEnvelope<Commodity>>(`/commodities/${id}`, p);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: COMMODITIES_KEY }),
  });
}

export function useDeleteCommodity() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => { await api.delete(`/commodities/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: COMMODITIES_KEY }),
  });
}

// ── Commodity Requests ──────────────────────────────────────────────────

export function useCommodityRequests(params?: { status?: string; member_id?: string; per_page?: number }) {
  return useQuery<{ data: CommodityRequest[]; meta: ApiMeta }>({
    queryKey: [...COMMODITY_REQS_KEY, params],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<CommodityRequest[]>>("/commodity-requests", { params });
      return { data: data.data, meta: data.meta! };
    },
    staleTime: 30_000,
  });
}

export function useApproveCommodityRequest() {
  const qc = useQueryClient();
  return useMutation<CommodityRequest, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.post<ApiEnvelope<CommodityRequest>>(`/commodity-requests/${id}/approve`);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: COMMODITY_REQS_KEY }),
  });
}

export function useRejectCommodityRequest() {
  const qc = useQueryClient();
  return useMutation<CommodityRequest, Error, { id: string; reason: string }>({
    mutationFn: async ({ id, reason }) => {
      const { data } = await api.post<ApiEnvelope<CommodityRequest>>(`/commodity-requests/${id}/reject`, { reason });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: COMMODITY_REQS_KEY }),
  });
}

export function useIssueCommodityRequest() {
  const qc = useQueryClient();
  return useMutation<CommodityRequest, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.post<ApiEnvelope<CommodityRequest>>(`/commodity-requests/${id}/issue`);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: COMMODITY_REQS_KEY }),
  });
}

export function useMarkCommodityRepaid() {
  const qc = useQueryClient();
  return useMutation<CommodityRequest, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.post<ApiEnvelope<CommodityRequest>>(`/commodity-requests/${id}/mark-repaid`);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: COMMODITY_REQS_KEY }),
  });
}

// ── Member Portal ───────────────────────────────────────────────────────

export function useMyCommodities() {
  return useQuery<MyCommoditiesResponse>({
    queryKey: ["me", "commodities"],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<MyCommoditiesResponse>>("/me/commodities");
      return data.data;
    },
    staleTime: 30_000,
  });
}

export function useCreateMyCommodityRequest() {
  const qc = useQueryClient();
  return useMutation<CommodityRequest, Error, { items: Array<{ commodity_id: string; quantity: number }>; repayment_period?: number }>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<CommodityRequest>>("/me/commodities", payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me", "commodities"] }),
  });
}
```

- [ ] Commit:

```bash
git add frontend/src/lib/api/commodities.ts
git commit -m "feat(commodities): add frontend API hooks"
```

---

## Task 8: Admin configuration pages

- [ ] Create `frontend/src/app/admin/configurations/commodity-types/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useCommodityTypes, useCreateCommodityType, useUpdateCommodityType, useDeleteCommodityType, CommodityType } from "@/lib/api/commodities";
import { extractApiError, extractFieldErrors } from "@/lib/api";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ColumnDef } from "@tanstack/react-table";

export default function CommodityTypesPage() {
  const { data: types = [], isLoading } = useCommodityTypes();
  const createMut = useCreateCommodityType();
  const updateMut = useUpdateCommodityType();
  const deleteMut = useDeleteCommodityType();

  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<CommodityType | null>(null);
  const [name, setName]       = useState("");
  const [errors, setErrors]   = useState<Record<string, string>>({});

  function openCreate() { setEditing(null); setName(""); setErrors({}); setOpen(true); }
  function openEdit(t: CommodityType) { setEditing(t); setName(t.name); setErrors({}); setOpen(true); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, name });
        toast.success("Updated.");
      } else {
        await createMut.mutateAsync({ name });
        toast.success("Created.");
      }
      setOpen(false);
    } catch (err) {
      const fe = extractFieldErrors(err);
      if (Object.keys(fe).length) { setErrors(fe); return; }
      toast.error(extractApiError(err));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this commodity type?")) return;
    try { await deleteMut.mutateAsync(id); toast.success("Deleted."); }
    catch (err) { toast.error(extractApiError(err)); }
  }

  const columns: ColumnDef<CommodityType>[] = [
    { accessorKey: "name", header: "Name" },
    {
      id: "actions", header: "Actions",
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
        <h1 className="text-2xl font-bold">Commodity Types</h1>
        <Button onClick={openCreate}>+ New Type</Button>
      </div>
      <DataTable columns={columns} data={types} isLoading={isLoading} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} Commodity Type</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} required />
              {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
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

- [ ] Create `frontend/src/app/admin/configurations/commodities/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  useCommodities, useCreateCommodity, useUpdateCommodity, useDeleteCommodity, Commodity,
  useCommodityTypes,
} from "@/lib/api/commodities";
import { extractApiError, extractFieldErrors } from "@/lib/api";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ColumnDef } from "@tanstack/react-table";

const fmt = (v: string) =>
  new Intl.NumberFormat("en-BW", { style: "currency", currency: "BWP" }).format(Number(v));

export default function CommoditiesPage() {
  const { data: commodities = [], isLoading } = useCommodities();
  const { data: types = [] }  = useCommodityTypes();
  const createMut = useCreateCommodity();
  const updateMut = useUpdateCommodity();
  const deleteMut = useDeleteCommodity();

  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<Commodity | null>(null);
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [form, setForm]       = useState({ commodity_type_id: "", name: "", unit_price: "", stock_quantity: "0", is_active: true });

  function openCreate() { setEditing(null); setForm({ commodity_type_id: "", name: "", unit_price: "", stock_quantity: "0", is_active: true }); setErrors({}); setOpen(true); }
  function openEdit(c: Commodity) {
    setEditing(c);
    setForm({ commodity_type_id: c.commodity_type_id, name: c.name, unit_price: c.unit_price, stock_quantity: String(c.stock_quantity), is_active: c.is_active });
    setErrors({}); setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    const payload = { commodity_type_id: form.commodity_type_id, name: form.name, unit_price: form.unit_price, stock_quantity: Number(form.stock_quantity), is_active: form.is_active };
    try {
      if (editing) { await updateMut.mutateAsync({ id: editing.id, ...payload }); toast.success("Updated."); }
      else { await createMut.mutateAsync(payload); toast.success("Created."); }
      setOpen(false);
    } catch (err) {
      const fe = extractFieldErrors(err);
      if (Object.keys(fe).length) { setErrors(fe); return; }
      toast.error(extractApiError(err));
    }
  }

  const columns: ColumnDef<Commodity>[] = [
    { accessorKey: "commodity_type.name", header: "Type" },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "unit_price", header: "Price", cell: ({ row }) => fmt(row.original.unit_price) },
    { accessorKey: "stock_quantity", header: "Stock" },
    { accessorKey: "is_active", header: "Active", cell: ({ row }) => row.original.is_active ? "Yes" : "No" },
    {
      id: "actions", header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openEdit(row.original)}>Edit</Button>
          <Button size="sm" variant="destructive" onClick={async () => {
            if (!confirm("Delete?")) return;
            try { await deleteMut.mutateAsync(row.original.id); toast.success("Deleted."); }
            catch (err) { toast.error(extractApiError(err)); }
          }}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Commodities</h1>
        <Button onClick={openCreate}>+ New Commodity</Button>
      </div>
      <DataTable columns={columns} data={commodities} isLoading={isLoading} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} Commodity</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Type</Label>
              <select className="w-full border rounded p-2 text-sm" value={form.commodity_type_id}
                onChange={e => setForm(f => ({ ...f, commodity_type_id: e.target.value }))} required>
                <option value="">Select type…</option>
                {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
            <div><Label>Unit Price (BWP)</Label><Input type="number" step="0.01" min="0" value={form.unit_price} onChange={e => setForm(f => ({ ...f, unit_price: e.target.value }))} required /></div>
            <div><Label>Stock Quantity</Label><Input type="number" min="0" value={form.stock_quantity} onChange={e => setForm(f => ({ ...f, stock_quantity: e.target.value }))} /></div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
              <Label>Active</Label>
            </div>
            {Object.entries(errors).map(([k, v]) => <p key={k} className="text-red-500 text-xs">{v}</p>)}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>{editing ? "Update" : "Create"}</Button>
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
git add frontend/src/app/admin/configurations/commodity-types/page.tsx \
        frontend/src/app/admin/configurations/commodities/page.tsx
git commit -m "feat(commodities): add admin configuration pages for commodity types and commodities"
```

---

## Task 9: Admin requests page

- [ ] Create `frontend/src/app/admin/commodities/requests/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  useCommodityRequests, useApproveCommodityRequest, useRejectCommodityRequest,
  useIssueCommodityRequest, useMarkCommodityRepaid, CommodityRequest,
} from "@/lib/api/commodities";
import { extractApiError } from "@/lib/api";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ColumnDef } from "@tanstack/react-table";

const fmt = (v: string) =>
  new Intl.NumberFormat("en-BW", { style: "currency", currency: "BWP" }).format(Number(v));

const STATUS_COLOR: Record<string, string> = {
  pending:  "text-yellow-600",
  approved: "text-blue-600 font-medium",
  rejected: "text-red-500",
  issued:   "text-green-600 font-medium",
  repaid:   "text-gray-500",
};

export default function CommodityRequestsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const { data, isLoading } = useCommodityRequests({ status: statusFilter || undefined, per_page: 50 });
  const approveMut  = useApproveCommodityRequest();
  const rejectMut   = useRejectCommodityRequest();
  const issueMut    = useIssueCommodityRequest();
  const repaidMut   = useMarkCommodityRepaid();

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectId, setRejectId]     = useState("");
  const [rejectReason, setRejectReason] = useState("");

  async function handleApprove(id: string) {
    try { await approveMut.mutateAsync(id); toast.success("Approved."); }
    catch (err) { toast.error(extractApiError(err)); }
  }

  async function handleIssue(id: string) {
    if (!confirm("Issue items? This will deduct stock.")) return;
    try { await issueMut.mutateAsync(id); toast.success("Issued."); }
    catch (err) { toast.error(extractApiError(err)); }
  }

  async function handleRepaid(id: string) {
    try { await repaidMut.mutateAsync(id); toast.success("Marked as repaid."); }
    catch (err) { toast.error(extractApiError(err)); }
  }

  async function handleReject() {
    try {
      await rejectMut.mutateAsync({ id: rejectId, reason: rejectReason });
      toast.success("Rejected.");
      setRejectOpen(false);
    } catch (err) { toast.error(extractApiError(err)); }
  }

  const requests = data?.data ?? [];

  const columns: ColumnDef<CommodityRequest>[] = [
    { accessorKey: "request_number", header: "Ref #" },
    { accessorKey: "member.full_name", header: "Member" },
    { accessorKey: "total_amount", header: "Total", cell: ({ row }) => fmt(row.original.total_amount) },
    {
      id: "items_count", header: "Items",
      cell: ({ row }) => `${row.original.items?.length ?? 0} item(s)`,
    },
    {
      accessorKey: "status", header: "Status",
      cell: ({ row }) => (
        <span className={STATUS_COLOR[row.original.status] ?? ""}>
          {row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1)}
        </span>
      ),
    },
    { accessorKey: "created_at", header: "Requested", cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString("en-BW") },
    {
      id: "actions", header: "Actions",
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="flex gap-1 flex-wrap">
            {r.status === "pending" && (
              <>
                <Button size="sm" onClick={() => handleApprove(r.id)}>Approve</Button>
                <Button size="sm" variant="destructive" onClick={() => { setRejectId(r.id); setRejectReason(""); setRejectOpen(true); }}>Reject</Button>
              </>
            )}
            {r.status === "approved" && (
              <Button size="sm" onClick={() => handleIssue(r.id)}>Issue</Button>
            )}
            {r.status === "issued" && (
              <Button size="sm" variant="outline" onClick={() => handleRepaid(r.id)}>Mark Repaid</Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Commodity Requests</h1>
        <div className="flex items-center gap-2">
          <Label>Status:</Label>
          <select className="border rounded p-1 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            {["pending","approved","rejected","issued","repaid"].map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>
      <DataTable columns={columns} data={requests} isLoading={isLoading} />
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Request</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>Reason</Label>
            <Input value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
              <Button variant="destructive" disabled={!rejectReason || rejectMut.isPending} onClick={handleReject}>Reject</Button>
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
git add frontend/src/app/admin/commodities/requests/page.tsx
git commit -m "feat(commodities): add admin commodity requests page"
```

---

## Task 10: Member portal commodities page + nav

- [ ] Create `frontend/src/app/member/service-desk/commodities/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useMyCommodities, useCreateMyCommodityRequest, Commodity } from "@/lib/api/commodities";
import { extractApiError } from "@/lib/api";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ColumnDef } from "@tanstack/react-table";

const fmt = (v: string) =>
  new Intl.NumberFormat("en-BW", { style: "currency", currency: "BWP" }).format(Number(v));

export default function MemberCommoditiesPage() {
  const { data, isLoading } = useMyCommodities();
  const createMut           = useCreateMyCommodityRequest();

  const available = data?.available ?? [];
  const requests  = data?.requests ?? [];

  const [open, setOpen]     = useState(false);
  const [cart, setCart]     = useState<Array<{ commodity: Commodity; quantity: number }>>([]);
  const [repaymentPeriod, setRepaymentPeriod] = useState("");

  function addToCart(c: Commodity) {
    setCart(prev => {
      const existing = prev.find(i => i.commodity.id === c.id);
      if (existing) {
        return prev.map(i => i.commodity.id === c.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { commodity: c, quantity: 1 }];
    });
  }

  function removeFromCart(id: string) {
    setCart(prev => prev.filter(i => i.commodity.id !== id));
  }

  const cartTotal = cart.reduce((sum, i) => sum + Number(i.commodity.unit_price) * i.quantity, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (cart.length === 0) { toast.error("Add at least one item."); return; }
    try {
      await createMut.mutateAsync({
        items: cart.map(i => ({ commodity_id: i.commodity.id, quantity: i.quantity })),
        repayment_period: repaymentPeriod ? Number(repaymentPeriod) : undefined,
      });
      toast.success("Request submitted.");
      setCart([]);
      setOpen(false);
    } catch (err) { toast.error(extractApiError(err)); }
  }

  const STATUS_COLOR: Record<string, string> = {
    pending: "text-yellow-600", approved: "text-blue-600", rejected: "text-red-500",
    issued: "text-green-600 font-medium", repaid: "text-gray-500",
  };

  const reqColumns: ColumnDef<typeof requests[number]>[] = [
    { accessorKey: "request_number", header: "Ref #" },
    { accessorKey: "total_amount", header: "Total", cell: ({ row }) => fmt(row.original.total_amount) },
    {
      accessorKey: "status", header: "Status",
      cell: ({ row }) => (
        <span className={STATUS_COLOR[row.original.status] ?? ""}>
          {row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1)}
        </span>
      ),
    },
    { accessorKey: "created_at", header: "Requested", cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString("en-BW") },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Commodities</h1>
        <Button onClick={() => { setCart([]); setOpen(true); }}>+ New Request</Button>
      </div>

      <h2 className="text-lg font-semibold">My Requests</h2>
      <DataTable columns={reqColumns} data={requests} isLoading={isLoading} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Request Commodities</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="font-semibold">Available Items</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto">
                {available.map(c => (
                  <div key={c.id} className="border rounded p-2 flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-gray-500">{fmt(c.unit_price)} · {c.stock_quantity} in stock</p>
                    </div>
                    <Button type="button" size="sm" onClick={() => addToCart(c)}>Add</Button>
                  </div>
                ))}
              </div>
            </div>

            {cart.length > 0 && (
              <div>
                <Label className="font-semibold">Your Cart</Label>
                <div className="space-y-1 mt-2">
                  {cart.map(i => (
                    <div key={i.commodity.id} className="flex items-center justify-between text-sm border-b pb-1">
                      <span>{i.commodity.name} × {i.quantity}</span>
                      <span>{fmt(String(Number(i.commodity.unit_price) * i.quantity))}</span>
                      <Button type="button" size="sm" variant="ghost" onClick={() => removeFromCart(i.commodity.id)}>✕</Button>
                    </div>
                  ))}
                  <p className="text-right font-semibold">Total: {fmt(String(cartTotal))}</p>
                </div>
              </div>
            )}

            <div>
              <Label>Repayment Period (months, optional)</Label>
              <Input type="number" min="1" value={repaymentPeriod} onChange={e => setRepaymentPeriod(e.target.value)} />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMut.isPending || cart.length === 0}>Submit Request</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] Add to admin CONFIGURATIONS nav in `sidebar/data/index.ts` (after Issue Categories):

```typescript
{ title: "Commodity Types", url: "/admin/configurations/commodity-types" },
{ title: "Commodities",     url: "/admin/configurations/commodities" },
```

- [ ] Add to admin MAIN MENU under Operations group:

```typescript
{ title: "Commodity Requests", url: "/admin/commodities/requests" },
```

- [ ] Run TypeScript check:

```bash
cd frontend && npx tsc --noEmit
```

- [ ] Commit:

```bash
git add frontend/src/app/member/service-desk/commodities/page.tsx \
        frontend/src/components/Layouts/sidebar/data/index.ts
git commit -m "feat(commodities): add member portal commodities page and nav entries"
```

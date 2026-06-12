# Phase 5: Members Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Members CRUD module — create/read/update/delete members with next-of-kin, photo upload, and an approve/reject workflow.

**Architecture:** Thin Laravel controllers delegate to a MemberService for member-number generation, transactional kin sync, and approval-log writes. The frontend uses React Query hooks for all data fetching; MemberForm is a single shared client component used by both CreateMemberPage and EditMemberPage.

**Tech Stack:** Laravel 12, PostgreSQL (`ilike` for search), Sanctum SPA auth, Storage facade (public disk), React 19, Next.js 16 App Router, React Query v5, TanStack Table, sonner toasts, shadcn/ui, SelectInput/DateInput/NumberInput components.

---

## File Map

**Backend — new files**
- `backend/app/Http/Requests/Api/V1/Member/StoreMemberRequest.php`
- `backend/app/Http/Requests/Api/V1/Member/UpdateMemberRequest.php`
- `backend/app/Http/Resources/V1/MemberKinResource.php`
- `backend/app/Http/Resources/V1/MemberResource.php`
- `backend/app/Http/Controllers/Api/V1/MemberController.php`
- `backend/app/Services/MemberService.php`
- `backend/database/factories/MemberFactory.php`
- `backend/database/factories/OrgFactory.php`
- `backend/tests/Feature/Api/V1/MemberTest.php`

**Backend — modified**
- `backend/routes/api.php` — add members routes under auth:sanctum

**Frontend — new files**
- `frontend/src/lib/api/members.ts`
- `frontend/src/components/Members/ApprovalStatusBadge.tsx`
- `frontend/src/components/Members/KinRow.tsx`
- `frontend/src/components/Members/MemberForm.tsx`
- `frontend/src/components/Members/MembersTable.tsx`
- `frontend/src/app/admin/members/create/page.tsx`
- `frontend/src/app/admin/members/[id]/page.tsx`
- `frontend/src/app/admin/members/[id]/edit/page.tsx`

**Frontend — replaced**
- `frontend/src/app/admin/members/page.tsx` — replace placeholder
- `frontend/src/app/admin/members/archived/page.tsx` — replace placeholder

---

## Task 1: Backend Scaffold (FormRequests, Resources, Routes)

**Files:**
- Create: `backend/app/Http/Requests/Api/V1/Member/StoreMemberRequest.php`
- Create: `backend/app/Http/Requests/Api/V1/Member/UpdateMemberRequest.php`
- Create: `backend/app/Http/Resources/V1/MemberKinResource.php`
- Create: `backend/app/Http/Resources/V1/MemberResource.php`
- Modify: `backend/routes/api.php`

- [x] **Step 1: Create StoreMemberRequest**

```php
<?php
// backend/app/Http/Requests/Api/V1/Member/StoreMemberRequest.php
namespace App\Http\Requests\Api\V1\Member;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $orgId = $this->user()->org_id;

        return [
            'full_name'          => ['required', 'string', 'max:200'],
            'id_number'          => ['required', 'string', 'max:50',
                                     Rule::unique('members', 'id_number')->where('org_id', $orgId)],
            'id_type'            => ['required', Rule::in(['national', 'passport', 'alien', 'military'])],
            'phone'              => ['required', 'string', 'max:20'],
            'date_of_birth'      => ['required', 'date'],
            'entry_date'         => ['required', 'date'],
            'title'              => ['nullable', Rule::in(['Mr', 'Mrs', 'Miss', 'Dr', 'Prof', 'Rev'])],
            'email'              => ['nullable', 'email', 'max:200'],
            'phone2'             => ['nullable', 'string', 'max:20'],
            'gender'             => ['nullable', Rule::in(['M', 'F'])],
            'nationality'        => ['nullable', 'string', 'max:3'],
            'marital_status'     => ['nullable', Rule::in(['single', 'married', 'divorced', 'widowed'])],
            'address'            => ['nullable', 'string'],
            'town'               => ['nullable', 'string', 'max:100'],
            'postal_code'        => ['nullable', 'string', 'max:20'],
            'employed'           => ['nullable', 'boolean'],
            'self_employed'      => ['nullable', 'boolean'],
            'employer_name'      => ['nullable', 'string', 'max:200'],
            'monthly_salary'     => ['nullable', 'numeric', 'min:0'],
            'monthly_net_income' => ['nullable', 'numeric', 'min:0'],
            'kins'               => ['nullable', 'array'],
            'kins.*.full_name'         => ['required', 'string', 'max:200'],
            'kins.*.relationship'      => ['required', 'string', 'max:50'],
            'kins.*.date_of_birth'     => ['nullable', 'date'],
            'kins.*.id_number'         => ['nullable', 'string', 'max:50'],
            'kins.*.id_type'           => ['nullable', Rule::in(['national', 'passport', 'alien', 'military'])],
            'kins.*.phone'             => ['nullable', 'string', 'max:20'],
            'kins.*.is_emergency_contact' => ['nullable', 'boolean'],
            'kins.*.is_beneficiary'    => ['nullable', 'boolean'],
            'kins.*.beneficiary_percent' => ['nullable', 'numeric', 'min:0', 'max:100',
                                             'required_if:kins.*.is_beneficiary,true'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($v) {
            $kins = $this->input('kins', []);
            $total = array_sum(array_map(
                fn($k) => ($k['is_beneficiary'] ?? false) ? (float) ($k['beneficiary_percent'] ?? 0) : 0,
                $kins
            ));
            if ($total > 100) {
                $v->errors()->add('kins', 'Total beneficiary percentage cannot exceed 100%.');
            }
        });
    }
}
```

- [x] **Step 2: Create UpdateMemberRequest**

```php
<?php
// backend/app/Http/Requests/Api/V1/Member/UpdateMemberRequest.php
namespace App\Http\Requests\Api\V1\Member;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $orgId  = $this->user()->org_id;
        $member = $this->route('member');

        return [
            'full_name'          => ['required', 'string', 'max:200'],
            'id_number'          => ['required', 'string', 'max:50',
                                     Rule::unique('members', 'id_number')
                                         ->where('org_id', $orgId)
                                         ->ignore($member)],
            'id_type'            => ['required', Rule::in(['national', 'passport', 'alien', 'military'])],
            'phone'              => ['required', 'string', 'max:20'],
            'date_of_birth'      => ['required', 'date'],
            'entry_date'         => ['required', 'date'],
            'title'              => ['nullable', Rule::in(['Mr', 'Mrs', 'Miss', 'Dr', 'Prof', 'Rev'])],
            'email'              => ['nullable', 'email', 'max:200'],
            'phone2'             => ['nullable', 'string', 'max:20'],
            'gender'             => ['nullable', Rule::in(['M', 'F'])],
            'nationality'        => ['nullable', 'string', 'max:3'],
            'marital_status'     => ['nullable', Rule::in(['single', 'married', 'divorced', 'widowed'])],
            'address'            => ['nullable', 'string'],
            'town'               => ['nullable', 'string', 'max:100'],
            'postal_code'        => ['nullable', 'string', 'max:20'],
            'employed'           => ['nullable', 'boolean'],
            'self_employed'      => ['nullable', 'boolean'],
            'employer_name'      => ['nullable', 'string', 'max:200'],
            'monthly_salary'     => ['nullable', 'numeric', 'min:0'],
            'monthly_net_income' => ['nullable', 'numeric', 'min:0'],
            'kins'               => ['nullable', 'array'],
            'kins.*.id'                => ['nullable', 'uuid'],
            'kins.*.full_name'         => ['required', 'string', 'max:200'],
            'kins.*.relationship'      => ['required', 'string', 'max:50'],
            'kins.*.date_of_birth'     => ['nullable', 'date'],
            'kins.*.id_number'         => ['nullable', 'string', 'max:50'],
            'kins.*.id_type'           => ['nullable', Rule::in(['national', 'passport', 'alien', 'military'])],
            'kins.*.phone'             => ['nullable', 'string', 'max:20'],
            'kins.*.is_emergency_contact' => ['nullable', 'boolean'],
            'kins.*.is_beneficiary'    => ['nullable', 'boolean'],
            'kins.*.beneficiary_percent' => ['nullable', 'numeric', 'min:0', 'max:100',
                                             'required_if:kins.*.is_beneficiary,true'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($v) {
            $kins = $this->input('kins', []);
            $total = array_sum(array_map(
                fn($k) => ($k['is_beneficiary'] ?? false) ? (float) ($k['beneficiary_percent'] ?? 0) : 0,
                $kins
            ));
            if ($total > 100) {
                $v->errors()->add('kins', 'Total beneficiary percentage cannot exceed 100%.');
            }
        });
    }
}
```

- [x] **Step 3: Create MemberKinResource**

```php
<?php
// backend/app/Http/Resources/V1/MemberKinResource.php
namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MemberKinResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                  => $this->id,
            'full_name'           => $this->full_name,
            'relationship'        => $this->relationship,
            'date_of_birth'       => $this->date_of_birth?->toDateString(),
            'id_number'           => $this->id_number,
            'id_type'             => $this->id_type,
            'phone'               => $this->phone,
            'is_emergency_contact' => $this->is_emergency_contact,
            'is_beneficiary'      => $this->is_beneficiary,
            'beneficiary_percent' => $this->beneficiary_percent,
        ];
    }
}
```

- [x] **Step 4: Create MemberResource**

```php
<?php
// backend/app/Http/Resources/V1/MemberResource.php
namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class MemberResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                 => $this->id,
            'member_number'      => $this->member_number,
            'full_name'          => $this->full_name,
            'title'              => $this->title,
            'id_number'          => $this->id_number,
            'id_type'            => $this->id_type,
            'email'              => $this->email,
            'phone'              => $this->phone,
            'phone2'             => $this->phone2,
            'date_of_birth'      => $this->date_of_birth?->toDateString(),
            'gender'             => $this->gender,
            'nationality'        => $this->nationality,
            'marital_status'     => $this->marital_status,
            'address'            => $this->address,
            'town'               => $this->town,
            'postal_code'        => $this->postal_code,
            'photo_url'          => $this->photo_path ? Storage::url($this->photo_path) : null,
            'employed'           => $this->employed,
            'self_employed'      => $this->self_employed,
            'employer_name'      => $this->employer_name,
            'monthly_salary'     => $this->monthly_salary,
            'monthly_net_income' => $this->monthly_net_income,
            'entry_date'         => $this->entry_date?->toDateString(),
            'is_active'          => $this->is_active,
            'approval_status'    => $this->approval_status,
            'approved_by'        => $this->approved_by,
            'approved_at'        => $this->approved_at?->toIso8601String(),
            'terminated_at'      => $this->terminated_at?->toIso8601String(),
            'termination_reason' => $this->termination_reason,
            'org_id'             => $this->org_id,
            'kins'               => MemberKinResource::collection($this->whenLoaded('kins')),
            'created_at'         => $this->created_at?->toIso8601String(),
        ];
    }
}
```

- [x] **Step 5: Implement MemberController methods**

```php
<?php
// backend/app/Http/Controllers/Api/V1/MemberController.php
namespace App\Http\Controllers\Api\V1;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MemberController extends ApiController
{
    public function index(Request $request): JsonResponse   { return $this->respond(null, 'TODO'); }
    public function store(Request $request): JsonResponse   { return $this->respond(null, 'TODO'); }
    public function show(Request $request, string $id): JsonResponse { return $this->respond(null, 'TODO'); }
    public function update(Request $request, string $id): JsonResponse { return $this->respond(null, 'TODO'); }
    public function destroy(Request $request, string $id): JsonResponse { return $this->respond(null, 'TODO'); }
    public function archived(Request $request): JsonResponse { return $this->respond(null, 'TODO'); }
    public function restore(Request $request, string $id): JsonResponse { return $this->respond(null, 'TODO'); }
    public function approve(Request $request, string $id): JsonResponse { return $this->respond(null, 'TODO'); }
    public function reject(Request $request, string $id): JsonResponse { return $this->respond(null, 'TODO'); }
    public function uploadPhoto(Request $request, string $id): JsonResponse { return $this->respond(null, 'TODO'); }
}
```

- [x] **Step 6: Add members routes to api.php**

```php
<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\MemberController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::middleware('throttle:5,1')->group(function () {
            Route::post('login', [AuthController::class, 'login']);
            Route::post('register', [AuthController::class, 'register']);
        });

        Route::middleware('auth:sanctum')->group(function () {
            Route::get('me', [AuthController::class, 'me']);
            Route::put('profile', [AuthController::class, 'updateProfile']);
            Route::post('logout', [AuthController::class, 'logout']);
        });
    });

    Route::middleware('auth:sanctum')->group(function () {
        // archived + action routes BEFORE apiResource so "archived" is never treated as a UUID
        Route::get('members/archived', [MemberController::class, 'archived']);
        Route::post('members/{id}/restore', [MemberController::class, 'restore']);
        Route::post('members/{member}/photo', [MemberController::class, 'uploadPhoto']);
        Route::post('members/{member}/approve', [MemberController::class, 'approve']);
        Route::post('members/{member}/reject', [MemberController::class, 'reject']);
        Route::apiResource('members', MemberController::class);
    });
});
```

- [x] **Step 7: Verify routes resolve**

Run: `cd backend && php artisan route:list --path=members`

Expected: 10 routes listed (archived, restore, photo, approve, reject, index, store, show, update, destroy).

- [x] **Step 8: Run existing tests to confirm nothing broken**

- [x] **Step 3: Run Tests**

`cd backend && php artisan test --filter MemberTest`

Expected: 13 passing tests.

- [x] **Step 4: Commit**

```bash
cd backend
git add app/Http/Requests/Api/V1/Member/ app/Http/Resources/V1/MemberKinResource.php app/Http/Resources/V1/MemberResource.php app/Http/Controllers/Api/V1/MemberController.php routes/api.php
git commit -m "feat(members): scaffold requests, resources, stub controller, routes"
```

---

## Task 2: MemberService

**Files:**
- Create: `backend/app/Services/MemberService.php`
- Create: `backend/database/factories/OrgFactory.php`

- [x] **Step 1: Create OrgFactory (needed by tests in later tasks)**

```php
<?php
// backend/database/factories/OrgFactory.php
namespace Database\Factories;

use App\Models\Org;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrgFactory extends Factory
{
    protected $model = Org::class;

    public function definition(): array
    {
        return [
            'name'         => fake()->company(),
            'full_name'    => fake()->company() . ' Cooperative Society',
            'country_code' => 'KEN',
            'currency_code'=> 'KES',
            'is_active'    => true,
            'is_default'   => false,
        ];
    }
}
```

- [x] **Step 2: Create MemberService**

```php
<?php
// backend/app/Services/MemberService.php
namespace App\Services;

use App\Models\ApprovalLog;
use App\Models\Member;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class MemberService
{
    public function generateMemberNumber(string $orgId): string
    {
        $year   = now()->year;
        $prefix = "MEM-{$year}-";

        $max = Member::withTrashed()
            ->where('org_id', $orgId)
            ->where('member_number', 'like', $prefix . '%')
            ->max('member_number');

        $next = $max ? ((int) substr($max, -4)) + 1 : 1;

        return $prefix . str_pad($next, 4, '0', STR_PAD_LEFT);
    }

    public function store(array $validated, string $orgId): Member
    {
        return DB::transaction(function () use ($validated, $orgId) {
            // Lock existing rows to prevent concurrent duplicate numbers
            Member::withTrashed()
                ->where('org_id', $orgId)
                ->lockForUpdate()
                ->select('member_number')
                ->get();

            $member = Member::create(array_merge(
                Arr::except($validated, ['kins']),
                [
                    'org_id'          => $orgId,
                    'member_number'   => $this->generateMemberNumber($orgId),
                    'approval_status' => 'pending',
                    'is_active'       => true,
                ]
            ));

            foreach ($validated['kins'] ?? [] as $kin) {
                $member->kins()->create(array_merge(
                    Arr::except($kin, ['id']),
                    ['org_id' => $orgId]
                ));
            }

            return $member->load('kins');
        });
    }

    public function update(Member $member, array $validated): Member
    {
        return DB::transaction(function () use ($member, $validated) {
            $member->update(Arr::except($validated, ['kins']));

            $incomingKins = $validated['kins'] ?? [];
            $incomingIds  = array_values(array_filter(array_column($incomingKins, 'id')));

            $member->kins()->whereNotIn('id', $incomingIds)->delete();

            foreach ($incomingKins as $kinData) {
                if (!empty($kinData['id'])) {
                    $member->kins()
                        ->where('id', $kinData['id'])
                        ->update(Arr::except($kinData, ['id']));
                } else {
                    $member->kins()->create(array_merge(
                        Arr::except($kinData, ['id']),
                        ['org_id' => $member->org_id]
                    ));
                }
            }

            return $member->fresh()->load('kins');
        });
    }

    public function storePhoto(Member $member, UploadedFile $file): void
    {
        if ($member->photo_path) {
            Storage::disk('public')->delete($member->photo_path);
        }

        $ext  = $file->getClientOriginalExtension();
        $path = $file->storeAs('member-photos', $member->id . '.' . $ext, 'public');
        $member->update(['photo_path' => $path]);
    }

    public function approve(Member $member, User $by): void
    {
        $old = $member->approval_status;

        $member->update([
            'approval_status' => 'approved',
            'approved_by'     => $by->id,
            'approved_at'     => now(),
        ]);

        ApprovalLog::create([
            'org_id'          => $member->org_id,
            'approvable_type' => 'member',
            'approvable_id'   => $member->id,
            'action'          => 'approved',
            'from_status'     => $old,
            'to_status'       => 'approved',
            'performed_by'    => $by->id,
        ]);
    }

    public function reject(Member $member, string $reason, User $by): void
    {
        $old = $member->approval_status;

        $member->update(['approval_status' => 'rejected']);

        ApprovalLog::create([
            'org_id'          => $member->org_id,
            'approvable_type' => 'member',
            'approvable_id'   => $member->id,
            'action'          => 'rejected',
            'from_status'     => $old,
            'to_status'       => 'rejected',
            'performed_by'    => $by->id,
            'notes'           => $reason,
        ]);
    }
}
```

- [ ] **Step 3: Commit**

```bash
cd backend
git add app/Services/MemberService.php database/factories/OrgFactory.php
git commit -m "feat(members): MemberService — member number generation, store/update transactions, approve/reject"
```

---

## Task 3: MemberController CRUD

**Files:**
- Modify: `backend/app/Http/Controllers/Api/V1/MemberController.php` (replace stub)

- [ ] **Step 1: Replace stub with full CRUD controller**

```php
<?php
// backend/app/Http/Controllers/Api/V1/MemberController.php
namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Api\V1\Member\StoreMemberRequest;
use App\Http\Requests\Api\V1\Member\UpdateMemberRequest;
use App\Http\Resources\V1\MemberResource;
use App\Models\Member;
use App\Services\MemberService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MemberController extends ApiController
{
    public function __construct(private MemberService $memberService) {}

    public function index(Request $request): JsonResponse
    {
        $query = Member::query()
            ->where('org_id', $request->user()->org_id)
            ->with('kins');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'ilike', "%{$search}%")
                  ->orWhere('member_number', 'ilike', "%{$search}%")
                  ->orWhere('id_number', 'ilike', "%{$search}%");
            });
        }

        if ($status = $request->query('status')) {
            $query->where('approval_status', $status);
        }

        $perPage = min((int) $request->query('per_page', 20), 100);
        $members = $query->orderByDesc('created_at')->paginate($perPage);

        return $this->respond(
            MemberResource::collection($members->items())->resolve(),
            '',
            200,
            [
                'current_page' => $members->currentPage(),
                'per_page'     => $members->perPage(),
                'total'        => $members->total(),
                'last_page'    => $members->lastPage(),
            ]
        );
    }

    public function store(StoreMemberRequest $request): JsonResponse
    {
        $member = $this->memberService->store(
            $request->validated(),
            $request->user()->org_id
        );

        return $this->respondCreated(new MemberResource($member), 'Member created successfully.');
    }

    public function show(Request $request, Member $member): JsonResponse
    {
        abort_unless($member->org_id === $request->user()->org_id, 404);

        return $this->respond(new MemberResource($member->load('kins')));
    }

    public function update(UpdateMemberRequest $request, Member $member): JsonResponse
    {
        abort_unless($member->org_id === $request->user()->org_id, 404);

        $member = $this->memberService->update($member, $request->validated());

        return $this->respond(new MemberResource($member), 'Member updated successfully.');
    }

    public function destroy(Request $request, Member $member): JsonResponse
    {
        abort_unless($member->org_id === $request->user()->org_id, 404);

        $member->delete();

        return $this->respond(null, 'Member archived successfully.');
    }

    public function archived(Request $request): JsonResponse
    {
        $query = Member::onlyTrashed()
            ->where('org_id', $request->user()->org_id);

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'ilike', "%{$search}%")
                  ->orWhere('member_number', 'ilike', "%{$search}%")
                  ->orWhere('id_number', 'ilike', "%{$search}%");
            });
        }

        $perPage = min((int) $request->query('per_page', 20), 100);
        $members = $query->orderByDesc('deleted_at')->paginate($perPage);

        return $this->respond(
            MemberResource::collection($members->items())->resolve(),
            '',
            200,
            [
                'current_page' => $members->currentPage(),
                'per_page'     => $members->perPage(),
                'total'        => $members->total(),
                'last_page'    => $members->lastPage(),
            ]
        );
    }

    public function restore(Request $request, string $id): JsonResponse
    {
        $member = Member::onlyTrashed()
            ->where('org_id', $request->user()->org_id)
            ->findOrFail($id);

        $member->restore();

        return $this->respond(
            new MemberResource($member->fresh()->load('kins')),
            'Member restored successfully.'
        );
    }

    public function approve(Request $request, Member $member): JsonResponse
    {
        abort_unless($member->org_id === $request->user()->org_id, 404);
        abort_if($member->approval_status !== 'pending', 422, 'Member is not pending approval.');

        $this->memberService->approve($member, $request->user());

        return $this->respond(
            new MemberResource($member->fresh()->load('kins')),
            'Member approved.'
        );
    }

    public function reject(Request $request, Member $member): JsonResponse
    {
        abort_unless($member->org_id === $request->user()->org_id, 404);
        abort_if($member->approval_status !== 'pending', 422, 'Member is not pending approval.');

        $request->validate(['reason' => 'required|string|max:500']);

        $this->memberService->reject($member, $request->input('reason'), $request->user());

        return $this->respond(
            new MemberResource($member->fresh()->load('kins')),
            'Member rejected.'
        );
    }

    public function uploadPhoto(Request $request, Member $member): JsonResponse
    {
        abort_unless($member->org_id === $request->user()->org_id, 404);

        $request->validate(['photo' => 'required|image|max:2048']);

        $this->memberService->storePhoto($member, $request->file('photo'));

        return $this->respond(
            new MemberResource($member->fresh()->load('kins')),
            'Photo uploaded.'
        );
    }
}
```

- [x] **Step 2: Commit**

```bash
cd backend
git add app/Http/Controllers/Api/V1/MemberController.php
git commit -m "feat(members): MemberController — full CRUD, archived, restore, approve, reject, photo"
```

---

## Task 4: MemberFactory + Feature Tests

**Files:**
- Create: `backend/database/factories/MemberFactory.php`
- Create: `backend/tests/Feature/Api/V1/MemberTest.php`

- [x] **Step 1: Create MemberFactory**

```php
<?php
// backend/database/factories/MemberFactory.php
namespace Database\Factories;

use App\Models\Member;
use App\Models\Org;
use Illuminate\Database\Eloquent\Factories\Factory;

class MemberFactory extends Factory
{
    protected $model = Member::class;

    public function definition(): array
    {
        return [
            'org_id'          => Org::factory(),
            'member_number'   => 'MEM-' . now()->year . '-' . str_pad(fake()->unique()->numberBetween(1, 9999), 4, '0', STR_PAD_LEFT),
            'full_name'       => fake()->name(),
            'id_number'       => fake()->unique()->numerify('########'),
            'id_type'         => 'national',
            'phone'           => '07' . fake()->numerify('########'),
            'date_of_birth'   => fake()->date('Y-m-d', '-20 years'),
            'entry_date'      => fake()->date('Y-m-d'),
            'approval_status' => 'pending',
            'is_active'       => true,
            'employed'        => false,
            'self_employed'   => false,
        ];
    }

    public function approved(): static
    {
        return $this->state(fn (array $attrs) => ['approval_status' => 'approved']);
    }

    public function pending(): static
    {
        return $this->state(fn (array $attrs) => ['approval_status' => 'pending']);
    }
}
```

- [x] **Step 2: Create MemberTest**

```php
<?php
// backend/tests/Feature/Api/V1/MemberTest.php
namespace Tests\Feature\Api\V1;

use App\Models\Member;
use App\Models\Org;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MemberTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private Org  $org;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withHeader('Origin', 'http://localhost:3000');

        $this->org = Org::factory()->create();
        $this->admin = User::factory()->create([
            'org_id' => $this->org->id,
            'role'   => 'admin',
        ]);
    }

    private function memberPayload(array $overrides = []): array
    {
        return array_merge([
            'full_name'     => 'Jane Doe',
            'id_number'     => '12345678',
            'id_type'       => 'national',
            'phone'         => '0700000001',
            'date_of_birth' => '1990-01-15',
            'entry_date'    => '2026-01-01',
        ], $overrides);
    }

    public function test_create_member_with_kins(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/members', $this->memberPayload([
                'kins' => [
                    [
                        'full_name'    => 'John Doe',
                        'relationship' => 'spouse',
                        'phone'        => '0711000000',
                        'is_emergency_contact' => true,
                        'is_beneficiary'       => true,
                        'beneficiary_percent'  => 50,
                    ],
                    [
                        'full_name'    => 'Mary Doe',
                        'relationship' => 'child',
                        'is_beneficiary' => false,
                    ],
                ],
            ]));

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.full_name', 'Jane Doe')
            ->assertJsonPath('data.approval_status', 'pending')
            ->assertJsonCount(2, 'data.kins');

        $this->assertDatabaseHas('members', ['full_name' => 'Jane Doe', 'org_id' => $this->org->id]);
        $this->assertDatabaseCount('member_kins', 2);
    }

    public function test_member_number_increments(): void
    {
        $r1 = $this->actingAs($this->admin)->postJson('/api/v1/members', $this->memberPayload());
        $r2 = $this->actingAs($this->admin)->postJson('/api/v1/members', $this->memberPayload(['id_number' => '99999999']));

        $r1->assertCreated();
        $r2->assertCreated();

        $this->assertEquals('MEM-' . now()->year . '-0001', $r1->json('data.member_number'));
        $this->assertEquals('MEM-' . now()->year . '-0002', $r2->json('data.member_number'));
    }

    public function test_create_sets_pending_status(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/members', $this->memberPayload());

        $response->assertCreated()->assertJsonPath('data.approval_status', 'pending');
    }

    public function test_update_syncs_kins(): void
    {
        $member = Member::factory()->create(['org_id' => $this->org->id]);
        $kin = $member->kins()->create([
            'org_id'       => $this->org->id,
            'full_name'    => 'Old Kin',
            'relationship' => 'parent',
        ]);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/v1/members/{$member->id}", array_merge(
                $this->memberPayload(['id_number' => $member->id_number]),
                [
                    'kins' => [
                        [
                            'id'           => $kin->id,
                            'full_name'    => 'Updated Kin',
                            'relationship' => 'parent',
                        ],
                        [
                            'full_name'    => 'New Kin',
                            'relationship' => 'sibling',
                        ],
                    ],
                ]
            ));

        $response->assertOk()->assertJsonCount(2, 'data.kins');
        $this->assertDatabaseHas('member_kins', ['id' => $kin->id, 'full_name' => 'Updated Kin']);
        $this->assertDatabaseHas('member_kins', ['full_name' => 'New Kin']);
    }

    public function test_approve_member(): void
    {
        $member = Member::factory()->pending()->create(['org_id' => $this->org->id]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/members/{$member->id}/approve");

        $response->assertOk()->assertJsonPath('data.approval_status', 'approved');

        $this->assertDatabaseHas('members', [
            'id'              => $member->id,
            'approval_status' => 'approved',
            'approved_by'     => $this->admin->id,
        ]);
        $this->assertDatabaseHas('approval_logs', [
            'approvable_id' => $member->id,
            'action'        => 'approved',
        ]);
    }

    public function test_reject_member(): void
    {
        $member = Member::factory()->pending()->create(['org_id' => $this->org->id]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/members/{$member->id}/reject", [
                'reason' => 'Incomplete documents.',
            ]);

        $response->assertOk()->assertJsonPath('data.approval_status', 'rejected');

        $this->assertDatabaseHas('approval_logs', [
            'approvable_id' => $member->id,
            'action'        => 'rejected',
            'notes'         => 'Incomplete documents.',
        ]);
    }

    public function test_archive_and_restore(): void
    {
        $member = Member::factory()->create(['org_id' => $this->org->id]);

        $this->actingAs($this->admin)
            ->deleteJson("/api/v1/members/{$member->id}")
            ->assertOk();

        $this->assertSoftDeleted('members', ['id' => $member->id]);

        $this->actingAs($this->admin)
            ->postJson("/api/v1/members/{$member->id}/restore")
            ->assertOk();

        $this->assertDatabaseHas('members', ['id' => $member->id, 'deleted_at' => null]);
    }

    public function test_archived_list_excludes_active(): void
    {
        Member::factory()->create(['org_id' => $this->org->id]);
        $archived = Member::factory()->create(['org_id' => $this->org->id]);
        $archived->delete();

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/members/archived');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals($archived->id, $response->json('data.0.id'));
    }

    public function test_search_filter(): void
    {
        Member::factory()->create(['org_id' => $this->org->id, 'full_name' => 'Alice Wanjiku']);
        Member::factory()->create(['org_id' => $this->org->id, 'full_name' => 'Bob Kamau']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/members?search=alice');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('Alice Wanjiku', $response->json('data.0.full_name'));
    }

    public function test_status_filter(): void
    {
        Member::factory()->pending()->create(['org_id' => $this->org->id]);
        Member::factory()->approved()->create(['org_id' => $this->org->id]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/members?status=approved');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('approved', $response->json('data.0.approval_status'));
    }

    public function test_org_scoping(): void
    {
        $otherOrg  = Org::factory()->create();
        $otherUser = User::factory()->create(['org_id' => $otherOrg->id, 'role' => 'admin']);
        $member    = Member::factory()->create(['org_id' => $this->org->id]);

        $this->actingAs($otherUser)
            ->getJson("/api/v1/members/{$member->id}")
            ->assertNotFound();
    }

    public function test_beneficiary_percent_sum_validation(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/members', $this->memberPayload([
                'kins' => [
                    ['full_name' => 'Kin A', 'relationship' => 'spouse',  'is_beneficiary' => true, 'beneficiary_percent' => 70],
                    ['full_name' => 'Kin B', 'relationship' => 'sibling', 'is_beneficiary' => true, 'beneficiary_percent' => 50],
                ],
            ]));

        $response->assertUnprocessable();
    }

    public function test_photo_upload(): void
    {
        $member = Member::factory()->create(['org_id' => $this->org->id]);

        $file = \Illuminate\Http\UploadedFile::fake()->image('photo.jpg');

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/members/{$member->id}/photo", ['photo' => $file]);

        $response->assertOk();
        $this->assertNotNull($response->json('data.photo_url'));
        $this->assertDatabaseMissing('members', ['id' => $member->id, 'photo_path' => null]);
    }
}
```

- [ ] **Step 3: Run failing tests first**

Run: `cd backend && php artisan test tests/Feature/Api/V1/MemberTest.php`

Expected: 12 tests, all should pass (controller and service are already written).

- [ ] **Step 4: If any test fails, fix the underlying code, then re-run until all pass**

Run: `cd backend && php artisan test`

Expected: 32 tests total (20 existing + 12 new), all pass.

- [ ] **Step 5: Commit**

```bash
cd backend
git add database/factories/MemberFactory.php tests/Feature/Api/V1/MemberTest.php
git commit -m "test(members): 12 feature tests — CRUD, approval, kins sync, photo, org scoping"
```

---

## Task 5: Frontend API Types and Hooks

**Files:**
- Create: `frontend/src/lib/api/members.ts`

- [ ] **Step 1: Create `lib/api/members.ts`**

```typescript
// frontend/src/lib/api/members.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiEnvelope, ApiMeta, extractApiError } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────

export interface MemberKin {
  id: string;
  full_name: string;
  relationship: string;
  date_of_birth: string | null;
  id_number: string | null;
  id_type: string | null;
  phone: string | null;
  is_emergency_contact: boolean;
  is_beneficiary: boolean;
  beneficiary_percent: string | null;
}

export interface Member {
  id: string;
  member_number: string;
  full_name: string;
  title: string | null;
  id_number: string;
  id_type: string;
  email: string | null;
  phone: string;
  phone2: string | null;
  date_of_birth: string;
  gender: string | null;
  nationality: string | null;
  marital_status: string | null;
  address: string | null;
  town: string | null;
  postal_code: string | null;
  photo_url: string | null;
  employed: boolean;
  self_employed: boolean;
  employer_name: string | null;
  monthly_salary: string | null;
  monthly_net_income: string | null;
  entry_date: string;
  is_active: boolean;
  approval_status: "draft" | "pending" | "approved" | "rejected";
  approved_by: string | null;
  approved_at: string | null;
  terminated_at: string | null;
  termination_reason: string | null;
  org_id: string;
  kins: MemberKin[];
  created_at: string;
}

export interface MembersParams {
  search?: string;
  status?: string;
  per_page?: number;
  page?: number;
}

export type CreateMemberPayload = Omit<
  Partial<Member>,
  "id" | "member_number" | "approval_status" | "org_id" | "kins" | "photo_url" | "created_at"
> & {
  full_name: string;
  id_number: string;
  id_type: string;
  phone: string;
  date_of_birth: string;
  entry_date: string;
  kins?: Array<Omit<MemberKin, "id"> & { id?: string }>;
};

export type UpdateMemberPayload = CreateMemberPayload;

// ── Query key ──────────────────────────────────────────────────────────

export const MEMBERS_KEY = ["members"] as const;

// ── Queries ────────────────────────────────────────────────────────────

export interface MembersResponse {
  data: Member[];
  meta: ApiMeta;
}

export function useMembers(params?: MembersParams) {
  return useQuery<MembersResponse>({
    queryKey: [...MEMBERS_KEY, params],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<Member[]>>("/members", { params });
      return { data: data.data, meta: data.meta! };
    },
    staleTime: 30_000,
  });
}

export function useMember(id: string) {
  return useQuery<Member>({
    queryKey: [...MEMBERS_KEY, id],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<Member>>(`/members/${id}`);
      return data.data;
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useArchivedMembers(params?: MembersParams) {
  return useQuery<MembersResponse>({
    queryKey: [...MEMBERS_KEY, "archived", params],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<Member[]>>("/members/archived", { params });
      return { data: data.data, meta: data.meta! };
    },
    staleTime: 30_000,
  });
}

// ── Mutations ──────────────────────────────────────────────────────────

export function useCreateMember() {
  const qc = useQueryClient();
  return useMutation<Member, Error, CreateMemberPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<Member>>("/members", payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MEMBERS_KEY });
    },
  });
}

export function useUpdateMember(id: string) {
  const qc = useQueryClient();
  return useMutation<Member, Error, UpdateMemberPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.put<ApiEnvelope<Member>>(`/members/${id}`, payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MEMBERS_KEY });
    },
  });
}

export function useDeleteMember() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/members/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MEMBERS_KEY });
    },
  });
}

export function useRestoreMember() {
  const qc = useQueryClient();
  return useMutation<Member, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.post<ApiEnvelope<Member>>(`/members/${id}/restore`);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MEMBERS_KEY });
    },
  });
}

export function useApproveMember() {
  const qc = useQueryClient();
  return useMutation<Member, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.post<ApiEnvelope<Member>>(`/members/${id}/approve`);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MEMBERS_KEY });
    },
  });
}

export function useRejectMember() {
  const qc = useQueryClient();
  return useMutation<Member, Error, { id: string; reason: string }>({
    mutationFn: async ({ id, reason }) => {
      const { data } = await api.post<ApiEnvelope<Member>>(`/members/${id}/reject`, { reason });
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MEMBERS_KEY });
    },
  });
}

export function useUploadMemberPhoto(memberId: string) {
  const qc = useQueryClient();
  return useMutation<Member, Error, File>({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append("photo", file);
      const { data } = await api.post<ApiEnvelope<Member>>(
        `/members/${memberId}/photo`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...MEMBERS_KEY, memberId] });
      qc.invalidateQueries({ queryKey: MEMBERS_KEY });
    },
  });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd frontend
git add src/lib/api/members.ts
git commit -m "feat(members): TypeScript types and React Query hooks"
```

---

## Task 6: ApprovalStatusBadge + KinRow

**Files:**
- Create: `frontend/src/components/Members/ApprovalStatusBadge.tsx`
- Create: `frontend/src/components/Members/KinRow.tsx`

- [ ] **Step 1: Create ApprovalStatusBadge**

```tsx
// frontend/src/components/Members/ApprovalStatusBadge.tsx
import React from "react";

type Status = "draft" | "pending" | "approved" | "rejected";

const CONFIG: Record<Status, { label: string; className: string }> = {
  draft:    { label: "Draft",    className: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300" },
  pending:  { label: "Pending",  className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" },
  approved: { label: "Approved", className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
};

interface Props {
  status: Status | string;
}

export default function ApprovalStatusBadge({ status }: Props) {
  const cfg = CONFIG[status as Status] ?? { label: status, className: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}
```

- [ ] **Step 2: Create KinRow**

```tsx
// frontend/src/components/Members/KinRow.tsx
"use client";

import React from "react";
import SelectInput from "@/components/Forms/SelectInput";
import DateInput from "@/components/Forms/DateInput";

export interface KinFormValues {
  _key: string;
  id?: string;
  full_name: string;
  relationship: string;
  date_of_birth: string;
  id_number: string;
  id_type: string;
  phone: string;
  is_emergency_contact: boolean;
  is_beneficiary: boolean;
  beneficiary_percent: string;
}

interface Props {
  kin: KinFormValues;
  index: number;
  errors: Record<string, string[]>;
  onChange: (updated: KinFormValues) => void;
  onRemove: () => void;
}

const RELATIONSHIP_OPTIONS = [
  { value: "spouse",  label: "Spouse" },
  { value: "child",   label: "Child" },
  { value: "parent",  label: "Parent" },
  { value: "sibling", label: "Sibling" },
  { value: "other",   label: "Other" },
];

const ID_TYPE_OPTIONS = [
  { value: "national",  label: "National ID" },
  { value: "passport",  label: "Passport" },
  { value: "alien",     label: "Alien Card" },
  { value: "military",  label: "Military ID" },
];

export default function KinRow({ kin, index, errors, onChange, onRemove }: Props) {
  const field = (name: string) => errors[`kins.${index}.${name}`]?.[0];

  const set = (patch: Partial<KinFormValues>) => onChange({ ...kin, ...patch });

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Next of Kin {index + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="text-sm text-red-500 hover:text-red-700"
        >
          Remove
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={kin.full_name}
            onChange={(e) => set({ full_name: e.target.value })}
            className={`w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 ${
              field("full_name")
                ? "border-red-600 focus:ring-red-600"
                : "border-gray-300 hover:border-green-600 focus:ring-green-600"
            }`}
          />
          {field("full_name") && <p className="mt-1 text-xs text-red-500">{field("full_name")}</p>}
        </div>

        <SelectInput
          label="Relationship *"
          options={RELATIONSHIP_OPTIONS}
          value={RELATIONSHIP_OPTIONS.find((o) => o.value === kin.relationship) ?? null}
          onChange={(opt) => set({ relationship: opt?.value ?? "" })}
          error={field("relationship")}
          usePortal
        />

        <DateInput
          label="Date of Birth"
          name={`kin_${index}_dob`}
          value={kin.date_of_birth}
          onChange={(d) => set({ date_of_birth: d })}
          disableTime
          error={field("date_of_birth")}
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
          <input
            type="text"
            value={kin.phone}
            onChange={(e) => set({ phone: e.target.value })}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:border-green-600 focus:ring-2 focus:ring-green-600"
          />
        </div>

        <SelectInput
          label="ID Type"
          options={ID_TYPE_OPTIONS}
          value={ID_TYPE_OPTIONS.find((o) => o.value === kin.id_type) ?? null}
          onChange={(opt) => set({ id_type: opt?.value ?? "" })}
          isClearable
          usePortal
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">ID Number</label>
          <input
            type="text"
            value={kin.id_number}
            onChange={(e) => set({ id_number: e.target.value })}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:border-green-600 focus:ring-2 focus:ring-green-600"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-6">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={kin.is_emergency_contact}
            onChange={(e) => set({ is_emergency_contact: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-600"
          />
          Emergency Contact
        </label>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={kin.is_beneficiary}
            onChange={(e) => set({ is_beneficiary: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-600"
          />
          Beneficiary
        </label>

        {kin.is_beneficiary && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Percent:</label>
            <input
              type="number"
              min={0}
              max={100}
              step="any"
              value={kin.beneficiary_percent}
              onChange={(e) => set({ beneficiary_percent: e.target.value })}
              className={`w-24 rounded-md border px-2 py-1.5 text-sm focus:ring-2 ${
                field("beneficiary_percent")
                  ? "border-red-600 focus:ring-red-600"
                  : "border-gray-300 focus:ring-green-600"
              }`}
            />
            <span className="text-sm text-gray-500">%</span>
            {field("beneficiary_percent") && (
              <p className="text-xs text-red-500">{field("beneficiary_percent")}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript**

Run: `cd frontend && npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
cd frontend
git add src/components/Members/ApprovalStatusBadge.tsx src/components/Members/KinRow.tsx
git commit -m "feat(members): ApprovalStatusBadge and KinRow components"
```

---

## Task 7: MemberForm

**Files:**
- Create: `frontend/src/components/Members/MemberForm.tsx`

- [ ] **Step 1: Create MemberForm**

```tsx
// frontend/src/components/Members/MemberForm.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import SelectInput from "@/components/Forms/SelectInput";
import DateInput from "@/components/Forms/DateInput";
import NumberInput from "@/components/Forms/NumberInput";
import KinRow, { KinFormValues } from "./KinRow";
import {
  Member,
  useCreateMember,
  useUpdateMember,
} from "@/lib/api/members";
import { api, extractApiError, extractFieldErrors } from "@/lib/api";

// ── Option lists ───────────────────────────────────────────────────────

const TITLE_OPTIONS = [
  { value: "Mr",   label: "Mr" },
  { value: "Mrs",  label: "Mrs" },
  { value: "Miss", label: "Miss" },
  { value: "Dr",   label: "Dr" },
  { value: "Prof", label: "Prof" },
  { value: "Rev",  label: "Rev" },
];

const ID_TYPE_OPTIONS = [
  { value: "national", label: "National ID" },
  { value: "passport", label: "Passport" },
  { value: "alien",    label: "Alien Card" },
  { value: "military", label: "Military ID" },
];

const GENDER_OPTIONS = [
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
];

const MARITAL_OPTIONS = [
  { value: "single",   label: "Single" },
  { value: "married",  label: "Married" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed",  label: "Widowed" },
];

// ── Types ──────────────────────────────────────────────────────────────

interface FormState {
  title: string;
  full_name: string;
  id_type: string;
  id_number: string;
  email: string;
  phone: string;
  phone2: string;
  date_of_birth: string;
  gender: string;
  nationality: string;
  marital_status: string;
  address: string;
  town: string;
  postal_code: string;
  employed: boolean;
  self_employed: boolean;
  employer_name: string;
  monthly_salary: string;
  monthly_net_income: string;
  entry_date: string;
}

interface Props {
  defaultValues?: Partial<FormState> & { kins?: MemberKinInit[] };
  memberId?: string;
}

interface MemberKinInit {
  id?: string;
  full_name?: string;
  relationship?: string;
  date_of_birth?: string | null;
  id_number?: string | null;
  id_type?: string | null;
  phone?: string | null;
  is_emergency_contact?: boolean;
  is_beneficiary?: boolean;
  beneficiary_percent?: string | null;
}

const EMPTY_STATE: FormState = {
  title: "", full_name: "", id_type: "", id_number: "",
  email: "", phone: "", phone2: "", date_of_birth: "",
  gender: "", nationality: "KEN", marital_status: "",
  address: "", town: "", postal_code: "",
  employed: false, self_employed: false,
  employer_name: "", monthly_salary: "", monthly_net_income: "",
  entry_date: "",
};

function initKin(init?: MemberKinInit): KinFormValues {
  return {
    _key: uuidv4(),
    id: init?.id,
    full_name: init?.full_name ?? "",
    relationship: init?.relationship ?? "",
    date_of_birth: init?.date_of_birth ?? "",
    id_number: init?.id_number ?? "",
    id_type: init?.id_type ?? "",
    phone: init?.phone ?? "",
    is_emergency_contact: init?.is_emergency_contact ?? false,
    is_beneficiary: init?.is_beneficiary ?? false,
    beneficiary_percent: init?.beneficiary_percent ?? "",
  };
}

// ── Component ──────────────────────────────────────────────────────────

export default function MemberForm({ defaultValues, memberId }: Props) {
  const router = useRouter();
  const isEdit = !!memberId;

  const [form, setForm] = useState<FormState>({ ...EMPTY_STATE, ...defaultValues });
  const [kins, setKins] = useState<KinFormValues[]>(
    (defaultValues?.kins ?? []).map(initKin)
  );
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  const createMutation = useCreateMember();
  const updateMutation = useUpdateMember(memberId ?? "");

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const err = (name: string) => fieldErrors[name]?.[0];

  const buildPayload = () => ({
    ...form,
    kins: kins.map(({ _key, ...rest }) => rest),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setSubmitting(true);

    try {
      let member: Member;

      if (isEdit) {
        member = await updateMutation.mutateAsync(buildPayload());
      } else {
        member = await createMutation.mutateAsync(buildPayload());
      }

      if (photoFile) {
        const fd = new FormData();
        fd.append("photo", photoFile);
        await api.post(`/members/${member.id}/photo`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      toast.success(isEdit ? "Member updated." : "Member created — pending approval.");
      router.push(`/admin/members/${member.id}`);
    } catch (error) {
      const fe = extractFieldErrors(error);
      if (fe) {
        setFieldErrors(fe);
      } else {
        toast.error(extractApiError(error));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const addKin = () => setKins((k) => [...k, initKin()]);
  const removeKin = (key: string) => setKins((k) => k.filter((x) => x._key !== key));
  const updateKin = (key: string, updated: KinFormValues) =>
    setKins((k) => k.map((x) => (x._key === key ? updated : x)));

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

      {/* ── Personal Details ── */}
      <div className="rounded-xl border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
        <h2 className="mb-5 text-lg font-semibold text-dark dark:text-white">Personal Details</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

          <SelectInput
            label="Title"
            options={TITLE_OPTIONS}
            value={TITLE_OPTIONS.find((o) => o.value === form.title) ?? null}
            onChange={(opt) => set("title", opt?.value ?? "")}
            isClearable
            usePortal
          />

          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => set("full_name", e.target.value)}
              required
              className={`w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 ${
                err("full_name") ? "border-red-600 focus:ring-red-600" : "border-gray-300 hover:border-green-600 focus:ring-green-600"
              }`}
            />
            {err("full_name") && <p className="mt-1 text-xs text-red-500">{err("full_name")}</p>}
          </div>

          <SelectInput
            label="ID Type *"
            options={ID_TYPE_OPTIONS}
            value={ID_TYPE_OPTIONS.find((o) => o.value === form.id_type) ?? null}
            onChange={(opt) => set("id_type", opt?.value ?? "")}
            error={err("id_type")}
            required
            usePortal
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              ID Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.id_number}
              onChange={(e) => set("id_number", e.target.value)}
              required
              className={`w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 ${
                err("id_number") ? "border-red-600 focus:ring-red-600" : "border-gray-300 hover:border-green-600 focus:ring-green-600"
              }`}
            />
            {err("id_number") && <p className="mt-1 text-xs text-red-500">{err("id_number")}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:border-green-600 focus:ring-2 focus:ring-green-600"
            />
            {err("email") && <p className="mt-1 text-xs text-red-500">{err("email")}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              required
              className={`w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 ${
                err("phone") ? "border-red-600 focus:ring-red-600" : "border-gray-300 hover:border-green-600 focus:ring-green-600"
              }`}
            />
            {err("phone") && <p className="mt-1 text-xs text-red-500">{err("phone")}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Phone 2</label>
            <input
              type="text"
              value={form.phone2}
              onChange={(e) => set("phone2", e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:border-green-600 focus:ring-2 focus:ring-green-600"
            />
          </div>

          <DateInput
            label="Date of Birth *"
            name="date_of_birth"
            value={form.date_of_birth}
            onChange={(d) => set("date_of_birth", d)}
            required
            disableTime
            error={err("date_of_birth")}
          />

          <SelectInput
            label="Gender"
            options={GENDER_OPTIONS}
            value={GENDER_OPTIONS.find((o) => o.value === form.gender) ?? null}
            onChange={(opt) => set("gender", opt?.value ?? "")}
            isClearable
            usePortal
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Nationality</label>
            <input
              type="text"
              value={form.nationality}
              onChange={(e) => set("nationality", e.target.value)}
              maxLength={3}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:border-green-600 focus:ring-2 focus:ring-green-600"
            />
          </div>

          <SelectInput
            label="Marital Status"
            options={MARITAL_OPTIONS}
            value={MARITAL_OPTIONS.find((o) => o.value === form.marital_status) ?? null}
            onChange={(opt) => set("marital_status", opt?.value ?? "")}
            isClearable
            usePortal
          />

          <div className="sm:col-span-2 lg:col-span-3">
            <label className="mb-2 block text-sm font-medium text-gray-700">Address</label>
            <textarea
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              rows={2}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:border-green-600 focus:ring-2 focus:ring-green-600"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Town</label>
            <input
              type="text"
              value={form.town}
              onChange={(e) => set("town", e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:border-green-600 focus:ring-2 focus:ring-green-600"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Postal Code</label>
            <input
              type="text"
              value={form.postal_code}
              onChange={(e) => set("postal_code", e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:border-green-600 focus:ring-2 focus:ring-green-600"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-green-50 file:px-3 file:py-1.5 file:text-green-700 hover:file:bg-green-100"
            />
          </div>
        </div>
      </div>

      {/* ── Employment ── */}
      <div className="rounded-xl border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
        <h2 className="mb-5 text-lg font-semibold text-dark dark:text-white">Employment</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

          <DateInput
            label="Entry Date *"
            name="entry_date"
            value={form.entry_date}
            onChange={(d) => set("entry_date", d)}
            required
            disableTime
            error={err("entry_date")}
          />

          <div className="flex items-center gap-6 pt-7">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.employed}
                onChange={(e) => set("employed", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-600"
              />
              Employed
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.self_employed}
                onChange={(e) => set("self_employed", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-600"
              />
              Self-Employed
            </label>
          </div>

          {form.employed && (
            <>
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="mb-2 block text-sm font-medium text-gray-700">Employer Name</label>
                <input
                  type="text"
                  value={form.employer_name}
                  onChange={(e) => set("employer_name", e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:border-green-600 focus:ring-2 focus:ring-green-600"
                />
              </div>
              <NumberInput
                label="Monthly Salary"
                name="monthly_salary"
                value={form.monthly_salary}
                onChange={(e) => set("monthly_salary", e.target.value)}
                step="any"
                min={0}
                error={err("monthly_salary")}
              />
              <NumberInput
                label="Monthly Net Income"
                name="monthly_net_income"
                value={form.monthly_net_income}
                onChange={(e) => set("monthly_net_income", e.target.value)}
                step="any"
                min={0}
                error={err("monthly_net_income")}
              />
            </>
          )}
        </div>
      </div>

      {/* ── Next of Kin ── */}
      <div className="rounded-xl border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-dark dark:text-white">Next of Kin</h2>
          <button
            type="button"
            onClick={addKin}
            className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
          >
            + Add Kin
          </button>
        </div>

        {fieldErrors["kins"] && (
          <p className="mb-3 text-sm text-red-500">{fieldErrors["kins"]?.[0]}</p>
        )}

        <div className="flex flex-col gap-4">
          {kins.map((kin, i) => (
            <KinRow
              key={kin._key}
              kin={kin}
              index={i}
              errors={fieldErrors}
              onChange={(updated) => updateKin(kin._key, updated)}
              onRemove={() => removeKin(kin._key)}
            />
          ))}
          {kins.length === 0 && (
            <p className="text-sm text-gray-500">No next of kin added yet.</p>
          )}
        </div>
      </div>

      {/* ── Submit ── */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "Saving…" : isEdit ? "Update Member" : "Create Member"}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `cd frontend && npx tsc --noEmit`

Expected: No errors. (If `uuid` is missing: `npm install uuid @types/uuid` in the `frontend` directory.)

- [ ] **Step 3: Commit**

```bash
cd frontend
git add src/components/Members/MemberForm.tsx
git commit -m "feat(members): MemberForm — three-section create/edit form with kin management"
```

---

## Task 8: MembersTable

**Files:**
- Create: `frontend/src/components/Members/MembersTable.tsx`

- [ ] **Step 1: Create MembersTable**

```tsx
// frontend/src/components/Members/MembersTable.tsx
"use client";

import React, { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DataTable } from "@/components/DataTable";
import ApprovalStatusBadge from "./ApprovalStatusBadge";
import { Member, useMembers, useDeleteMember } from "@/lib/api/members";
import { extractApiError } from "@/lib/api";

const STATUS_OPTIONS = [
  { label: "All",      value: "" },
  { label: "Pending",  value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Draft",    value: "draft" },
];

export default function MembersTable() {
  const router = useRouter();
  const [search, setSearch]   = useState("");
  const [status, setStatus]   = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data, isLoading, error } = useMembers({
    search: debouncedSearch || undefined,
    status: status || undefined,
    per_page: 100,
  });

  const deleteMutation = useDeleteMember();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    clearTimeout((handleSearchChange as any)._timer);
    (handleSearchChange as any)._timer = setTimeout(() => setDebouncedSearch(e.target.value), 400);
  };

  const handleArchive = async (member: Member) => {
    if (!window.confirm(`Archive ${member.full_name}?`)) return;
    try {
      await deleteMutation.mutateAsync(member.id);
      toast.success("Member archived.");
    } catch (err) {
      toast.error(extractApiError(err));
    }
  };

  const columns: ColumnDef<Member>[] = [
    {
      accessorKey: "member_number",
      header: "Member #",
      enableSorting: true,
    },
    {
      accessorKey: "full_name",
      header: "Full Name",
    },
    {
      accessorKey: "phone",
      header: "Phone",
    },
    {
      accessorKey: "entry_date",
      header: "Entry Date",
      cell: ({ getValue }) => {
        const v = getValue<string>();
        return v ? new Date(v).toLocaleDateString("en-KE") : "—";
      },
    },
    {
      accessorKey: "approval_status",
      header: "Status",
      cell: ({ getValue }) => <ApprovalStatusBadge status={getValue<string>()} />,
    },
    {
      accessorKey: "is_active",
      header: "Active",
      cell: ({ getValue }) => (
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
            getValue<boolean>()
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {getValue<boolean>() ? "Yes" : "No"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const m = row.original;
        return (
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/members/${m.id}`}
              className="rounded px-2 py-1 text-xs font-medium text-primary hover:underline"
            >
              View
            </Link>
            <Link
              href={`/admin/members/${m.id}/edit`}
              className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:underline"
            >
              Edit
            </Link>
            <button
              onClick={() => handleArchive(m)}
              className="rounded px-2 py-1 text-xs font-medium text-red-500 hover:underline"
            >
              Archive
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search name, member #, ID…"
          value={search}
          onChange={handleSearchChange}
          className="w-64 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:border-green-600 focus:ring-2 focus:ring-green-600"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:border-green-600 focus:ring-2 focus:ring-green-600"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-sm text-red-500">{extractApiError(error)}</p>
      )}

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        heading="Members"
        showExportButton
      />

      {isLoading && (
        <p className="text-center text-sm text-gray-500">Loading…</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `cd frontend && npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd frontend
git add src/components/Members/MembersTable.tsx
git commit -m "feat(members): MembersTable with server-side search/status filter"
```

---

## Task 9: All 5 Pages

**Files:**
- Modify: `frontend/src/app/admin/members/page.tsx`
- Create: `frontend/src/app/admin/members/create/page.tsx`
- Create: `frontend/src/app/admin/members/[id]/page.tsx`
- Create: `frontend/src/app/admin/members/[id]/edit/page.tsx`
- Modify: `frontend/src/app/admin/members/archived/page.tsx`

- [ ] **Step 1: Replace members list page**

```tsx
// frontend/src/app/admin/members/page.tsx
import Link from "next/link";
import MembersTable from "@/components/Members/MembersTable";

export default function MembersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-dark dark:text-white">Members</h1>
        <Link
          href="/admin/members/create"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
        >
          + Add Member
        </Link>
      </div>
      <MembersTable />
    </div>
  );
}
```

- [ ] **Step 2: Create member page**

```tsx
// frontend/src/app/admin/members/create/page.tsx
import MemberForm from "@/components/Members/MemberForm";

export default function CreateMemberPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-dark dark:text-white">Add Member</h1>
      <MemberForm />
    </div>
  );
}
```

- [ ] **Step 3: Create member detail page**

```tsx
// frontend/src/app/admin/members/[id]/page.tsx
"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import ApprovalStatusBadge from "@/components/Members/ApprovalStatusBadge";
import {
  useMember,
  useApproveMember,
  useRejectMember,
  useDeleteMember,
} from "@/lib/api/members";
import { extractApiError } from "@/lib/api";

export default function MemberDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const { data: member, isLoading, error } = useMember(id);
  const approveMutation = useApproveMember();
  const rejectMutation  = useRejectMember();
  const deleteMutation  = useDeleteMember();

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");

  const handleApprove = async () => {
    if (!window.confirm("Approve this member?")) return;
    try {
      await approveMutation.mutateAsync(id);
      toast.success("Member approved.");
    } catch (err) {
      toast.error(extractApiError(err));
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setRejectError("Reason is required.");
      return;
    }
    try {
      await rejectMutation.mutateAsync({ id, reason: rejectReason });
      toast.success("Member rejected.");
      setShowRejectModal(false);
    } catch (err) {
      toast.error(extractApiError(err));
    }
  };

  const handleArchive = async () => {
    if (!window.confirm("Archive this member?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Member archived.");
      router.push("/admin/members");
    } catch (err) {
      toast.error(extractApiError(err));
    }
  };

  if (isLoading) return <p className="text-gray-500">Loading…</p>;
  if (error || !member) return <p className="text-red-500">Member not found.</p>;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">{member.member_number}</p>
          <h1 className="text-2xl font-semibold text-dark dark:text-white">{member.full_name}</h1>
          <div className="mt-2">
            <ApprovalStatusBadge status={member.approval_status} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {member.approval_status === "pending" && (
            <>
              <button
                onClick={handleApprove}
                disabled={approveMutation.isPending}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
              >
                Approve
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
              >
                Reject
              </button>
            </>
          )}
          <Link
            href={`/admin/members/${id}/edit`}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Edit
          </Link>
          <button
            onClick={handleArchive}
            disabled={deleteMutation.isPending}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            Archive
          </button>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Personal */}
        <div className="rounded-xl border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
          <h2 className="mb-4 text-base font-semibold text-dark dark:text-white">Personal Details</h2>
          {member.photo_url && (
            <img src={member.photo_url} alt="Member photo" className="mb-4 h-24 w-24 rounded-full object-cover" />
          )}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <dt className="font-medium text-gray-500">ID Type</dt>
            <dd className="text-gray-900 dark:text-gray-100 capitalize">{member.id_type}</dd>
            <dt className="font-medium text-gray-500">ID Number</dt>
            <dd className="text-gray-900 dark:text-gray-100">{member.id_number}</dd>
            <dt className="font-medium text-gray-500">Phone</dt>
            <dd className="text-gray-900 dark:text-gray-100">{member.phone}</dd>
            {member.phone2 && <><dt className="font-medium text-gray-500">Phone 2</dt><dd className="text-gray-900 dark:text-gray-100">{member.phone2}</dd></>}
            {member.email && <><dt className="font-medium text-gray-500">Email</dt><dd className="text-gray-900 dark:text-gray-100">{member.email}</dd></>}
            <dt className="font-medium text-gray-500">Date of Birth</dt>
            <dd className="text-gray-900 dark:text-gray-100">{member.date_of_birth ? new Date(member.date_of_birth).toLocaleDateString("en-KE") : "—"}</dd>
            {member.gender && <><dt className="font-medium text-gray-500">Gender</dt><dd className="text-gray-900 dark:text-gray-100">{member.gender === "M" ? "Male" : "Female"}</dd></>}
            {member.nationality && <><dt className="font-medium text-gray-500">Nationality</dt><dd className="text-gray-900 dark:text-gray-100">{member.nationality}</dd></>}
            {member.marital_status && <><dt className="font-medium text-gray-500">Marital Status</dt><dd className="text-gray-900 dark:text-gray-100 capitalize">{member.marital_status}</dd></>}
            {member.address && <><dt className="font-medium text-gray-500">Address</dt><dd className="text-gray-900 dark:text-gray-100">{member.address}</dd></>}
            {member.town && <><dt className="font-medium text-gray-500">Town</dt><dd className="text-gray-900 dark:text-gray-100">{member.town}</dd></>}
          </dl>
        </div>

        {/* Employment */}
        <div className="rounded-xl border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
          <h2 className="mb-4 text-base font-semibold text-dark dark:text-white">Employment</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <dt className="font-medium text-gray-500">Entry Date</dt>
            <dd className="text-gray-900 dark:text-gray-100">{member.entry_date ? new Date(member.entry_date).toLocaleDateString("en-KE") : "—"}</dd>
            <dt className="font-medium text-gray-500">Employed</dt>
            <dd className="text-gray-900 dark:text-gray-100">{member.employed ? "Yes" : "No"}</dd>
            <dt className="font-medium text-gray-500">Self-Employed</dt>
            <dd className="text-gray-900 dark:text-gray-100">{member.self_employed ? "Yes" : "No"}</dd>
            {member.employer_name && <><dt className="font-medium text-gray-500">Employer</dt><dd className="text-gray-900 dark:text-gray-100">{member.employer_name}</dd></>}
            {member.monthly_salary && <><dt className="font-medium text-gray-500">Monthly Salary</dt><dd className="text-gray-900 dark:text-gray-100">{Number(member.monthly_salary).toLocaleString("en-KE")}</dd></>}
            {member.monthly_net_income && <><dt className="font-medium text-gray-500">Net Income</dt><dd className="text-gray-900 dark:text-gray-100">{Number(member.monthly_net_income).toLocaleString("en-KE")}</dd></>}
          </dl>
        </div>
      </div>

      {/* Kins */}
      {member.kins.length > 0 && (
        <div className="rounded-xl border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
          <h2 className="mb-4 text-base font-semibold text-dark dark:text-white">Next of Kin</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium uppercase text-gray-500">
                  <th className="pb-2 pr-4">Name</th>
                  <th className="pb-2 pr-4">Relationship</th>
                  <th className="pb-2 pr-4">Phone</th>
                  <th className="pb-2 pr-4">Emergency</th>
                  <th className="pb-2">Beneficiary %</th>
                </tr>
              </thead>
              <tbody>
                {member.kins.map((kin) => (
                  <tr key={kin.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium text-gray-900 dark:text-gray-100">{kin.full_name}</td>
                    <td className="py-2 pr-4 capitalize text-gray-600">{kin.relationship}</td>
                    <td className="py-2 pr-4 text-gray-600">{kin.phone ?? "—"}</td>
                    <td className="py-2 pr-4 text-gray-600">{kin.is_emergency_contact ? "Yes" : "No"}</td>
                    <td className="py-2 text-gray-600">
                      {kin.is_beneficiary ? `${kin.beneficiary_percent}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-dark">
            <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">Reject Member</h3>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => { setRejectReason(e.target.value); setRejectError(""); }}
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
            />
            {rejectError && <p className="mt-1 text-xs text-red-500">{rejectError}</p>}
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => { setShowRejectModal(false); setRejectReason(""); setRejectError(""); }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={rejectMutation.isPending}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create edit page**

```tsx
// frontend/src/app/admin/members/[id]/edit/page.tsx
"use client";

import React from "react";
import { useParams } from "next/navigation";
import MemberForm from "@/components/Members/MemberForm";
import { useMember } from "@/lib/api/members";

export default function EditMemberPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data: member, isLoading } = useMember(id);

  if (isLoading) return <p className="text-gray-500">Loading…</p>;
  if (!member) return <p className="text-red-500">Member not found.</p>;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-dark dark:text-white">
        Edit Member — {member.full_name}
      </h1>
      <MemberForm
        memberId={id}
        defaultValues={{
          title: member.title ?? "",
          full_name: member.full_name,
          id_type: member.id_type,
          id_number: member.id_number,
          email: member.email ?? "",
          phone: member.phone,
          phone2: member.phone2 ?? "",
          date_of_birth: member.date_of_birth,
          gender: member.gender ?? "",
          nationality: member.nationality ?? "KEN",
          marital_status: member.marital_status ?? "",
          address: member.address ?? "",
          town: member.town ?? "",
          postal_code: member.postal_code ?? "",
          employed: member.employed,
          self_employed: member.self_employed,
          employer_name: member.employer_name ?? "",
          monthly_salary: member.monthly_salary ?? "",
          monthly_net_income: member.monthly_net_income ?? "",
          entry_date: member.entry_date,
          kins: member.kins,
        }}
      />
    </div>
  );
}
```

- [ ] **Step 5: Replace archived page**

```tsx
// frontend/src/app/admin/members/archived/page.tsx
"use client";

import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { DataTable } from "@/components/DataTable";
import ApprovalStatusBadge from "@/components/Members/ApprovalStatusBadge";
import { Member, useArchivedMembers, useRestoreMember } from "@/lib/api/members";
import { extractApiError } from "@/lib/api";

export default function ArchivedMembersPage() {
  const { data, isLoading } = useArchivedMembers({ per_page: 100 });
  const restoreMutation = useRestoreMember();

  const handleRestore = async (member: Member) => {
    if (!window.confirm(`Restore ${member.full_name}?`)) return;
    try {
      await restoreMutation.mutateAsync(member.id);
      toast.success("Member restored.");
    } catch (err) {
      toast.error(extractApiError(err));
    }
  };

  const columns: ColumnDef<Member>[] = [
    { accessorKey: "member_number", header: "Member #" },
    { accessorKey: "full_name",     header: "Full Name" },
    { accessorKey: "phone",         header: "Phone" },
    {
      accessorKey: "approval_status",
      header: "Status",
      cell: ({ getValue }) => <ApprovalStatusBadge status={getValue<string>()} />,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <button
          onClick={() => handleRestore(row.original)}
          disabled={restoreMutation.isPending}
          className="rounded px-2 py-1 text-xs font-medium text-green-600 hover:underline disabled:opacity-50"
        >
          Restore
        </button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-dark dark:text-white">Archived Members</h1>
      {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
      <DataTable columns={columns} data={data?.data ?? []} heading="Archived Members" />
    </div>
  );
}
```

- [ ] **Step 6: Verify build**

Run: `cd frontend && npm run build`

Expected: Build succeeds. Note any type errors and fix them.

- [ ] **Step 7: Commit**

```bash
cd frontend
git add src/app/admin/members/page.tsx src/app/admin/members/create/page.tsx src/app/admin/members/\[id\]/page.tsx src/app/admin/members/\[id\]/edit/page.tsx src/app/admin/members/archived/page.tsx
git commit -m "feat(members): 5 admin pages — list, create, detail, edit, archived"
```

---

## Task 10: Final Verification

- [ ] **Step 1: Run full backend test suite**

Run: `cd backend && php artisan test`

Expected: 32 tests, 0 failures.

- [ ] **Step 2: Check storage symlink exists for photo upload**

Run: `cd backend && php artisan storage:link`

Expected: `public/storage` symlink created (or already exists).

- [ ] **Step 3: Smoke test in browser**

Start both servers:
```bash
# Terminal 1
cd backend && php artisan serve

# Terminal 2
cd frontend && npm run dev
```

Test the golden path:
1. Log in as admin → navigate to `/admin/members`
2. Click "Add Member" → fill required fields → save → confirm redirect to detail page with "pending" badge
3. Click "Approve" → confirm → badge changes to "approved", buttons disappear
4. Click "Edit" → change a field → save → confirm update persists
5. Click "Archive" → confirm → member disappears from list; appears in `/admin/members/archived`
6. Click "Restore" on archived member → confirm → member reappears in active list

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(phase5): members module complete — CRUD, approval workflow, photo upload, kins"
```

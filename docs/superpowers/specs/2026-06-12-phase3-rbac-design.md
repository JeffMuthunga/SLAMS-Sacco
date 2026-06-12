# Phase 3: RBAC Design

**Date:** 2026-06-12
**Status:** Approved

---

## Goal

Replace the interim `role` string column on `users` with a proper Spatie Laravel Permission–backed RBAC system, and add CASL on the frontend to mirror backend permissions for UI-level enforcement.

---

## Decisions Made

| Question | Decision |
|----------|----------|
| RBAC granularity | Granular named permissions (not just role-level checks) |
| Backend package | Spatie Laravel Permission |
| Frontend package | CASL (`@casl/ability` + `@casl/react`) |
| Permission subject scoping | Flat `"all"` subject — no per-resource scoping in Phase 3 |
| Interim `role` column | Dropped after migration to Spatie roles |
| Proxy changes | None — role-aware routing stays at root page level |
| Permission set scope | Minimal: only permissions for currently-built modules |

---

## Permission Set (Phase 3)

| Permission | Assigned to | Covers |
|------------|-------------|--------|
| `manage_members` | `admin` | All members API endpoints (CRUD, approve, reject, restore, photo) |
| `view_own_data` | `member` | Member portal access (Phase 12 will add member-facing API routes) |

Future phases add their own permissions (e.g. `manage_loans`, `approve_loans`, `manage_configurations`) and assign them to roles via seeders — no code changes required.

---

## Backend Changes

### 1. Install Spatie

```bash
composer require spatie/laravel-permission
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"
php artisan migrate
```

Spatie adds 5 tables: `roles`, `permissions`, `model_has_roles`, `model_has_permissions`, `role_has_permissions`.

### 2. `User` model

Add `HasRoles` trait:

```php
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasUuids, HasRoles, Notifiable;
    // remove 'role' from $fillable
}
```

### 3. `RbacSeeder`

Creates roles and permissions, assigns permissions to roles, and migrates existing users from the interim `role` column to Spatie roles:

```php
$admin  = Role::firstOrCreate(['name' => 'admin',  'guard_name' => 'web']);
$member = Role::firstOrCreate(['name' => 'member', 'guard_name' => 'web']);

$manageMembers = Permission::firstOrCreate(['name' => 'manage_members', 'guard_name' => 'web']);
$viewOwn       = Permission::firstOrCreate(['name' => 'view_own_data',  'guard_name' => 'web']);

$admin->syncPermissions([$manageMembers]);
$member->syncPermissions([$viewOwn]);

// Migrate existing users from interim role column
User::all()->each(function (User $user) {
    $user->syncRoles([$user->role]);
});
```

`RbacSeeder` is called from `DatabaseSeeder`.

### 4. Drop interim `role` column

A new migration drops `users.role` after `RbacSeeder` has run:

```php
Schema::table('users', function (Blueprint $table) {
    $table->dropColumn('role');
});
```

### 5. `UserResource`

```php
return [
    'id'          => $this->id,
    'name'        => $this->name,
    'email'       => $this->email,
    'org_id'      => $this->org_id,
    'role'        => $this->getRoleNames()->first(),
    'permissions' => $this->getAllPermissions()->pluck('name')->values(),
    'created_at'  => $this->created_at?->toIso8601String(),
];
```

### 6. Middleware registration

In `bootstrap/app.php`, register Spatie's role/permission middleware aliases:

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->alias([
        'role'       => \Spatie\Permission\Middleware\RoleMiddleware::class,
        'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
        'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
    ]);
})
```

### 7. Route protection

All members routes are wrapped in the permission middleware:

```php
Route::middleware(['auth:sanctum', 'permission:manage_members'])->group(function () {
    Route::get('members/archived', [MemberController::class, 'archived']);
    Route::post('members/{member}/restore', [MemberController::class, 'restore']);
    Route::post('members/{member}/photo', [MemberController::class, 'uploadPhoto']);
    Route::post('members/{member}/approve', [MemberController::class, 'approve']);
    Route::post('members/{member}/reject', [MemberController::class, 'reject']);
    Route::apiResource('members', MemberController::class);
});
```

### 8. Exception handler — 403 response

In `bootstrap/app.php`, map Spatie's `UnauthorizedException` to the standard API envelope:

```php
->withExceptions(function (Exceptions $exceptions) {
    $exceptions->render(function (\Spatie\Permission\Exceptions\UnauthorizedException $e, $request) {
        if ($request->expectsJson()) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden.',
                'data'    => null,
            ], 403);
        }
    });
})
```

---

## Frontend Changes

### 1. Packages

```bash
npm install @casl/ability @casl/react
```

### 2. `src/lib/ability.ts`

```ts
import { createMongoAbility, MongoAbility } from "@casl/ability";

export type AppAbility = MongoAbility<[string, "all"]>;

export function defineAbilityFor(permissions: string[]): AppAbility {
  return createMongoAbility(
    permissions.map((action) => ({ action, subject: "all" }))
  );
}
```

### 3. `src/lib/AbilityContext.tsx`

```tsx
"use client";

import { createContext, useContext } from "react";
import { createContextualCan } from "@casl/react";
import { AppAbility, defineAbilityFor } from "./ability";

export const AbilityContext = createContext<AppAbility>(defineAbilityFor([]));

export function useAbility(): AppAbility {
  return useContext(AbilityContext);
}

export const Can = createContextualCan(AbilityContext.Consumer);
```

### 4. `AbilityProvider` — in admin and member layouts

Each layout reads the session and builds the ability:

```tsx
"use client";

import { useMemo } from "react";
import { defineAbilityFor } from "@/lib/ability";
import { AbilityContext } from "@/lib/AbilityContext";
import { useSession } from "@/lib/auth/auth-client";

export function AbilityProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const ability = useMemo(
    () => defineAbilityFor(session?.user?.permissions ?? []),
    [session?.user?.permissions]
  );
  return (
    <AbilityContext.Provider value={ability}>
      {children}
    </AbilityContext.Provider>
  );
}
```

`AbilityProvider` wraps the children in both `src/app/admin/layout.tsx` and `src/app/member/layout.tsx`.

### 5. `SessionUser` type update

In `src/lib/auth/auth-client.ts`, add `permissions` field:

```ts
export interface SessionUser {
  // ... existing fields ...
  permissions?: string[];
}
```

### 6. UI enforcement — member detail page

Wrap the action buttons in `<Can>`:

```tsx
import { Can } from "@/lib/AbilityContext";

<Can I="manage_members" a="all">
  <button onClick={handleApprove}>Approve</button>
  <button onClick={() => setShowRejectModal(true)}>Reject</button>
  <button onClick={handleArchive}>Archive</button>
</Can>
```

---

## Data Flow

1. User logs in → `GET /auth/me` returns `{ role: "admin", permissions: ["manage_members"] }`
2. `useSession()` caches this in React Query
3. `AbilityProvider` builds CASL ability from `permissions` array
4. Components use `<Can I="manage_members">` or `useAbility().can("manage_members")` for UI gating
5. API calls go to backend → `permission:manage_members` middleware enforces access
6. Denied requests return `{ success: false, message: "Forbidden." }` (403)

---

## Testing

### Backend — `RbacTest` (new)

- Admin can list members (`GET /api/v1/members` → 200)
- Member cannot list members (`GET /api/v1/members` → 403)
- Admin can approve a member
- Member cannot approve a member
- `GET /auth/me` returns `permissions` array for both roles

### Existing tests

`AuthTest` and `MemberTest` continue to pass. The seeded admin user in tests gets the `admin` Spatie role via `RbacSeeder` (called from `DatabaseSeeder`).

---

## Out of Scope for Phase 3

- Per-resource permission scoping (e.g., "admin can only manage members in their own org") — org scoping is already handled at query level in the models
- Member-facing API routes — Phase 12
- Admin user management UI — future phase
- Additional permissions for future modules (`manage_loans`, `approve_loans`, etc.) — added per phase

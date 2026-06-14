# Phase 19: Access Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add granular admin sub-roles (loans officer, teller, auditor, manager) with per-permission scoping, and give admins a UI to manage roles and admin users.

**Architecture:** Spatie permissions already installed. This phase adds new permissions + built-in sub-roles to the seeder, then adds `RoleController` and `AdminUserController` for CRUD. Frontend gets two new configuration pages. CASL ability builder is updated to consume the user's permissions array from the session.

**Tech Stack:** Laravel 12, Spatie laravel-permission, Sanctum, Next.js 16, React Query, shadcn/ui, CASL.

**Note:** This phase should be run after Phases 15–18 so all new permissions (`manage_shares`, `manage_dividends`, `manage_commodities`, `manage_imports`) already exist in the seeder.

---

## File Map

**Modify (backend):**
- `backend/database/seeders/RbacSeeder.php` — add new permissions + sub-roles
- `backend/routes/api.php` — add roles + admin user routes
- `backend/app/Http/Controllers/Api/V1/AuthController.php` — expose permissions in `/me` response

**Create (backend):**
- `backend/app/Http/Controllers/Api/V1/RoleController.php`
- `backend/app/Http/Controllers/Api/V1/AdminUserController.php`

**Create (frontend):**
- `frontend/src/lib/api/roles.ts`
- `frontend/src/app/admin/configurations/roles/page.tsx`
- `frontend/src/app/admin/configurations/admin-users/page.tsx`

**Modify (frontend):**
- `frontend/src/components/Layouts/sidebar/data/index.ts`
- `frontend/src/lib/auth/auth-client.ts` — verify permissions are in session payload

---

## Task 1: Update RbacSeeder — new permissions + sub-roles

**Files:**
- Modify: `backend/database/seeders/RbacSeeder.php`

- [ ] Replace `backend/database/seeders/RbacSeeder.php` with the following complete file. This is idempotent — `firstOrCreate` is safe to run multiple times:

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RbacSeeder extends Seeder
{
    public function run(): void
    {
        app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

        // ── Roles ───────────────────────────────────────────────────────
        $admin        = Role::firstOrCreate(['name' => 'admin',         'guard_name' => 'web']);
        $manager      = Role::firstOrCreate(['name' => 'manager',       'guard_name' => 'web']);
        $loansOfficer = Role::firstOrCreate(['name' => 'loans_officer', 'guard_name' => 'web']);
        $teller       = Role::firstOrCreate(['name' => 'teller',        'guard_name' => 'web']);
        $auditor      = Role::firstOrCreate(['name' => 'auditor',       'guard_name' => 'web']);
        $member       = Role::firstOrCreate(['name' => 'member',        'guard_name' => 'web']);

        // ── Permissions ─────────────────────────────────────────────────
        $perms = [];
        $names = [
            'manage_members',
            'manage_configurations',
            'manage_accounts',
            'manage_loans',
            'manage_contributions',
            'manage_journals',
            'manage_petty_cash',
            'manage_issues',
            'manage_shares',
            'manage_dividends',
            'manage_commodities',
            'manage_imports',
            'manage_reports',
            'view_own_data',
        ];

        foreach ($names as $name) {
            $perms[$name] = Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        }

        // ── Role ↔ Permission assignments ───────────────────────────────
        $admin->syncPermissions(array_values($perms)); // all permissions

        $manager->syncPermissions([
            $perms['manage_members'],
            $perms['manage_accounts'],
            $perms['manage_loans'],
            $perms['manage_contributions'],
            $perms['manage_journals'],
            $perms['manage_petty_cash'],
            $perms['manage_issues'],
            $perms['manage_shares'],
            $perms['manage_dividends'],
            $perms['manage_commodities'],
            $perms['manage_imports'],
            $perms['manage_reports'],
        ]);

        $loansOfficer->syncPermissions([
            $perms['manage_loans'],
            $perms['manage_members'],
            $perms['manage_reports'],
        ]);

        $teller->syncPermissions([
            $perms['manage_accounts'],
            $perms['manage_contributions'],
            $perms['manage_reports'],
        ]);

        $auditor->syncPermissions([
            $perms['manage_journals'],
            $perms['manage_reports'],
        ]);

        $member->syncPermissions([$perms['view_own_data']]);
    }
}
```

- [ ] Run seeder:

```bash
cd backend && php artisan db:seed --class=RbacSeeder
```

Expected: no errors, new permissions and roles created/updated.

- [ ] Commit:

```bash
git add backend/database/seeders/RbacSeeder.php
git commit -m "feat(access): add granular permissions and admin sub-roles to RbacSeeder"
```

---

## Task 2: Expose permissions in session/me response

The frontend CASL ability builder needs to know which permissions the logged-in user has. The `GET /me` endpoint (or the auth response) must include the user's permission names.

- [ ] Find where `GET /me` is handled. Run:

```bash
grep -n "function me\|'me'\|/me" backend/routes/api.php | head -10
grep -rn "function me\b" backend/app/Http/Controllers/
```

- [ ] Once found, update the `me` response to include `permissions`. If the response uses `UserResource`, update `UserResource.php`. If it's inline in the controller, add the permissions there.

  The change to add — inside the user data shape:

```php
'permissions' => $request->user()->getAllPermissions()->pluck('name'),
'roles'       => $request->user()->getRoleNames(),
```

  Example: if `UserResource` is the class, add those two lines to its `toArray()` method.

- [ ] Commit:

```bash
git add backend/app/Http/Resources/V1/UserResource.php
git commit -m "feat(access): expose permissions and roles in /me response"
```

---

## Task 3: RoleController

**Files:**
- Create: `backend/app/Http/Controllers/Api/V1/RoleController.php`

- [ ] Create `backend/app/Http/Controllers/Api/V1/RoleController.php`:

```php
<?php

namespace App\Http\Controllers\Api\V1;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends ApiController
{
    private array $builtIn = ['admin', 'manager', 'loans_officer', 'teller', 'auditor', 'member'];

    public function index(Request $request): JsonResponse
    {
        $roles = Role::with('permissions')->get()->map(fn ($r) => [
            'id'          => $r->id,
            'name'        => $r->name,
            'is_built_in' => in_array($r->name, $this->builtIn, true),
            'permissions' => $r->permissions->pluck('name'),
        ]);

        $allPermissions = Permission::pluck('name');

        return $this->respond([
            'roles'       => $roles,
            'permissions' => $allPermissions,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'        => ['required', 'string', 'max:50', 'unique:roles,name'],
            'permissions' => ['array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ]);

        $role = Role::create(['name' => $data['name'], 'guard_name' => 'web']);

        if (! empty($data['permissions'])) {
            $role->syncPermissions($data['permissions']);
        }

        return $this->respondCreated([
            'id'          => $role->id,
            'name'        => $role->name,
            'is_built_in' => false,
            'permissions' => $role->permissions->pluck('name'),
        ], 'Role created.');
    }

    public function updatePermissions(Request $request, string $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        abort_if(in_array($role->name, $this->builtIn, true), 422,
            'Built-in role permissions cannot be changed here. Edit the RbacSeeder instead.');

        $data = $request->validate([
            'permissions'   => ['required', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ]);

        $role->syncPermissions($data['permissions']);

        return $this->respond([
            'id'          => $role->id,
            'name'        => $role->name,
            'is_built_in' => false,
            'permissions' => $role->permissions->pluck('name'),
        ], 'Permissions updated.');
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        abort_if(in_array($role->name, $this->builtIn, true), 422,
            'Built-in roles cannot be deleted.');

        $role->delete();

        return $this->respond(null, 'Role deleted.');
    }
}
```

- [ ] Commit:

```bash
git add backend/app/Http/Controllers/Api/V1/RoleController.php
git commit -m "feat(access): add RoleController"
```

---

## Task 4: AdminUserController

**Files:**
- Create: `backend/app/Http/Controllers/Api/V1/AdminUserController.php`

- [ ] Create `backend/app/Http/Controllers/Api/V1/AdminUserController.php`:

```php
<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class AdminUserController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $users = User::where('org_id', $request->user()->org_id)
            ->with('roles')
            ->whereHas('roles', fn ($q) => $q->where('name', '!=', 'member'))
            ->get()
            ->map(fn ($u) => [
                'id'    => $u->id,
                'name'  => $u->name,
                'email' => $u->email,
                'roles' => $u->getRoleNames(),
                'is_active' => true, // users table doesn't track active state yet; all are active
            ]);

        return $this->respond($users);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'  => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'unique:users,email'],
            'role'  => ['required', 'string', 'exists:roles,name'],
        ]);

        abort_if($data['role'] === 'member', 422, 'Cannot create admin users with the member role via this endpoint.');

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'org_id'   => $request->user()->org_id,
            'password' => Hash::make('password'), // temp password — user must reset
        ]);

        $user->assignRole($data['role']);

        return $this->respondCreated([
            'id'    => $user->id,
            'name'  => $user->name,
            'email' => $user->email,
            'roles' => $user->getRoleNames(),
        ], "Admin user created. Temporary password: password");
    }

    public function updateRole(Request $request, string $id): JsonResponse
    {
        $user = User::where('org_id', $request->user()->org_id)->findOrFail($id);

        abort_if($user->id === $request->user()->id, 422, 'You cannot change your own role.');

        $data = $request->validate([
            'role' => ['required', 'string', 'exists:roles,name'],
        ]);

        abort_if($data['role'] === 'member', 422, 'Cannot assign member role to admin users here.');

        $user->syncRoles([$data['role']]);

        return $this->respond([
            'id'    => $user->id,
            'name'  => $user->name,
            'email' => $user->email,
            'roles' => $user->getRoleNames(),
        ], 'Role updated.');
    }
}
```

- [ ] Commit:

```bash
git add backend/app/Http/Controllers/Api/V1/AdminUserController.php
git commit -m "feat(access): add AdminUserController"
```

---

## Task 5: Routes

**Files:**
- Modify: `backend/routes/api.php`

- [ ] Add to `api.php` inside the `manage_configurations` middleware group:

```php
// Roles
Route::get('roles',                   [\App\Http\Controllers\Api\V1\RoleController::class, 'index']);
Route::post('roles',                  [\App\Http\Controllers\Api\V1\RoleController::class, 'store']);
Route::put('roles/{id}/permissions',  [\App\Http\Controllers\Api\V1\RoleController::class, 'updatePermissions']);
Route::delete('roles/{id}',           [\App\Http\Controllers\Api\V1\RoleController::class, 'destroy']);

// Admin users
Route::get('admin-users',             [\App\Http\Controllers\Api\V1\AdminUserController::class, 'index']);
Route::post('admin-users',            [\App\Http\Controllers\Api\V1\AdminUserController::class, 'store']);
Route::put('admin-users/{id}/role',   [\App\Http\Controllers\Api\V1\AdminUserController::class, 'updateRole']);
```

- [ ] Commit:

```bash
git add backend/routes/api.php
git commit -m "feat(access): add roles and admin-users routes"
```

---

## Task 6: Frontend API hooks

**Files:**
- Create: `frontend/src/lib/api/roles.ts`

- [ ] Create `frontend/src/lib/api/roles.ts`:

```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiEnvelope } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────

export interface AppRole {
  id: number;
  name: string;
  is_built_in: boolean;
  permissions: string[];
}

export interface RolesData {
  roles: AppRole[];
  permissions: string[];
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
  is_active: boolean;
}

// ── Query keys ─────────────────────────────────────────────────────────

export const ROLES_KEY       = ["roles"] as const;
export const ADMIN_USERS_KEY = ["admin-users"] as const;

// ── Roles ───────────────────────────────────────────────────────────────

export function useRoles() {
  return useQuery<RolesData>({
    queryKey: ROLES_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<RolesData>>("/roles");
      return data.data;
    },
    staleTime: 60_000,
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation<AppRole, Error, { name: string; permissions: string[] }>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<AppRole>>("/roles", payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ROLES_KEY }),
  });
}

export function useUpdateRolePermissions() {
  const qc = useQueryClient();
  return useMutation<AppRole, Error, { id: number; permissions: string[] }>({
    mutationFn: async ({ id, permissions }) => {
      const { data } = await api.put<ApiEnvelope<AppRole>>(`/roles/${id}/permissions`, { permissions });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ROLES_KEY }),
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (id) => { await api.delete(`/roles/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ROLES_KEY }),
  });
}

// ── Admin Users ─────────────────────────────────────────────────────────

export function useAdminUsers() {
  return useQuery<AdminUser[]>({
    queryKey: ADMIN_USERS_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<AdminUser[]>>("/admin-users");
      return data.data;
    },
    staleTime: 30_000,
  });
}

export function useCreateAdminUser() {
  const qc = useQueryClient();
  return useMutation<AdminUser, Error, { name: string; email: string; role: string }>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<AdminUser>>("/admin-users", payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_USERS_KEY }),
  });
}

export function useUpdateAdminUserRole() {
  const qc = useQueryClient();
  return useMutation<AdminUser, Error, { id: string; role: string }>({
    mutationFn: async ({ id, role }) => {
      const { data } = await api.put<ApiEnvelope<AdminUser>>(`/admin-users/${id}/role`, { role });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_USERS_KEY }),
  });
}
```

- [ ] Commit:

```bash
git add frontend/src/lib/api/roles.ts
git commit -m "feat(access): add frontend roles and admin users API hooks"
```

---

## Task 7: Admin Roles configuration page

**Files:**
- Create: `frontend/src/app/admin/configurations/roles/page.tsx`

- [ ] Create `frontend/src/app/admin/configurations/roles/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  useRoles, useCreateRole, useUpdateRolePermissions, useDeleteRole, AppRole,
} from "@/lib/api/roles";
import { extractApiError, extractFieldErrors } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const PERMISSION_LABELS: Record<string, string> = {
  manage_members:        "Members",
  manage_configurations: "Configurations",
  manage_accounts:       "Accounts",
  manage_loans:          "Loans",
  manage_contributions:  "Contributions",
  manage_journals:       "Journals",
  manage_petty_cash:     "Petty Cash",
  manage_issues:         "Issues",
  manage_shares:         "Shares",
  manage_dividends:      "Dividends",
  manage_commodities:    "Commodities",
  manage_imports:        "Data Import",
  manage_reports:        "Reports",
  view_own_data:         "View Own Data",
};

export default function RolesPage() {
  const { data, isLoading } = useRoles();
  const createMut           = useCreateRole();
  const updatePermsMut      = useUpdateRolePermissions();
  const deleteMut           = useDeleteRole();

  const roles       = data?.roles ?? [];
  const permissions = data?.permissions ?? [];

  const [open, setOpen]             = useState(false);
  const [editingRole, setEditingRole] = useState<AppRole | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [errors, setErrors]         = useState<Record<string, string>>({});

  function openCreate() {
    setEditingRole(null);
    setNewRoleName("");
    setSelectedPerms([]);
    setErrors({});
    setOpen(true);
  }

  function openEditPerms(role: AppRole) {
    if (role.is_built_in) {
      toast.info("Built-in role permissions are managed in code (RbacSeeder).");
      return;
    }
    setEditingRole(role);
    setSelectedPerms([...role.permissions]);
    setErrors({});
    setOpen(true);
  }

  function togglePerm(p: string) {
    setSelectedPerms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    try {
      if (editingRole) {
        await updatePermsMut.mutateAsync({ id: editingRole.id, permissions: selectedPerms });
        toast.success("Permissions updated.");
      } else {
        await createMut.mutateAsync({ name: newRoleName, permissions: selectedPerms });
        toast.success("Role created.");
      }
      setOpen(false);
    } catch (err) {
      const fe = extractFieldErrors(err);
      if (Object.keys(fe).length) { setErrors(fe); return; }
      toast.error(extractApiError(err));
    }
  }

  async function handleDelete(role: AppRole) {
    if (!confirm(`Delete role "${role.name}"?`)) return;
    try {
      await deleteMut.mutateAsync(role.id);
      toast.success("Role deleted.");
    } catch (err) { toast.error(extractApiError(err)); }
  }

  if (isLoading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Roles & Permissions</h1>
        <Button onClick={openCreate}>+ New Role</Button>
      </div>

      <div className="space-y-4">
        {roles.map(role => (
          <div key={role.id} className="border rounded p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-semibold capitalize">{role.name.replace(/_/g, " ")}</span>
                {role.is_built_in && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Built-in</span>
                )}
              </div>
              <div className="flex gap-2">
                {!role.is_built_in && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => openEditPerms(role)}>
                      Edit Permissions
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(role)}>
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {role.permissions.map(p => (
                <span key={p} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                  {PERMISSION_LABELS[p] ?? p}
                </span>
              ))}
              {role.permissions.length === 0 && (
                <span className="text-xs text-gray-400">No permissions assigned.</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRole ? `Edit Permissions — ${editingRole.name}` : "New Role"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editingRole && (
              <div>
                <Label>Role Name (snake_case)</Label>
                <Input value={newRoleName} onChange={e => setNewRoleName(e.target.value)}
                  placeholder="e.g. branch_manager" required />
                {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
              </div>
            )}

            <div>
              <Label className="mb-2 block">Permissions</Label>
              <div className="grid grid-cols-2 gap-2">
                {permissions.filter(p => p !== "view_own_data").map(p => (
                  <label key={p} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPerms.includes(p)}
                      onChange={() => togglePerm(p)}
                    />
                    {PERMISSION_LABELS[p] ?? p}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMut.isPending || updatePermsMut.isPending}>
                {editingRole ? "Save Permissions" : "Create Role"}
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
git add frontend/src/app/admin/configurations/roles/page.tsx
git commit -m "feat(access): add admin roles configuration page"
```

---

## Task 8: Admin Users configuration page

**Files:**
- Create: `frontend/src/app/admin/configurations/admin-users/page.tsx`

- [ ] Create `frontend/src/app/admin/configurations/admin-users/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  useAdminUsers, useCreateAdminUser, useUpdateAdminUserRole, AdminUser,
} from "@/lib/api/roles";
import { useRoles } from "@/lib/api/roles";
import { extractApiError, extractFieldErrors } from "@/lib/api";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ColumnDef } from "@tanstack/react-table";

export default function AdminUsersPage() {
  const { data: users = [], isLoading } = useAdminUsers();
  const { data: rolesData }             = useRoles();
  const createMut                       = useCreateAdminUser();
  const updateRoleMut                   = useUpdateAdminUserRole();

  const roles = (rolesData?.roles ?? []).filter(r => r.name !== "member");

  const [open, setOpen]           = useState(false);
  const [roleOpen, setRoleOpen]   = useState(false);
  const [targetUser, setTargetUser] = useState<AdminUser | null>(null);
  const [newRole, setNewRole]     = useState("");
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [form, setForm]           = useState({ name: "", email: "", role: "" });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    try {
      await createMut.mutateAsync(form);
      toast.success("Admin user created. Temporary password: password");
      setOpen(false);
    } catch (err) {
      const fe = extractFieldErrors(err);
      if (Object.keys(fe).length) { setErrors(fe); return; }
      toast.error(extractApiError(err));
    }
  }

  async function handleRoleUpdate() {
    if (!targetUser) return;
    try {
      await updateRoleMut.mutateAsync({ id: targetUser.id, role: newRole });
      toast.success("Role updated.");
      setRoleOpen(false);
    } catch (err) { toast.error(extractApiError(err)); }
  }

  const columns: ColumnDef<AdminUser>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "email", header: "Email" },
    {
      accessorKey: "roles",
      header: "Role",
      cell: ({ row }) => (
        <span className="capitalize">{(row.original.roles[0] ?? "—").replace(/_/g, " ")}</span>
      ),
    },
    {
      id: "actions", header: "Actions",
      cell: ({ row }) => (
        <Button size="sm" variant="outline" onClick={() => {
          setTargetUser(row.original);
          setNewRole(row.original.roles[0] ?? "");
          setRoleOpen(true);
        }}>
          Change Role
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Users</h1>
        <Button onClick={() => { setForm({ name: "", email: "", role: "" }); setErrors({}); setOpen(true); }}>
          + Add Staff
        </Button>
      </div>

      <DataTable columns={columns} data={users} isLoading={isLoading} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Admin User</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
            </div>
            <div>
              <Label>Role</Label>
              <select className="w-full border rounded p-2 text-sm" value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))} required>
                <option value="">Select role…</option>
                {roles.map(r => (
                  <option key={r.id} value={r.name}>
                    {r.name.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                  </option>
                ))}
              </select>
              {errors.role && <p className="text-red-500 text-xs">{errors.role}</p>}
            </div>
            <p className="text-xs text-amber-600">Temporary password will be "password" — user must change it on first login.</p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMut.isPending}>Create</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={roleOpen} onOpenChange={setRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role — {targetUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>New Role</Label>
              <select className="w-full border rounded p-2 text-sm" value={newRole}
                onChange={e => setNewRole(e.target.value)}>
                {roles.map(r => (
                  <option key={r.id} value={r.name}>
                    {r.name.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRoleOpen(false)}>Cancel</Button>
              <Button onClick={handleRoleUpdate} disabled={!newRole || updateRoleMut.isPending}>Update</Button>
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
git add frontend/src/app/admin/configurations/admin-users/page.tsx
git commit -m "feat(access): add admin users configuration page"
```

---

## Task 9: Sidebar nav

**Files:**
- Modify: `frontend/src/components/Layouts/sidebar/data/index.ts`

- [ ] Add to the CONFIGURATIONS group items in `ADMIN_NAV_DATA` (after existing items):

```typescript
{ title: "Roles & Permissions", url: "/admin/configurations/roles" },
{ title: "Admin Users",         url: "/admin/configurations/admin-users" },
```

- [ ] Run TypeScript check:

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] Commit:

```bash
git add frontend/src/components/Layouts/sidebar/data/index.ts
git commit -m "feat(access): add Roles and Admin Users to configurations nav"
```

---

## Task 10: Update CASL ability builder

The frontend uses CASL to gate UI elements. The ability builder must now consume the `permissions` array from the user's session.

- [ ] Find the CASL ability file:

```bash
find frontend/src -name "ability*" -o -name "casl*" | grep -v node_modules
```

- [ ] Read the file and update `defineAbility` (or `buildAbility`) so it calls `can(permission, 'all')` for each permission in `user.permissions`:

Example pattern — replace the current static ability definition with:

```typescript
// In the ability builder function, where user data is available:
permissions.forEach((permission: string) => {
  can(permission, "all");
});
```

If the session payload doesn't yet include `permissions`, it will after Task 2 above. The hook that calls `GET /me` should be invalidated/refetched after login.

- [ ] Run TypeScript check:

```bash
cd frontend && npx tsc --noEmit
```

- [ ] Commit:

```bash
git add frontend/src/lib/auth/
git commit -m "feat(access): update CASL ability builder to use permissions from session"
```

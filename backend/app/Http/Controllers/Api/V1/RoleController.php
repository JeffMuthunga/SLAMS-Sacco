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
            'name'          => ['required', 'string', 'max:50', 'unique:roles,name'],
            'permissions'   => ['array'],
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

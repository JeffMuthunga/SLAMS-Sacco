<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminUserController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $users = User::where('org_id', $request->user()->org_id)
            ->with('roles')
            ->whereHas('roles', fn ($q) => $q->where('name', '!=', 'member'))
            ->get()
            ->map(fn ($u) => [
                'id'        => $u->id,
                'name'      => $u->name,
                'email'     => $u->email,
                'roles'     => $u->getRoleNames(),
                'is_active' => true,
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

        abort_if($data['role'] === 'member', 422,
            'Cannot create admin users with the member role via this endpoint.');

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'org_id'   => $request->user()->org_id,
            'password' => Hash::make('password'),
        ]);

        $user->assignRole($data['role']);

        return $this->respondCreated([
            'id'    => $user->id,
            'name'  => $user->name,
            'email' => $user->email,
            'roles' => $user->getRoleNames(),
        ], 'Admin user created. Temporary password: password');
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

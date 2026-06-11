<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Api\V1\Auth\LoginRequest;
use App\Http\Requests\Api\V1\Auth\RegisterRequest;
use App\Http\Requests\Api\V1\Auth\UpdateProfileRequest;
use App\Http\Resources\V1\UserResource;
use App\Models\Org;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends ApiController
{
    public function login(LoginRequest $request): JsonResponse
    {
        if (! Auth::attempt($request->only('email', 'password'), $request->boolean('remember'))) {
            return $this->respondError('Invalid credentials.', 422, [
                'email' => ['These credentials do not match our records.'],
            ]);
        }

        $request->session()->regenerate();

        return $this->respond(new UserResource($request->user()), 'Signed in successfully.');
    }

    public function register(RegisterRequest $request): JsonResponse
    {
        $defaultOrg = Org::where('is_default', true)->first();

        $user = User::create([
            'name' => $request->validated('name'),
            'email' => $request->validated('email'),
            'password' => Hash::make($request->validated('password')),
            'role' => 'member',
            'org_id' => $defaultOrg?->id,
        ]);

        Auth::login($user);
        $request->session()->regenerate();

        return $this->respondCreated(new UserResource($user), 'Account created successfully.');
    }

    public function me(Request $request): JsonResponse
    {
        return $this->respond(new UserResource($request->user()));
    }

    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->fill($request->validated())->save();

        return $this->respond(new UserResource($user), 'Profile updated successfully.');
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return $this->respond(null, 'Signed out successfully.');
    }
}

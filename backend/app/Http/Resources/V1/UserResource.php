<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'email'       => $this->email,
            'org_id'      => $this->org_id,
            'role'        => $this->getRoleNames()->first(),
            'permissions' => $this->getAllPermissions()->pluck('name')->values(),
            'created_at'  => $this->created_at?->toIso8601String(),
        ];
    }
}

<?php

namespace App\Http\Resources\V1\Configurations;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityTypeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'org_id'         => $this->org_id,
            'name'           => $this->name,
            'code'           => $this->code,
            'dr_account_id'  => $this->dr_account_id,
            'cr_account_id'  => $this->cr_account_id,
            'is_active'      => $this->is_active,
            'created_at'     => $this->created_at?->toIso8601String(),
            'updated_at'     => $this->updated_at?->toIso8601String(),
        ];
    }
}

<?php

namespace App\Http\Resources\V1\Configurations;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class IssueCategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'org_id'      => $this->org_id,
            'name'        => $this->name,
            'description' => $this->description,
            'created_at'  => $this->created_at?->toIso8601String(),
        ];
    }
}

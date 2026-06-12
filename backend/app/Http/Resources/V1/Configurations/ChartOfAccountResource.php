<?php

namespace App\Http\Resources\V1\Configurations;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChartOfAccountResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'org_id'          => $this->org_id,
            'account_type_id' => $this->account_type_id,
            'parent_id'       => $this->parent_id,
            'code'            => $this->code,
            'name'            => $this->name,
            'is_header'       => $this->is_header,
            'is_active'       => $this->is_active,
            'account_type'    => $this->whenLoaded('accountType', fn () => [
                'id'   => $this->accountType->id,
                'code' => $this->accountType->code,
                'name' => $this->accountType->name,
            ]),
            'parent'          => $this->whenLoaded('parent', fn () => [
                'id'   => $this->parent->id,
                'code' => $this->parent->code,
                'name' => $this->parent->name,
            ]),
            'created_at'      => $this->created_at?->toIso8601String(),
        ];
    }
}

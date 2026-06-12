<?php

namespace App\Http\Resources\V1\Configurations;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BankAccountResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'org_id'         => $this->org_id,
            'bank_id'        => $this->bank_id,
            'bank'           => $this->whenLoaded('bank', fn () => new BankResource($this->bank)),
            'account_name'   => $this->account_name,
            'account_number' => $this->account_number,
            'branch'         => $this->branch,
            'is_active'      => $this->is_active,
            'created_at'     => $this->created_at?->toIso8601String(),
            'updated_at'     => $this->updated_at?->toIso8601String(),
        ];
    }
}

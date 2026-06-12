<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DepositAccountResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                 => $this->id,
            'account_number'     => $this->account_number,
            'balance'            => $this->balance,
            'interest_rate'      => $this->interest_rate,
            'opening_date'       => $this->opening_date?->toDateString(),
            'last_activity_date' => $this->last_activity_date?->toDateString(),
            'is_active'          => $this->is_active,
            'is_locked'          => $this->is_locked,
            'locked_until_date'  => $this->locked_until_date?->toDateString(),
            'approval_status'    => $this->approval_status,
            'approved_by'        => $this->approved_by,
            'approved_at'        => $this->approved_at?->toIso8601String(),
            'org_id'             => $this->org_id,
            'member'             => $this->whenLoaded('member', fn () => [
                'id'            => $this->member->id,
                'full_name'     => $this->member->full_name,
                'member_number' => $this->member->member_number,
            ]),
            'product'            => $this->whenLoaded('product', fn () => [
                'id'   => $this->product->id,
                'name' => $this->product->name,
            ]),
            'created_at'         => $this->created_at?->toIso8601String(),
        ];
    }
}

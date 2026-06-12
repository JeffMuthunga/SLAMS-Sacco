<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PettyCashAllocationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'org_id'          => $this->org_id,
            'period_id'       => $this->period_id,
            'allocated_to'    => $this->allocated_to,
            'amount'          => $this->amount,
            'spent'           => $this->spent,
            'balance'         => $this->balance,
            'narration'       => $this->narration,
            'approval_status' => $this->approval_status,
            'approved_at'     => $this->approved_at?->toIso8601String(),
            'period'          => $this->whenLoaded('period', fn () => [
                'id'   => $this->period->id,
                'name' => $this->period->name,
            ]),
            'user'            => $this->whenLoaded('allocatedTo', fn () => [
                'id'    => $this->allocatedTo->id,
                'name'  => $this->allocatedTo->name,
                'email' => $this->allocatedTo->email,
            ]),
            'created_at'      => $this->created_at?->toIso8601String(),
        ];
    }
}

<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContributionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'expected_amount' => $this->expected_amount,
            'paid_amount'     => $this->paid_amount,
            'due_date'        => $this->due_date?->toDateString(),
            'paid_date'       => $this->paid_date?->toDateString(),
            'status'          => $this->status,
            'org_id'          => $this->org_id,
            'period_id'       => $this->period_id,
            'member'          => $this->whenLoaded('member', fn () => [
                'id'            => $this->member->id,
                'full_name'     => $this->member->full_name,
                'member_number' => $this->member->member_number,
            ]),
            'deposit_account' => $this->whenLoaded('depositAccount', fn () => [
                'id'             => $this->depositAccount->id,
                'account_number' => $this->depositAccount->account_number,
            ]),
            'period'          => $this->whenLoaded('period', fn () => [
                'id'   => $this->period->id,
                'name' => $this->period->name,
            ]),
            'created_at'      => $this->created_at?->toIso8601String(),
        ];
    }
}

<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DividendEntryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'dividend_run_id'  => $this->dividend_run_id,
            'member_id'        => $this->member_id,
            'member'           => $this->whenLoaded('member', fn () => [
                'id'            => $this->member->id,
                'full_name'     => $this->member->full_name,
                'member_number' => $this->member->member_number,
            ]),
            'share_balance'    => $this->share_balance,
            'dividend_amount'  => $this->dividend_amount,
            'credited_account_id' => $this->credited_account_id,
            'posted_at'        => $this->posted_at?->toIso8601String(),
            'created_at'       => $this->created_at?->toIso8601String(),
        ];
    }
}

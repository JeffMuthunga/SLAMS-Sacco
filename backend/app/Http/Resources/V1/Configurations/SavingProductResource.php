<?php

namespace App\Http\Resources\V1\Configurations;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SavingProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                              => $this->id,
            'org_id'                          => $this->org_id,
            'name'                            => $this->name,
            'description'                     => $this->description,
            'interest_rate'                   => $this->interest_rate,
            'min_opening_balance'             => $this->min_opening_balance,
            'min_balance'                     => $this->min_balance,
            'max_balance'                     => $this->max_balance,
            'min_deposit'                     => $this->min_deposit,
            'max_deposit'                     => $this->max_deposit,
            'min_withdrawal'                  => $this->min_withdrawal,
            'max_withdrawal'                  => $this->max_withdrawal,
            'lock_in_months'                  => $this->lock_in_months,
            'withdrawal_frequency'            => $this->withdrawal_frequency,
            'is_active'                       => $this->is_active,
            'is_mandatory'                    => $this->is_mandatory,
            'block_withdrawal_on_active_loan' => $this->block_withdrawal_on_active_loan,
            'created_at'                      => $this->created_at?->toIso8601String(),
            'updated_at'                      => $this->updated_at?->toIso8601String(),
        ];
    }
}

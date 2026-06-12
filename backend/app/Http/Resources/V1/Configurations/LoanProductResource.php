<?php

namespace App\Http\Resources\V1\Configurations;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LoanProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                     => $this->id,
            'org_id'                 => $this->org_id,
            'name'                   => $this->name,
            'description'            => $this->description,
            'interest_rate'          => $this->interest_rate,
            'interest_method'        => $this->interest_method,
            'repayment_frequency'    => $this->repayment_frequency,
            'min_amount'             => $this->min_amount,
            'max_amount'             => $this->max_amount,
            'min_period_months'      => $this->min_period_months,
            'max_period_months'      => $this->max_period_months,
            'max_repayments'         => $this->max_repayments,
            'requires_guarantor'     => $this->requires_guarantor,
            'requires_collateral'    => $this->requires_collateral,
            'min_membership_months'  => $this->min_membership_months,
            'processing_fee_amount'  => $this->processing_fee_amount,
            'processing_fee_percent' => $this->processing_fee_percent,
            'penalty_rate'           => $this->penalty_rate,
            'is_active'              => $this->is_active,
            'created_at'             => $this->created_at?->toIso8601String(),
            'updated_at'             => $this->updated_at?->toIso8601String(),
        ];
    }
}

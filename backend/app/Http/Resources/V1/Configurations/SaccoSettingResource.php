<?php

namespace App\Http\Resources\V1\Configurations;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SaccoSettingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                        => $this->id,
            'org_id'                    => $this->org_id,
            'registration_fee'          => $this->registration_fee,
            'min_share_capital'         => $this->min_share_capital,
            'min_monthly_contribution'  => $this->min_monthly_contribution,
            'loan_limit_multiplier'     => $this->loan_limit_multiplier,
            'updated_at'                => $this->updated_at?->toIso8601String(),
        ];
    }
}

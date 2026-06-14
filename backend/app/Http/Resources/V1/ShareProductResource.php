<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ShareProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                       => $this->id,
            'name'                     => $this->name,
            'price_per_share'          => $this->price_per_share,
            'min_shares'               => $this->min_shares,
            'max_shares'               => $this->max_shares,
            'is_active'                => $this->is_active,
            'share_capital_account_id' => $this->share_capital_account_id,
            'share_capital_account'    => $this->whenLoaded('shareCapitalAccount', fn () => [
                'id'   => $this->shareCapitalAccount->id,
                'name' => $this->shareCapitalAccount->name,
                'code' => $this->shareCapitalAccount->code,
            ]),
            'created_at'               => $this->created_at?->toIso8601String(),
        ];
    }
}

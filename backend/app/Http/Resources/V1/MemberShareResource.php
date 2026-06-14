<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MemberShareResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'quantity'       => $this->quantity,
            'price_per_share'=> $this->price_per_share,
            'total_amount'   => $this->total_amount,
            'purchase_date'  => $this->purchase_date?->toDateString(),
            'status'         => $this->status,
            'notes'          => $this->notes,
            'approved_at'    => $this->approved_at?->toIso8601String(),
            'approved_by'    => $this->approved_by,
            'member'         => $this->whenLoaded('member', fn () => [
                'id'            => $this->member->id,
                'full_name'     => $this->member->full_name,
                'member_number' => $this->member->member_number,
            ]),
            'share_product'  => $this->whenLoaded('shareProduct', fn () => [
                'id'              => $this->shareProduct->id,
                'name'            => $this->shareProduct->name,
                'price_per_share' => $this->shareProduct->price_per_share,
            ]),
            'deposit_account'=> $this->whenLoaded('depositAccount', fn () => [
                'id'             => $this->depositAccount->id,
                'account_number' => $this->depositAccount->account_number,
            ]),
            'created_at'     => $this->created_at?->toIso8601String(),
        ];
    }
}

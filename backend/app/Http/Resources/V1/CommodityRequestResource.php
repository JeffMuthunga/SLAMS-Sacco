<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommodityRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'request_number'   => $this->request_number,
            'status'           => $this->status,
            'total_amount'     => $this->total_amount,
            'repayment_period' => $this->repayment_period,
            'notes'            => $this->notes,
            'approved_at'      => $this->approved_at?->toIso8601String(),
            'issued_at'        => $this->issued_at?->toIso8601String(),
            'member'           => $this->whenLoaded('member', fn () => [
                'id'            => $this->member->id,
                'full_name'     => $this->member->full_name,
                'member_number' => $this->member->member_number,
            ]),
            'items'            => $this->whenLoaded('items', fn () =>
                $this->items->map(fn ($item) => [
                    'id'         => $item->id,
                    'commodity'  => $item->commodity ? [
                        'id'   => $item->commodity->id,
                        'name' => $item->commodity->name,
                    ] : null,
                    'quantity'   => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'subtotal'   => $item->subtotal,
                ])
            ),
            'created_at'       => $this->created_at?->toIso8601String(),
        ];
    }
}

<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PettyCashRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'org_id'          => $this->org_id,
            'allocation_id'   => $this->allocation_id,
            'item_id'         => $this->item_id,
            'requested_by'    => $this->requested_by,
            'units'           => $this->units,
            'unit_price'      => $this->unit_price,
            'amount'          => $this->amount,
            'receipt_number'  => $this->receipt_number,
            'expense_date'    => $this->expense_date?->toDateString(),
            'narration'       => $this->narration,
            'approval_status' => $this->approval_status,
            'approved_at'     => $this->approved_at?->toIso8601String(),
            'allocation'      => $this->whenLoaded('allocation', fn () => [
                'id'     => $this->allocation->id,
                'amount' => $this->allocation->amount,
            ]),
            'item'            => $this->whenLoaded('item', fn () => [
                'id'   => $this->item->id,
                'name' => $this->item->name,
            ]),
            'requester'       => $this->whenLoaded('requestedBy', fn () => [
                'id'    => $this->requestedBy->id,
                'name'  => $this->requestedBy->name,
                'email' => $this->requestedBy->email,
            ]),
            'created_at'      => $this->created_at?->toIso8601String(),
        ];
    }
}

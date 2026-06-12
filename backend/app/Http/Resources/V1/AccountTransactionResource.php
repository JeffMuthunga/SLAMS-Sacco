<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AccountTransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                    => $this->id,
            'deposit_account_id'    => $this->deposit_account_id,
            'transaction_type'      => $this->transaction_type,
            'amount'                => $this->amount,
            'balance_after'         => $this->balance_after,
            'reference_number'      => $this->reference_number,
            'transaction_date'      => $this->transaction_date?->toDateString(),
            'value_date'            => $this->value_date?->toDateString(),
            'narration'             => $this->narration,
            'linked_transaction_id' => $this->linked_transaction_id,
            'approval_status'       => $this->approval_status,
            'approved_at'           => $this->approved_at?->toIso8601String(),
            'created_by'            => $this->created_by,
            'created_at'            => $this->created_at?->toIso8601String(),
        ];
    }
}

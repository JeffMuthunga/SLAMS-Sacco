<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LoanRepaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'loan_id'          => $this->loan_id,
            'due_date'         => $this->due_date?->toDateString(),
            'paid_date'        => $this->paid_date?->toDateString(),
            'principal_due'    => $this->principal_due,
            'principal_paid'   => $this->principal_paid,
            'interest_due'     => $this->interest_due,
            'interest_paid'    => $this->interest_paid,
            'penalty_due'      => $this->penalty_due,
            'penalty_paid'     => $this->penalty_paid,
            'total_due'        => $this->total_due,
            'total_paid'       => $this->total_paid,
            'balance'          => $this->balance,
            'repayment_status' => $this->repayment_status,
            'created_at'       => $this->created_at?->toIso8601String(),
        ];
    }
}

<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LoanResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                   => $this->id,
            'account_number'       => $this->account_number,
            'principal_amount'     => $this->principal_amount,
            'interest_rate'        => $this->interest_rate,
            'repayment_period'     => $this->repayment_period,
            'repayment_frequency'  => $this->repayment_frequency,
            'repayment_amount'     => $this->repayment_amount,
            'total_payable'        => $this->total_payable,
            'outstanding_balance'  => $this->outstanding_balance,
            'disbursed_date'       => $this->disbursed_date?->toDateString(),
            'maturity_date'        => $this->maturity_date?->toDateString(),
            'expected_maturity_date' => $this->expected_maturity_date?->toDateString(),
            'loan_status'          => $this->loan_status,
            'approval_status'      => $this->approval_status,
            'approved_by'          => $this->approved_by,
            'approved_at'          => $this->approved_at?->toIso8601String(),
            'applied_at'           => $this->applied_at?->toIso8601String(),
            'org_id'               => $this->org_id,
            'member'               => $this->whenLoaded('member', fn () => [
                'id'            => $this->member->id,
                'full_name'     => $this->member->full_name,
                'member_number' => $this->member->member_number,
                'phone'         => $this->member->phone,
            ]),
            'loan_product'         => $this->whenLoaded('loanProduct', fn () => [
                'id'               => $this->loanProduct->id,
                'name'             => $this->loanProduct->name,
                'interest_method'  => $this->loanProduct->interest_method,
                'requires_guarantor'   => $this->loanProduct->requires_guarantor,
                'requires_collateral'  => $this->loanProduct->requires_collateral,
            ]),
            'disburse_account'     => $this->whenLoaded('disburseAccount', fn () => $this->disburseAccount ? [
                'id'            => $this->disburseAccount->id,
                'account_number'=> $this->disburseAccount->account_number,
            ] : null),
            'guarantees'           => LoanGuaranteeResource::collection($this->whenLoaded('guarantees')),
            'collaterals'          => $this->whenLoaded('collaterals', fn () => $this->collaterals->map(fn ($c) => [
                'id'              => $c->id,
                'collateral_type' => $c->collateral_type,
                'description'     => $c->description,
                'estimated_value' => $c->estimated_value,
                'is_received'     => $c->is_received,
                'is_released'     => $c->is_released,
            ])),
            'repayments'           => LoanRepaymentResource::collection($this->whenLoaded('repayments')),
            'notes'                => $this->whenLoaded('notes', fn () => $this->notes->map(fn ($n) => [
                'id'         => $n->id,
                'note'       => $n->note,
                'created_by' => $n->created_by,
                'created_at' => $n->created_at?->toIso8601String(),
            ])),
            'created_at'           => $this->created_at?->toIso8601String(),
        ];
    }
}

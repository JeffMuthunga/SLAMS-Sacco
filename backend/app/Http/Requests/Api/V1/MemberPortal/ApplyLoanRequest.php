<?php

namespace App\Http\Requests\Api\V1\MemberPortal;

use Illuminate\Foundation\Http\FormRequest;

class ApplyLoanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'loan_product_id'             => ['required', 'uuid', 'exists:loan_products,id'],
            'principal_amount'            => ['required', 'numeric', 'min:1'],
            'repayment_period'            => ['required', 'integer', 'min:1'],
            'disburse_account_id'         => ['nullable', 'uuid', 'exists:deposit_accounts,id'],
            'guarantors'                  => ['nullable', 'array'],
            'guarantors.*.member_id'      => ['required', 'uuid', 'exists:members,id'],
            'guarantors.*.guaranteed_amount' => ['required', 'numeric', 'min:0'],
        ];
    }
}

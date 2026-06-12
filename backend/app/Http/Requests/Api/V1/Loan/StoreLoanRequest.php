<?php

namespace App\Http\Requests\Api\V1\Loan;

use Illuminate\Foundation\Http\FormRequest;

class StoreLoanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'member_id'          => ['required', 'uuid', 'exists:members,id'],
            'loan_product_id'    => ['required', 'uuid', 'exists:loan_products,id'],
            'principal_amount'   => ['required', 'numeric', 'min:1'],
            'interest_rate'      => ['nullable', 'numeric', 'min:0', 'max:100'],
            'repayment_period'   => ['required', 'integer', 'min:1', 'max:360'],
            'repayment_frequency'=> ['nullable', 'in:daily,weekly,monthly,quarterly,annually'],
            'note'               => ['nullable', 'string', 'max:2000'],
            'guarantors'                     => ['nullable', 'array'],
            'guarantors.*.member_id'         => ['required', 'uuid', 'exists:members,id'],
            'guarantors.*.guaranteed_amount' => ['required', 'numeric', 'min:0'],
            'collaterals'                    => ['nullable', 'array'],
            'collaterals.*.collateral_type'  => ['required', 'string', 'max:100'],
            'collaterals.*.description'      => ['nullable', 'string', 'max:500'],
            'collaterals.*.estimated_value'  => ['required', 'numeric', 'min:0'],
        ];
    }
}

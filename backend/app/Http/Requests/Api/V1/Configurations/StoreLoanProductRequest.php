<?php

namespace App\Http\Requests\Api\V1\Configurations;

use Illuminate\Foundation\Http\FormRequest;

class StoreLoanProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'                   => ['required', 'string', 'max:120'],
            'description'            => ['nullable', 'string'],
            'interest_rate'          => ['required', 'numeric', 'min:0', 'max:100'],
            'interest_method'        => ['required', 'in:flat,reducing_balance'],
            'repayment_frequency'    => ['required', 'in:daily,weekly,monthly,quarterly,annually'],
            'min_amount'             => ['required', 'numeric', 'min:0'],
            'max_amount'             => ['required', 'numeric', 'min:0', 'gte:min_amount'],
            'min_period_months'      => ['required', 'integer', 'min:1'],
            'max_period_months'      => ['required', 'integer', 'min:1', 'gte:min_period_months'],
            'max_repayments'         => ['nullable', 'integer', 'min:1'],
            'requires_guarantor'     => ['sometimes', 'boolean'],
            'requires_collateral'    => ['sometimes', 'boolean'],
            'min_membership_months'  => ['sometimes', 'integer', 'min:0'],
            'processing_fee_amount'  => ['sometimes', 'numeric', 'min:0'],
            'processing_fee_percent' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'penalty_rate'           => ['sometimes', 'numeric', 'min:0'],
            'is_active'              => ['sometimes', 'boolean'],
        ];
    }
}

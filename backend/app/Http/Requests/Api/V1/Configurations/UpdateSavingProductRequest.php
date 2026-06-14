<?php

namespace App\Http\Requests\Api\V1\Configurations;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSavingProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'                 => ['sometimes', 'string', 'max:120'],
            'description'          => ['nullable', 'string'],
            'interest_rate'        => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'min_opening_balance'  => ['sometimes', 'numeric', 'min:0'],
            'min_balance'          => ['sometimes', 'numeric', 'min:0'],
            'max_balance'          => ['nullable', 'numeric', 'min:0'],
            'min_deposit'          => ['sometimes', 'numeric', 'min:0'],
            'max_deposit'          => ['nullable', 'numeric', 'min:0'],
            'min_withdrawal'       => ['sometimes', 'numeric', 'min:0'],
            'max_withdrawal'       => ['nullable', 'numeric', 'min:0'],
            'lock_in_months'       => ['sometimes', 'integer', 'min:0'],
            'withdrawal_frequency' => ['sometimes', 'in:any,daily,weekly,monthly'],
            'is_active'            => ['sometimes', 'boolean'],
            'is_mandatory'                    => ['sometimes', 'boolean'],
            'block_withdrawal_on_active_loan' => ['sometimes', 'boolean'],
        ];
    }
}

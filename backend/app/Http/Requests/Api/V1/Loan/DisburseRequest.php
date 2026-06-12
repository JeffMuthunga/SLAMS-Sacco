<?php

namespace App\Http\Requests\Api\V1\Loan;

use Illuminate\Foundation\Http\FormRequest;

class DisburseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'disburse_account_id' => ['required', 'uuid', 'exists:deposit_accounts,id'],
            'disbursed_date'      => ['nullable', 'date'],
        ];
    }
}

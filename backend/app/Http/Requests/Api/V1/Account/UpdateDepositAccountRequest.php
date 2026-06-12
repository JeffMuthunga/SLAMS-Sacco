<?php

namespace App\Http\Requests\Api\V1\Account;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDepositAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'interest_rate'     => ['nullable', 'numeric', 'min:0', 'max:100'],
            'is_locked'         => ['nullable', 'boolean'],
            'locked_until_date' => ['nullable', 'date', 'after_or_equal:today'],
        ];
    }
}

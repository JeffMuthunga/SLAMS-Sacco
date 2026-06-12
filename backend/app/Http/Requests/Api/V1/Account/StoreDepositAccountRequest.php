<?php

namespace App\Http\Requests\Api\V1\Account;

use Illuminate\Foundation\Http\FormRequest;

class StoreDepositAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'member_id'     => ['required', 'uuid', 'exists:members,id'],
            'product_id'    => ['required', 'uuid', 'exists:saving_products,id'],
            'opening_date'  => ['required', 'date'],
            'interest_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ];
    }
}

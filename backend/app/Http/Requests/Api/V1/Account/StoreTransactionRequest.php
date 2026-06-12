<?php

namespace App\Http\Requests\Api\V1\Account;

use Illuminate\Foundation\Http\FormRequest;

class StoreTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'deposit_account_id' => ['required', 'uuid', 'exists:deposit_accounts,id'],
            'transaction_type'   => ['required', 'in:deposit,withdrawal,transfer_out'],
            'to_account_id'      => ['required_if:transaction_type,transfer_out', 'nullable', 'uuid', 'exists:deposit_accounts,id'],
            'amount'             => ['required', 'numeric', 'min:0.01'],
            'reference_number'   => ['nullable', 'string', 'max:50'],
            'transaction_date'   => ['required', 'date'],
            'value_date'         => ['nullable', 'date'],
            'narration'          => ['nullable', 'string', 'max:255'],
        ];
    }
}

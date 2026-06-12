<?php

namespace App\Http\Requests\Api\V1\Loan;

use Illuminate\Foundation\Http\FormRequest;

class RecordRepaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount'   => ['required', 'numeric', 'min:0.01'],
            'paid_date'=> ['nullable', 'date'],
        ];
    }
}

<?php

namespace App\Http\Requests\Api\V1\Configurations;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCurrencyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $orgId = $this->user()->org_id;
        $currencyId = $this->route('currency');

        return [
            'name'          => ['required', 'string', 'max:255'],
            'code'          => [
                'required', 'string', 'size:3',
                Rule::unique('currencies', 'code')
                    ->where('org_id', $orgId)
                    ->ignore($currencyId)
            ],
            'symbol'        => ['nullable', 'string', 'max:10'],
            'exchange_rate' => ['required', 'numeric', 'min:0'],
            'is_default'    => ['sometimes', 'boolean'],
        ];
    }
}

<?php

namespace App\Http\Requests\Api\V1\Configurations;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBankAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $orgId = $this->user()->org_id;

        return [
            'bank_id'        => ['required', 'uuid', Rule::exists('banks', 'id')->where('org_id', $orgId)],
            'account_name'   => ['required', 'string', 'max:120'],
            'account_number' => ['required', 'string', 'max:50'],
            'branch'         => ['nullable', 'string', 'max:100'],
            'is_active'      => ['sometimes', 'boolean'],
        ];
    }
}

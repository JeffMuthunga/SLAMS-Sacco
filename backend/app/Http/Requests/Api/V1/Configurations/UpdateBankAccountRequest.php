<?php

namespace App\Http\Requests\Api\V1\Configurations;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBankAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $orgId = $this->user()->org_id;

        return [
            'bank_id'        => ['sometimes', 'uuid', Rule::exists('banks', 'id')->where('org_id', $orgId)],
            'account_name'   => ['sometimes', 'string', 'max:120'],
            'account_number' => ['sometimes', 'string', 'max:50'],
            'branch'         => ['nullable', 'string', 'max:100'],
            'is_active'      => ['sometimes', 'boolean'],
        ];
    }
}

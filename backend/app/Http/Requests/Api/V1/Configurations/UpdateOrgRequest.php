<?php

namespace App\Http\Requests\Api\V1\Configurations;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrgRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // RBAC will be handled by middleware
    }

    public function rules(): array
    {
        return [
            'name'          => ['sometimes', 'required', 'string', 'max:255'],
            'full_name'     => ['sometimes', 'required', 'string', 'max:255'],
            'suffix'        => ['nullable', 'string', 'max:50'],
            'email'         => ['nullable', 'email', 'max:255'],
            'phone'         => ['nullable', 'string', 'max:50'],
            'website'       => ['nullable', 'url', 'max:255'],
            'address'       => ['nullable', 'string'],
            'town'          => ['nullable', 'string', 'max:100'],
            'country_code'  => ['nullable', 'string', 'size:3'],
            'currency_code' => ['nullable', 'string', 'size:3'],
            'pin'           => ['nullable', 'string', 'max:50'],
            'reg_number'    => ['nullable', 'string', 'max:100'],
            'member_limit'  => ['nullable', 'integer', 'min:0'],
        ];
    }
}

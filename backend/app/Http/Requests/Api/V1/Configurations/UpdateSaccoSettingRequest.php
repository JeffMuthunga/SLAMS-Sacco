<?php

namespace App\Http\Requests\Api\V1\Configurations;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSaccoSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'registration_fee'         => ['sometimes', 'numeric', 'min:0'],
            'min_share_capital'        => ['sometimes', 'numeric', 'min:0'],
            'min_monthly_contribution' => ['sometimes', 'numeric', 'min:0'],
            'loan_limit_multiplier'    => ['sometimes', 'numeric', 'min:1', 'max:10'],
        ];
    }
}

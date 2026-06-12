<?php

namespace App\Http\Requests\Api\V1\Contribution;

use Illuminate\Foundation\Http\FormRequest;

class GenerateContributionsRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'period_id'       => ['required', 'uuid', 'exists:periods,id'],
            'expected_amount' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}

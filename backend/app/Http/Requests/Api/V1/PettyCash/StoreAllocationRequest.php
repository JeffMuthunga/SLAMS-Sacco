<?php

namespace App\Http\Requests\Api\V1\PettyCash;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAllocationRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $orgId = $this->user()->org_id;

        return [
            'period_id'    => ['required', 'uuid', Rule::exists('periods', 'id')],
            'allocated_to' => ['required', 'uuid', Rule::exists('users', 'id')->where('org_id', $orgId)],
            'amount'       => ['required', 'numeric', 'min:0.01'],
            'narration'    => ['nullable', 'string', 'max:255'],
        ];
    }
}

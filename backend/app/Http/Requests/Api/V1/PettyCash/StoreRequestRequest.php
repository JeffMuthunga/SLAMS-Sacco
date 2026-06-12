<?php

namespace App\Http\Requests\Api\V1\PettyCash;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRequestRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $orgId = $this->user()->org_id;

        return [
            'allocation_id'  => ['nullable', 'uuid', Rule::exists('petty_cash_allocations', 'id')->where('org_id', $orgId)],
            'item_id'        => ['nullable', 'uuid', Rule::exists('petty_cash_items', 'id')->where('org_id', $orgId)],
            'units'          => ['required', 'integer', 'min:1'],
            'unit_price'     => ['required', 'numeric', 'min:0.01'],
            'receipt_number' => ['nullable', 'string', 'max:50'],
            'expense_date'   => ['required', 'date'],
            'narration'      => ['nullable', 'string', 'max:255'],
        ];
    }
}

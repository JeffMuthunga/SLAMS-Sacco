<?php

namespace App\Http\Requests\Api\V1\Configurations;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFiscalYearRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $orgId = $this->user()->org_id;
        $fiscalYearId = $this->route('fiscal_year');

        return [
            'name'       => [
                'required', 'string', 'max:100',
                Rule::unique('fiscal_years', 'name')
                    ->where('org_id', $orgId)
                    ->ignore($fiscalYearId)
            ],
            'start_date' => ['required', 'date'],
            'end_date'   => ['required', 'date', 'after:start_date'],
        ];
    }
}

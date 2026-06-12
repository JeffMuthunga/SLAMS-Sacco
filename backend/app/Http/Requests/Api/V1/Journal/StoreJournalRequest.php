<?php

namespace App\Http\Requests\Api\V1\Journal;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreJournalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $orgId = $this->user()->org_id;

        return [
            'fiscal_year_id'   => ['required', 'uuid', Rule::exists('fiscal_years', 'id')->where('org_id', $orgId)],
            'period_id'        => ['required', 'uuid', Rule::exists('periods', 'id')->where('fiscal_year_id', $this->input('fiscal_year_id'))],
            'journal_date'     => ['required', 'date'],
            'narration'        => ['nullable', 'string', 'max:255'],
            'lines'            => ['required', 'array', 'min:2'],
            'lines.*.account_id' => ['required', 'uuid', Rule::exists('chart_of_accounts', 'id')->where('org_id', $orgId)->whereNull('deleted_at')],
            'lines.*.debit'    => ['required', 'numeric', 'min:0'],
            'lines.*.credit'   => ['required', 'numeric', 'min:0'],
            'lines.*.narration' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'lines.min' => 'A journal entry must have at least two lines.',
        ];
    }
}

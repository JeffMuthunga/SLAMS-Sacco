<?php

namespace App\Http\Requests\Api\V1\Member;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // TODO(Phase 3): enforce admin role via RBAC policy
    }

    public function rules(): array
    {
        $orgId  = $this->user()->org_id;
        $member = $this->route('member');

        return [
            'full_name'          => ['required', 'string', 'max:150'],
            'id_number'          => ['required', 'string', 'max:50',
                                     Rule::unique('members', 'id_number')
                                         ->where('org_id', $orgId)
                                         ->ignore($member)],
            'id_type'            => ['required', Rule::in(['national', 'passport', 'alien', 'military'])],
            'phone'              => ['required', 'string', 'max:20'],
            'date_of_birth'      => ['required', 'date'],
            'entry_date'         => ['required', 'date'],
            'title'              => ['nullable', Rule::in(['Mr', 'Mrs', 'Miss', 'Dr', 'Prof', 'Rev'])],
            'email'              => ['nullable', 'email', 'max:120'],
            'phone2'             => ['nullable', 'string', 'max:20'],
            'gender'             => ['nullable', Rule::in(['M', 'F'])],
            'nationality'        => ['nullable', 'string', 'max:3'],
            'marital_status'     => ['nullable', Rule::in(['single', 'married', 'divorced', 'widowed'])],
            'address'            => ['nullable', 'string'],
            'town'               => ['nullable', 'string', 'max:100'],
            'postal_code'        => ['nullable', 'string', 'max:20'],
            'employed'           => ['nullable', 'boolean'],
            'self_employed'      => ['nullable', 'boolean'],
            'employer_name'      => ['nullable', 'string', 'max:120'],
            'monthly_salary'     => ['nullable', 'numeric', 'decimal:0,2', 'min:0'],
            'monthly_net_income' => ['nullable', 'numeric', 'decimal:0,2', 'min:0'],
            'kins'               => ['nullable', 'array'],
            'kins.*.id'                   => ['nullable', 'uuid'],
            'kins.*.full_name'            => ['required', 'string', 'max:150'],
            'kins.*.relationship'         => ['required', Rule::in(['spouse', 'child', 'parent', 'sibling', 'other'])],
            'kins.*.date_of_birth'        => ['nullable', 'date'],
            'kins.*.id_number'            => ['nullable', 'string', 'max:50'],
            'kins.*.id_type'              => ['nullable', Rule::in(['national', 'passport', 'alien', 'military'])],
            'kins.*.phone'                => ['nullable', 'string', 'max:20'],
            'kins.*.is_emergency_contact' => ['nullable', 'boolean'],
            'kins.*.is_beneficiary'       => ['nullable', 'boolean'],
            'kins.*.beneficiary_percent'  => ['nullable', 'numeric', 'decimal:0,2', 'min:0', 'max:100',
                                              'required_if:kins.*.is_beneficiary,true'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($v) {
            $kins = $this->input('kins', []);
            $total = array_sum(array_map(
                fn($k) => ($k['is_beneficiary'] ?? false) ? (float) ($k['beneficiary_percent'] ?? 0) : 0,
                $kins
            ));
            if ($total > 100) {
                $v->errors()->add('kins', 'Total beneficiary percentage cannot exceed 100%.');
            }
        });
    }
}

<?php

namespace App\Http\Requests\Api\V1\Issue;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreIssueRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $orgId = $this->user()->org_id;

        return [
            'category_id'  => ['required', 'uuid', Rule::exists('issue_categories', 'id')->where('org_id', $orgId)->whereNull('deleted_at')],
            'member_id'    => ['nullable', 'uuid', Rule::exists('members', 'id')->where('org_id', $orgId)],
            'assigned_to'  => ['nullable', 'uuid', Rule::exists('users', 'id')->where('org_id', $orgId)],
            'title'        => ['required', 'string', 'max:200'],
            'description'  => ['nullable', 'string'],
            'priority'     => ['sometimes', Rule::in(['low', 'medium', 'high', 'urgent'])],
        ];
    }
}

<?php

namespace App\Http\Requests\Api\V1\Issue;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateIssueRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $orgId = $this->user()->org_id;

        return [
            'category_id'  => ['sometimes', 'uuid', Rule::exists('issue_categories', 'id')->where('org_id', $orgId)->whereNull('deleted_at')],
            'assigned_to'  => ['nullable', 'uuid', Rule::exists('users', 'id')->where('org_id', $orgId)],
            'title'        => ['sometimes', 'string', 'max:200'],
            'description'  => ['nullable', 'string'],
            'priority'     => ['sometimes', Rule::in(['low', 'medium', 'high', 'urgent'])],
            'status'       => ['sometimes', Rule::in(['open', 'in_progress', 'resolved', 'closed'])],
        ];
    }
}

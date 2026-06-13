<?php

namespace App\Http\Requests\Api\V1\MemberExit;

use Illuminate\Foundation\Http\FormRequest;

class StoreMemberExitRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'member_id' => ['required', 'uuid', 'exists:members,id'],
            'exit_type' => ['required', 'in:voluntary,death,expulsion,transfer'],
            'reason'    => ['nullable', 'string', 'max:2000'],
            'exit_date' => ['required', 'date'],
            'notes'     => ['nullable', 'string', 'max:2000'],
        ];
    }
}

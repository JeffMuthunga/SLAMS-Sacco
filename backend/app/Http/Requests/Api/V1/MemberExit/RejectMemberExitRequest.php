<?php

namespace App\Http\Requests\Api\V1\MemberExit;

use Illuminate\Foundation\Http\FormRequest;

class RejectMemberExitRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'rejection_reason' => ['required', 'string', 'max:2000'],
        ];
    }
}

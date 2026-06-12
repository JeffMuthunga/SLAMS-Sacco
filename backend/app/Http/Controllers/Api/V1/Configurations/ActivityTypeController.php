<?php

namespace App\Http\Controllers\Api\V1\Configurations;

use App\Http\Resources\V1\Configurations\ActivityTypeResource;
use App\Models\ActivityType;
use Illuminate\Validation\Rule;

class ActivityTypeController extends BaseCrudController
{
    protected function modelClass(): string
    {
        return ActivityType::class;
    }

    protected function resourceClass(): string
    {
        return ActivityTypeResource::class;
    }

    protected function storeRules(string $orgId): array
    {
        return [
            'name'      => ['required', 'string', 'max:120'],
            'code'      => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('activity_types', 'code')
                    ->where('org_id', $orgId)
                    ->withoutTrashed(),
            ],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    protected function updateRules(string $id, string $orgId): array
    {
        return [
            'name'      => ['required', 'string', 'max:120'],
            'code'      => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('activity_types', 'code')
                    ->where('org_id', $orgId)
                    ->withoutTrashed()
                    ->ignore($id),
            ],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}

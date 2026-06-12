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

    protected function storeRules(): array
    {
        $orgId = request()->user()->org_id;

        return [
            'name'      => ['required', 'string', 'max:120'],
            'code'      => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('activity_types', 'code')
                    ->where('org_id', $orgId)
                    ->whereNull('deleted_at'),
            ],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    protected function updateRules(string $id): array
    {
        $orgId = request()->user()->org_id;

        return [
            'name'      => ['required', 'string', 'max:120'],
            'code'      => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('activity_types', 'code')
                    ->where('org_id', $orgId)
                    ->whereNull('deleted_at')
                    ->ignore($id),
            ],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}

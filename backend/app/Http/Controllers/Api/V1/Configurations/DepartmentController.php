<?php

namespace App\Http\Controllers\Api\V1\Configurations;

use App\Http\Resources\V1\Configurations\DepartmentResource;
use App\Models\Department;

class DepartmentController extends BaseCrudController
{
    protected function modelClass(): string
    {
        return Department::class;
    }

    protected function resourceClass(): string
    {
        return DepartmentResource::class;
    }

    protected function storeRules(): array
    {
        return [
            'name'      => ['required', 'string', 'max:120'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    protected function updateRules(string $id): array
    {
        return [
            'name'      => ['required', 'string', 'max:120'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}

<?php

namespace App\Http\Controllers\Api\V1\Configurations;

use App\Http\Resources\V1\Configurations\IssueCategoryResource;
use App\Models\IssueCategory;

class IssueCategoryController extends BaseCrudController
{
    protected function modelClass(): string { return IssueCategory::class; }
    protected function resourceClass(): string { return IssueCategoryResource::class; }

    protected function storeRules(string $orgId): array
    {
        return [
            'name'        => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:255'],
        ];
    }

    protected function updateRules(string $id, string $orgId): array
    {
        return $this->storeRules($orgId);
    }
}

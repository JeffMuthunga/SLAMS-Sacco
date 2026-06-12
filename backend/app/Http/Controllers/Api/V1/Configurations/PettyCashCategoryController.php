<?php

namespace App\Http\Controllers\Api\V1\Configurations;

use App\Http\Resources\V1\Configurations\PettyCashCategoryResource;
use App\Models\PettyCashCategory;

class PettyCashCategoryController extends BaseCrudController
{
    protected function modelClass(): string { return PettyCashCategory::class; }
    protected function resourceClass(): string { return PettyCashCategoryResource::class; }

    protected function storeRules(string $orgId): array
    {
        return ['name' => ['required', 'string', 'max:100']];
    }

    protected function updateRules(string $id, string $orgId): array
    {
        return ['name' => ['required', 'string', 'max:100']];
    }
}

<?php

namespace App\Http\Controllers\Api\V1\Configurations;

use App\Http\Resources\V1\CommodityTypeResource;
use App\Models\CommodityType;

class CommodityTypeController extends BaseCrudController
{
    protected function modelClass(): string    { return CommodityType::class; }
    protected function resourceClass(): string { return CommodityTypeResource::class; }

    protected function storeRules(string $orgId): array
    {
        return ['name' => ['required', 'string', 'max:120']];
    }

    protected function updateRules(string $id, string $orgId): array
    {
        return $this->storeRules($orgId);
    }
}

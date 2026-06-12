<?php

namespace App\Http\Controllers\Api\V1\Configurations;

use App\Http\Resources\V1\Configurations\CollateralTypeResource;
use App\Models\CollateralType;

class CollateralTypeController extends BaseCrudController
{
    protected function modelClass(): string
    {
        return CollateralType::class;
    }

    protected function resourceClass(): string
    {
        return CollateralTypeResource::class;
    }

    protected function storeRules(): array
    {
        return [
            'name'        => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string'],
            'is_active'   => ['sometimes', 'boolean'],
        ];
    }

    protected function updateRules(string $id): array
    {
        return [
            'name'        => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string'],
            'is_active'   => ['sometimes', 'boolean'],
        ];
    }
}

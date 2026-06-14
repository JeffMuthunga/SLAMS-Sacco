<?php

namespace App\Http\Controllers\Api\V1\Configurations;

use App\Http\Resources\V1\Configurations\EligibleEmployerResource;
use App\Models\EligibleEmployer;

class EligibleEmployerController extends BaseCrudController
{
    protected function modelClass(): string
    {
        return EligibleEmployer::class;
    }

    protected function resourceClass(): string
    {
        return EligibleEmployerResource::class;
    }

    protected function storeRules(string $orgId): array
    {
        return [
            'name'      => ['required', 'string', 'max:150'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    protected function updateRules(string $id, string $orgId): array
    {
        return [
            'name'      => ['required', 'string', 'max:150'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}

<?php

namespace App\Http\Controllers\Api\V1\Configurations;

use App\Http\Resources\V1\Configurations\AccountTypeResource;
use App\Models\AccountType;

class AccountTypeController extends BaseCrudController
{
    protected function modelClass(): string
    {
        return AccountType::class;
    }

    protected function resourceClass(): string
    {
        return AccountTypeResource::class;
    }

    protected function storeRules(string $orgId): array
    {
        return [
            'code' => ['required', 'integer', 'between:1,9'],
            'name' => ['required', 'string', 'max:100'],
        ];
    }

    protected function updateRules(string $id, string $orgId): array
    {
        return [
            'code' => ['required', 'integer', 'between:1,9'],
            'name' => ['required', 'string', 'max:100'],
        ];
    }
}

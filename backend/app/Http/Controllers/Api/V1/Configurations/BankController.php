<?php

namespace App\Http\Controllers\Api\V1\Configurations;

use App\Http\Resources\V1\Configurations\BankResource;
use App\Models\Bank;

class BankController extends BaseCrudController
{
    protected function modelClass(): string
    {
        return Bank::class;
    }

    protected function resourceClass(): string
    {
        return BankResource::class;
    }

    protected function storeRules(): array
    {
        return [
            'name'      => ['required', 'string', 'max:120'],
            'code'      => ['nullable', 'string', 'max:20'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    protected function updateRules(string $id): array
    {
        return [
            'name'      => ['required', 'string', 'max:120'],
            'code'      => ['nullable', 'string', 'max:20'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}

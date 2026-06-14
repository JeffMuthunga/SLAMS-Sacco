<?php

namespace App\Http\Controllers\Api\V1\Configurations;

use App\Http\Resources\V1\ShareProductResource;
use App\Models\ShareProduct;

class ShareProductController extends BaseCrudController
{
    protected function modelClass(): string    { return ShareProduct::class; }
    protected function resourceClass(): string { return ShareProductResource::class; }

    protected function storeRules(string $orgId): array
    {
        return [
            'name'                     => ['required', 'string', 'max:120'],
            'price_per_share'          => ['required', 'numeric', 'min:0.01'],
            'min_shares'               => ['required', 'integer', 'min:1'],
            'max_shares'               => ['nullable', 'integer', 'min:1'],
            'share_capital_account_id' => ['nullable', 'uuid', 'exists:chart_of_accounts,id'],
            'is_active'                => ['boolean'],
        ];
    }

    protected function updateRules(string $id, string $orgId): array
    {
        return $this->storeRules($orgId);
    }
}

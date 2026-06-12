<?php

namespace App\Http\Controllers\Api\V1\Configurations;

use App\Http\Resources\V1\Configurations\PettyCashItemResource;
use App\Models\PettyCashItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PettyCashItemController extends BaseCrudController
{
    protected function modelClass(): string { return PettyCashItem::class; }
    protected function resourceClass(): string { return PettyCashItemResource::class; }

    protected function storeRules(string $orgId): array
    {
        return [
            'category_id'   => ['required', 'uuid', Rule::exists('petty_cash_categories', 'id')->where('org_id', $orgId)],
            'name'          => ['required', 'string', 'max:100'],
            'default_price' => ['required', 'numeric', 'min:0'],
            'default_units' => ['sometimes', 'integer', 'min:1'],
        ];
    }

    protected function updateRules(string $id, string $orgId): array
    {
        return $this->storeRules($orgId);
    }

    public function index(Request $request): JsonResponse
    {
        $query = PettyCashItem::where('org_id', $request->user()->org_id)
            ->with('category');

        if ($catId = $request->query('category_id')) {
            $query->where('category_id', $catId);
        }

        return $this->respond(PettyCashItemResource::collection($query->get())->resolve());
    }
}

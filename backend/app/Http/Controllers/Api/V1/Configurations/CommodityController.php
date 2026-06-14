<?php

namespace App\Http\Controllers\Api\V1\Configurations;

use App\Http\Resources\V1\CommodityResource;
use App\Models\Commodity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommodityController extends BaseCrudController
{
    protected function modelClass(): string    { return Commodity::class; }
    protected function resourceClass(): string { return CommodityResource::class; }

    public function index(Request $request): JsonResponse
    {
        $items = Commodity::where('org_id', $request->user()->org_id)
            ->with('commodityType')
            ->get();
        return $this->respond(CommodityResource::collection($items), 'Retrieved successfully.');
    }

    protected function storeRules(string $orgId): array
    {
        return [
            'commodity_type_id' => ['required', 'uuid', 'exists:commodity_types,id'],
            'name'              => ['required', 'string', 'max:120'],
            'unit_price'        => ['required', 'numeric', 'min:0'],
            'stock_quantity'    => ['integer', 'min:0'],
            'is_active'         => ['boolean'],
        ];
    }

    protected function updateRules(string $id, string $orgId): array
    {
        return $this->storeRules($orgId);
    }
}

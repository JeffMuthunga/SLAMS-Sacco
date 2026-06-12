<?php

namespace App\Http\Controllers\Api\V1\Configurations;

use App\Http\Controllers\Api\V1\ApiController;
use App\Http\Requests\Api\V1\Configurations\StoreCurrencyRequest;
use App\Http\Requests\Api\V1\Configurations\UpdateCurrencyRequest;
use App\Http\Resources\V1\Configurations\CurrencyResource;
use App\Models\Currency;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CurrencyController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $orgId = $request->user()->org_id;

        $currencies = Currency::where('org_id', $orgId)
            ->orderBy('is_default', 'desc')
            ->orderBy('code', 'asc')
            ->get();

        return $this->respond(CurrencyResource::collection($currencies), 'Currencies retrieved successfully.');
    }

    public function store(StoreCurrencyRequest $request): JsonResponse
    {
        $orgId = $request->user()->org_id;
        $data = array_merge($request->validated(), ['org_id' => $orgId]);

        if ($data['is_default'] ?? false) {
            Currency::where('org_id', $orgId)->update(['is_default' => false]);
        }

        $currency = Currency::create($data);

        return $this->respondCreated(new CurrencyResource($currency), 'Currency created successfully.');
    }

    public function update(UpdateCurrencyRequest $request, string $id): JsonResponse
    {
        $orgId = $request->user()->org_id;
        $currency = Currency::where('org_id', $orgId)->findOrFail($id);

        $data = $request->validated();

        if ($data['is_default'] ?? false) {
            Currency::where('org_id', $orgId)->where('id', '!=', $id)->update(['is_default' => false]);
        }

        $currency->update($data);

        return $this->respond(new CurrencyResource($currency), 'Currency updated successfully.');
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $orgId = $request->user()->org_id;
        $currency = Currency::where('org_id', $orgId)->findOrFail($id);

        if ($currency->is_default) {
            return $this->respondError('Cannot delete the default currency.', 422);
        }

        $currency->delete();

        return $this->respond(null, 'Currency deleted successfully.');
    }
}

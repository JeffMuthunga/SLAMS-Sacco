<?php

namespace App\Http\Controllers\Api\V1\Configurations;

use App\Http\Controllers\Api\V1\ApiController;
use App\Http\Resources\V1\Configurations\SavingProductResource;
use App\Models\SavingProduct;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SavingProductController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $products = SavingProduct::where('org_id', $request->user()->org_id)->get();

        return $this->respond(SavingProductResource::collection($products), 'Saving products retrieved.');
    }

    public function store(Request $request): JsonResponse
    {
        $orgId = $request->user()->org_id;

        $data = $request->validate([
            'name'                 => ['required', 'string', 'max:120'],
            'description'          => ['nullable', 'string'],
            'interest_rate'        => ['required', 'numeric', 'min:0', 'max:100'],
            'min_opening_balance'  => ['sometimes', 'numeric', 'min:0'],
            'min_balance'          => ['sometimes', 'numeric', 'min:0'],
            'max_balance'          => ['nullable', 'numeric', 'min:0'],
            'min_deposit'          => ['sometimes', 'numeric', 'min:0'],
            'max_deposit'          => ['nullable', 'numeric', 'min:0'],
            'min_withdrawal'       => ['sometimes', 'numeric', 'min:0'],
            'max_withdrawal'       => ['nullable', 'numeric', 'min:0'],
            'lock_in_months'       => ['sometimes', 'integer', 'min:0'],
            'withdrawal_frequency' => ['sometimes', 'in:any,daily,weekly,monthly'],
            'is_active'            => ['sometimes', 'boolean'],
        ]);

        $data['org_id'] = $orgId;
        $product = SavingProduct::create($data);

        return $this->respondCreated(new SavingProductResource($product), 'Saving product created.');
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $product = SavingProduct::where('org_id', $request->user()->org_id)->findOrFail($id);

        return $this->respond(new SavingProductResource($product), 'Saving product retrieved.');
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $orgId = $request->user()->org_id;
        $product = SavingProduct::where('org_id', $orgId)->findOrFail($id);

        $data = $request->validate([
            'name'                 => ['sometimes', 'string', 'max:120'],
            'description'          => ['nullable', 'string'],
            'interest_rate'        => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'min_opening_balance'  => ['sometimes', 'numeric', 'min:0'],
            'min_balance'          => ['sometimes', 'numeric', 'min:0'],
            'max_balance'          => ['nullable', 'numeric', 'min:0'],
            'min_deposit'          => ['sometimes', 'numeric', 'min:0'],
            'max_deposit'          => ['nullable', 'numeric', 'min:0'],
            'min_withdrawal'       => ['sometimes', 'numeric', 'min:0'],
            'max_withdrawal'       => ['nullable', 'numeric', 'min:0'],
            'lock_in_months'       => ['sometimes', 'integer', 'min:0'],
            'withdrawal_frequency' => ['sometimes', 'in:any,daily,weekly,monthly'],
            'is_active'            => ['sometimes', 'boolean'],
        ]);

        $product->update($data);

        return $this->respond(new SavingProductResource($product), 'Saving product updated.');
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $product = SavingProduct::where('org_id', $request->user()->org_id)->findOrFail($id);
        $product->delete();

        return $this->respond(null, 'Saving product deleted.');
    }
}

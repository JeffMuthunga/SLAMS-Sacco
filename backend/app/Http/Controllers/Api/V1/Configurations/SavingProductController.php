<?php

namespace App\Http\Controllers\Api\V1\Configurations;

use App\Http\Controllers\Api\V1\ApiController;
use App\Http\Requests\Api\V1\Configurations\StoreSavingProductRequest;
use App\Http\Requests\Api\V1\Configurations\UpdateSavingProductRequest;
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

    public function store(StoreSavingProductRequest $request): JsonResponse
    {
        $orgId = $request->user()->org_id;

        $data = array_merge($request->validated(), ['org_id' => $orgId]);
        $product = SavingProduct::create($data);

        return $this->respondCreated(new SavingProductResource($product), 'Saving product created.');
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $product = SavingProduct::where('org_id', $request->user()->org_id)->findOrFail($id);

        return $this->respond(new SavingProductResource($product), 'Saving product retrieved.');
    }

    public function update(UpdateSavingProductRequest $request, string $id): JsonResponse
    {
        $orgId = $request->user()->org_id;
        $product = SavingProduct::where('org_id', $orgId)->findOrFail($id);

        $product->update($request->validated());

        return $this->respond(new SavingProductResource($product), 'Saving product updated.');
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $product = SavingProduct::where('org_id', $request->user()->org_id)->findOrFail($id);
        $product->delete();

        return $this->respond(null, 'Saving product deleted.');
    }
}

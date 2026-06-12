<?php

namespace App\Http\Controllers\Api\V1\Configurations;

use App\Http\Controllers\Api\V1\ApiController;
use App\Http\Requests\Api\V1\Configurations\StoreLoanProductRequest;
use App\Http\Requests\Api\V1\Configurations\UpdateLoanProductRequest;
use App\Http\Resources\V1\Configurations\LoanProductResource;
use App\Models\LoanProduct;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LoanProductController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $products = LoanProduct::where('org_id', $request->user()->org_id)->get();

        return $this->respond(LoanProductResource::collection($products), 'Loan products retrieved.');
    }

    public function store(StoreLoanProductRequest $request): JsonResponse
    {
        $orgId = $request->user()->org_id;

        $data = array_merge($request->validated(), ['org_id' => $orgId]);
        $product = LoanProduct::create($data);

        return $this->respondCreated(new LoanProductResource($product), 'Loan product created.');
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $product = LoanProduct::where('org_id', $request->user()->org_id)->findOrFail($id);

        return $this->respond(new LoanProductResource($product), 'Loan product retrieved.');
    }

    public function update(UpdateLoanProductRequest $request, string $id): JsonResponse
    {
        $orgId = $request->user()->org_id;
        $product = LoanProduct::where('org_id', $orgId)->findOrFail($id);

        $product->update($request->validated());

        return $this->respond(new LoanProductResource($product), 'Loan product updated.');
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $product = LoanProduct::where('org_id', $request->user()->org_id)->findOrFail($id);
        $product->delete();

        return $this->respond(null, 'Loan product deleted.');
    }
}

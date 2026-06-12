<?php

namespace App\Http\Controllers\Api\V1\Configurations;

use App\Http\Controllers\Api\V1\ApiController;
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

    public function store(Request $request): JsonResponse
    {
        $orgId = $request->user()->org_id;

        $data = $request->validate([
            'name'                   => ['required', 'string', 'max:120'],
            'description'            => ['nullable', 'string'],
            'interest_rate'          => ['required', 'numeric', 'min:0', 'max:100'],
            'interest_method'        => ['required', 'in:flat,reducing_balance'],
            'repayment_frequency'    => ['required', 'in:daily,weekly,monthly,quarterly,annually'],
            'min_amount'             => ['required', 'numeric', 'min:0'],
            'max_amount'             => ['required', 'numeric', 'min:0', 'gte:min_amount'],
            'min_period_months'      => ['required', 'integer', 'min:1'],
            'max_period_months'      => ['required', 'integer', 'min:1', 'gte:min_period_months'],
            'max_repayments'         => ['nullable', 'integer', 'min:1'],
            'requires_guarantor'     => ['sometimes', 'boolean'],
            'requires_collateral'    => ['sometimes', 'boolean'],
            'min_membership_months'  => ['sometimes', 'integer', 'min:0'],
            'processing_fee_amount'  => ['sometimes', 'numeric', 'min:0'],
            'processing_fee_percent' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'penalty_rate'           => ['sometimes', 'numeric', 'min:0'],
            'is_active'              => ['sometimes', 'boolean'],
        ]);

        $data['org_id'] = $orgId;
        $product = LoanProduct::create($data);

        return $this->respondCreated(new LoanProductResource($product), 'Loan product created.');
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $product = LoanProduct::where('org_id', $request->user()->org_id)->findOrFail($id);

        return $this->respond(new LoanProductResource($product), 'Loan product retrieved.');
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $orgId = $request->user()->org_id;
        $product = LoanProduct::where('org_id', $orgId)->findOrFail($id);

        $data = $request->validate([
            'name'                   => ['sometimes', 'string', 'max:120'],
            'description'            => ['nullable', 'string'],
            'interest_rate'          => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'interest_method'        => ['sometimes', 'in:flat,reducing_balance'],
            'repayment_frequency'    => ['sometimes', 'in:daily,weekly,monthly,quarterly,annually'],
            'min_amount'             => ['sometimes', 'numeric', 'min:0'],
            'max_amount'             => ['sometimes', 'numeric', 'min:0', 'gte:min_amount'],
            'min_period_months'      => ['sometimes', 'integer', 'min:1'],
            'max_period_months'      => ['sometimes', 'integer', 'min:1', 'gte:min_period_months'],
            'max_repayments'         => ['nullable', 'integer', 'min:1'],
            'requires_guarantor'     => ['sometimes', 'boolean'],
            'requires_collateral'    => ['sometimes', 'boolean'],
            'min_membership_months'  => ['sometimes', 'integer', 'min:0'],
            'processing_fee_amount'  => ['sometimes', 'numeric', 'min:0'],
            'processing_fee_percent' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'penalty_rate'           => ['sometimes', 'numeric', 'min:0'],
            'is_active'              => ['sometimes', 'boolean'],
        ]);

        $product->update($data);

        return $this->respond(new LoanProductResource($product), 'Loan product updated.');
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $product = LoanProduct::where('org_id', $request->user()->org_id)->findOrFail($id);
        $product->delete();

        return $this->respond(null, 'Loan product deleted.');
    }
}

<?php

namespace App\Http\Controllers\Api\V1\Configurations;

use App\Http\Controllers\Api\V1\ApiController;
use App\Http\Requests\Api\V1\Configurations\StoreBankAccountRequest;
use App\Http\Requests\Api\V1\Configurations\UpdateBankAccountRequest;
use App\Http\Resources\V1\Configurations\BankAccountResource;
use App\Models\BankAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BankAccountController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $accounts = BankAccount::where('org_id', $request->user()->org_id)
            ->with('bank')
            ->get();

        return $this->respond(BankAccountResource::collection($accounts), 'Bank accounts retrieved.');
    }

    public function store(StoreBankAccountRequest $request): JsonResponse
    {
        $orgId = $request->user()->org_id;

        $data = array_merge($request->validated(), ['org_id' => $orgId]);
        $account = BankAccount::create($data);
        $account->load('bank');

        return $this->respondCreated(new BankAccountResource($account), 'Bank account created.');
    }

    public function update(UpdateBankAccountRequest $request, string $id): JsonResponse
    {
        $orgId = $request->user()->org_id;
        $account = BankAccount::where('org_id', $orgId)->findOrFail($id);

        $account->update($request->validated());
        $account->load('bank');

        return $this->respond(new BankAccountResource($account), 'Bank account updated.');
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $account = BankAccount::where('org_id', $request->user()->org_id)->findOrFail($id);
        $account->delete();

        return $this->respond(null, 'Bank account deleted.');
    }
}

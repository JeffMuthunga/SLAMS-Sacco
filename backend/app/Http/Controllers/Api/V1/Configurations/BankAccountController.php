<?php

namespace App\Http\Controllers\Api\V1\Configurations;

use App\Http\Controllers\Api\V1\ApiController;
use App\Http\Resources\V1\Configurations\BankAccountResource;
use App\Models\BankAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BankAccountController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $accounts = BankAccount::where('org_id', $request->user()->org_id)
            ->with('bank')
            ->get();

        return $this->respond(BankAccountResource::collection($accounts), 'Bank accounts retrieved.');
    }

    public function store(Request $request): JsonResponse
    {
        $orgId = $request->user()->org_id;

        $data = $request->validate([
            'bank_id'        => ['required', 'uuid', Rule::exists('banks', 'id')->where('org_id', $orgId)],
            'account_name'   => ['required', 'string', 'max:120'],
            'account_number' => ['required', 'string', 'max:50'],
            'branch'         => ['nullable', 'string', 'max:100'],
            'is_active'      => ['sometimes', 'boolean'],
        ]);

        $data['org_id'] = $orgId;
        $account = BankAccount::create($data);
        $account->load('bank');

        return $this->respondCreated(new BankAccountResource($account), 'Bank account created.');
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $orgId = $request->user()->org_id;
        $account = BankAccount::where('org_id', $orgId)->findOrFail($id);

        $data = $request->validate([
            'bank_id'        => ['sometimes', 'uuid', Rule::exists('banks', 'id')->where('org_id', $orgId)],
            'account_name'   => ['sometimes', 'string', 'max:120'],
            'account_number' => ['sometimes', 'string', 'max:50'],
            'branch'         => ['nullable', 'string', 'max:100'],
            'is_active'      => ['sometimes', 'boolean'],
        ]);

        $account->update($data);
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

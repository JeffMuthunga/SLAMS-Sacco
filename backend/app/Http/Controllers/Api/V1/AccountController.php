<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Api\V1\Account\StoreDepositAccountRequest;
use App\Http\Requests\Api\V1\Account\UpdateDepositAccountRequest;
use App\Http\Resources\V1\AccountTransactionResource;
use App\Http\Resources\V1\DepositAccountResource;
use App\Models\DepositAccount;
use App\Services\AccountService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountController extends ApiController
{
    public function __construct(private AccountService $accountService) {}

    public function index(Request $request): JsonResponse
    {
        $query = DepositAccount::query()
            ->where('org_id', $request->user()->org_id)
            ->with(['member', 'product']);

        if ($search = $request->query('search')) {
            $term = strtolower($search);
            $query->where(function ($q) use ($term) {
                $q->whereRaw('LOWER(account_number) LIKE ?', ["%{$term}%"]);
            });
        }

        if ($status = $request->query('status')) {
            $query->where('approval_status', $status);
        }

        if ($memberId = $request->query('member_id')) {
            $query->where('member_id', $memberId);
        }

        $perPage  = min((int) $request->query('per_page', 20), 100);
        $accounts = $query->orderByDesc('created_at')->paginate($perPage);

        return $this->respond(
            DepositAccountResource::collection($accounts->items())->resolve(),
            '',
            200,
            [
                'current_page' => $accounts->currentPage(),
                'per_page'     => $accounts->perPage(),
                'total'        => $accounts->total(),
                'last_page'    => $accounts->lastPage(),
            ]
        );
    }

    public function store(StoreDepositAccountRequest $request): JsonResponse
    {
        $account = $this->accountService->store(
            $request->validated(),
            $request->user()->org_id
        );

        return $this->respondCreated(
            new DepositAccountResource($account->load(['member', 'product'])),
            'Account opened successfully.'
        );
    }

    public function show(Request $request, DepositAccount $account): JsonResponse
    {
        abort_unless($account->org_id === $request->user()->org_id, 404);

        return $this->respond(
            new DepositAccountResource($account->load(['member', 'product']))
        );
    }

    public function update(UpdateDepositAccountRequest $request, DepositAccount $account): JsonResponse
    {
        abort_unless($account->org_id === $request->user()->org_id, 404);

        $account->update($request->validated());

        return $this->respond(
            new DepositAccountResource($account->fresh()->load(['member', 'product'])),
            'Account updated successfully.'
        );
    }

    public function destroy(Request $request, DepositAccount $account): JsonResponse
    {
        abort_unless($account->org_id === $request->user()->org_id, 404);

        $account->delete();

        return $this->respond(null, 'Account closed.');
    }

    public function approve(Request $request, DepositAccount $account): JsonResponse
    {
        abort_unless($account->org_id === $request->user()->org_id, 404);
        abort_if($account->approval_status !== 'pending', 422, 'Account is not pending approval.');

        $this->accountService->approve($account, $request->user());

        return $this->respond(
            new DepositAccountResource($account->fresh()->load(['member', 'product'])),
            'Account approved.'
        );
    }

    public function reject(Request $request, DepositAccount $account): JsonResponse
    {
        abort_unless($account->org_id === $request->user()->org_id, 404);
        abort_if($account->approval_status !== 'pending', 422, 'Account is not pending approval.');

        $this->accountService->reject($account, $request->user());

        return $this->respond(
            new DepositAccountResource($account->fresh()->load(['member', 'product'])),
            'Account rejected.'
        );
    }

    public function statement(Request $request, DepositAccount $account): JsonResponse
    {
        abort_unless($account->org_id === $request->user()->org_id, 404);

        $perPage = min((int) $request->query('per_page', 50), 200);
        $txs     = $account->transactions()
            ->orderByDesc('transaction_date')
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return $this->respond(
            [
                'account'      => (new DepositAccountResource($account->load(['member', 'product'])))->resolve(),
                'transactions' => AccountTransactionResource::collection($txs->items())->resolve(),
            ],
            '',
            200,
            [
                'current_page' => $txs->currentPage(),
                'per_page'     => $txs->perPage(),
                'total'        => $txs->total(),
                'last_page'    => $txs->lastPage(),
            ]
        );
    }
}

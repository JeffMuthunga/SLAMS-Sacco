<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Api\V1\Account\StoreTransactionRequest;
use App\Http\Resources\V1\AccountTransactionResource;
use App\Models\AccountTransaction;
use App\Models\DepositAccount;
use App\Services\AccountService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountTransactionController extends ApiController
{
    public function __construct(private AccountService $accountService) {}

    public function index(Request $request): JsonResponse
    {
        $orgId = $request->user()->org_id;

        $query = AccountTransaction::query()
            ->whereHas('depositAccount', fn ($q) => $q->where('org_id', $orgId));

        if ($accountId = $request->query('deposit_account_id')) {
            $query->where('deposit_account_id', $accountId);
        }

        if ($type = $request->query('transaction_type')) {
            $query->where('transaction_type', $type);
        }

        if ($from = $request->query('from_date')) {
            $query->where('transaction_date', '>=', $from);
        }

        if ($to = $request->query('to_date')) {
            $query->where('transaction_date', '<=', $to);
        }

        if ($search = $request->query('search')) {
            $term = strtolower($search);
            $query->where(function ($q) use ($term) {
                $q->whereRaw('LOWER(reference_number) LIKE ?', ["%{$term}%"])
                  ->orWhereRaw('LOWER(narration) LIKE ?', ["%{$term}%"]);
            });
        }

        $perPage = min((int) $request->query('per_page', 50), 200);
        $txs     = $query->orderByDesc('transaction_date')
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return $this->respond(
            AccountTransactionResource::collection($txs->items())->resolve(),
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

    public function show(Request $request, AccountTransaction $accountTransaction): JsonResponse
    {
        $orgId = $request->user()->org_id;
        abort_unless($accountTransaction->depositAccount->org_id === $orgId, 404);

        return $this->respond(new AccountTransactionResource($accountTransaction));
    }

    public function store(StoreTransactionRequest $request): JsonResponse
    {
        $orgId   = $request->user()->org_id;
        $data    = $request->validated();
        $account = DepositAccount::where('org_id', $orgId)->findOrFail($data['deposit_account_id']);

        if ($data['transaction_type'] === 'transfer_out') {
            $toAccount = DepositAccount::where('org_id', $orgId)->findOrFail($data['to_account_id']);
            abort_if($toAccount->id === $account->id, 422, 'Cannot transfer to the same account.');

            [$out, $in] = $this->accountService->postTransfer($account, $toAccount, $data, $request->user());

            return $this->respondCreated(
                [
                    'out' => (new AccountTransactionResource($out))->resolve(),
                    'in'  => (new AccountTransactionResource($in))->resolve(),
                ],
                'Transfer posted successfully.'
            );
        }

        $tx = $this->accountService->postTransaction($account, $data, $request->user());

        return $this->respondCreated(
            new AccountTransactionResource($tx),
            'Transaction posted successfully.'
        );
    }
}

<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\V1\MemberResource;
use App\Http\Resources\V1\DepositAccountResource;
use App\Http\Resources\V1\AccountTransactionResource;
use App\Http\Resources\V1\LoanResource;
use App\Http\Resources\V1\ContributionResource;
use App\Http\Resources\V1\IssueResource;
use App\Http\Resources\V1\PettyCashAllocationResource;
use App\Http\Resources\V1\PettyCashRequestResource;
use App\Http\Requests\Api\V1\Issue\StoreIssueRequest;
use App\Models\DepositAccount;
use App\Models\LoanGuarantee;
use App\Models\AccountTransaction;
use App\Models\Contribution;
use App\Models\Issue;
use App\Models\IssueComment;
use App\Models\PettyCashAllocation;
use App\Models\PettyCashRequest;
use App\Services\IssueService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MemberPortalController extends ApiController
{
    public function __construct(private IssueService $issueService) {}

    private function resolveMember(Request $request): \App\Models\Member
    {
        $member = \App\Models\Member::where('user_id', $request->user()->id)
            ->where('org_id', $request->user()->org_id)
            ->first();

        if (!$member) {
            abort(403, 'No member record linked to your account.');
        }

        return $member;
    }

    public function profile(Request $request): JsonResponse
    {
        $member = $this->resolveMember($request);
        $member->load('kins');
        return $this->respond(new MemberResource($member));
    }

    public function dashboard(Request $request): JsonResponse
    {
        $member = $this->resolveMember($request);

        $totalBalance = $member->depositAccounts()
            ->where('approval_status', 'approved')
            ->where('is_active', true)
            ->sum('balance');

        $activeLoans = $member->loans()
            ->whereIn('loan_status', ['disbursed', 'active'])
            ->count();

        $outstandingLoanBalance = $member->loans()
            ->whereIn('loan_status', ['disbursed', 'active'])
            ->sum('outstanding_balance');

        $pendingContributions = $member->contributions()
            ->whereIn('status', ['pending', 'partial'])
            ->count();

        return $this->respond([
            'total_balance'           => number_format((float)$totalBalance, 2, '.', ''),
            'active_loans'            => $activeLoans,
            'outstanding_loan_balance'=> number_format((float)$outstandingLoanBalance, 2, '.', ''),
            'pending_contributions'   => $pendingContributions,
        ]);
    }

    public function accounts(Request $request): JsonResponse
    {
        $member = $this->resolveMember($request);

        $accounts = $member->depositAccounts()
            ->with(['product', 'member'])
            ->where('approval_status', 'approved')
            ->orderByDesc('opening_date')
            ->get();

        return $this->respond(DepositAccountResource::collection($accounts));
    }

    public function accountStatement(Request $request, string $accountId): JsonResponse
    {
        $member  = $this->resolveMember($request);
        $account = $member->depositAccounts()->where('id', $accountId)->firstOrFail();

        $query = AccountTransaction::where('deposit_account_id', $account->id)
            ->orderByDesc('transaction_date')
            ->orderByDesc('created_at');

        if ($request->filled('from_date')) {
            $query->whereDate('transaction_date', '>=', $request->from_date);
        }
        if ($request->filled('to_date')) {
            $query->whereDate('transaction_date', '<=', $request->to_date);
        }

        $transactions = $query->paginate($request->integer('per_page', 50));

        return $this->respond(
            AccountTransactionResource::collection($transactions)->response()->getData(true)
        );
    }

    public function loans(Request $request): JsonResponse
    {
        $member = $this->resolveMember($request);

        $loans = $member->loans()
            ->with(['loanProduct', 'member'])
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 20));

        return $this->respond(
            LoanResource::collection($loans)->response()->getData(true)
        );
    }

    public function loanDetail(Request $request, string $loanId): JsonResponse
    {
        $member = $this->resolveMember($request);
        $loan   = $member->loans()
            ->with(['loanProduct', 'member', 'guarantees.member', 'collaterals', 'repayments', 'notes'])
            ->where('id', $loanId)
            ->firstOrFail();

        return $this->respond(new LoanResource($loan));
    }

    public function contributions(Request $request): JsonResponse
    {
        $member = $this->resolveMember($request);

        $query = $member->contributions()
            ->with(['period', 'depositAccount'])
            ->orderByDesc('due_date');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $contributions = $query->paginate($request->integer('per_page', 50));

        return $this->respond(
            ContributionResource::collection($contributions)->response()->getData(true)
        );
    }

    public function guarantees(Request $request): JsonResponse
    {
        $member = $this->resolveMember($request);

        $query = LoanGuarantee::where('member_id', $member->id)
            ->with(['loan.member', 'loan.loanProduct', 'member'])
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            match ($request->status) {
                'active'   => $query->where('is_active', true),
                'inactive' => $query->where('is_active', false),
                'pending'  => $query->where('is_accepted', false)->where('is_active', true),
                default    => null,
            };
        }

        $guarantees = $query->paginate($request->integer('per_page', 50));

        $data = $guarantees->getCollection()->map(fn($g) => [
            'id'               => $g->id,
            'guaranteed_amount'=> $g->guaranteed_amount,
            'is_accepted'      => $g->is_accepted,
            'accepted_at'      => $g->accepted_at,
            'is_active'        => $g->is_active,
            'approval_status'  => $g->approval_status,
            'created_at'       => $g->created_at,
            'loan' => $g->loan ? [
                'id'             => $g->loan->id,
                'account_number' => $g->loan->account_number,
                'principal_amount'=> $g->loan->principal_amount,
                'loan_status'    => $g->loan->loan_status,
                'member'         => $g->loan->member ? [
                    'id'           => $g->loan->member->id,
                    'full_name'    => $g->loan->member->full_name,
                    'member_number'=> $g->loan->member->member_number,
                ] : null,
                'loan_product' => $g->loan->loanProduct ? [
                    'id'   => $g->loan->loanProduct->id,
                    'name' => $g->loan->loanProduct->name,
                ] : null,
            ] : null,
        ]);

        return $this->respond([
            'data' => $data,
            'meta' => [
                'current_page' => $guarantees->currentPage(),
                'last_page'    => $guarantees->lastPage(),
                'per_page'     => $guarantees->perPage(),
                'total'        => $guarantees->total(),
            ],
        ]);
    }

    public function issues(Request $request): JsonResponse
    {
        $member = $this->resolveMember($request);

        $query = Issue::where('org_id', $request->user()->org_id)
            ->where('member_id', $member->id)
            ->with(['category', 'reporter', 'assignee'])
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $issues = $query->paginate($request->integer('per_page', 50));

        return $this->respond(
            IssueResource::collection($issues)->response()->getData(true)
        );
    }

    public function createIssue(StoreIssueRequest $request): JsonResponse
    {
        $member = $this->resolveMember($request);
        $data   = $request->validated();
        $data['member_id'] = $member->id;

        $issue = $this->issueService->create($data, $request->user()->org_id, $request->user());
        $issue->load(['category', 'member', 'reporter', 'assignee', 'comments.user']);

        return $this->respondCreated(new IssueResource($issue));
    }

    public function addIssueComment(Request $request, string $issueId): JsonResponse
    {
        $member = $this->resolveMember($request);
        $issue  = Issue::where('org_id', $request->user()->org_id)
            ->where('member_id', $member->id)
            ->where('id', $issueId)
            ->firstOrFail();

        $request->validate(['body' => 'required|string|max:2000']);

        $comment = $this->issueService->addComment($issue, $request->body, $request->user());
        $comment->load('user');

        return $this->respondCreated([
            'id'         => $comment->id,
            'body'       => $comment->body,
            'created_at' => $comment->created_at,
            'user'       => $comment->user ? ['id' => $comment->user->id, 'name' => $comment->user->name] : null,
        ]);
    }

    public function myAllocations(Request $request): JsonResponse
    {
        $allocations = PettyCashAllocation::where('org_id', $request->user()->org_id)
            ->where('allocated_to', $request->user()->id)
            ->with(['period'])
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 20));

        return $this->respond(
            PettyCashAllocationResource::collection($allocations)->response()->getData(true)
        );
    }

    public function myRequests(Request $request): JsonResponse
    {
        $requests = PettyCashRequest::where('org_id', $request->user()->org_id)
            ->where('requested_by', $request->user()->id)
            ->with(['allocation.period', 'item.category'])
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 50));

        return $this->respond(
            PettyCashRequestResource::collection($requests)->response()->getData(true)
        );
    }

    public function allTransactions(Request $request): JsonResponse
    {
        $member   = $this->resolveMember($request);
        $accountIds = $member->depositAccounts()->pluck('id');

        $query = AccountTransaction::whereIn('deposit_account_id', $accountIds)
            ->orderByDesc('transaction_date')
            ->orderByDesc('created_at');

        if ($request->filled('from_date')) {
            $query->whereDate('transaction_date', '>=', $request->from_date);
        }
        if ($request->filled('to_date')) {
            $query->whereDate('transaction_date', '<=', $request->to_date);
        }
        if ($request->filled('transaction_type')) {
            $query->where('transaction_type', $request->transaction_type);
        }

        $transactions = $query->paginate($request->integer('per_page', 50));

        return $this->respond(
            AccountTransactionResource::collection($transactions)->response()->getData(true)
        );
    }
}

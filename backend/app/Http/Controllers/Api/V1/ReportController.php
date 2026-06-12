<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\V1\MemberResource;
use App\Http\Resources\V1\LoanResource;
use App\Http\Resources\V1\ContributionResource;
use App\Http\Resources\V1\DepositAccountResource;
use App\Http\Resources\V1\AccountTransactionResource;
use App\Http\Resources\V1\IssueResource;
use App\Http\Resources\V1\PettyCashAllocationResource;
use App\Http\Resources\V1\PettyCashRequestResource;
use App\Models\Member;
use App\Models\Loan;
use App\Models\Contribution;
use App\Models\DepositAccount;
use App\Models\AccountTransaction;
use App\Models\Issue;
use App\Models\PettyCashAllocation;
use App\Models\PettyCashRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends ApiController
{
    private function perPage(Request $request, int $max = 1000): int
    {
        return min((int) $request->query('per_page', 200), $max);
    }

    private function pageMeta(\Illuminate\Pagination\LengthAwarePaginator $paginator, array $extra = []): array
    {
        return array_merge([
            'current_page' => $paginator->currentPage(),
            'last_page'    => $paginator->lastPage(),
            'per_page'     => $paginator->perPage(),
            'total'        => $paginator->total(),
        ], $extra);
    }

    // ── Members ───────────────────────────────────────────────────────────

    public function members(Request $request): JsonResponse
    {
        $query = Member::where('org_id', $request->user()->org_id);

        if ($v = $request->query('approval_status')) {
            $query->where('approval_status', $v);
        }
        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }
        if ($v = $request->query('gender')) {
            $query->where('gender', $v);
        }
        if ($v = $request->query('entry_from')) {
            $query->whereDate('entry_date', '>=', $v);
        }
        if ($v = $request->query('entry_to')) {
            $query->whereDate('entry_date', '<=', $v);
        }
        if ($v = $request->query('search')) {
            $term = strtolower($v);
            $query->where(function ($q) use ($term) {
                $q->whereRaw('LOWER(full_name) LIKE ?', ["%{$term}%"])
                  ->orWhereRaw('LOWER(member_number) LIKE ?', ["%{$term}%"])
                  ->orWhereRaw('LOWER(id_number) LIKE ?', ["%{$term}%"]);
            });
        }

        $total    = $query->count();
        $active   = (clone $query)->where('is_active', true)->count();

        $members  = $query->orderBy('member_number')->paginate($this->perPage($request));

        return $this->respond(
            MemberResource::collection($members->items())->resolve(),
            '',
            200,
            $this->pageMeta($members, ['summary' => [
                'total' => $total, 'active' => $active, 'inactive' => $total - $active,
            ]])
        );
    }

    // ── Loans ─────────────────────────────────────────────────────────────

    public function loans(Request $request): JsonResponse
    {
        $query = Loan::where('org_id', $request->user()->org_id)
            ->with(['member', 'loanProduct']);

        if ($v = $request->query('loan_status')) {
            $query->where('loan_status', $v);
        }
        if ($v = $request->query('loan_product_id')) {
            $query->where('loan_product_id', $v);
        }
        if ($v = $request->query('disbursed_from')) {
            $query->whereDate('disbursed_date', '>=', $v);
        }
        if ($v = $request->query('disbursed_to')) {
            $query->whereDate('disbursed_date', '<=', $v);
        }
        if ($v = $request->query('applied_from')) {
            $query->whereDate('applied_at', '>=', $v);
        }
        if ($v = $request->query('applied_to')) {
            $query->whereDate('applied_at', '<=', $v);
        }
        if ($v = $request->query('search')) {
            $term = strtolower($v);
            $query->where(function ($q) use ($term) {
                $q->whereRaw('LOWER(account_number) LIKE ?', ["%{$term}%"])
                  ->orWhereHas('member', fn ($mq) =>
                      $mq->whereRaw('LOWER(full_name) LIKE ?', ["%{$term}%"])
                  );
            });
        }

        $total            = $query->count();
        $totalPrincipal   = $query->sum('principal_amount');
        $totalOutstanding = $query->sum('outstanding_balance');
        $activeCount      = (clone $query)->whereIn('loan_status', ['disbursed', 'active'])->count();

        $loans = $query->orderByDesc('applied_at')->paginate($this->perPage($request));

        return $this->respond(
            LoanResource::collection($loans->items())->resolve(),
            '',
            200,
            $this->pageMeta($loans, ['summary' => [
                'total'             => $total,
                'active'            => $activeCount,
                'total_principal'   => number_format((float)$totalPrincipal, 2, '.', ''),
                'total_outstanding' => number_format((float)$totalOutstanding, 2, '.', ''),
            ]])
        );
    }

    // ── Contributions ─────────────────────────────────────────────────────

    public function contributions(Request $request): JsonResponse
    {
        $query = Contribution::where('org_id', $request->user()->org_id)
            ->with(['member', 'period', 'depositAccount']);

        if ($v = $request->query('fiscal_year_id')) {
            $query->whereHas('period', fn ($q) => $q->where('fiscal_year_id', $v));
        }
        if ($v = $request->query('period_id')) {
            $query->where('period_id', $v);
        }
        if ($v = $request->query('status')) {
            $query->where('status', $v);
        }
        if ($v = $request->query('due_from')) {
            $query->whereDate('due_date', '>=', $v);
        }
        if ($v = $request->query('due_to')) {
            $query->whereDate('due_date', '<=', $v);
        }
        if ($v = $request->query('member_id')) {
            $query->where('member_id', $v);
        }

        $sumExpected  = $query->sum('expected_amount');
        $sumPaid      = $query->sum('paid_amount');
        $total        = $query->count();
        $paidCount    = (clone $query)->where('status', 'paid')->count();
        $pendingCount = (clone $query)->whereIn('status', ['pending', 'partial'])->count();

        $contributions = $query->orderByDesc('due_date')->paginate($this->perPage($request));

        return $this->respond(
            ContributionResource::collection($contributions->items())->resolve(),
            '',
            200,
            $this->pageMeta($contributions, ['summary' => [
                'total'          => $total,
                'paid'           => $paidCount,
                'pending'        => $pendingCount,
                'total_expected' => number_format((float)$sumExpected, 2, '.', ''),
                'total_paid'     => number_format((float)$sumPaid, 2, '.', ''),
            ]])
        );
    }

    // ── Savings Accounts ──────────────────────────────────────────────────

    public function accounts(Request $request): JsonResponse
    {
        $query = DepositAccount::where('org_id', $request->user()->org_id)
            ->with(['member', 'product']);

        if ($v = $request->query('product_id')) {
            $query->where('product_id', $v);
        }
        if ($v = $request->query('approval_status')) {
            $query->where('approval_status', $v);
        }
        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }
        if ($v = $request->query('opening_from')) {
            $query->whereDate('opening_date', '>=', $v);
        }
        if ($v = $request->query('opening_to')) {
            $query->whereDate('opening_date', '<=', $v);
        }

        $total        = $query->count();
        $totalBalance = $query->sum('balance');
        $activeCount  = (clone $query)->where('is_active', true)->count();

        $accs = $query->orderByDesc('opening_date')->paginate($this->perPage($request));

        return $this->respond(
            DepositAccountResource::collection($accs->items())->resolve(),
            '',
            200,
            $this->pageMeta($accs, ['summary' => [
                'total'         => $total,
                'active'        => $activeCount,
                'total_balance' => number_format((float)$totalBalance, 2, '.', ''),
            ]])
        );
    }

    // ── Transactions ──────────────────────────────────────────────────────

    public function transactions(Request $request): JsonResponse
    {
        $query = AccountTransaction::whereHas('depositAccount', fn ($q) =>
            $q->where('org_id', $request->user()->org_id)
        );

        if ($v = $request->query('transaction_type')) {
            $query->where('transaction_type', $v);
        }
        if ($v = $request->query('deposit_account_id')) {
            $query->where('deposit_account_id', $v);
        }
        if ($v = $request->query('from_date')) {
            $query->whereDate('transaction_date', '>=', $v);
        }
        if ($v = $request->query('to_date')) {
            $query->whereDate('transaction_date', '<=', $v);
        }

        $total     = $query->count();
        $sumDebit  = (clone $query)->whereIn('transaction_type', ['withdrawal', 'transfer_out', 'fee'])->sum('amount');
        $sumCredit = (clone $query)->whereIn('transaction_type', ['deposit', 'interest_credit', 'transfer_in', 'loan_disbursement', 'contribution'])->sum('amount');

        $txns = $query->orderByDesc('transaction_date')->paginate($this->perPage($request));

        return $this->respond(
            AccountTransactionResource::collection($txns->items())->resolve(),
            '',
            200,
            $this->pageMeta($txns, ['summary' => [
                'total'        => $total,
                'total_credit' => number_format((float)$sumCredit, 2, '.', ''),
                'total_debit'  => number_format((float)$sumDebit, 2, '.', ''),
            ]])
        );
    }

    // ── Issues ────────────────────────────────────────────────────────────

    public function issues(Request $request): JsonResponse
    {
        $query = Issue::where('org_id', $request->user()->org_id)
            ->with(['category', 'member', 'reporter', 'assignee']);

        if ($v = $request->query('status')) {
            $query->where('status', $v);
        }
        if ($v = $request->query('priority')) {
            $query->where('priority', $v);
        }
        if ($v = $request->query('category_id')) {
            $query->where('category_id', $v);
        }
        if ($v = $request->query('created_from')) {
            $query->whereDate('created_at', '>=', $v);
        }
        if ($v = $request->query('created_to')) {
            $query->whereDate('created_at', '<=', $v);
        }

        $total    = $query->count();
        $open     = (clone $query)->where('status', 'open')->count();
        $resolved = (clone $query)->where('status', 'resolved')->count();
        $closed   = (clone $query)->where('status', 'closed')->count();

        $issues = $query->orderByDesc('created_at')->paginate($this->perPage($request));

        return $this->respond(
            IssueResource::collection($issues->items())->resolve(),
            '',
            200,
            $this->pageMeta($issues, ['summary' => [
                'total' => $total, 'open' => $open, 'resolved' => $resolved, 'closed' => $closed,
            ]])
        );
    }

    // ── Petty Cash ────────────────────────────────────────────────────────

    public function pettyCash(Request $request): JsonResponse
    {
        $allocQuery = PettyCashAllocation::where('org_id', $request->user()->org_id)
            ->with(['period', 'allocatedTo']);
        $reqQuery   = PettyCashRequest::where('org_id', $request->user()->org_id)
            ->with(['allocation.period', 'item.category', 'requestedBy']);

        if ($v = $request->query('period_id')) {
            $allocQuery->where('period_id', $v);
            $reqQuery->whereHas('allocation', fn ($q) => $q->where('period_id', $v));
        }
        if ($v = $request->query('approval_status')) {
            $allocQuery->where('approval_status', $v);
            $reqQuery->where('approval_status', $v);
        }

        $totalAllocated = $allocQuery->sum('amount');
        $totalSpent     = $allocQuery->sum('spent');
        $totalRequested = $reqQuery->sum('amount');
        $approvedReqs   = (clone $reqQuery)->where('approval_status', 'approved')->sum('amount');

        $allocPerPage = $this->perPage($request, 200);
        $reqPerPage   = $this->perPage($request, 200);

        $allocs = $allocQuery->orderByDesc('created_at')->paginate($allocPerPage);
        $reqs   = $reqQuery->orderByDesc('created_at')->paginate($reqPerPage);

        return $this->respond([
            'allocations' => [
                'data' => PettyCashAllocationResource::collection($allocs->items())->resolve(),
                'meta' => $this->pageMeta($allocs),
            ],
            'requests' => [
                'data' => PettyCashRequestResource::collection($reqs->items())->resolve(),
                'meta' => $this->pageMeta($reqs),
            ],
            'summary' => [
                'total_allocated' => number_format((float)$totalAllocated, 2, '.', ''),
                'total_spent'     => number_format((float)$totalSpent, 2, '.', ''),
                'total_requested' => number_format((float)$totalRequested, 2, '.', ''),
                'approved_amount' => number_format((float)$approvedReqs, 2, '.', ''),
            ],
        ]);
    }
}

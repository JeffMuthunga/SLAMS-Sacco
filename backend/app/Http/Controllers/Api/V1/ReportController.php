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
use App\Models\LoanRepayment;
use App\Models\MemberShare;
use App\Models\DividendEntry;
use App\Models\DividendRun;
use App\Models\ShareProduct;
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

    // ── Loan Repayments ───────────────────────────────────────────────────

    public function loanRepayments(Request $request): JsonResponse
    {
        $query = LoanRepayment::whereHas('loan', fn ($q) =>
            $q->where('org_id', $request->user()->org_id)
        )->with(['loan.member', 'loan.loanProduct', 'period']);

        if ($v = $request->query('repayment_status')) {
            $query->where('repayment_status', $v);
        }
        if ($v = $request->query('loan_product_id')) {
            $query->whereHas('loan', fn ($q) => $q->where('loan_product_id', $v));
        }
        if ($v = $request->query('member_id')) {
            $query->whereHas('loan', fn ($q) => $q->where('member_id', $v));
        }
        if ($v = $request->query('due_from')) {
            $query->whereDate('due_date', '>=', $v);
        }
        if ($v = $request->query('due_to')) {
            $query->whereDate('due_date', '<=', $v);
        }
        if ($request->boolean('overdue')) {
            $query->where('repayment_status', '!=', 'paid')
                  ->whereDate('due_date', '<', now()->toDateString());
        }

        $total       = $query->count();
        $totalDue    = $query->sum('total_due');
        $totalPaid   = $query->sum('total_paid');
        $overdueCount = (clone $query)->where('repayment_status', '!=', 'paid')
                           ->whereDate('due_date', '<', now()->toDateString())->count();

        $repayments = $query->orderBy('due_date')->paginate($this->perPage($request));

        $data = $repayments->items();
        $rows = array_map(function ($r) {
            $loan   = $r->loan;
            $member = $loan?->member;
            $product = $loan?->loanProduct;
            return [
                'id'                => $r->id,
                'due_date'          => $r->due_date?->toDateString(),
                'paid_date'         => $r->paid_date?->toDateString(),
                'principal_due'     => $r->principal_due,
                'principal_paid'    => $r->principal_paid,
                'interest_due'      => $r->interest_due,
                'interest_paid'     => $r->interest_paid,
                'total_due'         => $r->total_due,
                'total_paid'        => $r->total_paid,
                'balance'           => $r->balance,
                'repayment_status'  => $r->repayment_status,
                'loan_account'      => $loan?->account_number,
                'loan_product'      => $product?->name,
                'member_name'       => $member?->full_name,
                'member_number'     => $member?->member_number,
            ];
        }, $data);

        return $this->respond(
            $rows, '', 200,
            $this->pageMeta($repayments, ['summary' => [
                'total'         => $total,
                'overdue'       => $overdueCount,
                'total_due'     => number_format((float)$totalDue, 2, '.', ''),
                'total_paid'    => number_format((float)$totalPaid, 2, '.', ''),
                'total_balance' => number_format((float)($totalDue - $totalPaid), 2, '.', ''),
            ]])
        );
    }

    // ── Shares ────────────────────────────────────────────────────────────

    public function shares(Request $request): JsonResponse
    {
        $query = MemberShare::where('org_id', $request->user()->org_id)
            ->with(['member', 'shareProduct']);

        if ($v = $request->query('share_product_id')) {
            $query->where('share_product_id', $v);
        }
        if ($v = $request->query('status')) {
            $query->where('status', $v);
        }
        if ($v = $request->query('from_date')) {
            $query->whereDate('purchase_date', '>=', $v);
        }
        if ($v = $request->query('to_date')) {
            $query->whereDate('purchase_date', '<=', $v);
        }

        $total        = $query->count();
        $totalShares  = $query->sum('quantity');
        $totalValue   = $query->sum('total_amount');

        $shares = $query->orderByDesc('purchase_date')->paginate($this->perPage($request));

        $data = array_map(function ($s) {
            return [
                'id'             => $s->id,
                'member_name'    => $s->member?->full_name,
                'member_number'  => $s->member?->member_number,
                'product_name'   => $s->shareProduct?->name,
                'quantity'       => $s->quantity,
                'price_per_share'=> $s->price_per_share,
                'total_amount'   => $s->total_amount,
                'purchase_date'  => $s->purchase_date,
                'status'         => $s->status,
                'notes'          => $s->notes,
            ];
        }, $shares->items());

        return $this->respond(
            $data, '', 200,
            $this->pageMeta($shares, ['summary' => [
                'total'        => $total,
                'total_shares' => $totalShares,
                'total_value'  => number_format((float)$totalValue, 2, '.', ''),
            ]])
        );
    }

    // ── Dividends ─────────────────────────────────────────────────────────

    public function dividends(Request $request): JsonResponse
    {
        $orgId = $request->user()->org_id;

        $runQuery = DividendRun::where('org_id', $orgId);
        if ($v = $request->query('fiscal_year_id')) {
            $runQuery->where('fiscal_year_id', $v);
        }
        if ($v = $request->query('status')) {
            $runQuery->where('status', $v);
        }

        $runs = $runQuery->with('fiscalYear')->orderByDesc('created_at')->get();

        $entryQuery = DividendEntry::where('org_id', $orgId)
            ->with(['member', 'dividendRun.fiscalYear', 'creditedAccount']);

        if ($v = $request->query('fiscal_year_id')) {
            $entryQuery->whereHas('dividendRun', fn ($q) => $q->where('fiscal_year_id', $v));
        }
        if ($v = $request->query('dividend_run_id')) {
            $entryQuery->where('dividend_run_id', $v);
        }

        $totalDividend = $entryQuery->sum('dividend_amount');
        $entryCount    = $entryQuery->count();

        $entries = $entryQuery->orderByDesc('posted_at')->paginate($this->perPage($request));

        $entryData = array_map(function ($e) {
            return [
                'id'              => $e->id,
                'member_name'     => $e->member?->full_name,
                'member_number'   => $e->member?->member_number,
                'run_rate'        => $e->dividendRun?->rate,
                'fiscal_year'     => $e->dividendRun?->fiscalYear?->name,
                'share_balance'   => $e->share_balance,
                'dividend_amount' => $e->dividend_amount,
                'account_number'  => $e->creditedAccount?->account_number,
                'posted_at'       => $e->posted_at?->toDateString(),
            ];
        }, $entries->items());

        return $this->respond([
            'runs'    => $runs->map(fn ($r) => [
                'id'             => $r->id,
                'fiscal_year'    => $r->fiscalYear?->name,
                'rate'           => $r->rate,
                'status'         => $r->status,
                'total_dividend' => $r->total_dividend,
                'approved_at'    => $r->approved_at,
            ])->values()->all(),
            'entries' => [
                'data' => $entryData,
                'meta' => $this->pageMeta($entries, ['summary' => [
                    'total'          => $entryCount,
                    'total_dividend' => number_format((float)$totalDividend, 2, '.', ''),
                ]]),
            ],
        ]);
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

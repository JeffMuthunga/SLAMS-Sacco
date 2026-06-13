<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Member;
use App\Models\Loan;
use App\Models\DepositAccount;
use App\Models\Contribution;
use App\Models\Issue;
use App\Models\PettyCashRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends ApiController
{
    public function stats(Request $request): JsonResponse
    {
        $orgId = $request->user()->org_id;
        $now   = now();

        $totalMembers   = Member::where('org_id', $orgId)->where('approval_status', 'approved')->where('is_active', true)->count();
        $pendingMembers = Member::where('org_id', $orgId)->where('approval_status', 'pending')->count();

        $activeLoans         = Loan::where('org_id', $orgId)->where('loan_status', 'active')->count();
        $totalLoanPortfolio  = Loan::where('org_id', $orgId)->where('loan_status', 'active')->sum('outstanding_balance');
        $pendingLoanApprovals = Loan::where('org_id', $orgId)->where('approval_status', 'pending')->count();

        $totalSavings = DepositAccount::where('org_id', $orgId)->where('approval_status', 'approved')->sum('balance');

        $contributionsThisMonth = Contribution::where('org_id', $orgId)
            ->whereYear('due_date', $now->year)
            ->whereMonth('due_date', $now->month)
            ->where('status', 'paid')
            ->sum('paid_amount');

        $openIssues = Issue::where('org_id', $orgId)->whereIn('status', ['open', 'in_progress'])->count();

        $recentLoans = Loan::where('org_id', $orgId)
            ->with(['member:id,first_name,last_name,member_number', 'loanProduct:id,name'])
            ->orderByDesc('applied_at')
            ->limit(5)
            ->get(['id', 'member_id', 'loan_product_id', 'principal_amount', 'loan_status', 'approval_status', 'applied_at']);

        return $this->respond([
            'stats' => [
                'total_members'          => $totalMembers,
                'pending_members'        => $pendingMembers,
                'active_loans'           => $activeLoans,
                'total_loan_portfolio'   => number_format((float) $totalLoanPortfolio, 2, '.', ''),
                'pending_loan_approvals' => $pendingLoanApprovals,
                'total_savings'          => number_format((float) $totalSavings, 2, '.', ''),
                'contributions_this_month' => number_format((float) $contributionsThisMonth, 2, '.', ''),
                'open_issues'            => $openIssues,
            ],
            'recent_loans' => $recentLoans->map(fn($loan) => [
                'id'              => $loan->id,
                'member_name'     => $loan->member ? trim($loan->member->first_name . ' ' . $loan->member->last_name) : '—',
                'member_number'   => $loan->member?->member_number,
                'product'         => $loan->loanProduct?->name,
                'principal'       => $loan->principal_amount,
                'loan_status'     => $loan->loan_status,
                'approval_status' => $loan->approval_status,
                'applied_at'      => $loan->applied_at,
            ]),
        ]);
    }
}

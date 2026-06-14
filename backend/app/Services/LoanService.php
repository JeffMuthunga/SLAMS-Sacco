<?php

namespace App\Services;

use App\Models\AccountTransaction;
use App\Models\DepositAccount;
use App\Models\Loan;
use App\Models\LoanCollateral;
use App\Models\LoanGuarantee;
use App\Models\LoanNote;
use App\Models\LoanRepayment;
use App\Models\Period;
use Carbon\Carbon;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class LoanService
{
    public function __construct(private NotificationService $notifications) {}

    public function generateLoanNumber(string $orgId): string
    {
        $year   = now()->year;
        $prefix = "LN-{$year}-";

        $last = Loan::withTrashed()
            ->where('org_id', $orgId)
            ->where('account_number', 'like', $prefix . '%')
            ->orderByDesc('account_number')
            ->value('account_number');

        $seq = $last ? ((int) substr($last, -5)) + 1 : 1;

        return $prefix . str_pad($seq, 5, '0', STR_PAD_LEFT);
    }

    public function store(array $data, string $orgId, $user): Loan
    {
        return DB::transaction(function () use ($data, $orgId, $user) {
            Loan::withTrashed()
                ->where('org_id', $orgId)
                ->lockForUpdate()
                ->select('account_number')
                ->get();

            $product = \App\Models\LoanProduct::findOrFail($data['loan_product_id']);

            // Calculate repayment schedule totals
            [$repaymentAmount, $totalPayable] = $this->calculateInstallment(
                $data['principal_amount'],
                $data['interest_rate'] ?? $product->interest_rate,
                $data['repayment_period'],
                $product->interest_method
            );

            $loan = Loan::create([
                'org_id'              => $orgId,
                'member_id'           => $data['member_id'],
                'loan_product_id'     => $data['loan_product_id'],
                'account_number'      => $this->generateLoanNumber($orgId),
                'principal_amount'    => $data['principal_amount'],
                'interest_rate'       => $data['interest_rate'] ?? $product->interest_rate,
                'repayment_period'    => $data['repayment_period'],
                'repayment_frequency' => $data['repayment_frequency'] ?? $product->repayment_frequency,
                'repayment_amount'    => $repaymentAmount,
                'total_payable'       => $totalPayable,
                'outstanding_balance' => $data['principal_amount'],
                'loan_status'         => 'applied',
                'approval_status'     => 'pending',
                'applied_at'          => now(),
            ]);

            foreach ($data['guarantors'] ?? [] as $g) {
                LoanGuarantee::create([
                    'org_id'            => $orgId,
                    'loan_id'           => $loan->id,
                    'member_id'         => $g['member_id'],
                    'guaranteed_amount' => $g['guaranteed_amount'],
                    'approval_status'   => 'pending',
                    'is_accepted'       => false,
                    'is_active'         => true,
                ]);
            }

            foreach ($data['collaterals'] ?? [] as $c) {
                LoanCollateral::create([
                    'org_id'           => $orgId,
                    'loan_id'          => $loan->id,
                    'collateral_type'  => $c['collateral_type'],
                    'description'      => $c['description'] ?? null,
                    'estimated_value'  => $c['estimated_value'],
                    'is_received'      => false,
                    'is_released'      => false,
                ]);
            }

            if (!empty($data['note'])) {
                LoanNote::create([
                    'org_id'     => $orgId,
                    'loan_id'    => $loan->id,
                    'note'       => $data['note'],
                    'created_by' => $user->id,
                ]);
            }

            return $loan->load(['member', 'loanProduct', 'guarantees', 'collaterals']);
        });
    }

    public function approve(Loan $loan, $user): void
    {
        $product = $loan->loanProduct ?? $loan->load('loanProduct')->loanProduct;
        if ($product && $product->requires_guarantor) {
            $allAccepted = $loan->guarantees()
                ->where('is_active', true)
                ->where('is_accepted', false)
                ->doesntExist();
            $hasAny = $loan->guarantees()->where('is_active', true)->exists();
            abort_if(!$allAccepted || !$hasAny, 422, 'All guarantors must confirm before this loan can be approved.');
        }

        $loan->update([
            'loan_status'     => 'approved',
            'approval_status' => 'approved',
            'approved_by'     => $user->id,
            'approved_at'     => now(),
        ]);

        $loan->load('member');
        $this->notifications->loanApproved($loan);
    }

    public function reject(Loan $loan, string $reason, $user): void
    {
        $loan->update([
            'loan_status'     => 'rejected',
            'approval_status' => 'rejected',
            'approved_by'     => $user->id,
            'approved_at'     => now(),
        ]);

        LoanNote::create([
            'org_id'     => $loan->org_id,
            'loan_id'    => $loan->id,
            'note'       => "Rejected: {$reason}",
            'created_by' => $user->id,
        ]);

        $loan->load('member');
        $this->notifications->loanRejected($loan, $reason);
    }

    public function disburse(Loan $loan, array $data, $user): Loan
    {
        return DB::transaction(function () use ($loan, $data, $user) {
            $disburseDate = $data['disbursed_date'] ?? now()->toDateString();

            $loan->update([
                'loan_status'      => 'active',
                'disburse_account_id' => $data['disburse_account_id'],
                'disbursed_date'   => $disburseDate,
                'disbursed_by'     => $user->id,
                'expected_maturity_date' => $this->calculateMaturityDate(
                    $disburseDate,
                    $loan->repayment_period,
                    $loan->repayment_frequency
                ),
                'outstanding_balance' => $loan->principal_amount,
            ]);

            // Post loan disbursement transaction to member's deposit account
            $account = DepositAccount::lockForUpdate()->findOrFail($data['disburse_account_id']);
            $newBalance = bcadd((string) $account->balance, (string) $loan->principal_amount, 2);

            AccountTransaction::create([
                'org_id'             => $loan->org_id,
                'deposit_account_id' => $account->id,
                'period_id'          => $this->currentPeriodId($loan->org_id),
                'transaction_type'   => 'loan_disbursement',
                'amount'             => (string) $loan->principal_amount,
                'balance_after'      => $newBalance,
                'reference_number'   => $loan->account_number,
                'transaction_date'   => $disburseDate,
                'value_date'         => $disburseDate,
                'narration'          => "Loan disbursement — {$loan->account_number}",
                'created_by'         => $user->id,
                'approval_status'    => 'approved',
                'approved_by'        => $user->id,
                'approved_at'        => now(),
            ]);

            $account->update([
                'balance'            => $newBalance,
                'last_activity_date' => $disburseDate,
            ]);

            // Generate repayment schedule
            $this->generateRepaymentSchedule($loan, $disburseDate, $user);

            $fresh = $loan->fresh()->load(['member', 'loanProduct', 'repayments', 'guarantees', 'collaterals']);
            $this->notifications->loanDisbursed($fresh);
            return $fresh;
        });
    }

    public function recordRepayment(Loan $loan, LoanRepayment $schedule, array $data, $user): LoanRepayment
    {
        return DB::transaction(function () use ($loan, $schedule, $data, $user) {
            $loan = Loan::lockForUpdate()->findOrFail($loan->id);

            $amount     = (string) $data['amount'];
            $paidDate   = $data['paid_date'] ?? now()->toDateString();
            $balance    = bcsub((string) $schedule->balance, $amount, 2);
            $isFullyPaid = bccomp($amount, (string) $schedule->balance, 2) >= 0;

            // Split payment: principal first, then interest, then penalty
            $principalPaying = min((float) $amount, (float) bcsub((string) $schedule->principal_due, (string) $schedule->principal_paid, 2));
            $remaining       = bcsub($amount, (string) $principalPaying, 2);
            $interestPaying  = min((float) $remaining, (float) bcsub((string) $schedule->interest_due, (string) $schedule->interest_paid, 2));
            $penaltyPaying   = bcsub($remaining, (string) $interestPaying, 2);

            $newPrincipalPaid = bcadd((string) $schedule->principal_paid, (string) $principalPaying, 2);
            $newInterestPaid  = bcadd((string) $schedule->interest_paid, (string) $interestPaying, 2);
            $newPenaltyPaid   = bcadd((string) $schedule->penalty_paid, (string) max(0, (float) $penaltyPaying), 2);
            $newTotalPaid     = bcadd((string) $schedule->total_paid, $amount, 2);
            $newBalance       = bcsub((string) $schedule->balance, $amount, 2);
            if (bccomp($newBalance, '0', 2) < 0) {
                $newBalance = '0.00';
            }

            $schedule->update([
                'principal_paid'   => $newPrincipalPaid,
                'interest_paid'    => $newInterestPaid,
                'penalty_paid'     => $newPenaltyPaid,
                'total_paid'       => $newTotalPaid,
                'balance'          => $newBalance,
                'paid_date'        => $paidDate,
                'repayment_status' => $isFullyPaid ? 'paid' : 'partial',
                'period_id'        => $this->currentPeriodId($loan->org_id),
            ]);

            // Update loan outstanding balance
            $newOutstanding = bcsub((string) $loan->outstanding_balance, (string) $principalPaying, 2);
            if (bccomp($newOutstanding, '0', 2) < 0) {
                $newOutstanding = '0.00';
            }

            $loanUpdates = ['outstanding_balance' => $newOutstanding];

            // Check if all repayments are paid → mark loan as repaid
            $allPaid = LoanRepayment::where('loan_id', $loan->id)
                ->where('repayment_status', '!=', 'paid')
                ->doesntExist();

            if ($allPaid) {
                $loanUpdates['loan_status'] = 'repaid';
                $loanUpdates['maturity_date'] = $paidDate;
            }

            $loan->update($loanUpdates);

            // Post loan_repayment transaction to deposit account if disburse_account_id set
            if ($loan->disburse_account_id) {
                $account    = DepositAccount::lockForUpdate()->findOrFail($loan->disburse_account_id);
                $newBalance = bcsub((string) $account->balance, $amount, 2);
                if (bccomp($newBalance, '0', 2) < 0) {
                    $newBalance = '0.00';
                }

                AccountTransaction::create([
                    'org_id'             => $loan->org_id,
                    'deposit_account_id' => $account->id,
                    'period_id'          => $this->currentPeriodId($loan->org_id),
                    'transaction_type'   => 'loan_repayment',
                    'amount'             => $amount,
                    'balance_after'      => $newBalance,
                    'reference_number'   => $loan->account_number,
                    'transaction_date'   => $paidDate,
                    'value_date'         => $paidDate,
                    'narration'          => "Loan repayment — {$loan->account_number}",
                    'created_by'         => $user->id,
                    'approval_status'    => 'approved',
                    'approved_by'        => $user->id,
                    'approved_at'        => now(),
                ]);

                $account->update([
                    'balance'            => $newBalance,
                    'last_activity_date' => $paidDate,
                ]);
            }

            return $schedule->fresh();
        });
    }

    public function markDefaulted(Loan $loan, $user): void
    {
        $loan->update(['loan_status' => 'defaulted']);

        LoanNote::create([
            'org_id'     => $loan->org_id,
            'loan_id'    => $loan->id,
            'note'       => 'Loan marked as defaulted.',
            'created_by' => $user->id,
        ]);

        // Mark overdue repayments
        LoanRepayment::where('loan_id', $loan->id)
            ->whereIn('repayment_status', ['pending', 'partial'])
            ->where('due_date', '<', now()->toDateString())
            ->update(['repayment_status' => 'overdue']);

        $loan->load('member');
        $this->notifications->loanDefaulted($loan);
    }

    public function addNote(Loan $loan, string $note, $user): LoanNote
    {
        return LoanNote::create([
            'org_id'     => $loan->org_id,
            'loan_id'    => $loan->id,
            'note'       => $note,
            'created_by' => $user->id,
        ]);
    }

    public function checkAndConfirmGuarantors(Loan $loan): void
    {
        $product = $loan->loanProduct ?? $loan->load('loanProduct')->loanProduct;
        if (!$product || !$product->requires_guarantor) {
            return;
        }

        $hasActive = $loan->guarantees()->where('is_active', true)->exists();
        $allAccepted = $loan->guarantees()
            ->where('is_active', true)
            ->where('is_accepted', false)
            ->doesntExist();

        if ($hasActive && $allAccepted) {
            $loan->update(['loan_status' => 'guarantors_confirmed']);
        }
    }

    public function addGuarantor(Loan $loan, array $data, string $orgId): LoanGuarantee
    {
        abort_unless(
            in_array($loan->loan_status, ['applied', 'guarantors_confirmed'], true),
            422,
            'Guarantors can only be added to applied or guarantors_confirmed loans.'
        );

        $guarantee = LoanGuarantee::create([
            'org_id'            => $orgId,
            'loan_id'           => $loan->id,
            'member_id'         => $data['member_id'],
            'guaranteed_amount' => $data['guaranteed_amount'],
            'approval_status'   => 'pending',
            'is_accepted'       => false,
            'is_active'         => true,
        ]);

        // A new unconfirmed guarantor resets back to applied
        if ($loan->loan_status === 'guarantors_confirmed') {
            $loan->update(['loan_status' => 'applied']);
        }

        return $guarantee->load('member');
    }

    // ── Private helpers ─────────────────────────────────────────────────

    private function calculateInstallment(
        string|float $principal,
        string|float $annualRate,
        int $months,
        string $method
    ): array {
        $p = (float) $principal;
        $r = (float) $annualRate;

        if ($method === 'flat') {
            $totalInterest  = $p * ($r / 100) * ($months / 12);
            $totalPayable   = $p + $totalInterest;
            $installment    = $totalPayable / $months;
        } else {
            // Reducing balance (annuity formula)
            $monthlyRate = $r / 100 / 12;
            if ($monthlyRate > 0) {
                $factor      = pow(1 + $monthlyRate, $months);
                $installment = $p * $monthlyRate * $factor / ($factor - 1);
                $totalPayable = $installment * $months;
            } else {
                $installment  = $p / $months;
                $totalPayable = $p;
            }
        }

        return [
            number_format($installment, 2, '.', ''),
            number_format($totalPayable, 2, '.', ''),
        ];
    }

    private function generateRepaymentSchedule(Loan $loan, string $startDate, $user): void
    {
        $product     = $loan->loanProduct;
        $method      = $product->interest_method;
        $months      = $loan->repayment_period;
        $annual      = (float) $loan->interest_rate;
        $principal   = (float) $loan->principal_amount;
        $installment = (float) $loan->repayment_amount;
        $monthlyRate = $annual / 100 / 12;
        $outstanding = $principal;

        $periodId = $this->currentPeriodId($loan->org_id);
        $date     = Carbon::parse($startDate);

        for ($i = 1; $i <= $months; $i++) {
            $date = $date->copy()->addMonth();
            $dueDate = $date->toDateString();

            if ($method === 'flat') {
                $interestDue   = round($principal * ($annual / 100) / 12, 2);
                $principalDue  = round($principal / $months, 2);
            } else {
                $interestDue  = round($outstanding * $monthlyRate, 2);
                $principalDue = round($installment - $interestDue, 2);
                if ($i === $months) {
                    // Absorb rounding on last installment
                    $principalDue = round($outstanding, 2);
                }
            }

            $totalDue  = round($principalDue + $interestDue, 2);
            $balance   = $totalDue;
            $outstanding -= $principalDue;

            LoanRepayment::create([
                'org_id'           => $loan->org_id,
                'loan_id'          => $loan->id,
                'period_id'        => $periodId,
                'due_date'         => $dueDate,
                'principal_due'    => $principalDue,
                'principal_paid'   => 0,
                'interest_due'     => $interestDue,
                'interest_paid'    => 0,
                'penalty_due'      => 0,
                'penalty_paid'     => 0,
                'total_due'        => $totalDue,
                'total_paid'       => 0,
                'balance'          => $balance,
                'repayment_status' => 'pending',
                'created_by'       => $user->id,
            ]);
        }
    }

    private function calculateMaturityDate(string $startDate, int $months, string $frequency): string
    {
        return Carbon::parse($startDate)->addMonths($months)->toDateString();
    }

    private function currentPeriodId(string $orgId): ?string
    {
        return Period::where('org_id', $orgId)
            ->where('status', 'open')
            ->orderByDesc('start_date')
            ->value('id');
    }
}

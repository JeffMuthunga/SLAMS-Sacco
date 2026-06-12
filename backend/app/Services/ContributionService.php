<?php

namespace App\Services;

use App\Models\AccountTransaction;
use App\Models\Contribution;
use App\Models\DepositAccount;
use App\Models\Member;
use App\Models\Period;
use App\Models\SaccoSetting;
use Illuminate\Support\Facades\DB;

class ContributionService
{
    /**
     * Generate one contribution record per active, approved member for the given period.
     * Skips members that already have a contribution for this period.
     */
    public function generateForPeriod(string $orgId, string $periodId, ?string $expectedAmount): int
    {
        $period = Period::where('org_id', $orgId)->findOrFail($periodId);

        if (!$expectedAmount) {
            $settings = SaccoSetting::where('org_id', $orgId)->first();
            $expectedAmount = $settings?->min_monthly_contribution ?? '0.00';
        }

        $existingMemberIds = Contribution::where('org_id', $orgId)
            ->where('period_id', $periodId)
            ->pluck('member_id')
            ->all();

        $members = Member::where('org_id', $orgId)
            ->where('approval_status', 'approved')
            ->where('is_active', true)
            ->whereNotIn('id', $existingMemberIds)
            ->get();

        $created = 0;

        DB::transaction(function () use ($members, $orgId, $periodId, $period, $expectedAmount, &$created) {
            foreach ($members as $member) {
                // Try to find member's primary deposit account
                $account = DepositAccount::where('org_id', $orgId)
                    ->where('member_id', $member->id)
                    ->where('is_active', true)
                    ->orderByDesc('created_at')
                    ->first();

                if (!$account) continue;

                Contribution::create([
                    'org_id'             => $orgId,
                    'member_id'          => $member->id,
                    'deposit_account_id' => $account->id,
                    'period_id'          => $periodId,
                    'expected_amount'    => $expectedAmount,
                    'paid_amount'        => '0.00',
                    'due_date'           => $period->end_date,
                    'status'             => 'pending',
                ]);

                $created++;
            }
        });

        return $created;
    }

    /**
     * Record a payment against a contribution.
     * Posts a `contribution` account transaction.
     */
    public function recordPayment(Contribution $contribution, string $amount, ?string $paidDate, $user): Contribution
    {
        return DB::transaction(function () use ($contribution, $amount, $paidDate, $user) {
            $account = DepositAccount::lockForUpdate()->findOrFail($contribution->deposit_account_id);

            $paidDate   = $paidDate ?? now()->toDateString();
            $newPaid    = bcadd((string) $contribution->paid_amount, $amount, 2);
            $isFullPaid = bccomp($newPaid, (string) $contribution->expected_amount, 2) >= 0;

            $contribution->update([
                'paid_amount' => $newPaid,
                'paid_date'   => $paidDate,
                'status'      => $isFullPaid ? 'paid' : 'partial',
            ]);

            // Post contribution transaction to deposit account
            $newBalance = bcadd((string) $account->balance, $amount, 2);

            AccountTransaction::create([
                'org_id'             => $contribution->org_id,
                'deposit_account_id' => $account->id,
                'period_id'          => $contribution->period_id,
                'transaction_type'   => 'contribution',
                'amount'             => $amount,
                'balance_after'      => $newBalance,
                'reference_number'   => null,
                'transaction_date'   => $paidDate,
                'value_date'         => $paidDate,
                'narration'          => "Monthly contribution — {$paidDate}",
                'created_by'         => $user->id,
                'approval_status'    => 'approved',
                'approved_by'        => $user->id,
                'approved_at'        => now(),
            ]);

            $account->update([
                'balance'            => $newBalance,
                'last_activity_date' => $paidDate,
            ]);

            return $contribution->fresh();
        });
    }

    public function waive(Contribution $contribution): void
    {
        $contribution->update(['status' => 'waived']);
    }
}

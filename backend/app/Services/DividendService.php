<?php

namespace App\Services;

use App\Models\DepositAccount;
use App\Models\DividendEntry;
use App\Models\DividendRun;
use App\Models\FiscalYear;
use App\Models\MemberShare;
use Illuminate\Support\Facades\DB;

class DividendService
{
    public function calculate(string $orgId, string $fiscalYearId, string $rate): DividendRun
    {
        FiscalYear::where('org_id', $orgId)->findOrFail($fiscalYearId);

        abort_if(
            DividendRun::where('org_id', $orgId)
                ->where('fiscal_year_id', $fiscalYearId)
                ->whereIn('status', ['approved', 'posted'])
                ->exists(),
            422,
            'An approved or posted dividend run already exists for this fiscal year.'
        );

        return DB::transaction(function () use ($orgId, $fiscalYearId, $rate) {
            DividendRun::where('org_id', $orgId)
                ->where('fiscal_year_id', $fiscalYearId)
                ->where('status', 'draft')
                ->delete();

            $run = DividendRun::create([
                'org_id'         => $orgId,
                'fiscal_year_id' => $fiscalYearId,
                'rate'           => $rate,
                'status'         => 'draft',
                'total_dividend' => '0.00',
            ]);

            $memberTotals = MemberShare::where('org_id', $orgId)
                ->where('status', 'approved')
                ->selectRaw('member_id, SUM(total_amount) as total_shares')
                ->groupBy('member_id')
                ->get();

            $grandTotal = '0.00';

            foreach ($memberTotals as $row) {
                $shareBalance = (string) $row->total_shares;
                $dividendAmt  = bcmul($shareBalance, $rate, 2);

                $account = DepositAccount::where('org_id', $orgId)
                    ->where('member_id', $row->member_id)
                    ->where('is_active', true)
                    ->orderByDesc('created_at')
                    ->first();

                DividendEntry::create([
                    'org_id'              => $orgId,
                    'dividend_run_id'     => $run->id,
                    'member_id'           => $row->member_id,
                    'share_balance'       => $shareBalance,
                    'dividend_amount'     => $dividendAmt,
                    'credited_account_id' => $account?->id,
                ]);

                $grandTotal = bcadd($grandTotal, $dividendAmt, 2);
            }

            $run->update(['total_dividend' => $grandTotal]);

            return $run->load(['fiscalYear', 'entries.member']);
        });
    }

    public function approve(DividendRun $run, $user): DividendRun
    {
        abort_unless($run->status === 'draft', 422, 'Only draft runs can be approved.');

        $run->update([
            'status'      => 'approved',
            'approved_by' => $user->id,
            'approved_at' => now(),
        ]);

        return $run->fresh()->load(['fiscalYear', 'entries.member']);
    }

    public function post(DividendRun $run): DividendRun
    {
        abort_unless($run->status === 'approved', 422, 'Only approved runs can be posted.');

        DB::transaction(function () use ($run) {
            $entries = $run->entries()->with('creditedAccount')->get();

            foreach ($entries as $entry) {
                if (! $entry->credited_account_id) continue;

                $account = DepositAccount::lockForUpdate()->findOrFail($entry->credited_account_id);
                $newBal  = bcadd((string) $account->balance, (string) $entry->dividend_amount, 2);
                $account->update(['balance' => $newBal]);

                $entry->update(['posted_at' => now()]);
            }

            $run->update(['status' => 'posted', 'posted_at' => now()]);
        });

        return $run->fresh()->load(['fiscalYear', 'entries.member']);
    }
}

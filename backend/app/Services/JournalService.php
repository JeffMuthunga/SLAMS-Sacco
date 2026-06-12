<?php

namespace App\Services;

use App\Models\Journal;
use App\Models\JournalLine;
use Illuminate\Support\Facades\DB;

class JournalService
{
    public function generateReference(string $orgId): string
    {
        $prefix = 'JV-' . now()->format('Ym') . '-';

        $last = Journal::where('org_id', $orgId)
            ->where('reference_number', 'like', $prefix . '%')
            ->lockForUpdate()
            ->orderByDesc('reference_number')
            ->first();

        $next = $last
            ? ((int) substr($last->reference_number, strlen($prefix))) + 1
            : 1;

        return $prefix . str_pad($next, 5, '0', STR_PAD_LEFT);
    }

    public function store(array $data, string $orgId, object $user): Journal
    {
        $lines = $data['lines'];

        $totalDebit  = array_reduce($lines, fn ($c, $l) => bcadd($c, (string) $l['debit'],  2), '0.00');
        $totalCredit = array_reduce($lines, fn ($c, $l) => bcadd($c, (string) $l['credit'], 2), '0.00');

        abort_if(
            bccomp($totalDebit, $totalCredit, 2) !== 0,
            422,
            "Journal is not balanced: debits ({$totalDebit}) ≠ credits ({$totalCredit})."
        );

        abort_if(
            bccomp($totalDebit, '0.00', 2) === 0,
            422,
            'Journal entry must have non-zero amounts.'
        );

        return DB::transaction(function () use ($data, $lines, $orgId, $user) {
            $journal = Journal::create([
                'org_id'          => $orgId,
                'fiscal_year_id'  => $data['fiscal_year_id'],
                'period_id'       => $data['period_id'],
                'reference_number' => $this->generateReference($orgId),
                'journal_date'    => $data['journal_date'],
                'narration'       => $data['narration'] ?? null,
                'is_posted'       => false,
                'is_reversed'     => false,
                'created_by'      => $user->id,
            ]);

            foreach ($lines as $line) {
                JournalLine::create([
                    'org_id'     => $orgId,
                    'journal_id' => $journal->id,
                    'account_id' => $line['account_id'],
                    'debit'      => $line['debit'],
                    'credit'     => $line['credit'],
                    'narration'  => $line['narration'] ?? null,
                ]);
            }

            return $journal;
        });
    }

    public function post(Journal $journal, object $user): Journal
    {
        $journal->update([
            'is_posted' => true,
            'posted_at' => now(),
            'posted_by' => $user->id,
        ]);

        return $journal;
    }

    public function reverse(Journal $journal, object $user): Journal
    {
        $original = $journal->load('lines');

        return DB::transaction(function () use ($original, $user) {
            $reversed = Journal::create([
                'org_id'           => $original->org_id,
                'fiscal_year_id'   => $original->fiscal_year_id,
                'period_id'        => $original->period_id,
                'reference_number' => $this->generateReference($original->org_id),
                'journal_date'     => now()->toDateString(),
                'narration'        => 'Reversal of ' . $original->reference_number . ($original->narration ? ': ' . $original->narration : ''),
                'is_posted'        => true,
                'posted_at'        => now(),
                'posted_by'        => $user->id,
                'is_reversed'      => false,
                'created_by'       => $user->id,
            ]);

            foreach ($original->lines as $line) {
                JournalLine::create([
                    'org_id'     => $original->org_id,
                    'journal_id' => $reversed->id,
                    'account_id' => $line->account_id,
                    'debit'      => $line->credit,
                    'credit'     => $line->debit,
                    'narration'  => $line->narration,
                ]);
            }

            $original->update([
                'is_reversed' => true,
                'reversed_at' => now(),
                'reversed_by' => $user->id,
            ]);

            return $reversed;
        });
    }
}

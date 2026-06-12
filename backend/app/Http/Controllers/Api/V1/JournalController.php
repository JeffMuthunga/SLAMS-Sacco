<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Api\V1\Journal\StoreJournalRequest;
use App\Http\Resources\V1\JournalLineResource;
use App\Http\Resources\V1\JournalResource;
use App\Models\ChartOfAccount;
use App\Models\Journal;
use App\Models\JournalLine;
use App\Services\JournalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JournalController extends ApiController
{
    public function __construct(private JournalService $journalService) {}

    public function index(Request $request): JsonResponse
    {
        $query = Journal::query()
            ->where('org_id', $request->user()->org_id)
            ->with(['period', 'fiscalYear']);

        if ($fyId = $request->query('fiscal_year_id')) {
            $query->where('fiscal_year_id', $fyId);
        }
        if ($periodId = $request->query('period_id')) {
            $query->where('period_id', $periodId);
        }
        if ($request->has('is_posted')) {
            $query->where('is_posted', filter_var($request->query('is_posted'), FILTER_VALIDATE_BOOLEAN));
        }
        if ($search = $request->query('search')) {
            $term = strtolower($search);
            $query->where(function ($q) use ($term) {
                $q->whereRaw('LOWER(reference_number) LIKE ?', ["%{$term}%"])
                  ->orWhereRaw('LOWER(narration) LIKE ?', ["%{$term}%"]);
            });
        }

        $perPage  = min((int) $request->query('per_page', 50), 200);
        $journals = $query->orderByDesc('journal_date')->orderByDesc('created_at')->paginate($perPage);

        return $this->respond(
            JournalResource::collection($journals->items())->resolve(),
            '',
            200,
            [
                'current_page' => $journals->currentPage(),
                'per_page'     => $journals->perPage(),
                'total'        => $journals->total(),
                'last_page'    => $journals->lastPage(),
            ]
        );
    }

    public function store(StoreJournalRequest $request): JsonResponse
    {
        $journal = $this->journalService->store(
            $request->validated(),
            $request->user()->org_id,
            $request->user()
        );

        return $this->respondCreated(
            new JournalResource($journal->load(['lines.account', 'period', 'fiscalYear'])),
            'Journal entry created.'
        );
    }

    public function show(Request $request, Journal $journal): JsonResponse
    {
        abort_unless($journal->org_id === $request->user()->org_id, 404);

        return $this->respond(
            new JournalResource($journal->load(['lines.account', 'period', 'fiscalYear']))
        );
    }

    public function post(Request $request, Journal $journal): JsonResponse
    {
        abort_unless($journal->org_id === $request->user()->org_id, 404);
        abort_if($journal->is_posted, 422, 'Journal is already posted.');

        $posted = $this->journalService->post($journal, $request->user());

        return $this->respond(
            new JournalResource($posted->load(['lines.account', 'period', 'fiscalYear'])),
            'Journal posted.'
        );
    }

    public function reverse(Request $request, Journal $journal): JsonResponse
    {
        abort_unless($journal->org_id === $request->user()->org_id, 404);
        abort_unless($journal->is_posted, 422, 'Only posted journals can be reversed.');
        abort_if($journal->is_reversed, 422, 'Journal has already been reversed.');

        $reversed = $this->journalService->reverse($journal, $request->user());

        return $this->respondCreated(
            new JournalResource($reversed->load(['lines.account', 'period', 'fiscalYear'])),
            'Journal reversed.'
        );
    }

    public function destroy(Request $request, Journal $journal): JsonResponse
    {
        abort_unless($journal->org_id === $request->user()->org_id, 404);
        abort_if($journal->is_posted, 422, 'Cannot delete a posted journal.');

        $journal->delete();

        return $this->respond(null, 'Journal deleted.');
    }

    public function ledger(Request $request): JsonResponse
    {
        $orgId     = $request->user()->org_id;
        $accountId = $request->query('account_id');

        abort_unless($accountId, 422, 'account_id is required.');

        $account = ChartOfAccount::where('org_id', $orgId)->findOrFail($accountId);

        $query = JournalLine::query()
            ->where('journal_lines.org_id', $orgId)
            ->where('journal_lines.account_id', $accountId)
            ->join('journals', 'journal_lines.journal_id', '=', 'journals.id')
            ->where('journals.is_posted', true)
            ->select('journal_lines.*', 'journals.reference_number', 'journals.journal_date', 'journals.narration as journal_narration')
            ->with('account');

        if ($from = $request->query('from_date')) {
            $query->whereDate('journals.journal_date', '>=', $from);
        }
        if ($to = $request->query('to_date')) {
            $query->whereDate('journals.journal_date', '<=', $to);
        }

        $lines = $query->orderBy('journals.journal_date')->orderBy('journals.created_at')->get();

        $runningBalance = '0.00';
        $ledgerLines = $lines->map(function ($line) use (&$runningBalance) {
            $runningBalance = bcadd(
                bcsub($runningBalance, (string) $line->credit, 2),
                (string) $line->debit,
                2
            );

            return [
                'journal_line_id'    => $line->id,
                'journal_id'         => $line->journal_id,
                'reference_number'   => $line->reference_number,
                'journal_date'       => $line->journal_date,
                'narration'          => $line->narration ?? $line->journal_narration,
                'debit'              => $line->debit,
                'credit'             => $line->credit,
                'running_balance'    => $runningBalance,
            ];
        });

        return $this->respond([
            'account' => [
                'id'   => $account->id,
                'code' => $account->code,
                'name' => $account->name,
            ],
            'lines'   => $ledgerLines,
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Api\V1\Loan\DisburseRequest;
use App\Http\Requests\Api\V1\Loan\StoreLoanRequest;
use App\Http\Resources\V1\LoanResource;
use App\Models\Loan;
use App\Services\LoanService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LoanController extends ApiController
{
    public function __construct(private LoanService $loanService) {}

    public function index(Request $request): JsonResponse
    {
        $query = Loan::query()
            ->where('org_id', $request->user()->org_id)
            ->with(['member', 'loanProduct']);

        if ($status = $request->query('loan_status')) {
            $query->where('loan_status', $status);
        }

        if ($memberId = $request->query('member_id')) {
            $query->where('member_id', $memberId);
        }

        if ($search = $request->query('search')) {
            $term = strtolower($search);
            $query->where(function ($q) use ($term) {
                $q->whereRaw('LOWER(account_number) LIKE ?', ["%{$term}%"])
                  ->orWhereHas('member', fn ($mq) =>
                      $mq->whereRaw('LOWER(full_name) LIKE ?', ["%{$term}%"])
                         ->orWhereRaw('LOWER(member_number) LIKE ?', ["%{$term}%"])
                  );
            });
        }

        $perPage = min((int) $request->query('per_page', 20), 100);
        $loans   = $query->orderByDesc('applied_at')->paginate($perPage);

        return $this->respond(
            LoanResource::collection($loans->items())->resolve(),
            '',
            200,
            [
                'current_page' => $loans->currentPage(),
                'per_page'     => $loans->perPage(),
                'total'        => $loans->total(),
                'last_page'    => $loans->lastPage(),
            ]
        );
    }

    public function store(StoreLoanRequest $request): JsonResponse
    {
        $loan = $this->loanService->store(
            $request->validated(),
            $request->user()->org_id,
            $request->user()
        );

        return $this->respondCreated(
            new LoanResource($loan),
            'Loan application submitted.'
        );
    }

    public function show(Request $request, Loan $loan): JsonResponse
    {
        abort_unless($loan->org_id === $request->user()->org_id, 404);

        $loan->load(['member', 'loanProduct', 'disburseAccount', 'guarantees.member', 'collaterals', 'repayments', 'notes']);

        return $this->respond(new LoanResource($loan));
    }

    public function approve(Request $request, Loan $loan): JsonResponse
    {
        abort_unless($loan->org_id === $request->user()->org_id, 404);
        abort_if($loan->approval_status !== 'pending', 422, 'Loan is not pending approval.');

        $this->loanService->approve($loan, $request->user());

        return $this->respond(
            new LoanResource($loan->fresh()->load(['member', 'loanProduct', 'guarantees.member', 'collaterals', 'repayments', 'notes'])),
            'Loan approved.'
        );
    }

    public function reject(Request $request, Loan $loan): JsonResponse
    {
        abort_unless($loan->org_id === $request->user()->org_id, 404);
        abort_if($loan->approval_status !== 'pending', 422, 'Loan is not pending approval.');

        $request->validate(['reason' => 'required|string|max:1000']);

        $this->loanService->reject($loan, $request->input('reason'), $request->user());

        return $this->respond(
            new LoanResource($loan->fresh()->load(['member', 'loanProduct', 'guarantees.member', 'collaterals', 'repayments', 'notes'])),
            'Loan rejected.'
        );
    }

    public function disburse(DisburseRequest $request, Loan $loan): JsonResponse
    {
        abort_unless($loan->org_id === $request->user()->org_id, 404);
        abort_if($loan->loan_status !== 'approved', 422, 'Loan must be approved before disbursement.');

        $loan = $this->loanService->disburse($loan, $request->validated(), $request->user());

        return $this->respond(
            new LoanResource($loan),
            'Loan disbursed successfully.'
        );
    }

    public function markDefaulted(Request $request, Loan $loan): JsonResponse
    {
        abort_unless($loan->org_id === $request->user()->org_id, 404);
        abort_if(!in_array($loan->loan_status, ['active', 'disbursed'], true), 422, 'Only active loans can be marked as defaulted.');

        $this->loanService->markDefaulted($loan, $request->user());

        return $this->respond(
            new LoanResource($loan->fresh()->load(['member', 'loanProduct'])),
            'Loan marked as defaulted.'
        );
    }

    public function addNote(Request $request, Loan $loan): JsonResponse
    {
        abort_unless($loan->org_id === $request->user()->org_id, 404);
        $request->validate(['note' => 'required|string|max:2000']);

        $this->loanService->addNote($loan, $request->input('note'), $request->user());

        return $this->respond(
            new LoanResource($loan->fresh()->load(['member', 'loanProduct', 'guarantees.member', 'collaterals', 'repayments', 'notes'])),
            'Note added.'
        );
    }

    public function addGuarantor(Request $request, Loan $loan): JsonResponse
    {
        abort_unless($loan->org_id === $request->user()->org_id, 404);

        $request->validate([
            'member_id'         => ['required', 'uuid', 'exists:members,id'],
            'guaranteed_amount' => ['required', 'numeric', 'min:0'],
        ]);

        $guarantee = $this->loanService->addGuarantor(
            $loan,
            $request->only('member_id', 'guaranteed_amount'),
            $request->user()->org_id
        );

        return $this->respondCreated([
            'id'               => $guarantee->id,
            'member'           => $guarantee->member ? [
                'id'            => $guarantee->member->id,
                'full_name'     => $guarantee->member->full_name,
                'member_number' => $guarantee->member->member_number,
            ] : null,
            'guaranteed_amount' => $guarantee->guaranteed_amount,
            'is_accepted'       => $guarantee->is_accepted,
            'is_active'         => $guarantee->is_active,
            'approval_status'   => $guarantee->approval_status,
        ], 'Guarantor added.');
    }

    public function destroy(Request $request, Loan $loan): JsonResponse
    {
        abort_unless($loan->org_id === $request->user()->org_id, 404);
        abort_if(!in_array($loan->loan_status, ['draft', 'applied', 'rejected'], true), 422, 'Only draft/applied/rejected loans can be archived.');

        $loan->delete();

        return $this->respond(null, 'Loan archived.');
    }
}

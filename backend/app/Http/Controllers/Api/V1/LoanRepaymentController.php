<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Api\V1\Loan\RecordRepaymentRequest;
use App\Http\Resources\V1\LoanRepaymentResource;
use App\Models\Loan;
use App\Models\LoanRepayment;
use App\Services\LoanService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LoanRepaymentController extends ApiController
{
    public function __construct(private LoanService $loanService) {}

    public function index(Request $request): JsonResponse
    {
        $orgId  = $request->user()->org_id;
        $loanId = $request->query('loan_id');

        $query = LoanRepayment::query()
            ->whereHas('loan', fn ($q) => $q->where('org_id', $orgId));

        if ($loanId) {
            $query->where('loan_id', $loanId);
        }

        $repayments = $query->orderBy('due_date')->get();

        return $this->respond(
            LoanRepaymentResource::collection($repayments)->resolve()
        );
    }

    public function store(RecordRepaymentRequest $request, Loan $loan, LoanRepayment $repayment): JsonResponse
    {
        abort_unless($loan->org_id === $request->user()->org_id, 404);
        abort_unless($repayment->loan_id === $loan->id, 404);
        abort_if($repayment->repayment_status === 'paid', 422, 'This instalment is already fully paid.');
        abort_if(!in_array($loan->loan_status, ['active', 'disbursed'], true), 422, 'Loan is not active.');

        $schedule = $this->loanService->recordRepayment(
            $loan,
            $repayment,
            $request->validated(),
            $request->user()
        );

        return $this->respondCreated(
            new LoanRepaymentResource($schedule),
            'Repayment recorded.'
        );
    }
}

<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Api\V1\Contribution\GenerateContributionsRequest;
use App\Http\Requests\Api\V1\Contribution\RecordContributionPaymentRequest;
use App\Http\Resources\V1\ContributionResource;
use App\Models\Contribution;
use App\Services\ContributionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContributionController extends ApiController
{
    public function __construct(private ContributionService $contributionService) {}

    public function index(Request $request): JsonResponse
    {
        $query = Contribution::query()
            ->where('org_id', $request->user()->org_id)
            ->with(['member', 'depositAccount', 'period']);

        if ($periodId = $request->query('period_id')) {
            $query->where('period_id', $periodId);
        }

        if ($memberId = $request->query('member_id')) {
            $query->where('member_id', $memberId);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->query('search')) {
            $term = strtolower($search);
            $query->whereHas('member', fn ($q) =>
                $q->whereRaw('LOWER(full_name) LIKE ?', ["%{$term}%"])
                  ->orWhereRaw('LOWER(member_number) LIKE ?', ["%{$term}%"])
            );
        }

        $perPage       = min((int) $request->query('per_page', 50), 200);
        $contributions = $query->orderBy('due_date')->paginate($perPage);

        return $this->respond(
            ContributionResource::collection($contributions->items())->resolve(),
            '',
            200,
            [
                'current_page' => $contributions->currentPage(),
                'per_page'     => $contributions->perPage(),
                'total'        => $contributions->total(),
                'last_page'    => $contributions->lastPage(),
            ]
        );
    }

    public function show(Request $request, Contribution $contribution): JsonResponse
    {
        abort_unless($contribution->org_id === $request->user()->org_id, 404);

        return $this->respond(
            new ContributionResource($contribution->load(['member', 'depositAccount', 'period']))
        );
    }

    public function generate(GenerateContributionsRequest $request): JsonResponse
    {
        $count = $this->contributionService->generateForPeriod(
            $request->user()->org_id,
            $request->validated('period_id'),
            $request->validated('expected_amount')
        );

        return $this->respondCreated(
            ['generated' => $count],
            "{$count} contribution record(s) generated."
        );
    }

    public function pay(RecordContributionPaymentRequest $request, Contribution $contribution): JsonResponse
    {
        abort_unless($contribution->org_id === $request->user()->org_id, 404);
        abort_if($contribution->status === 'paid', 422, 'Contribution is already fully paid.');
        abort_if($contribution->status === 'waived', 422, 'Contribution has been waived.');

        $updated = $this->contributionService->recordPayment(
            $contribution,
            (string) $request->validated('amount'),
            $request->validated('paid_date'),
            $request->user()
        );

        return $this->respondCreated(
            new ContributionResource($updated->load(['member', 'depositAccount', 'period'])),
            'Payment recorded.'
        );
    }

    public function waive(Request $request, Contribution $contribution): JsonResponse
    {
        abort_unless($contribution->org_id === $request->user()->org_id, 404);
        abort_if(in_array($contribution->status, ['paid', 'waived'], true), 422, 'Cannot waive a paid or already waived contribution.');

        $this->contributionService->waive($contribution);

        return $this->respond(
            new ContributionResource($contribution->fresh()->load(['member', 'depositAccount', 'period'])),
            'Contribution waived.'
        );
    }
}

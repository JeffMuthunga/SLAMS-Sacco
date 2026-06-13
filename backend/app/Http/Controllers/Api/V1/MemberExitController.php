<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Api\V1\MemberExit\RejectMemberExitRequest;
use App\Http\Requests\Api\V1\MemberExit\StoreMemberExitRequest;
use App\Http\Resources\V1\MemberExitResource;
use App\Models\MemberExit;
use App\Services\MemberExitService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MemberExitController extends ApiController
{
    public function __construct(private MemberExitService $service) {}

    public function index(Request $request): JsonResponse
    {
        $query = MemberExit::where('org_id', $request->user()->org_id)
            ->with(['member', 'requestedBy', 'approvedBy', 'rejectedBy']);

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($memberId = $request->query('member_id')) {
            $query->where('member_id', $memberId);
        }

        $perPage = min((int) $request->query('per_page', 50), 200);
        $exits   = $query->orderByDesc('created_at')->paginate($perPage);

        return $this->respond(
            MemberExitResource::collection($exits->items())->resolve(),
            '',
            200,
            [
                'current_page' => $exits->currentPage(),
                'per_page'     => $exits->perPage(),
                'total'        => $exits->total(),
                'last_page'    => $exits->lastPage(),
            ]
        );
    }

    public function store(StoreMemberExitRequest $request): JsonResponse
    {
        try {
            $exit = $this->service->create(
                $request->validated(),
                $request->user()->org_id,
                $request->user()
            );
            return $this->respondCreated(new MemberExitResource($exit->load(['member', 'requestedBy'])));
        } catch (\RuntimeException $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    public function show(Request $request, MemberExit $memberExit): JsonResponse
    {
        if ($memberExit->org_id !== $request->user()->org_id) {
            return $this->respondError('Not found.', 404);
        }
        return $this->respond(
            new MemberExitResource($memberExit->load(['member', 'requestedBy', 'approvedBy', 'rejectedBy']))
        );
    }

    public function approve(Request $request, MemberExit $memberExit): JsonResponse
    {
        if ($memberExit->org_id !== $request->user()->org_id) {
            return $this->respondError('Not found.', 404);
        }
        try {
            $exit = $this->service->approve($memberExit, $request->user());
            return $this->respond(new MemberExitResource($exit), 'Exit request approved.');
        } catch (\RuntimeException $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    public function reject(RejectMemberExitRequest $request, MemberExit $memberExit): JsonResponse
    {
        if ($memberExit->org_id !== $request->user()->org_id) {
            return $this->respondError('Not found.', 404);
        }
        try {
            $exit = $this->service->reject($memberExit, $request->user(), $request->validated()['rejection_reason']);
            return $this->respond(new MemberExitResource($exit), 'Exit request rejected.');
        } catch (\RuntimeException $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }
}

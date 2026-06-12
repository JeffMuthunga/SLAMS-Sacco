<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Api\V1\PettyCash\StoreRequestRequest;
use App\Http\Resources\V1\PettyCashRequestResource;
use App\Models\PettyCashRequest;
use App\Services\PettyCashService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PettyCashRequestController extends ApiController
{
    public function __construct(private PettyCashService $service) {}

    public function index(Request $request): JsonResponse
    {
        $query = PettyCashRequest::where('org_id', $request->user()->org_id)
            ->with(['allocation', 'item', 'requestedBy']);

        if ($allocationId = $request->query('allocation_id')) {
            $query->where('allocation_id', $allocationId);
        }
        if ($status = $request->query('approval_status')) {
            $query->where('approval_status', $status);
        }
        if ($userId = $request->query('requested_by')) {
            $query->where('requested_by', $userId);
        }

        $perPage  = min((int) $request->query('per_page', 50), 200);
        $requests = $query->orderByDesc('expense_date')->paginate($perPage);

        return $this->respond(
            PettyCashRequestResource::collection($requests->items())->resolve(),
            '',
            200,
            [
                'current_page' => $requests->currentPage(),
                'per_page'     => $requests->perPage(),
                'total'        => $requests->total(),
                'last_page'    => $requests->lastPage(),
            ]
        );
    }

    public function store(StoreRequestRequest $request): JsonResponse
    {
        $pcRequest = $this->service->createRequest(
            $request->validated(),
            $request->user()->org_id,
            $request->user()
        );

        return $this->respondCreated(
            new PettyCashRequestResource($pcRequest->load(['allocation', 'item', 'requestedBy'])),
            'Request created.'
        );
    }

    public function show(Request $request, PettyCashRequest $pettyCashRequest): JsonResponse
    {
        abort_unless($pettyCashRequest->org_id === $request->user()->org_id, 404);

        return $this->respond(
            new PettyCashRequestResource($pettyCashRequest->load(['allocation', 'item', 'requestedBy']))
        );
    }

    public function approve(Request $request, PettyCashRequest $pettyCashRequest): JsonResponse
    {
        abort_unless($pettyCashRequest->org_id === $request->user()->org_id, 404);
        abort_if(
            in_array($pettyCashRequest->approval_status, ['approved', 'rejected'], true),
            422,
            'Request is already ' . $pettyCashRequest->approval_status . '.'
        );

        $updated = $this->service->approveRequest($pettyCashRequest, $request->user());

        return $this->respond(
            new PettyCashRequestResource($updated->fresh()->load(['allocation', 'item', 'requestedBy'])),
            'Request approved.'
        );
    }

    public function reject(Request $request, PettyCashRequest $pettyCashRequest): JsonResponse
    {
        abort_unless($pettyCashRequest->org_id === $request->user()->org_id, 404);
        abort_if(
            in_array($pettyCashRequest->approval_status, ['approved', 'rejected'], true),
            422,
            'Request is already ' . $pettyCashRequest->approval_status . '.'
        );

        $updated = $this->service->rejectRequest($pettyCashRequest, $request->user());

        return $this->respond(
            new PettyCashRequestResource($updated->load(['allocation', 'item', 'requestedBy'])),
            'Request rejected.'
        );
    }

    public function destroy(Request $request, PettyCashRequest $pettyCashRequest): JsonResponse
    {
        abort_unless($pettyCashRequest->org_id === $request->user()->org_id, 404);
        abort_if($pettyCashRequest->approval_status === 'approved', 422, 'Cannot delete an approved request.');

        $pettyCashRequest->delete();

        return $this->respond(null, 'Request deleted.');
    }
}

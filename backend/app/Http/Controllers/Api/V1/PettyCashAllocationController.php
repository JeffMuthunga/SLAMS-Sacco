<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Api\V1\PettyCash\StoreAllocationRequest;
use App\Http\Resources\V1\PettyCashAllocationResource;
use App\Models\PettyCashAllocation;
use App\Services\PettyCashService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PettyCashAllocationController extends ApiController
{
    public function __construct(private PettyCashService $service) {}

    public function index(Request $request): JsonResponse
    {
        $query = PettyCashAllocation::where('org_id', $request->user()->org_id)
            ->with(['period', 'allocatedTo']);

        if ($periodId = $request->query('period_id')) {
            $query->where('period_id', $periodId);
        }
        if ($status = $request->query('approval_status')) {
            $query->where('approval_status', $status);
        }

        $perPage      = min((int) $request->query('per_page', 50), 200);
        $allocations  = $query->orderByDesc('created_at')->paginate($perPage);

        return $this->respond(
            PettyCashAllocationResource::collection($allocations->items())->resolve(),
            '',
            200,
            [
                'current_page' => $allocations->currentPage(),
                'per_page'     => $allocations->perPage(),
                'total'        => $allocations->total(),
                'last_page'    => $allocations->lastPage(),
            ]
        );
    }

    public function store(StoreAllocationRequest $request): JsonResponse
    {
        $allocation = $this->service->createAllocation($request->validated(), $request->user()->org_id);

        return $this->respondCreated(
            new PettyCashAllocationResource($allocation->load(['period', 'allocatedTo'])),
            'Allocation created.'
        );
    }

    public function show(Request $request, PettyCashAllocation $pettyCashAllocation): JsonResponse
    {
        abort_unless($pettyCashAllocation->org_id === $request->user()->org_id, 404);

        return $this->respond(
            new PettyCashAllocationResource($pettyCashAllocation->load(['period', 'allocatedTo']))
        );
    }

    public function approve(Request $request, PettyCashAllocation $pettyCashAllocation): JsonResponse
    {
        abort_unless($pettyCashAllocation->org_id === $request->user()->org_id, 404);
        abort_if(
            in_array($pettyCashAllocation->approval_status, ['approved', 'rejected'], true),
            422,
            'Allocation is already ' . $pettyCashAllocation->approval_status . '.'
        );

        $updated = $this->service->approveAllocation($pettyCashAllocation, $request->user());

        return $this->respond(
            new PettyCashAllocationResource($updated->load(['period', 'allocatedTo'])),
            'Allocation approved.'
        );
    }

    public function reject(Request $request, PettyCashAllocation $pettyCashAllocation): JsonResponse
    {
        abort_unless($pettyCashAllocation->org_id === $request->user()->org_id, 404);
        abort_if(
            in_array($pettyCashAllocation->approval_status, ['approved', 'rejected'], true),
            422,
            'Allocation is already ' . $pettyCashAllocation->approval_status . '.'
        );

        $updated = $this->service->rejectAllocation($pettyCashAllocation, $request->user());

        return $this->respond(
            new PettyCashAllocationResource($updated->load(['period', 'allocatedTo'])),
            'Allocation rejected.'
        );
    }

    public function destroy(Request $request, PettyCashAllocation $pettyCashAllocation): JsonResponse
    {
        abort_unless($pettyCashAllocation->org_id === $request->user()->org_id, 404);
        abort_if($pettyCashAllocation->approval_status === 'approved', 422, 'Cannot delete an approved allocation.');

        $pettyCashAllocation->delete();

        return $this->respond(null, 'Allocation deleted.');
    }
}

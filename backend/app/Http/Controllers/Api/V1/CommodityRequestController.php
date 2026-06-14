<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\V1\CommodityRequestResource;
use App\Models\CommodityRequest;
use App\Models\Member;
use App\Services\CommodityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommodityRequestController extends ApiController
{
    public function __construct(private CommodityService $commodityService) {}

    public function index(Request $request): JsonResponse
    {
        $query = CommodityRequest::where('org_id', $request->user()->org_id)
            ->with(['member', 'items.commodity'])
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('member_id')) {
            $query->where('member_id', $request->member_id);
        }

        $results = $query->paginate($request->integer('per_page', 25));

        return $this->respond(
            CommodityRequestResource::collection($results)->response()->getData(true)
        );
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $req = CommodityRequest::where('org_id', $request->user()->org_id)
            ->with(['member', 'items.commodity'])
            ->findOrFail($id);

        return $this->respond(new CommodityRequestResource($req));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'member_id'                => ['required', 'uuid', 'exists:members,id'],
            'items'                    => ['required', 'array', 'min:1'],
            'items.*.commodity_id'     => ['required', 'uuid', 'exists:commodities,id'],
            'items.*.quantity'         => ['required', 'integer', 'min:1'],
            'repayment_period'         => ['nullable', 'integer', 'min:1'],
        ]);

        $member = Member::where('org_id', $request->user()->org_id)->findOrFail($data['member_id']);
        $req    = $this->commodityService->createRequest(
            $member,
            $data['items'],
            $data['repayment_period'] ?? null,
            $request->user()->org_id
        );

        return $this->respondCreated(new CommodityRequestResource($req), 'Commodity request created.');
    }

    public function approve(Request $request, string $id): JsonResponse
    {
        $req = CommodityRequest::where('org_id', $request->user()->org_id)->findOrFail($id);
        $req = $this->commodityService->approve($req, $request->user());

        return $this->respond(new CommodityRequestResource($req), 'Request approved.');
    }

    public function reject(Request $request, string $id): JsonResponse
    {
        $data = $request->validate(['reason' => ['required', 'string', 'max:500']]);
        $req  = CommodityRequest::where('org_id', $request->user()->org_id)->findOrFail($id);
        $req  = $this->commodityService->reject($req, $data['reason']);

        return $this->respond(new CommodityRequestResource($req), 'Request rejected.');
    }

    public function issue(Request $request, string $id): JsonResponse
    {
        $req = CommodityRequest::where('org_id', $request->user()->org_id)
            ->with('items')
            ->findOrFail($id);
        $req = $this->commodityService->issue($req);

        return $this->respond(new CommodityRequestResource($req), 'Items issued.');
    }

    public function markRepaid(Request $request, string $id): JsonResponse
    {
        $req = CommodityRequest::where('org_id', $request->user()->org_id)->findOrFail($id);
        $req = $this->commodityService->markRepaid($req);

        return $this->respond(new CommodityRequestResource($req), 'Marked as repaid.');
    }
}

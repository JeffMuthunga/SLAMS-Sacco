<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\V1\MemberShareResource;
use App\Models\Member;
use App\Models\MemberShare;
use App\Services\ShareService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MemberShareController extends ApiController
{
    public function __construct(private ShareService $shareService) {}

    public function index(Request $request): JsonResponse
    {
        $query = MemberShare::where('org_id', $request->user()->org_id)
            ->with(['member', 'shareProduct', 'depositAccount'])
            ->latest();

        if ($request->filled('member_id')) {
            $query->where('member_id', $request->member_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $shares = $query->paginate($request->integer('per_page', 25));

        return $this->respond(
            MemberShareResource::collection($shares)->response()->getData(true)
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'member_id'        => ['required', 'uuid', 'exists:members,id'],
            'share_product_id' => ['required', 'uuid', 'exists:share_products,id'],
            'deposit_account_id' => ['nullable', 'uuid', 'exists:deposit_accounts,id'],
            'quantity'         => ['required', 'integer', 'min:1'],
            'purchase_date'    => ['nullable', 'date'],
            'notes'            => ['nullable', 'string', 'max:500'],
        ]);

        $member = Member::where('org_id', $request->user()->org_id)->findOrFail($data['member_id']);
        $share  = $this->shareService->purchaseShares($member, $data, $request->user()->org_id);
        $share->load(['member', 'shareProduct', 'depositAccount']);

        return $this->respondCreated(new MemberShareResource($share), 'Share purchase recorded.');
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $share = MemberShare::where('org_id', $request->user()->org_id)
            ->with(['member', 'shareProduct', 'depositAccount'])
            ->findOrFail($id);

        return $this->respond(new MemberShareResource($share));
    }

    public function approve(Request $request, string $id): JsonResponse
    {
        $share = MemberShare::where('org_id', $request->user()->org_id)->findOrFail($id);
        $share = $this->shareService->approve($share, $request->user());

        return $this->respond(new MemberShareResource($share), 'Share purchase approved.');
    }

    public function reject(Request $request, string $id): JsonResponse
    {
        $data  = $request->validate(['reason' => ['required', 'string', 'max:500']]);
        $share = MemberShare::where('org_id', $request->user()->org_id)->findOrFail($id);
        $share = $this->shareService->reject($share, $data['reason']);

        return $this->respond(new MemberShareResource($share), 'Share purchase rejected.');
    }
}

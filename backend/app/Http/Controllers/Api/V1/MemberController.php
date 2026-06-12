<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Api\V1\Member\StoreMemberRequest;
use App\Http\Requests\Api\V1\Member\UpdateMemberRequest;
use App\Http\Resources\V1\MemberResource;
use App\Models\Member;
use App\Services\MemberService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MemberController extends ApiController
{
    public function __construct(private MemberService $memberService) {}

    public function index(Request $request): JsonResponse
    {
        $query = Member::query()
            ->where('org_id', $request->user()->org_id)
            ->with('kins');

        if ($search = $request->query('search')) {
            $term = strtolower($search);
            $query->where(function ($q) use ($term) {
                $q->whereRaw('LOWER(full_name) LIKE ?', ["%{$term}%"])
                  ->orWhereRaw('LOWER(member_number) LIKE ?', ["%{$term}%"])
                  ->orWhereRaw('LOWER(id_number) LIKE ?', ["%{$term}%"]);
            });
        }

        if ($status = $request->query('status')) {
            $query->where('approval_status', $status);
        }

        $perPage = min((int) $request->query('per_page', 20), 100);
        $members = $query->orderByDesc('created_at')->paginate($perPage);

        return $this->respond(
            MemberResource::collection($members->items())->resolve(),
            '',
            200,
            [
                'current_page' => $members->currentPage(),
                'per_page'     => $members->perPage(),
                'total'        => $members->total(),
                'last_page'    => $members->lastPage(),
            ]
        );
    }

    public function store(StoreMemberRequest $request): JsonResponse
    {
        $member = $this->memberService->store(
            $request->validated(),
            $request->user()->org_id
        );

        return $this->respondCreated(new MemberResource($member), 'Member created successfully.');
    }

    public function show(Request $request, Member $member): JsonResponse
    {
        abort_unless($member->org_id === $request->user()->org_id, 404);

        return $this->respond(new MemberResource($member->load('kins')));
    }

    public function update(UpdateMemberRequest $request, Member $member): JsonResponse
    {
        abort_unless($member->org_id === $request->user()->org_id, 404);

        $member = $this->memberService->update($member, $request->validated());

        return $this->respond(new MemberResource($member), 'Member updated successfully.');
    }

    public function destroy(Request $request, Member $member): JsonResponse
    {
        abort_unless($member->org_id === $request->user()->org_id, 404);

        $member->delete();

        return $this->respond(null, 'Member archived successfully.');
    }

    public function archived(Request $request): JsonResponse
    {
        $query = Member::onlyTrashed()
            ->where('org_id', $request->user()->org_id);

        if ($search = $request->query('search')) {
            $term = strtolower($search);
            $query->where(function ($q) use ($term) {
                $q->whereRaw('LOWER(full_name) LIKE ?', ["%{$term}%"])
                  ->orWhereRaw('LOWER(member_number) LIKE ?', ["%{$term}%"])
                  ->orWhereRaw('LOWER(id_number) LIKE ?', ["%{$term}%"]);
            });
        }

        $perPage = min((int) $request->query('per_page', 20), 100);
        $members = $query->orderByDesc('deleted_at')->paginate($perPage);

        return $this->respond(
            MemberResource::collection($members->items())->resolve(),
            '',
            200,
            [
                'current_page' => $members->currentPage(),
                'per_page'     => $members->perPage(),
                'total'        => $members->total(),
                'last_page'    => $members->lastPage(),
            ]
        );
    }

    public function restore(Request $request, string $member): JsonResponse
    {
        $found = Member::onlyTrashed()
            ->where('org_id', $request->user()->org_id)
            ->findOrFail($member);

        $found->restore();

        return $this->respond(
            new MemberResource($found->fresh()->load('kins')),
            'Member restored successfully.'
        );
    }

    public function approve(Request $request, Member $member): JsonResponse
    {
        abort_unless($member->org_id === $request->user()->org_id, 404);
        abort_if($member->approval_status !== 'pending', 422, 'Member is not pending approval.');

        $this->memberService->approve($member, $request->user());

        return $this->respond(
            new MemberResource($member->fresh()->load('kins')),
            'Member approved.'
        );
    }

    public function reject(Request $request, Member $member): JsonResponse
    {
        abort_unless($member->org_id === $request->user()->org_id, 404);
        abort_if($member->approval_status !== 'pending', 422, 'Member is not pending approval.');

        $request->validate(['reason' => 'required|string|max:500']);

        $this->memberService->reject($member, $request->input('reason'), $request->user());

        return $this->respond(
            new MemberResource($member->fresh()->load('kins')),
            'Member rejected.'
        );
    }

    public function uploadPhoto(Request $request, Member $member): JsonResponse
    {
        abort_unless($member->org_id === $request->user()->org_id, 404);

        $request->validate(['photo' => 'required|image|max:2048']);

        $this->memberService->storePhoto($member, $request->file('photo'));

        return $this->respond(
            new MemberResource($member->fresh()->load('kins')),
            'Photo uploaded.'
        );
    }
}

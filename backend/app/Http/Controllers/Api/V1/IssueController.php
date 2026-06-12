<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Api\V1\Issue\StoreIssueRequest;
use App\Http\Requests\Api\V1\Issue\UpdateIssueRequest;
use App\Http\Resources\V1\IssueCommentResource;
use App\Http\Resources\V1\IssueResource;
use App\Models\Issue;
use App\Services\IssueService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IssueController extends ApiController
{
    public function __construct(private IssueService $issueService) {}

    public function index(Request $request): JsonResponse
    {
        $query = Issue::where('org_id', $request->user()->org_id)
            ->with(['category', 'member', 'reporter', 'assignee']);

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($priority = $request->query('priority')) {
            $query->where('priority', $priority);
        }
        if ($categoryId = $request->query('category_id')) {
            $query->where('category_id', $categoryId);
        }
        if ($memberId = $request->query('member_id')) {
            $query->where('member_id', $memberId);
        }
        if ($assignedTo = $request->query('assigned_to')) {
            $query->where('assigned_to', $assignedTo);
        }
        if ($search = $request->query('search')) {
            $term = strtolower($search);
            $query->where(function ($q) use ($term) {
                $q->whereRaw('LOWER(title) LIKE ?', ["%{$term}%"])
                  ->orWhereRaw('LOWER(reference_number) LIKE ?', ["%{$term}%"]);
            });
        }

        $perPage = min((int) $request->query('per_page', 50), 200);
        $issues  = $query->orderByRaw("CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END")
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return $this->respond(
            IssueResource::collection($issues->items())->resolve(),
            '',
            200,
            [
                'current_page' => $issues->currentPage(),
                'per_page'     => $issues->perPage(),
                'total'        => $issues->total(),
                'last_page'    => $issues->lastPage(),
            ]
        );
    }

    public function store(StoreIssueRequest $request): JsonResponse
    {
        $issue = $this->issueService->create(
            $request->validated(),
            $request->user()->org_id,
            $request->user()
        );

        return $this->respondCreated(
            new IssueResource($issue->load(['category', 'member', 'reporter', 'assignee'])),
            'Issue created.'
        );
    }

    public function show(Request $request, Issue $issue): JsonResponse
    {
        abort_unless($issue->org_id === $request->user()->org_id, 404);

        return $this->respond(
            new IssueResource($issue->load(['category', 'member', 'reporter', 'assignee', 'comments.user']))
        );
    }

    public function update(UpdateIssueRequest $request, Issue $issue): JsonResponse
    {
        abort_unless($issue->org_id === $request->user()->org_id, 404);
        abort_if($issue->status === 'closed', 422, 'Cannot update a closed issue.');

        $updated = $this->issueService->update($issue, $request->validated());

        return $this->respond(
            new IssueResource($updated->load(['category', 'member', 'reporter', 'assignee', 'comments.user'])),
            'Issue updated.'
        );
    }

    public function addComment(Request $request, Issue $issue): JsonResponse
    {
        abort_unless($issue->org_id === $request->user()->org_id, 404);

        $request->validate(['body' => ['required', 'string', 'max:2000']]);

        $comment = $this->issueService->addComment($issue, $request->validated('body'), $request->user());

        return $this->respondCreated(
            new IssueCommentResource($comment->load('user')),
            'Comment added.'
        );
    }

    public function destroy(Request $request, Issue $issue): JsonResponse
    {
        abort_unless($issue->org_id === $request->user()->org_id, 404);
        abort_if($issue->status !== 'open', 422, 'Only open issues can be deleted.');

        $issue->delete();

        return $this->respond(null, 'Issue deleted.');
    }
}

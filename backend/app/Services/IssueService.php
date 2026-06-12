<?php

namespace App\Services;

use App\Models\Issue;
use App\Models\IssueComment;

class IssueService
{
    public function __construct(private NotificationService $notifications) {}

    public function generateReference(string $orgId): string
    {
        $prefix = 'ISSUE-' . now()->format('Ym') . '-';

        $last = Issue::where('org_id', $orgId)
            ->where('reference_number', 'like', $prefix . '%')
            ->orderByDesc('reference_number')
            ->first();

        $next = $last
            ? ((int) substr($last->reference_number, strlen($prefix))) + 1
            : 1;

        return $prefix . str_pad($next, 4, '0', STR_PAD_LEFT);
    }

    public function create(array $data, string $orgId, object $user): Issue
    {
        $issue = Issue::create([
            'org_id'           => $orgId,
            'reference_number' => $this->generateReference($orgId),
            'category_id'      => $data['category_id'],
            'member_id'        => $data['member_id'] ?? null,
            'reported_by'      => $user->id,
            'assigned_to'      => $data['assigned_to'] ?? null,
            'title'            => $data['title'],
            'description'      => $data['description'] ?? null,
            'priority'         => $data['priority'] ?? 'medium',
            'status'           => 'open',
        ]);

        $this->notifications->issueCreated($issue->load(['assignee', 'member']));

        return $issue;
    }

    public function update(Issue $issue, array $data): Issue
    {
        $updates = array_filter([
            'category_id' => $data['category_id'] ?? null,
            'assigned_to' => array_key_exists('assigned_to', $data) ? $data['assigned_to'] : $issue->assigned_to,
            'title'       => $data['title'] ?? null,
            'description' => array_key_exists('description', $data) ? $data['description'] : $issue->description,
            'priority'    => $data['priority'] ?? null,
        ], fn ($v) => $v !== null);

        if (isset($data['status']) && $data['status'] !== $issue->status) {
            $updates['status'] = $data['status'];
            if ($data['status'] === 'resolved') {
                $updates['resolved_at'] = now();
            }
            if ($data['status'] === 'closed') {
                $updates['closed_at'] = now();
            }
        }

        $wasResolved = isset($data['status']) && $data['status'] === 'resolved' && $issue->status !== 'resolved';

        $issue->update($updates);

        if ($wasResolved) {
            $this->notifications->issueResolved($issue->load('member'));
        }

        return $issue;
    }

    public function addComment(Issue $issue, string $body, object $user): IssueComment
    {
        return IssueComment::create([
            'issue_id' => $issue->id,
            'user_id'  => $user->id,
            'body'     => $body,
        ]);
    }
}

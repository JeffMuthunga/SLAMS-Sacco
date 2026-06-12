<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class IssueResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'org_id'           => $this->org_id,
            'reference_number' => $this->reference_number,
            'title'            => $this->title,
            'description'      => $this->description,
            'priority'         => $this->priority,
            'status'           => $this->status,
            'category_id'      => $this->category_id,
            'member_id'        => $this->member_id,
            'reported_by'      => $this->reported_by,
            'assigned_to'      => $this->assigned_to,
            'resolved_at'      => $this->resolved_at?->toIso8601String(),
            'closed_at'        => $this->closed_at?->toIso8601String(),
            'category'         => $this->whenLoaded('category', fn () => [
                'id'   => $this->category->id,
                'name' => $this->category->name,
            ]),
            'member'           => $this->whenLoaded('member', fn () => [
                'id'            => $this->member->id,
                'full_name'     => $this->member->full_name,
                'member_number' => $this->member->member_number,
            ]),
            'reporter'         => $this->whenLoaded('reporter', fn () => [
                'id'   => $this->reporter->id,
                'name' => $this->reporter->name,
            ]),
            'assignee'         => $this->whenLoaded('assignee', fn () => [
                'id'   => $this->assignee->id,
                'name' => $this->assignee->name,
            ]),
            'comments'         => IssueCommentResource::collection($this->whenLoaded('comments')),
            'created_at'       => $this->created_at?->toIso8601String(),
        ];
    }
}

<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MemberExitResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'org_id'           => $this->org_id,
            'reference_number' => $this->reference_number,
            'exit_type'        => $this->exit_type,
            'reason'           => $this->reason,
            'exit_date'        => $this->exit_date?->toDateString(),
            'status'           => $this->status,
            'rejection_reason' => $this->rejection_reason,
            'notes'            => $this->notes,
            'requested_at'     => $this->requested_at?->toIso8601String(),
            'approved_at'      => $this->approved_at?->toIso8601String(),
            'rejected_at'      => $this->rejected_at?->toIso8601String(),
            'member'           => $this->whenLoaded('member', fn () => [
                'id'            => $this->member->id,
                'full_name'     => $this->member->full_name,
                'member_number' => $this->member->member_number,
                'phone'         => $this->member->phone,
                'email'         => $this->member->email,
            ]),
            'requested_by'     => $this->whenLoaded('requestedBy', fn () => [
                'id'   => $this->requestedBy->id,
                'name' => $this->requestedBy->name,
            ]),
            'approved_by'      => $this->whenLoaded('approvedBy', fn () => [
                'id'   => $this->approvedBy->id,
                'name' => $this->approvedBy->name,
            ]),
            'rejected_by'      => $this->whenLoaded('rejectedBy', fn () => [
                'id'   => $this->rejectedBy->id,
                'name' => $this->rejectedBy->name,
            ]),
            'created_at'       => $this->created_at?->toIso8601String(),
        ];
    }
}

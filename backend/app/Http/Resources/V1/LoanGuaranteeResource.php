<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LoanGuaranteeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'loan_id'          => $this->loan_id,
            'member'           => $this->whenLoaded('member', fn () => [
                'id'            => $this->member->id,
                'full_name'     => $this->member->full_name,
                'member_number' => $this->member->member_number,
                'has_portal_account' => (bool) $this->member->user_id,
            ]),
            'guaranteed_amount'=> $this->guaranteed_amount,
            'is_accepted'      => $this->is_accepted,
            'accepted_at'      => $this->accepted_at?->toIso8601String(),
            'is_active'        => $this->is_active,
            'approval_status'  => $this->approval_status,
            'created_at'       => $this->created_at?->toIso8601String(),
        ];
    }
}

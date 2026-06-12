<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class MemberResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                 => $this->id,
            'user_id'            => $this->user_id,
            'member_number'      => $this->member_number,
            'full_name'          => $this->full_name,
            'title'              => $this->title,
            'id_number'          => $this->id_number,
            'id_type'            => $this->id_type,
            'email'              => $this->email,
            'phone'              => $this->phone,
            'phone2'             => $this->phone2,
            'date_of_birth'      => $this->date_of_birth?->toDateString(),
            'gender'             => $this->gender,
            'nationality'        => $this->nationality,
            'marital_status'     => $this->marital_status,
            'address'            => $this->address,
            'town'               => $this->town,
            'postal_code'        => $this->postal_code,
            'photo_url'          => $this->photo_path ? Storage::url($this->photo_path) : null,
            'employed'           => $this->employed,
            'self_employed'      => $this->self_employed,
            'employer_name'      => $this->employer_name,
            'monthly_salary'     => $this->monthly_salary,
            'monthly_net_income' => $this->monthly_net_income,
            'entry_date'         => $this->entry_date?->toDateString(),
            'is_active'          => $this->is_active,
            'approval_status'    => $this->approval_status,
            'approved_by'        => $this->approved_by,
            'approved_at'        => $this->approved_at?->toIso8601String(),
            'terminated_at'      => $this->terminated_at?->toIso8601String(),
            'termination_reason' => $this->termination_reason,
            'org_id'             => $this->org_id,
            'kins'               => MemberKinResource::collection($this->whenLoaded('kins')),
            'created_at'         => $this->created_at?->toIso8601String(),
        ];
    }
}

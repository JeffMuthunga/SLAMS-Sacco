<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MemberKinResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                   => $this->id,
            'full_name'            => $this->full_name,
            'relationship'         => $this->relationship,
            'date_of_birth'        => $this->date_of_birth?->toDateString(),
            'id_number'            => $this->id_number,
            'id_type'              => $this->id_type,
            'phone'                => $this->phone,
            'is_emergency_contact' => $this->is_emergency_contact,
            'is_beneficiary'       => $this->is_beneficiary,
            'beneficiary_percent'  => $this->beneficiary_percent,
        ];
    }
}

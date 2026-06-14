<?php

namespace App\Http\Resources\V1\Configurations;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class OrgResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'name'          => $this->name,
            'full_name'     => $this->full_name,
            'suffix'        => $this->suffix,
            'email'         => $this->email,
            'phone'         => $this->phone,
            'website'       => $this->website,
            'logo_url'       => $this->logo_path ? url(Storage::url($this->logo_path)) : null,
            'primary_color'  => $this->primary_color,
            'secondary_color' => $this->secondary_color,
            'address'        => $this->address,
            'town'          => $this->town,
            'country_code'  => $this->country_code,
            'currency_code' => $this->currency_code,
            'pin'           => $this->pin,
            'reg_number'    => $this->reg_number,
            'member_limit'  => $this->member_limit,
            'is_active'     => $this->is_active,
            'is_default'    => $this->is_default,
            'created_at'    => $this->created_at?->toIso8601String(),
            'updated_at'    => $this->updated_at?->toIso8601String(),
        ];
    }
}

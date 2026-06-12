<?php

namespace App\Http\Resources\V1\Configurations;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PeriodResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'fiscal_year_id' => $this->fiscal_year_id,
            'name'           => $this->name,
            'start_date'     => $this->start_date?->toDateString(),
            'end_date'       => $this->end_date?->toDateString(),
            'is_opened'      => $this->is_opened,
            'is_closed'      => $this->is_closed,
            'is_posted'      => $this->is_posted,
        ];
    }
}

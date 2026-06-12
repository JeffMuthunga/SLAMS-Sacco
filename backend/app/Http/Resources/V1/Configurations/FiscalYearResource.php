<?php

namespace App\Http\Resources\V1\Configurations;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FiscalYearResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'name'       => $this->name,
            'start_date' => $this->start_date?->toDateString(),
            'end_date'   => $this->end_date?->toDateString(),
            'is_opened'  => $this->is_opened,
            'is_closed'  => $this->is_closed,
            'closed_at'  => $this->closed_at?->toIso8601String(),
            'closed_by'  => $this->closed_by,
            'periods'    => PeriodResource::collection($this->whenLoaded('periods')),
        ];
    }
}

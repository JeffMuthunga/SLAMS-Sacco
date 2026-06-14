<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DividendRunResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'fiscal_year_id' => $this->fiscal_year_id,
            'fiscal_year'    => $this->whenLoaded('fiscalYear', fn () => [
                'id'          => $this->fiscalYear->id,
                'fiscal_year' => $this->fiscalYear->fiscal_year,
            ]),
            'rate'           => $this->rate,
            'status'         => $this->status,
            'total_dividend' => $this->total_dividend,
            'notes'          => $this->notes,
            'approved_by'    => $this->approved_by,
            'approved_at'    => $this->approved_at?->toIso8601String(),
            'posted_at'      => $this->posted_at?->toIso8601String(),
            'entries_count'  => $this->whenLoaded('entries', fn () => $this->entries->count()),
            'entries'        => DividendEntryResource::collection($this->whenLoaded('entries')),
            'created_at'     => $this->created_at?->toIso8601String(),
        ];
    }
}

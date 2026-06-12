<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class JournalResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'org_id'           => $this->org_id,
            'fiscal_year_id'   => $this->fiscal_year_id,
            'period_id'        => $this->period_id,
            'reference_number' => $this->reference_number,
            'journal_date'     => $this->journal_date?->toDateString(),
            'narration'        => $this->narration,
            'is_posted'        => $this->is_posted,
            'posted_at'        => $this->posted_at?->toIso8601String(),
            'is_reversed'      => $this->is_reversed,
            'reversed_at'      => $this->reversed_at?->toIso8601String(),
            'period'           => $this->whenLoaded('period', fn () => [
                'id'   => $this->period->id,
                'name' => $this->period->name,
            ]),
            'fiscal_year'      => $this->whenLoaded('fiscalYear', fn () => [
                'id'   => $this->fiscalYear->id,
                'name' => $this->fiscalYear->name,
            ]),
            'lines'            => JournalLineResource::collection($this->whenLoaded('lines')),
            'created_at'       => $this->created_at?->toIso8601String(),
        ];
    }
}

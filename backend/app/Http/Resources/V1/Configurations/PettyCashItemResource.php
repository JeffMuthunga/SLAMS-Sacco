<?php

namespace App\Http\Resources\V1\Configurations;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PettyCashItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'org_id'         => $this->org_id,
            'category_id'    => $this->category_id,
            'name'           => $this->name,
            'default_price'  => $this->default_price,
            'default_units'  => $this->default_units,
            'category'       => $this->whenLoaded('category', fn () => [
                'id'   => $this->category->id,
                'name' => $this->category->name,
            ]),
            'created_at'     => $this->created_at?->toIso8601String(),
        ];
    }
}

<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommodityResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'commodity_type_id' => $this->commodity_type_id,
            'commodity_type'    => $this->whenLoaded('commodityType', fn () => [
                'id'   => $this->commodityType->id,
                'name' => $this->commodityType->name,
            ]),
            'name'              => $this->name,
            'unit_price'        => $this->unit_price,
            'stock_quantity'    => $this->stock_quantity,
            'is_active'         => $this->is_active,
            'created_at'        => $this->created_at?->toIso8601String(),
        ];
    }
}

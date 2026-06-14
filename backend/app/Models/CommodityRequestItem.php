<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommodityRequestItem extends Model
{
    use HasUuids;

    protected $fillable = [
        'org_id', 'commodity_request_id', 'commodity_id', 'quantity', 'unit_price', 'subtotal',
    ];

    protected function casts(): array
    {
        return ['unit_price' => 'decimal:2', 'subtotal' => 'decimal:2'];
    }

    public function commodity(): BelongsTo
    {
        return $this->belongsTo(Commodity::class);
    }

    public function request(): BelongsTo
    {
        return $this->belongsTo(CommodityRequest::class, 'commodity_request_id');
    }
}

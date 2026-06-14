<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Commodity extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'commodity_type_id', 'name', 'unit_price', 'stock_quantity', 'is_active',
    ];

    protected function casts(): array
    {
        return ['unit_price' => 'decimal:2', 'is_active' => 'boolean'];
    }

    public function commodityType(): BelongsTo
    {
        return $this->belongsTo(CommodityType::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PettyCashItem extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = ['org_id', 'category_id', 'name', 'default_price', 'default_units'];

    protected function casts(): array
    {
        return [
            'default_price' => 'decimal:2',
            'default_units' => 'integer',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(PettyCashCategory::class, 'category_id');
    }
}

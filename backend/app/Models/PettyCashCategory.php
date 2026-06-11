<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PettyCashCategory extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = ['org_id', 'name'];

    public function org(): BelongsTo
    {
        return $this->belongsTo(Org::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PettyCashItem::class, 'category_id');
    }
}

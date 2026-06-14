<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class CommodityType extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = ['org_id', 'name'];

    public function commodities(): HasMany
    {
        return $this->hasMany(Commodity::class);
    }
}

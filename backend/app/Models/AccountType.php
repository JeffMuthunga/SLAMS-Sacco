<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class AccountType extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = ['org_id', 'code', 'name'];

    protected function casts(): array
    {
        return ['code' => 'integer'];
    }

    public function org(): BelongsTo
    {
        return $this->belongsTo(Org::class);
    }

    public function accounts(): HasMany
    {
        return $this->hasMany(ChartOfAccount::class);
    }
}

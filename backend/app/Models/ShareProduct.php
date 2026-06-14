<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ShareProduct extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'share_capital_account_id', 'name', 'price_per_share',
        'min_shares', 'max_shares', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price_per_share' => 'decimal:2',
            'is_active'       => 'boolean',
        ];
    }

    public function org(): BelongsTo
    {
        return $this->belongsTo(Org::class);
    }

    public function shareCapitalAccount(): BelongsTo
    {
        return $this->belongsTo(ChartOfAccount::class, 'share_capital_account_id');
    }

    public function memberShares(): HasMany
    {
        return $this->hasMany(MemberShare::class);
    }
}

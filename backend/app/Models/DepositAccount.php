<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class DepositAccount extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'member_id', 'product_id', 'account_number',
        'balance', 'interest_rate', 'opening_date', 'last_activity_date',
        'is_active', 'is_locked', 'locked_until_date',
        'approval_status', 'approved_by', 'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'balance' => 'decimal:2',
            'interest_rate' => 'decimal:4',
            'opening_date' => 'date',
            'last_activity_date' => 'date',
            'locked_until_date' => 'date',
            'approved_at' => 'datetime',
            'is_active' => 'boolean',
            'is_locked' => 'boolean',
        ];
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(SavingProduct::class, 'product_id');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(AccountTransaction::class);
    }

    public function contributions(): HasMany
    {
        return $this->hasMany(Contribution::class);
    }
}

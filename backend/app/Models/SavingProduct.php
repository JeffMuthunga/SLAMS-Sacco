<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SavingProduct extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'name', 'description', 'interest_rate',
        'min_opening_balance', 'min_balance', 'max_balance',
        'min_deposit', 'max_deposit', 'min_withdrawal', 'max_withdrawal',
        'lock_in_months', 'withdrawal_frequency', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'interest_rate' => 'decimal:4',
            'min_opening_balance' => 'decimal:2',
            'min_balance' => 'decimal:2',
            'max_balance' => 'decimal:2',
            'min_deposit' => 'decimal:2',
            'max_deposit' => 'decimal:2',
            'min_withdrawal' => 'decimal:2',
            'max_withdrawal' => 'decimal:2',
            'lock_in_months' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function org(): BelongsTo
    {
        return $this->belongsTo(Org::class);
    }

    public function depositAccounts(): HasMany
    {
        return $this->hasMany(DepositAccount::class, 'product_id');
    }
}

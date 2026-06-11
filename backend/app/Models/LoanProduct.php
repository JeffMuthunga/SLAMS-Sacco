<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class LoanProduct extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'name', 'description', 'interest_rate', 'interest_method',
        'repayment_frequency', 'min_amount', 'max_amount',
        'min_period_months', 'max_period_months', 'max_repayments',
        'requires_guarantor', 'requires_collateral', 'min_membership_months',
        'processing_fee_amount', 'processing_fee_percent', 'penalty_rate', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'interest_rate' => 'decimal:4',
            'min_amount' => 'decimal:2',
            'max_amount' => 'decimal:2',
            'processing_fee_amount' => 'decimal:2',
            'processing_fee_percent' => 'decimal:2',
            'penalty_rate' => 'decimal:4',
            'requires_guarantor' => 'boolean',
            'requires_collateral' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function org(): BelongsTo
    {
        return $this->belongsTo(Org::class);
    }

    public function loans(): HasMany
    {
        return $this->hasMany(Loan::class);
    }
}

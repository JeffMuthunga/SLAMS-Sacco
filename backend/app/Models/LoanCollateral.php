<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class LoanCollateral extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'loan_id', 'collateral_type', 'description',
        'estimated_value', 'is_received', 'is_released',
    ];

    protected function casts(): array
    {
        return [
            'estimated_value' => 'decimal:2',
            'is_received' => 'boolean',
            'is_released' => 'boolean',
        ];
    }

    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class);
    }
}

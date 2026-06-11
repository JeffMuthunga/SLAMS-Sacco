<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class LoanRepayment extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'loan_id', 'period_id', 'due_date', 'paid_date',
        'principal_due', 'principal_paid', 'interest_due', 'interest_paid',
        'penalty_due', 'penalty_paid', 'total_due', 'total_paid', 'balance',
        'repayment_status', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'due_date' => 'date',
            'paid_date' => 'date',
            'principal_due' => 'decimal:2',
            'principal_paid' => 'decimal:2',
            'interest_due' => 'decimal:2',
            'interest_paid' => 'decimal:2',
            'penalty_due' => 'decimal:2',
            'penalty_paid' => 'decimal:2',
            'total_due' => 'decimal:2',
            'total_paid' => 'decimal:2',
            'balance' => 'decimal:2',
        ];
    }

    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class);
    }

    public function period(): BelongsTo
    {
        return $this->belongsTo(Period::class);
    }
}

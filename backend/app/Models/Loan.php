<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Loan extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'member_id', 'loan_product_id', 'account_number',
        'disburse_account_id', 'principal_amount', 'interest_rate',
        'repayment_period', 'repayment_frequency', 'repayment_amount',
        'total_payable', 'outstanding_balance',
        'disbursed_date', 'maturity_date', 'expected_maturity_date',
        'loan_status', 'approval_status',
        'approved_by', 'approved_at', 'disbursed_by', 'applied_at',
    ];

    protected function casts(): array
    {
        return [
            'principal_amount' => 'decimal:2',
            'interest_rate' => 'decimal:4',
            'repayment_amount' => 'decimal:2',
            'total_payable' => 'decimal:2',
            'outstanding_balance' => 'decimal:2',
            'disbursed_date' => 'date',
            'maturity_date' => 'date',
            'expected_maturity_date' => 'date',
            'approved_at' => 'datetime',
            'applied_at' => 'datetime',
        ];
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function loanProduct(): BelongsTo
    {
        return $this->belongsTo(LoanProduct::class);
    }

    public function disburseAccount(): BelongsTo
    {
        return $this->belongsTo(DepositAccount::class, 'disburse_account_id');
    }

    public function repayments(): HasMany
    {
        return $this->hasMany(LoanRepayment::class);
    }

    public function guarantees(): HasMany
    {
        return $this->hasMany(LoanGuarantee::class);
    }

    public function collaterals(): HasMany
    {
        return $this->hasMany(LoanCollateral::class);
    }

    public function notes(): HasMany
    {
        return $this->hasMany(LoanNote::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class AccountTransaction extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'deposit_account_id', 'period_id', 'transaction_type',
        'amount', 'balance_after', 'reference_number',
        'transaction_date', 'value_date', 'narration', 'created_by',
        'linked_transaction_id', 'approval_status', 'approved_by', 'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'balance_after' => 'decimal:2',
            'transaction_date' => 'date',
            'value_date' => 'date',
            'approved_at' => 'datetime',
        ];
    }

    public function depositAccount(): BelongsTo
    {
        return $this->belongsTo(DepositAccount::class);
    }

    public function period(): BelongsTo
    {
        return $this->belongsTo(Period::class);
    }

    public function linkedTransaction(): BelongsTo
    {
        return $this->belongsTo(AccountTransaction::class, 'linked_transaction_id');
    }
}

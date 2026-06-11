<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Contribution extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'member_id', 'deposit_account_id', 'period_id',
        'expected_amount', 'paid_amount', 'due_date', 'paid_date', 'status',
    ];

    protected function casts(): array
    {
        return [
            'expected_amount' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'due_date' => 'date',
            'paid_date' => 'date',
        ];
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function depositAccount(): BelongsTo
    {
        return $this->belongsTo(DepositAccount::class);
    }

    public function period(): BelongsTo
    {
        return $this->belongsTo(Period::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DividendEntry extends Model
{
    use HasUuids;

    protected $fillable = [
        'org_id', 'dividend_run_id', 'member_id',
        'share_balance', 'dividend_amount', 'credited_account_id', 'posted_at',
    ];

    protected function casts(): array
    {
        return [
            'share_balance'   => 'decimal:2',
            'dividend_amount' => 'decimal:2',
            'posted_at'       => 'datetime',
        ];
    }

    public function member(): BelongsTo { return $this->belongsTo(Member::class); }
    public function dividendRun(): BelongsTo { return $this->belongsTo(DividendRun::class); }
    public function creditedAccount(): BelongsTo { return $this->belongsTo(DepositAccount::class, 'credited_account_id'); }
}

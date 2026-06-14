<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class MemberShare extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'member_id', 'share_product_id', 'deposit_account_id',
        'quantity', 'price_per_share', 'total_amount', 'purchase_date',
        'status', 'approved_by', 'approved_at', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'price_per_share' => 'decimal:2',
            'total_amount'    => 'decimal:2',
            'purchase_date'   => 'date',
            'approved_at'     => 'datetime',
        ];
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function shareProduct(): BelongsTo
    {
        return $this->belongsTo(ShareProduct::class);
    }

    public function depositAccount(): BelongsTo
    {
        return $this->belongsTo(DepositAccount::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}

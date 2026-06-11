<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PettyCashRequest extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'allocation_id', 'item_id', 'requested_by',
        'units', 'unit_price', 'amount', 'receipt_number',
        'expense_date', 'narration', 'approval_status', 'approved_by', 'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'unit_price' => 'decimal:2',
            'amount' => 'decimal:2',
            'expense_date' => 'date',
            'approved_at' => 'datetime',
            'units' => 'integer',
        ];
    }

    public function allocation(): BelongsTo
    {
        return $this->belongsTo(PettyCashAllocation::class, 'allocation_id');
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(PettyCashItem::class, 'item_id');
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PettyCashAllocation extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'period_id', 'allocated_to', 'amount', 'spent', 'balance',
        'narration', 'approval_status', 'approved_by', 'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'spent' => 'decimal:2',
            'balance' => 'decimal:2',
            'approved_at' => 'datetime',
        ];
    }

    public function period(): BelongsTo
    {
        return $this->belongsTo(Period::class);
    }

    public function allocatedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'allocated_to');
    }

    public function requests(): HasMany
    {
        return $this->hasMany(PettyCashRequest::class, 'allocation_id');
    }
}

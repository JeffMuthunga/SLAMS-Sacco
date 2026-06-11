<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class LoanGuarantee extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'loan_id', 'member_id', 'guaranteed_amount',
        'is_accepted', 'accepted_at', 'is_active', 'approval_status',
    ];

    protected function casts(): array
    {
        return [
            'guaranteed_amount' => 'decimal:2',
            'is_accepted' => 'boolean',
            'is_active' => 'boolean',
            'accepted_at' => 'datetime',
        ];
    }

    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class);
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }
}

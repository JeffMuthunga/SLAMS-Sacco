<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class MemberExit extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'member_id', 'reference_number', 'exit_type', 'reason',
        'exit_date', 'status', 'requested_by', 'requested_at',
        'approved_by', 'approved_at', 'rejected_by', 'rejected_at',
        'rejection_reason', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'exit_date'    => 'date',
            'requested_at' => 'datetime',
            'approved_at'  => 'datetime',
            'rejected_at'  => 'datetime',
        ];
    }

    public function member(): BelongsTo      { return $this->belongsTo(Member::class); }
    public function org(): BelongsTo         { return $this->belongsTo(Org::class); }
    public function requestedBy(): BelongsTo { return $this->belongsTo(User::class, 'requested_by'); }
    public function approvedBy(): BelongsTo  { return $this->belongsTo(User::class, 'approved_by'); }
    public function rejectedBy(): BelongsTo  { return $this->belongsTo(User::class, 'rejected_by'); }
}

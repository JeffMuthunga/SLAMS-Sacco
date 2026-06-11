<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class MemberKin extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'member_id', 'full_name', 'relationship',
        'date_of_birth', 'id_number', 'id_type', 'phone',
        'is_emergency_contact', 'is_beneficiary', 'beneficiary_percent',
    ];

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'is_emergency_contact' => 'boolean',
            'is_beneficiary' => 'boolean',
            'beneficiary_percent' => 'decimal:2',
        ];
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }
}

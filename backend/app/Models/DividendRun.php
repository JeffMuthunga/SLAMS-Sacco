<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class DividendRun extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'fiscal_year_id', 'rate', 'status', 'total_dividend',
        'approved_by', 'approved_at', 'posted_at', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'rate'           => 'decimal:4',
            'total_dividend' => 'decimal:2',
            'approved_at'    => 'datetime',
            'posted_at'      => 'datetime',
        ];
    }

    public function fiscalYear(): BelongsTo { return $this->belongsTo(FiscalYear::class); }
    public function approvedBy(): BelongsTo { return $this->belongsTo(User::class, 'approved_by'); }
    public function entries(): HasMany { return $this->hasMany(DividendEntry::class); }
}

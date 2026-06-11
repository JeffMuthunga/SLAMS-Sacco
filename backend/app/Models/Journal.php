<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Journal extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'fiscal_year_id', 'period_id', 'reference_number',
        'journal_date', 'narration',
        'is_posted', 'posted_at', 'posted_by',
        'is_reversed', 'reversed_at', 'reversed_by', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'journal_date' => 'date',
            'posted_at' => 'datetime',
            'reversed_at' => 'datetime',
            'is_posted' => 'boolean',
            'is_reversed' => 'boolean',
        ];
    }

    public function fiscalYear(): BelongsTo
    {
        return $this->belongsTo(FiscalYear::class);
    }

    public function period(): BelongsTo
    {
        return $this->belongsTo(Period::class);
    }

    public function lines(): HasMany
    {
        return $this->hasMany(JournalLine::class);
    }
}

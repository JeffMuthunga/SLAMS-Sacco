<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class FiscalYear extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'name', 'start_date', 'end_date',
        'is_opened', 'is_closed', 'closed_at', 'closed_by',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'closed_at' => 'datetime',
            'is_opened' => 'boolean',
            'is_closed' => 'boolean',
        ];
    }

    public function org(): BelongsTo
    {
        return $this->belongsTo(Org::class);
    }

    public function periods(): HasMany
    {
        return $this->hasMany(Period::class);
    }
}

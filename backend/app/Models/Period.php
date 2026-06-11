<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Period extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'fiscal_year_id', 'name', 'start_date', 'end_date',
        'is_opened', 'is_closed', 'is_posted',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'is_opened' => 'boolean',
            'is_closed' => 'boolean',
            'is_posted' => 'boolean',
        ];
    }

    public function org(): BelongsTo
    {
        return $this->belongsTo(Org::class);
    }

    public function fiscalYear(): BelongsTo
    {
        return $this->belongsTo(FiscalYear::class);
    }
}

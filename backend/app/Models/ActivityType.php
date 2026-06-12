<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ActivityType extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id',
        'name',
        'code',
        'dr_account_id',
        'cr_account_id',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function org(): BelongsTo
    {
        return $this->belongsTo(Org::class);
    }

    public function drAccount(): BelongsTo
    {
        return $this->belongsTo(ChartOfAccount::class, 'dr_account_id');
    }

    public function crAccount(): BelongsTo
    {
        return $this->belongsTo(ChartOfAccount::class, 'cr_account_id');
    }
}

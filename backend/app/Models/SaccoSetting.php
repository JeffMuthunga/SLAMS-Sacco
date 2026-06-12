<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaccoSetting extends Model
{
    use HasUuids;

    protected $fillable = [
        'org_id',
        'registration_fee',
        'min_share_capital',
        'min_monthly_contribution',
        'loan_limit_multiplier',
    ];

    protected function casts(): array
    {
        return [
            'registration_fee' => 'string',
            'min_share_capital' => 'string',
            'min_monthly_contribution' => 'string',
            'loan_limit_multiplier' => 'string',
        ];
    }

    public function org(): BelongsTo
    {
        return $this->belongsTo(Org::class);
    }
}

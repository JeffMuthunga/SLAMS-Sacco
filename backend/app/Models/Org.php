<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Org extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'name', 'full_name', 'suffix', 'email', 'phone', 'website',
        'logo_path', 'primary_color', 'secondary_color', 'address', 'town', 'country_code', 'currency_code',
        'pin', 'reg_number', 'member_limit', 'is_active', 'is_default',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_default' => 'boolean',
            'member_limit' => 'integer',
        ];
    }

    public function members(): HasMany
    {
        return $this->hasMany(Member::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function fiscalYears(): HasMany
    {
        return $this->hasMany(FiscalYear::class);
    }

    public function periods(): HasMany
    {
        return $this->hasMany(Period::class);
    }
}

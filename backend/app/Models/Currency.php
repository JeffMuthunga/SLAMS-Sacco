<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Currency extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = ['org_id', 'code', 'name', 'symbol', 'exchange_rate', 'is_default'];

    protected function casts(): array
    {
        return [
            'exchange_rate' => 'string',
            'is_default' => 'boolean',
        ];
    }
}

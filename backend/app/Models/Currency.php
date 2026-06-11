<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Currency extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = ['org_id', 'code', 'name', 'symbol', 'is_default'];

    protected function casts(): array
    {
        return ['is_default' => 'boolean'];
    }
}

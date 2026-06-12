<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class IssueCategory extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = ['org_id', 'name', 'description'];

    public function issues(): HasMany
    {
        return $this->hasMany(Issue::class, 'category_id');
    }
}

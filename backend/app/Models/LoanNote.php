<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoanNote extends Model
{
    use HasUuids;

    protected $fillable = ['org_id', 'loan_id', 'note', 'created_by'];

    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class);
    }
}

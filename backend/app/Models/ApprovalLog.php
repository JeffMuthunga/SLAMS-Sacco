<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ApprovalLog extends Model
{
    use HasUuids;

    protected $fillable = [
        'org_id', 'approvable_type', 'approvable_id',
        'action', 'from_status', 'to_status', 'performed_by', 'notes',
    ];

    public function approvable(): MorphTo
    {
        return $this->morphTo();
    }

    public function performer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    public function org(): BelongsTo
    {
        return $this->belongsTo(Org::class);
    }
}

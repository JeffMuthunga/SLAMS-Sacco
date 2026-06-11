<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Member extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id', 'user_id', 'member_number', 'title', 'full_name',
        'id_number', 'id_type', 'email', 'phone', 'phone2',
        'date_of_birth', 'gender', 'nationality', 'marital_status',
        'address', 'town', 'postal_code', 'photo_path',
        'employed', 'self_employed', 'employer_name',
        'monthly_salary', 'monthly_net_income', 'entry_date', 'is_active',
        'approval_status', 'approved_by', 'approved_at',
        'terminated_at', 'termination_reason',
    ];

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'entry_date' => 'date',
            'approved_at' => 'datetime',
            'terminated_at' => 'datetime',
            'employed' => 'boolean',
            'self_employed' => 'boolean',
            'is_active' => 'boolean',
            'monthly_salary' => 'decimal:2',
            'monthly_net_income' => 'decimal:2',
        ];
    }

    public function org(): BelongsTo
    {
        return $this->belongsTo(Org::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function kins(): HasMany
    {
        return $this->hasMany(MemberKin::class);
    }

    public function depositAccounts(): HasMany
    {
        return $this->hasMany(DepositAccount::class);
    }

    public function loans(): HasMany
    {
        return $this->hasMany(Loan::class);
    }

    public function contributions(): HasMany
    {
        return $this->hasMany(Contribution::class);
    }
}

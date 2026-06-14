<?php

namespace App\Imports;

use App\Models\Member;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\SkipsFailures;
use Maatwebsite\Excel\Concerns\WithBatchInserts;
use Maatwebsite\Excel\Concerns\WithChunkReading;

class MembersImport implements ToModel, WithHeadingRow, WithValidation, SkipsOnFailure, WithBatchInserts, WithChunkReading
{
    use SkipsFailures;

    private string $orgId;
    private bool $dryRun;
    private int $inserted = 0;
    private int $skipped  = 0;

    public function __construct(string $orgId, bool $dryRun = false)
    {
        $this->orgId  = $orgId;
        $this->dryRun = $dryRun;
    }

    public function model(array $row): ?Member
    {
        if (Member::where('org_id', $this->orgId)->where('id_number', $row['id_number'])->exists()) {
            $this->skipped++;
            return null;
        }

        if ($this->dryRun) {
            $this->inserted++;
            return null;
        }

        $this->inserted++;

        $year   = now()->year;
        $prefix = "IMP-{$year}-";
        $max    = Member::withTrashed()->where('org_id', $this->orgId)
            ->where('member_number', 'like', $prefix . '%')
            ->max('member_number');
        $next   = $max ? ((int) substr($max, -4)) + 1 : 1;

        return new Member([
            'org_id'          => $this->orgId,
            'member_number'   => $prefix . str_pad($next, 4, '0', STR_PAD_LEFT),
            'full_name'       => $row['full_name'],
            'id_number'       => $row['id_number'],
            'id_type'         => $row['id_type'] ?? 'national_id',
            'email'           => $row['email'] ?: null,
            'phone'           => $row['phone'],
            'phone2'          => $row['phone2'] ?: null,
            'gender'          => $row['gender'] ?: null,
            'date_of_birth'   => $row['date_of_birth'],
            'entry_date'      => $row['entry_date'] ?? now()->toDateString(),
            'employed'        => filter_var($row['employed'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'employer_name'   => $row['employer_name'] ?: null,
            'monthly_salary'  => $row['monthly_salary'] ?: null,
            'address'         => $row['address'] ?: null,
            'town'            => $row['town'] ?: null,
            'approval_status' => 'approved',
            'is_active'       => true,
        ]);
    }

    public function rules(): array
    {
        return [
            'full_name'     => ['required', 'string'],
            'id_number'     => ['required', 'string'],
            'phone'         => ['required', 'string'],
            'date_of_birth' => ['required', 'date'],
        ];
    }

    public function customValidationMessages(): array
    {
        return [
            'full_name.required'     => 'full_name is required.',
            'id_number.required'     => 'id_number is required.',
            'phone.required'         => 'phone is required.',
            'date_of_birth.required' => 'date_of_birth is required.',
            'date_of_birth.date'     => 'date_of_birth must be a valid date (YYYY-MM-DD).',
        ];
    }

    public function batchSize(): int   { return 100; }
    public function chunkSize(): int   { return 200; }
    public function getInserted(): int { return $this->inserted; }
    public function getSkipped(): int  { return $this->skipped; }
}

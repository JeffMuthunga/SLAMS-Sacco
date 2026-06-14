<?php

namespace App\Imports;

use App\Models\DepositAccount;
use App\Models\Member;
use App\Models\SavingProduct;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\SkipsFailures;
use Maatwebsite\Excel\Concerns\WithChunkReading;

class DepositAccountsImport implements ToModel, WithHeadingRow, WithValidation, SkipsOnFailure, WithChunkReading
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

    public function model(array $row): ?DepositAccount
    {
        $member = Member::where('org_id', $this->orgId)
            ->where('id_number', $row['member_id_number'])
            ->first();

        if (! $member) {
            $this->skipped++;
            return null;
        }

        if ($this->dryRun) {
            $this->inserted++;
            return null;
        }

        $this->inserted++;

        $year   = now()->year;
        $prefix = "ACC-{$year}-";
        $max    = DepositAccount::withTrashed()->where('org_id', $this->orgId)
            ->where('account_number', 'like', $prefix . '%')
            ->max('account_number');
        $next   = $max ? ((int) substr($max, -4)) + 1 : 1;

        $product = SavingProduct::where('org_id', $this->orgId)->first();

        return new DepositAccount([
            'org_id'        => $this->orgId,
            'member_id'     => $member->id,
            'product_id'    => $product?->id,
            'account_number'=> $prefix . str_pad($next, 4, '0', STR_PAD_LEFT),
            'balance'       => $row['balance'] ?? '0.00',
            'is_active'     => true,
            'opening_date'  => $row['opened_date'] ?? now()->toDateString(),
        ]);
    }

    public function rules(): array
    {
        return [
            'member_id_number' => ['required', 'string'],
            'balance'          => ['nullable', 'numeric', 'min:0'],
            'opened_date'      => ['nullable', 'date'],
        ];
    }

    public function chunkSize(): int   { return 200; }
    public function getInserted(): int { return $this->inserted; }
    public function getSkipped(): int  { return $this->skipped; }
}

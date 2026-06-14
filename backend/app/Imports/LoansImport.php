<?php

namespace App\Imports;

use App\Models\Loan;
use App\Models\LoanProduct;
use App\Models\Member;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\SkipsFailures;
use Maatwebsite\Excel\Concerns\WithChunkReading;

class LoansImport implements ToModel, WithHeadingRow, WithValidation, SkipsOnFailure, WithChunkReading
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

    public function model(array $row): ?Loan
    {
        $member = Member::where('org_id', $this->orgId)
            ->where('id_number', $row['member_id_number'])
            ->first();

        $product = LoanProduct::where('org_id', $this->orgId)
            ->where('name', $row['loan_product_name'])
            ->first();

        if (! $member || ! $product) {
            $this->skipped++;
            return null;
        }

        if ($this->dryRun) {
            $this->inserted++;
            return null;
        }

        $this->inserted++;

        $year   = now()->year;
        $prefix = "LN-{$year}-";
        $max    = Loan::withTrashed()->where('org_id', $this->orgId)
            ->where('account_number', 'like', $prefix . '%')
            ->max('account_number');
        $next   = $max ? ((int) substr($max, -4)) + 1 : 1;

        return new Loan([
            'org_id'              => $this->orgId,
            'member_id'           => $member->id,
            'loan_product_id'     => $product->id,
            'account_number'      => $prefix . str_pad($next, 4, '0', STR_PAD_LEFT),
            'principal_amount'    => $row['principal_amount'],
            'interest_rate'       => $row['interest_rate'] ?? $product->interest_rate,
            'repayment_period'    => $row['repayment_period'],
            'repayment_frequency' => $row['repayment_frequency'] ?? 'monthly',
            'outstanding_balance' => $row['outstanding_balance'] ?? $row['principal_amount'],
            'repayment_amount'    => '0.00',
            'total_payable'       => $row['principal_amount'],
            'loan_status'         => 'active',
            'approval_status'     => 'approved',
            'disbursed_date'      => $row['disbursed_date'] ?? null,
        ]);
    }

    public function rules(): array
    {
        return [
            'member_id_number'  => ['required', 'string'],
            'loan_product_name' => ['required', 'string'],
            'principal_amount'  => ['required', 'numeric', 'min:0'],
            'repayment_period'  => ['required', 'integer', 'min:1'],
        ];
    }

    public function chunkSize(): int   { return 100; }
    public function getInserted(): int { return $this->inserted; }
    public function getSkipped(): int  { return $this->skipped; }
}

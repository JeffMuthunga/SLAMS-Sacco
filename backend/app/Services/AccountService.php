<?php

namespace App\Services;

use App\Models\AccountTransaction;
use App\Models\DepositAccount;
use App\Models\Period;
use Illuminate\Support\Facades\DB;

class AccountService
{
    public function generateAccountNumber(string $orgId): string
    {
        $prefix = 'ACC-' . now()->format('Ymd') . '-';

        $last = DepositAccount::withTrashed()
            ->where('org_id', $orgId)
            ->where('account_number', 'like', $prefix . '%')
            ->orderByDesc('account_number')
            ->value('account_number');

        $seq = $last ? ((int) substr($last, -5)) + 1 : 1;

        return $prefix . str_pad($seq, 5, '0', STR_PAD_LEFT);
    }

    public function store(array $data, string $orgId): DepositAccount
    {
        return DB::transaction(function () use ($data, $orgId) {
            DepositAccount::withTrashed()
                ->where('org_id', $orgId)
                ->lockForUpdate()
                ->select('account_number')
                ->get();

            return DepositAccount::create([
                'org_id'          => $orgId,
                'member_id'       => $data['member_id'],
                'product_id'      => $data['product_id'],
                'account_number'  => $this->generateAccountNumber($orgId),
                'interest_rate'   => $data['interest_rate'] ?? 0,
                'opening_date'    => $data['opening_date'],
                'approval_status' => 'pending',
                'is_active'       => false,
                'balance'         => '0.00',
            ]);
        });
    }

    public function approve(DepositAccount $account, $user): void
    {
        $account->update([
            'approval_status' => 'approved',
            'is_active'       => true,
            'approved_by'     => $user->id,
            'approved_at'     => now(),
        ]);
    }

    public function reject(DepositAccount $account, $user): void
    {
        $account->update([
            'approval_status' => 'rejected',
            'approved_by'     => $user->id,
            'approved_at'     => now(),
        ]);
    }

    private function currentPeriodId(string $orgId): ?string
    {
        return Period::where('org_id', $orgId)
            ->where('status', 'open')
            ->orderByDesc('start_date')
            ->value('id');
    }

    public function postTransaction(DepositAccount $account, array $data, $user): AccountTransaction
    {
        return DB::transaction(function () use ($account, $data, $user) {
            $account = DepositAccount::lockForUpdate()->findOrFail($account->id);

            abort_if(!$account->is_active, 422, 'Account is not active.');
            abort_if($account->is_locked, 422, 'Account is locked.');

            $amount = (string) $data['amount'];
            $type   = $data['transaction_type'];

            $debitTypes = ['withdrawal', 'transfer_out', 'fee', 'loan_disbursement'];

            if (in_array($type, $debitTypes, true)) {
                $newBalance = bcsub((string) $account->balance, $amount, 2);
                abort_if(bccomp($newBalance, '0', 2) < 0, 422, 'Insufficient balance.');
            } else {
                $newBalance = bcadd((string) $account->balance, $amount, 2);
            }

            $tx = AccountTransaction::create([
                'org_id'             => $account->org_id,
                'deposit_account_id' => $account->id,
                'period_id'          => $this->currentPeriodId($account->org_id),
                'transaction_type'   => $type,
                'amount'             => $amount,
                'balance_after'      => $newBalance,
                'reference_number'   => $data['reference_number'] ?? null,
                'transaction_date'   => $data['transaction_date'],
                'value_date'         => $data['value_date'] ?? $data['transaction_date'],
                'narration'          => $data['narration'] ?? null,
                'created_by'         => $user->id,
                'approval_status'    => 'approved',
                'approved_by'        => $user->id,
                'approved_at'        => now(),
            ]);

            $account->update([
                'balance'            => $newBalance,
                'last_activity_date' => $data['transaction_date'],
            ]);

            return $tx;
        });
    }

    public function postTransfer(DepositAccount $from, DepositAccount $to, array $data, $user): array
    {
        return DB::transaction(function () use ($from, $to, $data, $user) {
            $outData = array_merge($data, ['transaction_type' => 'transfer_out']);
            $inData  = array_merge($data, ['transaction_type' => 'transfer_in']);

            $out = $this->postTransaction($from, $outData, $user);
            $in  = $this->postTransaction($to, $inData, $user);

            $out->update(['linked_transaction_id' => $in->id]);
            $in->update(['linked_transaction_id'  => $out->id]);

            return [$out, $in];
        });
    }
}

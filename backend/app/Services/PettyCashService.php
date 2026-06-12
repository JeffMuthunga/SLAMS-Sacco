<?php

namespace App\Services;

use App\Models\PettyCashAllocation;
use App\Models\PettyCashRequest;
use Illuminate\Support\Facades\DB;

class PettyCashService
{
    public function __construct(private NotificationService $notifications) {}

    public function createAllocation(array $data, string $orgId): PettyCashAllocation
    {
        $amount = (string) $data['amount'];

        return PettyCashAllocation::create([
            'org_id'       => $orgId,
            'period_id'    => $data['period_id'],
            'allocated_to' => $data['allocated_to'],
            'amount'       => $amount,
            'spent'        => '0.00',
            'balance'      => $amount,
            'narration'    => $data['narration'] ?? null,
            'approval_status' => 'draft',
        ]);
    }

    public function approveAllocation(PettyCashAllocation $allocation, object $user): PettyCashAllocation
    {
        $allocation->update([
            'approval_status' => 'approved',
            'approved_by'     => $user->id,
            'approved_at'     => now(),
        ]);

        return $allocation;
    }

    public function rejectAllocation(PettyCashAllocation $allocation, object $user): PettyCashAllocation
    {
        $allocation->update([
            'approval_status' => 'rejected',
            'approved_by'     => $user->id,
            'approved_at'     => now(),
        ]);

        return $allocation;
    }

    public function createRequest(array $data, string $orgId, object $user): PettyCashRequest
    {
        $units     = (int) $data['units'];
        $unitPrice = (string) $data['unit_price'];
        $amount    = bcmul((string) $units, $unitPrice, 2);

        return PettyCashRequest::create([
            'org_id'          => $orgId,
            'allocation_id'   => $data['allocation_id'] ?? null,
            'item_id'         => $data['item_id'] ?? null,
            'requested_by'    => $user->id,
            'units'           => $units,
            'unit_price'      => $unitPrice,
            'amount'          => $amount,
            'receipt_number'  => $data['receipt_number'] ?? null,
            'expense_date'    => $data['expense_date'],
            'narration'       => $data['narration'] ?? null,
            'approval_status' => 'draft',
        ]);
    }

    public function approveRequest(PettyCashRequest $pcRequest, object $user): PettyCashRequest
    {
        return DB::transaction(function () use ($pcRequest, $user) {
            $pcRequest->update([
                'approval_status' => 'approved',
                'approved_by'     => $user->id,
                'approved_at'     => now(),
            ]);

            if ($pcRequest->allocation_id) {
                $allocation = PettyCashAllocation::lockForUpdate()->find($pcRequest->allocation_id);

                if ($allocation) {
                    $newSpent   = bcadd((string) $allocation->spent,   (string) $pcRequest->amount, 2);
                    $newBalance = bcsub((string) $allocation->balance, (string) $pcRequest->amount, 2);

                    $allocation->update(['spent' => $newSpent, 'balance' => $newBalance]);
                }
            }

            $this->notifications->pettyCashRequestApproved($pcRequest->load(['allocation.allocatedTo', 'item']));

            return $pcRequest;
        });
    }

    public function rejectRequest(PettyCashRequest $pcRequest, object $user): PettyCashRequest
    {
        $pcRequest->update([
            'approval_status' => 'rejected',
            'approved_by'     => $user->id,
            'approved_at'     => now(),
        ]);

        $this->notifications->pettyCashRequestRejected($pcRequest->load(['allocation.allocatedTo', 'item']));

        return $pcRequest;
    }
}

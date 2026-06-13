<?php

namespace App\Services;

use App\Models\Loan;
use App\Models\Member;
use App\Models\MemberExit;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class MemberExitService
{
    public function __construct(private NotificationService $notifications) {}

    public function generateReference(string $orgId): string
    {
        $prefix = 'EXIT-' . now()->format('Ym') . '-';
        $last = MemberExit::where('org_id', $orgId)
            ->where('reference_number', 'like', $prefix . '%')
            ->orderByDesc('reference_number')
            ->first();
        $next = $last ? ((int) substr($last->reference_number, strlen($prefix))) + 1 : 1;
        return $prefix . str_pad($next, 4, '0', STR_PAD_LEFT);
    }

    public function create(array $data, string $orgId, User $user): MemberExit
    {
        $memberId = $data['member_id'];

        // One pending exit per member at a time
        $existing = MemberExit::where('org_id', $orgId)
            ->where('member_id', $memberId)
            ->where('status', 'pending')
            ->first();
        if ($existing) {
            throw new \RuntimeException('This member already has a pending exit request.');
        }

        // Block if active loans exist
        $activeLoans = Loan::where('org_id', $orgId)
            ->where('member_id', $memberId)
            ->where('loan_status', 'active')
            ->where('outstanding_balance', '>', 0)
            ->count();
        if ($activeLoans > 0) {
            throw new \RuntimeException('Member has active loans with outstanding balance. Settle all loans before processing exit.');
        }

        return DB::transaction(function () use ($data, $orgId, $user) {
            $exit = MemberExit::create([
                'org_id'           => $orgId,
                'member_id'        => $data['member_id'],
                'reference_number' => $this->generateReference($orgId),
                'exit_type'        => $data['exit_type'],
                'reason'           => $data['reason'] ?? null,
                'exit_date'        => $data['exit_date'],
                'status'           => 'pending',
                'requested_by'     => $user->id,
                'requested_at'     => now(),
                'notes'            => $data['notes'] ?? null,
            ]);

            $exit->load(['member', 'requestedBy']);

            try {
                $this->notifications->memberExitRequested($exit);
            } catch (\Throwable) {}

            return $exit;
        });
    }

    public function approve(MemberExit $exit, User $admin): MemberExit
    {
        if ($exit->status !== 'pending') {
            throw new \RuntimeException('Only pending exit requests can be approved.');
        }

        return DB::transaction(function () use ($exit, $admin) {
            $exit->update([
                'status'      => 'approved',
                'approved_by' => $admin->id,
                'approved_at' => now(),
            ]);

            // Deactivate member
            $exit->member()->update(['is_active' => false]);

            $exit->load(['member', 'approvedBy']);

            try {
                $this->notifications->memberExitApproved($exit);
            } catch (\Throwable) {}

            return $exit;
        });
    }

    public function reject(MemberExit $exit, User $admin, string $reason): MemberExit
    {
        if ($exit->status !== 'pending') {
            throw new \RuntimeException('Only pending exit requests can be rejected.');
        }

        $exit->update([
            'status'           => 'rejected',
            'rejected_by'      => $admin->id,
            'rejected_at'      => now(),
            'rejection_reason' => $reason,
        ]);

        $exit->load(['member', 'rejectedBy']);

        try {
            $this->notifications->memberExitRejected($exit);
        } catch (\Throwable) {}

        return $exit;
    }
}

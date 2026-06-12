<?php

namespace App\Services;

use App\Models\ApprovalLog;
use App\Models\Member;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class MemberService
{
    public function generateMemberNumber(string $orgId): string
    {
        $year   = now()->year;
        $prefix = "MEM-{$year}-";

        $max = Member::withTrashed()
            ->where('org_id', $orgId)
            ->where('member_number', 'like', $prefix . '%')
            ->max('member_number');

        $next = $max ? ((int) substr($max, -4)) + 1 : 1;

        return $prefix . str_pad($next, 4, '0', STR_PAD_LEFT);
    }

    public function store(array $validated, string $orgId): Member
    {
        return DB::transaction(function () use ($validated, $orgId) {
            // Lock existing rows to prevent concurrent duplicate numbers
            Member::withTrashed()
                ->where('org_id', $orgId)
                ->lockForUpdate()
                ->select('member_number')
                ->get();

            $member = Member::create(array_merge(
                Arr::except($validated, ['kins']),
                [
                    'org_id'          => $orgId,
                    'member_number'   => $this->generateMemberNumber($orgId),
                    'approval_status' => 'pending',
                    'is_active'       => true,
                ]
            ));

            foreach ($validated['kins'] ?? [] as $kin) {
                $member->kins()->create(array_merge(
                    Arr::except($kin, ['id']),
                    ['org_id' => $orgId]
                ));
            }

            return $member->load('kins');
        });
    }

    public function update(Member $member, array $validated): Member
    {
        return DB::transaction(function () use ($member, $validated) {
            $member->update(Arr::except($validated, ['kins']));

            $incomingKins = $validated['kins'] ?? [];
            $incomingIds  = array_values(array_filter(array_column($incomingKins, 'id')));

            $member->kins()->whereNotIn('id', $incomingIds)->delete();

            foreach ($incomingKins as $kinData) {
                if (!empty($kinData['id'])) {
                    $member->kins()
                        ->where('id', $kinData['id'])
                        ->update(Arr::except($kinData, ['id']));
                } else {
                    $member->kins()->create(array_merge(
                        Arr::except($kinData, ['id']),
                        ['org_id' => $member->org_id]
                    ));
                }
            }

            return $member->fresh()->load('kins');
        });
    }

    public function storePhoto(Member $member, UploadedFile $file): void
    {
        if ($member->photo_path) {
            Storage::disk('public')->delete($member->photo_path);
        }

        $ext  = $file->getClientOriginalExtension();
        $path = $file->storeAs('member-photos', $member->id . '.' . $ext, 'public');
        $member->update(['photo_path' => $path]);
    }

    public function approve(Member $member, User $by): void
    {
        $old = $member->approval_status;

        $member->update([
            'approval_status' => 'approved',
            'approved_by'     => $by->id,
            'approved_at'     => now(),
        ]);

        ApprovalLog::create([
            'org_id'          => $member->org_id,
            'approvable_type' => 'member',
            'approvable_id'   => $member->id,
            'action'          => 'approved',
            'from_status'     => $old,
            'to_status'       => 'approved',
            'performed_by'    => $by->id,
        ]);
    }

    public function reject(Member $member, string $reason, User $by): void
    {
        $old = $member->approval_status;

        $member->update(['approval_status' => 'rejected']);

        ApprovalLog::create([
            'org_id'          => $member->org_id,
            'approvable_type' => 'member',
            'approvable_id'   => $member->id,
            'action'          => 'rejected',
            'from_status'     => $old,
            'to_status'       => 'rejected',
            'performed_by'    => $by->id,
            'notes'           => $reason,
        ]);
    }
}

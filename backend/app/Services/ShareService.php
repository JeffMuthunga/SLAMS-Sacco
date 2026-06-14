<?php

namespace App\Services;

use App\Models\DepositAccount;
use App\Models\MemberShare;
use App\Models\ShareProduct;
use App\Models\Member;
use Illuminate\Support\Facades\DB;

class ShareService
{
    public function purchaseShares(Member $member, array $data, string $orgId): MemberShare
    {
        $product = ShareProduct::where('org_id', $orgId)
            ->where('is_active', true)
            ->findOrFail($data['share_product_id']);

        $quantity    = (int) $data['quantity'];
        $priceEach   = (string) $product->price_per_share;
        $totalAmount = bcmul((string) $quantity, $priceEach, 2);

        abort_if($quantity < $product->min_shares, 422,
            "Minimum shares for this product is {$product->min_shares}.");

        if ($product->max_shares !== null) {
            $currentHeld = MemberShare::where('org_id', $orgId)
                ->where('member_id', $member->id)
                ->where('share_product_id', $product->id)
                ->where('status', 'approved')
                ->sum('quantity');

            abort_if(($currentHeld + $quantity) > $product->max_shares, 422,
                "This purchase would exceed the maximum of {$product->max_shares} shares for this product.");
        }

        return MemberShare::create([
            'org_id'           => $orgId,
            'member_id'        => $member->id,
            'share_product_id' => $product->id,
            'deposit_account_id' => $data['deposit_account_id'] ?? null,
            'quantity'         => $quantity,
            'price_per_share'  => $priceEach,
            'total_amount'     => $totalAmount,
            'purchase_date'    => $data['purchase_date'] ?? now()->toDateString(),
            'status'           => 'pending',
            'notes'            => $data['notes'] ?? null,
        ]);
    }

    public function approve(MemberShare $share, $user): MemberShare
    {
        abort_unless($share->status === 'pending', 422, 'Only pending share purchases can be approved.');

        DB::transaction(function () use ($share, $user) {
            $share->update([
                'status'      => 'approved',
                'approved_by' => $user->id,
                'approved_at' => now(),
            ]);

            // Deduct from deposit account if provided
            if ($share->deposit_account_id) {
                $account = DepositAccount::lockForUpdate()->findOrFail($share->deposit_account_id);
                $newBal  = bcsub((string) $account->balance, (string) $share->total_amount, 2);
                abort_if(bccomp($newBal, '0', 2) < 0, 422, 'Insufficient account balance for this share purchase.');
                $account->update(['balance' => $newBal]);
            }
        });

        return $share->fresh()->load(['member', 'shareProduct', 'depositAccount']);
    }

    public function reject(MemberShare $share, string $reason): MemberShare
    {
        abort_unless($share->status === 'pending', 422, 'Only pending share purchases can be rejected.');

        $share->update([
            'status' => 'rejected',
            'notes'  => $reason,
        ]);

        return $share->fresh()->load(['member', 'shareProduct']);
    }

    public function memberBalance(string $memberId, string $orgId): array
    {
        $shares = MemberShare::where('org_id', $orgId)
            ->where('member_id', $memberId)
            ->where('status', 'approved')
            ->with('shareProduct')
            ->get()
            ->groupBy('share_product_id');

        $summary = [];
        $totalValue = '0.00';

        foreach ($shares as $productId => $purchases) {
            $qty   = $purchases->sum('quantity');
            $value = $purchases->sum(fn ($s) => (float) $s->total_amount);
            $valueStr = number_format($value, 2, '.', '');
            $totalValue = bcadd($totalValue, $valueStr, 2);

            $summary[] = [
                'share_product_id'   => $productId,
                'share_product_name' => $purchases->first()->shareProduct?->name,
                'quantity'           => $qty,
                'value'              => $valueStr,
            ];
        }

        return [
            'summary'     => $summary,
            'total_value' => $totalValue,
        ];
    }
}

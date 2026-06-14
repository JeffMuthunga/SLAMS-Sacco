<?php

namespace App\Services;

use App\Models\Commodity;
use App\Models\CommodityRequest;
use App\Models\CommodityRequestItem;
use App\Models\Member;
use Illuminate\Support\Facades\DB;

class CommodityService
{
    private function generateRequestNumber(string $orgId): string
    {
        $year   = now()->year;
        $prefix = "CMR-{$year}-";
        $last   = CommodityRequest::withTrashed()
            ->where('org_id', $orgId)
            ->where('request_number', 'like', $prefix . '%')
            ->max('request_number');
        $next = $last ? ((int) substr($last, -4)) + 1 : 1;
        return $prefix . str_pad($next, 4, '0', STR_PAD_LEFT);
    }

    /**
     * @param array $items  Each item: ['commodity_id', 'quantity']
     */
    public function createRequest(Member $member, array $items, ?int $repaymentPeriod, string $orgId): CommodityRequest
    {
        abort_if(empty($items), 422, 'At least one item is required.');

        return DB::transaction(function () use ($member, $items, $repaymentPeriod, $orgId) {
            $request = CommodityRequest::create([
                'org_id'           => $orgId,
                'member_id'        => $member->id,
                'request_number'   => $this->generateRequestNumber($orgId),
                'status'           => 'pending',
                'total_amount'     => '0.00',
                'repayment_period' => $repaymentPeriod,
            ]);

            $total = '0.00';

            foreach ($items as $line) {
                $commodity = Commodity::where('org_id', $orgId)
                    ->where('is_active', true)
                    ->findOrFail($line['commodity_id']);

                $qty      = (int) $line['quantity'];
                $subtotal = bcmul((string) $commodity->unit_price, (string) $qty, 2);

                CommodityRequestItem::create([
                    'org_id'               => $orgId,
                    'commodity_request_id' => $request->id,
                    'commodity_id'         => $commodity->id,
                    'quantity'             => $qty,
                    'unit_price'           => (string) $commodity->unit_price,
                    'subtotal'             => $subtotal,
                ]);

                $total = bcadd($total, $subtotal, 2);
            }

            $request->update(['total_amount' => $total]);

            return $request->load(['member', 'items.commodity']);
        });
    }

    public function approve(CommodityRequest $request, $user): CommodityRequest
    {
        abort_unless($request->status === 'pending', 422, 'Only pending requests can be approved.');

        $request->update([
            'status'      => 'approved',
            'approved_by' => $user->id,
            'approved_at' => now(),
        ]);

        return $request->fresh()->load(['member', 'items.commodity']);
    }

    public function reject(CommodityRequest $request, string $reason): CommodityRequest
    {
        abort_unless($request->status === 'pending', 422, 'Only pending requests can be rejected.');

        $request->update(['status' => 'rejected', 'notes' => $reason]);

        return $request->fresh()->load(['member', 'items.commodity']);
    }

    public function issue(CommodityRequest $request): CommodityRequest
    {
        abort_unless($request->status === 'approved', 422, 'Only approved requests can be issued.');

        DB::transaction(function () use ($request) {
            foreach ($request->items as $item) {
                $commodity = Commodity::lockForUpdate()->findOrFail($item->commodity_id);
                abort_if(
                    $commodity->stock_quantity < $item->quantity,
                    422,
                    "Insufficient stock for {$commodity->name}. Available: {$commodity->stock_quantity}."
                );
                $commodity->decrement('stock_quantity', $item->quantity);
            }

            $request->update(['status' => 'issued', 'issued_at' => now()]);
        });

        return $request->fresh()->load(['member', 'items.commodity']);
    }

    public function markRepaid(CommodityRequest $request): CommodityRequest
    {
        abort_unless($request->status === 'issued', 422, 'Only issued requests can be marked as repaid.');
        $request->update(['status' => 'repaid']);
        return $request->fresh()->load(['member', 'items.commodity']);
    }
}

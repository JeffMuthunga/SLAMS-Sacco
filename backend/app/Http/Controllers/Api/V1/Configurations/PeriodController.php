<?php

namespace App\Http\Controllers\Api\V1\Configurations;

use App\Http\Controllers\Api\V1\ApiController;
use App\Http\Requests\Api\V1\Configurations\UpdatePeriodStatusRequest;
use App\Http\Resources\V1\Configurations\PeriodResource;
use App\Models\Period;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PeriodController extends ApiController
{
    public function updateStatus(UpdatePeriodStatusRequest $request, string $id): JsonResponse
    {
        $orgId = $request->user()->org_id;
        $period = Period::where('org_id', $orgId)->findOrFail($id);

        $status = $request->input('status');

        if ($status === 'open') {
            if ($period->is_closed) {
                return $this->respondError('Cannot open a closed period.', 422);
            }
            $period->update(['is_opened' => true]);
        } elseif ($status === 'close') {
            if (!$period->is_opened) {
                return $this->respondError('Cannot close a period that is not open.', 422);
            }
            $period->update(['is_opened' => false, 'is_closed' => true]);
        } elseif ($status === 'post') {
            if (!$period->is_closed) {
                return $this->respondError('Cannot post an unclosed period.', 422);
            }
            $period->update(['is_posted' => true]);
        }

        return $this->respond(new PeriodResource($period), "Period status updated to {$status}.");
    }
}

<?php

namespace App\Http\Controllers\Api\V1\Configurations;

use App\Http\Controllers\Api\V1\ApiController;
use App\Http\Requests\Api\V1\Configurations\StoreFiscalYearRequest;
use App\Http\Requests\Api\V1\Configurations\UpdateFiscalYearRequest;
use App\Http\Resources\V1\Configurations\FiscalYearResource;
use App\Http\Resources\V1\Configurations\PeriodResource;
use App\Models\FiscalYear;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FiscalYearController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $orgId = $request->user()->org_id;

        $years = FiscalYear::where('org_id', $orgId)
            ->with('periods')
            ->orderBy('start_date', 'desc')
            ->get();

        return $this->respond(FiscalYearResource::collection($years), 'Fiscal years retrieved successfully.');
    }

    public function store(StoreFiscalYearRequest $request): JsonResponse
    {
        $orgId = $request->user()->org_id;
        $data = array_merge($request->validated(), ['org_id' => $orgId]);

        // Basic check for overlapping dates
        $overlap = FiscalYear::where('org_id', $orgId)
            ->where(function ($query) use ($data) {
                $query->whereBetween('start_date', [$data['start_date'], $data['end_date']])
                      ->orWhereBetween('end_date', [$data['start_date'], $data['end_date']])
                      ->orWhere(function ($q) use ($data) {
                          $q->where('start_date', '<=', $data['start_date'])
                            ->where('end_date', '>=', $data['end_date']);
                      });
            })->exists();

        if ($overlap) {
            return $this->respondError('The fiscal year dates overlap with an existing fiscal year.', 422);
        }

        $year = DB::transaction(function () use ($data) {
            $year = FiscalYear::create($data);

            // Automatically generate 12 monthly periods
            $start = Carbon::parse($data['start_date']);
            $end = Carbon::parse($data['end_date']);

            $current = $start->copy();
            $periodNumber = 1;

            while ($current <= $end) {
                $periodEnd = $current->copy()->endOfMonth();
                if ($periodEnd > $end) {
                    $periodEnd = $end;
                }

                $year->periods()->create([
                    'org_id' => $data['org_id'],
                    'name' => 'Period ' . $periodNumber . ' - ' . $current->format('M Y'),
                    'start_date' => $current->toDateString(),
                    'end_date' => $periodEnd->toDateString(),
                    'is_opened' => false,
                    'is_closed' => false,
                    'is_posted' => false,
                ]);

                $current->addMonth()->startOfMonth();
                $periodNumber++;
            }

            return $year;
        });

        $year->load('periods');

        return $this->respondCreated(new FiscalYearResource($year), 'Fiscal year created successfully.');
    }

    public function update(UpdateFiscalYearRequest $request, string $id): JsonResponse
    {
        $orgId = $request->user()->org_id;
        $year = FiscalYear::where('org_id', $orgId)->findOrFail($id);

        if ($year->is_closed) {
            return $this->respondError('Cannot update a closed fiscal year.', 422);
        }

        $data = $request->validated();

        $overlap = FiscalYear::where('org_id', $orgId)
            ->where('id', '!=', $id)
            ->where(function ($query) use ($data) {
                $query->whereBetween('start_date', [$data['start_date'], $data['end_date']])
                      ->orWhereBetween('end_date', [$data['start_date'], $data['end_date']])
                      ->orWhere(function ($q) use ($data) {
                          $q->where('start_date', '<=', $data['start_date'])
                            ->where('end_date', '>=', $data['end_date']);
                      });
            })->exists();

        if ($overlap) {
            return $this->respondError('The fiscal year dates overlap with an existing fiscal year.', 422);
        }

        $year->update($data);
        $year->load('periods');

        return $this->respond(new FiscalYearResource($year), 'Fiscal year updated successfully.');
    }

    public function periods(Request $request, string $fiscal_year): JsonResponse
    {
        $orgId = $request->user()->org_id;

        $year = FiscalYear::where('org_id', $orgId)->findOrFail($fiscal_year);

        $periods = $year->periods()
            ->orderBy('start_date')
            ->get();

        return $this->respond(PeriodResource::collection($periods), 'Periods retrieved.');
    }

    public function close(Request $request, string $id): JsonResponse
    {
        $orgId = $request->user()->org_id;
        $year = FiscalYear::where('org_id', $orgId)->with('periods')->findOrFail($id);

        if ($year->is_closed) {
            return $this->respondError('Fiscal year is already closed.', 422);
        }

        // Ensure all periods are closed
        $unclosedPeriods = $year->periods()->where('is_closed', false)->count();
        if ($unclosedPeriods > 0) {
            return $this->respondError('All periods must be closed before closing the fiscal year.', 422);
        }

        $year->update([
            'is_opened' => false,
            'is_closed' => true,
            'closed_at' => now(),
            'closed_by' => $request->user()->id,
        ]);

        return $this->respond(new FiscalYearResource($year), 'Fiscal year closed successfully.');
    }
}

<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\V1\DividendRunResource;
use App\Models\DividendRun;
use App\Services\DividendService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DividendController extends ApiController
{
    public function __construct(private DividendService $dividendService) {}

    public function index(Request $request): JsonResponse
    {
        $runs = DividendRun::where('org_id', $request->user()->org_id)
            ->with('fiscalYear')
            ->withCount('entries')
            ->latest()
            ->paginate($request->integer('per_page', 25));

        return $this->respond(
            DividendRunResource::collection($runs)->response()->getData(true)
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'fiscal_year_id' => ['required', 'uuid', 'exists:fiscal_years,id'],
            'rate'           => ['required', 'numeric', 'min:0.0001', 'max:1'],
            'notes'          => ['nullable', 'string', 'max:500'],
        ]);

        $run = $this->dividendService->calculate(
            $request->user()->org_id,
            $data['fiscal_year_id'],
            (string) $data['rate']
        );

        if (isset($data['notes'])) {
            $run->update(['notes' => $data['notes']]);
        }

        return $this->respondCreated(new DividendRunResource($run), 'Dividend run calculated.');
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $run = DividendRun::where('org_id', $request->user()->org_id)
            ->with(['fiscalYear', 'entries.member', 'entries.creditedAccount'])
            ->findOrFail($id);

        return $this->respond(new DividendRunResource($run));
    }

    public function approve(Request $request, string $id): JsonResponse
    {
        $run = DividendRun::where('org_id', $request->user()->org_id)->findOrFail($id);
        $run = $this->dividendService->approve($run, $request->user());

        return $this->respond(new DividendRunResource($run), 'Dividend run approved.');
    }

    public function post(Request $request, string $id): JsonResponse
    {
        $run = DividendRun::where('org_id', $request->user()->org_id)->findOrFail($id);
        $run = $this->dividendService->post($run);

        return $this->respond(new DividendRunResource($run), 'Dividend posted to member accounts.');
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $run = DividendRun::where('org_id', $request->user()->org_id)->findOrFail($id);
        abort_unless($run->status === 'draft', 422, 'Only draft runs can be deleted.');
        $run->delete();

        return $this->respond(null, 'Dividend run deleted.');
    }
}

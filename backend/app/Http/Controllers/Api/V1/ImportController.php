<?php

namespace App\Http\Controllers\Api\V1;

use App\Imports\DepositAccountsImport;
use App\Imports\LoansImport;
use App\Imports\MembersImport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;

class ImportController extends ApiController
{
    private array $allowed = ['members', 'accounts', 'loans'];

    public function template(Request $request, string $entity): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        abort_unless(in_array($entity, $this->allowed, true), 404);

        $map = [
            'members'  => 'members_template.csv',
            'accounts' => 'accounts_template.csv',
            'loans'    => 'loans_template.csv',
        ];

        $path = "templates/{$map[$entity]}";
        abort_unless(Storage::disk('local')->exists($path), 404, 'Template not found.');

        return Storage::disk('local')->download($path, $map[$entity]);
    }

    public function dryRun(Request $request, string $entity): JsonResponse
    {
        abort_unless(in_array($entity, $this->allowed, true), 404);

        $request->validate(['file' => ['required', 'file', 'mimes:csv,xlsx,xls', 'max:10240']]);

        $orgId  = $request->user()->org_id;
        $import = $this->makeImport($entity, $orgId, true);

        try {
            Excel::import($import, $request->file('file'));
            $failures = collect($import->failures())->map(fn ($f) => [
                'row'    => $f->row(),
                'errors' => $f->errors(),
                'values' => $f->values(),
            ])->all();
        } catch (\Throwable $e) {
            return $this->respondError('File could not be parsed: ' . $e->getMessage(), 422);
        }

        return $this->respond([
            'rows_valid'    => $import->getInserted(),
            'rows_skipped'  => $import->getSkipped(),
            'failure_count' => count($failures),
            'failures'      => $failures,
        ], count($failures) === 0 ? 'Validation passed.' : 'Validation completed with errors.');
    }

    public function commit(Request $request, string $entity): JsonResponse
    {
        abort_unless(in_array($entity, $this->allowed, true), 404);

        $request->validate(['file' => ['required', 'file', 'mimes:csv,xlsx,xls', 'max:10240']]);

        $orgId  = $request->user()->org_id;
        $import = $this->makeImport($entity, $orgId, false);

        try {
            Excel::import($import, $request->file('file'));
        } catch (\Throwable $e) {
            return $this->respondError('Import failed: ' . $e->getMessage(), 422);
        }

        $failCount = count($import->failures());

        return $this->respond([
            'inserted'      => $import->getInserted(),
            'skipped'       => $import->getSkipped(),
            'failure_count' => $failCount,
        ], "Import complete. {$import->getInserted()} records inserted, {$import->getSkipped()} skipped, {$failCount} failed.");
    }

    private function makeImport(string $entity, string $orgId, bool $dryRun): MembersImport|DepositAccountsImport|LoansImport
    {
        return match ($entity) {
            'members'  => new MembersImport($orgId, $dryRun),
            'accounts' => new DepositAccountsImport($orgId, $dryRun),
            'loans'    => new LoansImport($orgId, $dryRun),
        };
    }
}

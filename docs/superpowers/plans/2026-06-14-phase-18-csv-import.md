# Phase 18: CSV / Excel Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow admins to bulk-import Members, Deposit Accounts, and historical Loans via CSV/Excel upload — with a dry-run validation mode and a commit mode.

**Architecture:** Uses `maatwebsite/excel` (Laravel Excel) for xlsx + csv parsing. One `Import` class per entity, each implementing `WithHeadingRow` + `SkipsOnFailure` + `WithValidation`. `ImportController` exposes `/imports/{entity}/dry-run` and `/imports/{entity}/commit`. Frontend shows a three-tab page with template download, file upload, error preview, and commit confirmation.

**Tech Stack:** Laravel 12, `maatwebsite/excel ^3.1`, Next.js 16, React Query, shadcn/ui.

---

## File Map

**Install (backend):**
- `composer require maatwebsite/excel` — package install

**Create (backend):**
- `backend/app/Imports/MembersImport.php`
- `backend/app/Imports/DepositAccountsImport.php`
- `backend/app/Imports/LoansImport.php`
- `backend/app/Http/Controllers/Api/V1/ImportController.php`
- `backend/storage/app/templates/members_template.csv`
- `backend/storage/app/templates/accounts_template.csv`
- `backend/storage/app/templates/loans_template.csv`

**Modify (backend):**
- `backend/routes/api.php` — add import routes
- `backend/config/filesystems.php` — ensure `local` disk is configured (likely already is)

**Create (frontend):**
- `frontend/src/lib/api/imports.ts`
- `frontend/src/app/admin/import/page.tsx`

**Modify (frontend):**
- `frontend/src/components/Layouts/sidebar/data/index.ts` — add Import nav item

---

## Task 1: Install maatwebsite/excel

- [ ] Install the package:

```bash
cd backend && composer require maatwebsite/excel
```

Expected: composer resolves and installs `maatwebsite/excel` without errors. Laravel auto-discovers the service provider.

- [ ] Commit:

```bash
git add backend/composer.json backend/composer.lock
git commit -m "feat(import): install maatwebsite/excel"
```

---

## Task 2: CSV template files

These files serve as download templates to show users the correct column format.

- [ ] Create `backend/storage/app/templates/members_template.csv`:

```
full_name,id_number,id_type,email,phone,phone2,gender,date_of_birth,entry_date,employed,employer_name,monthly_salary,address,town
John Doe,BWA000001,national_id,john@example.com,+26771000001,,M,1990-01-15,2024-01-01,false,,,Gaborone,Gaborone
```

- [ ] Create `backend/storage/app/templates/accounts_template.csv`:

```
member_id_number,account_type,balance,opened_date
BWA000001,savings,1500.00,2024-01-01
```

- [ ] Create `backend/storage/app/templates/loans_template.csv`:

```
member_id_number,loan_product_name,principal_amount,interest_rate,repayment_period,repayment_frequency,disbursed_date,outstanding_balance
BWA000001,Personal Loan,10000.00,18.00,12,monthly,2024-01-15,8500.00
```

- [ ] Commit:

```bash
git add backend/storage/app/templates/
git commit -m "feat(import): add CSV template files for download"
```

---

## Task 3: MembersImport class

- [ ] Create `backend/app/Imports/MembersImport.php`:

```php
<?php

namespace App\Imports;

use App\Models\Member;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\SkipsFailures;
use Maatwebsite\Excel\Concerns\WithBatchInserts;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Illuminate\Support\Facades\DB;

class MembersImport implements ToModel, WithHeadingRow, WithValidation, SkipsOnFailure, WithBatchInserts, WithChunkReading
{
    use SkipsFailures;

    private string $orgId;
    private bool $dryRun;
    private int $inserted = 0;
    private int $skipped  = 0;

    public function __construct(string $orgId, bool $dryRun = false)
    {
        $this->orgId  = $orgId;
        $this->dryRun = $dryRun;
    }

    public function model(array $row): ?Member
    {
        // Skip duplicates by id_number
        if (Member::where('org_id', $this->orgId)->where('id_number', $row['id_number'])->exists()) {
            $this->skipped++;
            return null;
        }

        if ($this->dryRun) {
            $this->inserted++;
            return null; // validation passes, don't actually create
        }

        $this->inserted++;

        $year   = now()->year;
        $prefix = "IMP-{$year}-";
        $max    = Member::withTrashed()->where('org_id', $this->orgId)
            ->where('member_number', 'like', $prefix . '%')
            ->max('member_number');
        $next   = $max ? ((int) substr($max, -4)) + 1 : 1;

        return new Member([
            'org_id'          => $this->orgId,
            'member_number'   => $prefix . str_pad($next, 4, '0', STR_PAD_LEFT),
            'full_name'       => $row['full_name'],
            'id_number'       => $row['id_number'],
            'id_type'         => $row['id_type'] ?? 'national_id',
            'email'           => $row['email'] ?: null,
            'phone'           => $row['phone'],
            'phone2'          => $row['phone2'] ?: null,
            'gender'          => $row['gender'] ?: null,
            'date_of_birth'   => $row['date_of_birth'],
            'entry_date'      => $row['entry_date'] ?? now()->toDateString(),
            'employed'        => filter_var($row['employed'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'employer_name'   => $row['employer_name'] ?: null,
            'monthly_salary'  => $row['monthly_salary'] ?: null,
            'address'         => $row['address'] ?: null,
            'town'            => $row['town'] ?: null,
            'approval_status' => 'approved',
            'is_active'       => true,
        ]);
    }

    public function rules(): array
    {
        return [
            'full_name'     => ['required', 'string'],
            'id_number'     => ['required', 'string'],
            'phone'         => ['required', 'string'],
            'date_of_birth' => ['required', 'date'],
        ];
    }

    public function customValidationMessages(): array
    {
        return [
            'full_name.required'     => 'full_name is required.',
            'id_number.required'     => 'id_number is required.',
            'phone.required'         => 'phone is required.',
            'date_of_birth.required' => 'date_of_birth is required.',
            'date_of_birth.date'     => 'date_of_birth must be a valid date (YYYY-MM-DD).',
        ];
    }

    public function batchSize(): int  { return 100; }
    public function chunkSize(): int  { return 200; }

    public function getInserted(): int { return $this->inserted; }
    public function getSkipped(): int  { return $this->skipped; }
}
```

- [ ] Commit:

```bash
git add backend/app/Imports/MembersImport.php
git commit -m "feat(import): add MembersImport class"
```

---

## Task 4: DepositAccountsImport class

- [ ] Create `backend/app/Imports/DepositAccountsImport.php`:

```php
<?php

namespace App\Imports;

use App\Models\DepositAccount;
use App\Models\Member;
use App\Models\SavingProduct;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\SkipsFailures;
use Maatwebsite\Excel\Concerns\WithChunkReading;

class DepositAccountsImport implements ToModel, WithHeadingRow, WithValidation, SkipsOnFailure, WithChunkReading
{
    use SkipsFailures;

    private string $orgId;
    private bool $dryRun;
    private int $inserted = 0;
    private int $skipped  = 0;

    public function __construct(string $orgId, bool $dryRun = false)
    {
        $this->orgId  = $orgId;
        $this->dryRun = $dryRun;
    }

    public function model(array $row): ?DepositAccount
    {
        $member = Member::where('org_id', $this->orgId)
            ->where('id_number', $row['member_id_number'])
            ->first();

        if (! $member) {
            $this->skipped++;
            return null;
        }

        if ($this->dryRun) {
            $this->inserted++;
            return null;
        }

        $this->inserted++;

        $year   = now()->year;
        $prefix = "ACC-{$year}-";
        $max    = DepositAccount::withTrashed()->where('org_id', $this->orgId)
            ->where('account_number', 'like', $prefix . '%')
            ->max('account_number');
        $next   = $max ? ((int) substr($max, -4)) + 1 : 1;

        // Try to find a default saving product
        $product = SavingProduct::where('org_id', $this->orgId)->first();

        return new DepositAccount([
            'org_id'             => $this->orgId,
            'member_id'          => $member->id,
            'saving_product_id'  => $product?->id,
            'account_number'     => $prefix . str_pad($next, 4, '0', STR_PAD_LEFT),
            'balance'            => $row['balance'] ?? '0.00',
            'is_active'          => true,
            'opened_date'        => $row['opened_date'] ?? now()->toDateString(),
        ]);
    }

    public function rules(): array
    {
        return [
            'member_id_number' => ['required', 'string'],
            'balance'          => ['nullable', 'numeric', 'min:0'],
            'opened_date'      => ['nullable', 'date'],
        ];
    }

    public function chunkSize(): int  { return 200; }
    public function getInserted(): int { return $this->inserted; }
    public function getSkipped(): int  { return $this->skipped; }
}
```

- [ ] Commit:

```bash
git add backend/app/Imports/DepositAccountsImport.php
git commit -m "feat(import): add DepositAccountsImport class"
```

---

## Task 5: LoansImport class

- [ ] Create `backend/app/Imports/LoansImport.php`:

```php
<?php

namespace App\Imports;

use App\Models\Loan;
use App\Models\LoanProduct;
use App\Models\Member;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\SkipsFailures;
use Maatwebsite\Excel\Concerns\WithChunkReading;

class LoansImport implements ToModel, WithHeadingRow, WithValidation, SkipsOnFailure, WithChunkReading
{
    use SkipsFailures;

    private string $orgId;
    private bool $dryRun;
    private int $inserted = 0;
    private int $skipped  = 0;

    public function __construct(string $orgId, bool $dryRun = false)
    {
        $this->orgId  = $orgId;
        $this->dryRun = $dryRun;
    }

    public function model(array $row): ?Loan
    {
        $member = Member::where('org_id', $this->orgId)
            ->where('id_number', $row['member_id_number'])
            ->first();

        $product = LoanProduct::where('org_id', $this->orgId)
            ->where('name', $row['loan_product_name'])
            ->first();

        if (! $member || ! $product) {
            $this->skipped++;
            return null;
        }

        if ($this->dryRun) {
            $this->inserted++;
            return null;
        }

        $this->inserted++;

        $year   = now()->year;
        $prefix = "LN-{$year}-";
        $max    = Loan::withTrashed()->where('org_id', $this->orgId)
            ->where('account_number', 'like', $prefix . '%')
            ->max('account_number');
        $next   = $max ? ((int) substr($max, -4)) + 1 : 1;

        return new Loan([
            'org_id'              => $this->orgId,
            'member_id'           => $member->id,
            'loan_product_id'     => $product->id,
            'account_number'      => $prefix . str_pad($next, 4, '0', STR_PAD_LEFT),
            'principal_amount'    => $row['principal_amount'],
            'interest_rate'       => $row['interest_rate'] ?? $product->interest_rate,
            'repayment_period'    => $row['repayment_period'],
            'repayment_frequency' => $row['repayment_frequency'] ?? 'monthly',
            'outstanding_balance' => $row['outstanding_balance'] ?? $row['principal_amount'],
            'repayment_amount'    => '0.00',
            'total_payable'       => $row['principal_amount'],
            'loan_status'         => 'active',
            'approval_status'     => 'approved',
            'disbursed_date'      => $row['disbursed_date'] ?? null,
        ]);
    }

    public function rules(): array
    {
        return [
            'member_id_number'  => ['required', 'string'],
            'loan_product_name' => ['required', 'string'],
            'principal_amount'  => ['required', 'numeric', 'min:0'],
            'repayment_period'  => ['required', 'integer', 'min:1'],
        ];
    }

    public function chunkSize(): int  { return 100; }
    public function getInserted(): int { return $this->inserted; }
    public function getSkipped(): int  { return $this->skipped; }
}
```

- [ ] Commit:

```bash
git add backend/app/Imports/LoansImport.php
git commit -m "feat(import): add LoansImport class"
```

---

## Task 6: ImportController + Routes

- [ ] Create `backend/app/Http/Controllers/Api/V1/ImportController.php`:

```php
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

        $orgId    = $request->user()->org_id;
        $import   = $this->makeImport($entity, $orgId, true);
        $failures = [];

        try {
            Excel::import($import, $request->file('file'));
            $failures = collect($import->failures())->map(fn ($f) => [
                'row'     => $f->row(),
                'errors'  => $f->errors(),
                'values'  => $f->values(),
            ])->all();
        } catch (\Throwable $e) {
            return $this->respondError('File could not be parsed: ' . $e->getMessage(), 422);
        }

        return $this->respond([
            'rows_valid'   => $import->getInserted(),
            'rows_skipped' => $import->getSkipped(),
            'failure_count'=> count($failures),
            'failures'     => $failures,
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
```

- [ ] Add `manage_imports` permission to `RbacSeeder.php` and include in admin `syncPermissions`.

- [ ] Add import routes to `api.php`:

```php
Route::middleware(['auth:sanctum', 'permission:manage_imports'])->prefix('imports')->group(function () {
    Route::get('templates/{entity}',        [\App\Http\Controllers\Api\V1\ImportController::class, 'template']);
    Route::post('{entity}/dry-run',         [\App\Http\Controllers\Api\V1\ImportController::class, 'dryRun']);
    Route::post('{entity}/commit',          [\App\Http\Controllers\Api\V1\ImportController::class, 'commit']);
});
```

- [ ] Re-run seeder:

```bash
cd backend && php artisan db:seed --class=RbacSeeder
```

- [ ] Commit:

```bash
git add backend/app/Http/Controllers/Api/V1/ImportController.php \
        backend/routes/api.php \
        backend/database/seeders/RbacSeeder.php
git commit -m "feat(import): add ImportController, routes, manage_imports permission"
```

---

## Task 7: Frontend API hooks

- [ ] Create `frontend/src/lib/api/imports.ts`:

```typescript
import { api, ApiEnvelope } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────

export type ImportEntity = "members" | "accounts" | "loans";

export interface ImportFailure {
  row: number;
  errors: string[];
  values: Record<string, string>;
}

export interface DryRunResult {
  rows_valid: number;
  rows_skipped: number;
  failure_count: number;
  failures: ImportFailure[];
}

export interface CommitResult {
  inserted: number;
  skipped: number;
  failure_count: number;
}

// ── API calls (not React Query — upload uses FormData) ──────────────────

export async function downloadTemplate(entity: ImportEntity): Promise<void> {
  const response = await api.get(`/imports/templates/${entity}`, { responseType: "blob" });
  const url      = URL.createObjectURL(new Blob([response.data]));
  const link     = document.createElement("a");
  link.href      = url;
  link.download  = `${entity}_template.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function dryRunImport(entity: ImportEntity, file: File): Promise<DryRunResult> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<ApiEnvelope<DryRunResult>>(
    `/imports/${entity}/dry-run`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data.data;
}

export async function commitImport(entity: ImportEntity, file: File): Promise<CommitResult> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<ApiEnvelope<CommitResult>>(
    `/imports/${entity}/commit`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data.data;
}
```

- [ ] Commit:

```bash
git add frontend/src/lib/api/imports.ts
git commit -m "feat(import): add frontend import API helpers"
```

---

## Task 8: Admin Import page

- [ ] Create `frontend/src/app/admin/import/page.tsx`:

```tsx
"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  downloadTemplate, dryRunImport, commitImport,
  ImportEntity, DryRunResult, CommitResult, ImportFailure,
} from "@/lib/api/imports";
import { extractApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ENTITIES: { key: ImportEntity; label: string; description: string }[] = [
  { key: "members",  label: "Members",  description: "Import member records. Columns: full_name, id_number, id_type, email, phone, gender, date_of_birth, entry_date, employed, employer_name, monthly_salary, address, town" },
  { key: "accounts", label: "Accounts", description: "Import deposit accounts. Columns: member_id_number, balance, opened_date" },
  { key: "loans",    label: "Loans",    description: "Import historical active loans. Columns: member_id_number, loan_product_name, principal_amount, interest_rate, repayment_period, repayment_frequency, disbursed_date, outstanding_balance" },
];

function ImportTab({ entity, description }: { entity: ImportEntity; description: string }) {
  const fileRef         = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dryRunResult, setDryRunResult] = useState<DryRunResult | null>(null);
  const [commitResult, setCommitResult] = useState<CommitResult | null>(null);
  const [validating, setValidating]     = useState(false);
  const [committing, setCommitting]     = useState(false);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
    setDryRunResult(null);
    setCommitResult(null);
  }

  async function handleValidate() {
    if (!file) { toast.error("Please select a file first."); return; }
    setValidating(true);
    setDryRunResult(null);
    try {
      const result = await dryRunImport(entity, file);
      setDryRunResult(result);
      if (result.failure_count === 0) {
        toast.success(`Validation passed. ${result.rows_valid} row(s) ready to import.`);
      } else {
        toast.warning(`${result.failure_count} row(s) have errors. Fix them before importing.`);
      }
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setValidating(false);
    }
  }

  async function handleCommit() {
    if (!file) return;
    if (!confirm(`Import ${dryRunResult?.rows_valid ?? "?"} records? This cannot be undone.`)) return;
    setCommitting(true);
    try {
      const result = await commitImport(entity, file);
      setCommitResult(result);
      toast.success(`Import complete: ${result.inserted} inserted, ${result.skipped} skipped.`);
      setFile(null);
      setDryRunResult(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setCommitting(false);
    }
  }

  const canCommit = dryRunResult !== null && dryRunResult.failure_count === 0 && dryRunResult.rows_valid > 0;

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">{description}</p>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => downloadTemplate(entity)}>
          Download Template
        </Button>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Upload File (.csv or .xlsx)</label>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={onFileChange}
          className="block text-sm"
        />
        {file && <p className="text-xs text-gray-500">Selected: {file.name} ({Math.round(file.size / 1024)} KB)</p>}
      </div>

      <div className="flex gap-3">
        <Button onClick={handleValidate} disabled={!file || validating}>
          {validating ? "Validating…" : "Validate File"}
        </Button>
        <Button onClick={handleCommit} disabled={!canCommit || committing}>
          {committing ? "Importing…" : "Import"}
        </Button>
      </div>

      {dryRunResult && (
        <div className={`rounded border p-4 space-y-2 ${dryRunResult.failure_count > 0 ? "border-red-300 bg-red-50" : "border-green-300 bg-green-50"}`}>
          <div className="flex gap-6 text-sm">
            <span>✓ Valid rows: <strong>{dryRunResult.rows_valid}</strong></span>
            <span>⏭ Skipped (duplicates): <strong>{dryRunResult.rows_skipped}</strong></span>
            <span className={dryRunResult.failure_count > 0 ? "text-red-600 font-medium" : ""}>
              ✕ Errors: <strong>{dryRunResult.failure_count}</strong>
            </span>
          </div>

          {dryRunResult.failures.length > 0 && (
            <div className="max-h-64 overflow-y-auto">
              <table className="text-xs w-full border-collapse">
                <thead>
                  <tr className="bg-red-100">
                    <th className="border px-2 py-1 text-left">Row</th>
                    <th className="border px-2 py-1 text-left">Errors</th>
                    <th className="border px-2 py-1 text-left">Values</th>
                  </tr>
                </thead>
                <tbody>
                  {dryRunResult.failures.map((f: ImportFailure, i) => (
                    <tr key={i} className="odd:bg-white even:bg-red-50">
                      <td className="border px-2 py-1">{f.row}</td>
                      <td className="border px-2 py-1">{f.errors.join(", ")}</td>
                      <td className="border px-2 py-1 font-mono truncate max-w-xs">
                        {Object.entries(f.values).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(" | ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {commitResult && (
        <div className="rounded border border-green-300 bg-green-50 p-4 text-sm space-y-1">
          <p className="font-semibold text-green-700">Import complete</p>
          <p>Records inserted: <strong>{commitResult.inserted}</strong></p>
          <p>Records skipped: <strong>{commitResult.skipped}</strong></p>
          {commitResult.failure_count > 0 && (
            <p className="text-red-600">Rows with errors (not imported): <strong>{commitResult.failure_count}</strong></p>
          )}
        </div>
      )}
    </div>
  );
}

export default function ImportPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Import Data</h1>
      <p className="text-gray-500 text-sm">
        Upload a CSV or Excel file to bulk-import records. Always validate first, then import.
        Download a template to see the required column format.
      </p>

      <Tabs defaultValue="members">
        <TabsList>
          {ENTITIES.map(e => (
            <TabsTrigger key={e.key} value={e.key}>{e.label}</TabsTrigger>
          ))}
        </TabsList>
        {ENTITIES.map(e => (
          <TabsContent key={e.key} value={e.key} className="mt-4">
            <ImportTab entity={e.key} description={e.description} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
```

- [ ] Commit:

```bash
git add frontend/src/app/admin/import/page.tsx
git commit -m "feat(import): add admin import page with dry-run + commit flow"
```

---

## Task 9: Sidebar nav

**Files:**
- Modify: `frontend/src/components/Layouts/sidebar/data/index.ts`

- [ ] Add to the admin MAIN MENU `Administration` group items:

```typescript
{ title: "Import Data", url: "/admin/import" },
```

- [ ] Run TypeScript check:

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] Commit:

```bash
git add frontend/src/components/Layouts/sidebar/data/index.ts
git commit -m "feat(import): add Import Data to admin sidebar"
```

---

## Task 10: Verify DepositAccount model has `opened_date` fillable

The `DepositAccountsImport` sets `opened_date`. Confirm the `DepositAccount` model includes it in `$fillable`.

- [ ] Run:

```bash
grep -n "opened_date\|fillable" backend/app/Models/DepositAccount.php
```

If `opened_date` is missing from `$fillable`, add it. If the column doesn't exist in the DB schema, add a migration:

```bash
php artisan make:migration add_opened_date_to_deposit_accounts_table
```

Migration content:

```php
Schema::table('deposit_accounts', function (Blueprint $table) {
    $table->date('opened_date')->nullable()->after('balance');
});
```

```bash
cd backend && php artisan migrate
```

- [ ] Commit any changes:

```bash
git add backend/app/Models/DepositAccount.php backend/database/migrations/
git commit -m "feat(import): ensure deposit_accounts has opened_date column and fillable"
```

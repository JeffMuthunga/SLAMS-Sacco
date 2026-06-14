"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  downloadTemplate,
  dryRunImport,
  commitImport,
  type ImportEntity,
  type DryRunResult,
  type CommitResult,
  type ImportFailure,
} from "@/lib/api/imports";
import { extractApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ENTITIES: { key: ImportEntity; label: string; description: string }[] = [
  {
    key: "members",
    label: "Members",
    description:
      "Import member records. Columns: full_name, id_number, id_type, email, phone, gender, date_of_birth, entry_date, employed, employer_name, monthly_salary, address, town",
  },
  {
    key: "accounts",
    label: "Accounts",
    description: "Import deposit accounts. Columns: member_id_number, balance, opened_date",
  },
  {
    key: "loans",
    label: "Loans",
    description:
      "Import historical active loans. Columns: member_id_number, loan_product_name, principal_amount, interest_rate, repayment_period, repayment_frequency, disbursed_date, outstanding_balance",
  },
];

function ImportTab({
  entity,
  description,
}: {
  entity: ImportEntity;
  description: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dryRunResult, setDryRunResult] = useState<DryRunResult | null>(null);
  const [commitResult, setCommitResult] = useState<CommitResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [committing, setCommitting] = useState(false);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
    setDryRunResult(null);
    setCommitResult(null);
  }

  async function handleValidate() {
    if (!file) {
      toast.error("Please select a file first.");
      return;
    }
    setValidating(true);
    setDryRunResult(null);
    try {
      const result = await dryRunImport(entity, file);
      setDryRunResult(result);
      if (result.failure_count === 0) {
        toast.success(
          `Validation passed. ${result.rows_valid} row(s) ready to import.`
        );
      } else {
        toast.warning(
          `${result.failure_count} row(s) have errors. Fix them before importing.`
        );
      }
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setValidating(false);
    }
  }

  async function handleCommit() {
    if (!file) return;
    if (
      !confirm(
        `Import ${dryRunResult?.rows_valid ?? "?"} records? This cannot be undone.`
      )
    )
      return;
    setCommitting(true);
    try {
      const result = await commitImport(entity, file);
      setCommitResult(result);
      toast.success(
        `Import complete: ${result.inserted} inserted, ${result.skipped} skipped.`
      );
      setFile(null);
      setDryRunResult(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setCommitting(false);
    }
  }

  const canCommit =
    dryRunResult !== null &&
    dryRunResult.failure_count === 0 &&
    dryRunResult.rows_valid > 0;

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">{description}</p>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => downloadTemplate(entity)}>
          Download Template
        </Button>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Upload File (.csv or .xlsx)
        </label>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={onFileChange}
          className="block text-sm"
        />
        {file && (
          <p className="text-xs text-gray-500">
            Selected: {file.name} ({Math.round(file.size / 1024)} KB)
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button onClick={handleValidate} disabled={!file || validating}>
          {validating ? "Validating..." : "Validate File"}
        </Button>
        <Button onClick={handleCommit} disabled={!canCommit || committing}>
          {committing ? "Importing..." : "Import"}
        </Button>
      </div>

      {dryRunResult && (
        <div
          className={`rounded border p-4 space-y-2 ${
            dryRunResult.failure_count > 0
              ? "border-red-300 bg-red-50"
              : "border-green-300 bg-green-50"
          }`}
        >
          <div className="flex gap-6 text-sm">
            <span>
              Valid rows: <strong>{dryRunResult.rows_valid}</strong>
            </span>
            <span>
              Skipped (duplicates):{" "}
              <strong>{dryRunResult.rows_skipped}</strong>
            </span>
            <span
              className={
                dryRunResult.failure_count > 0
                  ? "text-red-600 font-medium"
                  : ""
              }
            >
              Errors: <strong>{dryRunResult.failure_count}</strong>
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
                  {dryRunResult.failures.map((f: ImportFailure, i: number) => (
                    <tr key={i} className="odd:bg-white even:bg-red-50">
                      <td className="border px-2 py-1">{f.row}</td>
                      <td className="border px-2 py-1">
                        {f.errors.join(", ")}
                      </td>
                      <td className="border px-2 py-1 font-mono truncate max-w-xs">
                        {Object.entries(f.values)
                          .slice(0, 3)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(" | ")}
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
          <p>
            Records inserted: <strong>{commitResult.inserted}</strong>
          </p>
          <p>
            Records skipped: <strong>{commitResult.skipped}</strong>
          </p>
          {commitResult.failure_count > 0 && (
            <p className="text-red-600">
              Rows with errors (not imported):{" "}
              <strong>{commitResult.failure_count}</strong>
            </p>
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
        Upload a CSV or Excel file to bulk-import records. Always validate
        first, then import. Download a template to see the required column
        format.
      </p>

      <Tabs defaultValue="members">
        <TabsList>
          {ENTITIES.map((e) => (
            <TabsTrigger key={e.key} value={e.key}>
              {e.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {ENTITIES.map((e) => (
          <TabsContent key={e.key} value={e.key} className="mt-4">
            <ImportTab entity={e.key} description={e.description} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

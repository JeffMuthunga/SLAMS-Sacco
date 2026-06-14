"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  useDividendRuns,
  useCreateDividendRun,
  useDeleteDividendRun,
  type DividendRun,
} from "@/lib/api/dividends";
import { useFiscalYears } from "@/lib/api/configurations";
import { extractApiError, extractFieldErrors } from "@/lib/api";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ColumnDef } from "@tanstack/react-table";

const fmt = (v: string) =>
  new Intl.NumberFormat("en-BW", { style: "currency", currency: "BWP" }).format(
    Number(v)
  );

export default function DividendRunsPage() {
  const { data, isLoading } = useDividendRuns();
  const { data: fiscalYears = [] } = useFiscalYears();
  const createMut = useCreateDividendRun();
  const deleteMut = useDeleteDividendRun();

  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ fiscal_year_id: "", rate: "", notes: "" });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    try {
      await createMut.mutateAsync({
        fiscal_year_id: form.fiscal_year_id,
        rate: String(Number(form.rate) / 100),
        notes: form.notes || undefined,
      });
      toast.success("Dividend run calculated.");
      setOpen(false);
      setForm({ fiscal_year_id: "", rate: "", notes: "" });
    } catch (err) {
      const fe = extractFieldErrors(err);
      if (Object.keys(fe).length) { setErrors(fe); return; }
      toast.error(extractApiError(err));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this draft dividend run?")) return;
    try {
      await deleteMut.mutateAsync(id);
      toast.success("Deleted.");
    } catch (err) { toast.error(extractApiError(err)); }
  }

  const runs = data?.data ?? [];

  const STATUS_COLOR: Record<string, string> = {
    draft: "text-yellow-600",
    approved: "text-blue-600 font-medium",
    posted: "text-green-600 font-medium",
  };

  const columns: ColumnDef<DividendRun>[] = [
    {
      id: "fiscal_year",
      header: "Fiscal Year",
      cell: ({ row }) => row.original.fiscal_year?.fiscal_year ?? "—",
    },
    {
      accessorKey: "rate",
      header: "Rate",
      cell: ({ row }) => `${(Number(row.original.rate) * 100).toFixed(2)}%`,
    },
    {
      accessorKey: "total_dividend",
      header: "Total Dividend",
      cell: ({ row }) => fmt(row.original.total_dividend),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span className={STATUS_COLOR[row.original.status] ?? ""}>
          {row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Link href={`/admin/dividends/${row.original.id}`}>
            <Button size="sm" variant="outline">View</Button>
          </Link>
          {row.original.status === "draft" && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleDelete(row.original.id)}
            >
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dividend Runs</h1>
        <Button
          onClick={() => {
            setForm({ fiscal_year_id: "", rate: "", notes: "" });
            setErrors({});
            setOpen(true);
          }}
        >
          + New Dividend Run
        </Button>
      </div>

      <DataTable columns={columns} data={runs} isLoading={isLoading} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Dividend Run</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label>Fiscal Year</Label>
              <select
                className="w-full border rounded p-2 text-sm"
                value={form.fiscal_year_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fiscal_year_id: e.target.value }))
                }
                required
              >
                <option value="">Select fiscal year…</option>
                {fiscalYears.map((fy) => (
                  <option key={fy.id} value={fy.id}>
                    {fy.fiscal_year}
                  </option>
                ))}
              </select>
              {errors.fiscal_year_id && (
                <p className="text-red-500 text-xs">{errors.fiscal_year_id}</p>
              )}
            </div>
            <div>
              <Label>Dividend Rate (%)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max="100"
                placeholder="e.g. 10 for 10%"
                value={form.rate}
                onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))}
                required
              />
              {errors.rate && (
                <p className="text-red-500 text-xs">{errors.rate}</p>
              )}
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMut.isPending}>
                Calculate
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

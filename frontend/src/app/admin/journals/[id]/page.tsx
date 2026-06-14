"use client";

import React, { use } from "react";
import { useRouter } from "next/navigation";
import {
  useJournal,
  usePostJournal,
  useReverseJournal,
  useDeleteJournal,
} from "@/lib/api/journals";
import { extractApiError } from "@/lib/api";
import { toast } from "sonner";

function fmt(v: string) {
  return parseFloat(v).toLocaleString("en-BW", { minimumFractionDigits: 2 });
}

function StatusBadge({ journal }: { journal: { is_posted: boolean; is_reversed: boolean } }) {
  if (journal.is_reversed) {
    return <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">Reversed</span>;
  }
  return journal.is_posted ? (
    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">Posted</span>
  ) : (
    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">Draft</span>
  );
}

export default function JournalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router  = useRouter();

  const { data: journal, isLoading, error } = useJournal(id);
  const postMutation    = usePostJournal();
  const reverseMutation = useReverseJournal();
  const deleteMutation  = useDeleteJournal();

  if (isLoading) return <p className="p-6 text-gray-500">Loading…</p>;
  if (error)     return <p className="p-6 text-red-500">{extractApiError(error)}</p>;
  if (!journal)  return null;

  const handlePost = () => {
    postMutation.mutate(journal.id, {
      onSuccess: () => toast.success("Journal posted."),
      onError: (err) => toast.error(extractApiError(err)),
    });
  };

  const handleReverse = () => {
    if (!confirm("Create a reversing entry for this journal?")) return;
    reverseMutation.mutate(journal.id, {
      onSuccess: (j) => {
        toast.success("Reversing journal created.");
        router.push(`/admin/journals/${j.id}`);
      },
      onError: (err) => toast.error(extractApiError(err)),
    });
  };

  const handleDelete = () => {
    if (!confirm("Delete this draft journal entry?")) return;
    deleteMutation.mutate(journal.id, {
      onSuccess: () => {
        toast.success("Journal deleted.");
        router.push("/admin/journals");
      },
      onError: (err) => toast.error(extractApiError(err)),
    });
  };

  const totalDebit  = journal.lines.reduce((s, l) => s + parseFloat(l.debit),  0);
  const totalCredit = journal.lines.reduce((s, l) => s + parseFloat(l.credit), 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dark dark:text-white">
            {journal.reference_number}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {new Date(journal.journal_date).toLocaleDateString("en-BW", { dateStyle: "long" })}
            {journal.period && <> · {journal.period.name}</>}
            {journal.fiscal_year && <> · {journal.fiscal_year.name}</>}
          </p>
          {journal.narration && <p className="mt-1 text-sm text-gray-600">{journal.narration}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge journal={journal} />
          {!journal.is_posted && (
            <>
              <button
                onClick={handlePost}
                disabled={postMutation.isPending}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                Post Journal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Delete
              </button>
            </>
          )}
          {journal.is_posted && !journal.is_reversed && (
            <button
              onClick={handleReverse}
              disabled={reverseMutation.isPending}
              className="rounded-lg border border-orange-300 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-50 disabled:opacity-50"
            >
              Reverse
            </button>
          )}
        </div>
      </div>

      {/* Lines table */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-dark">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-dark dark:text-white">Journal Lines</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left font-medium text-gray-500">Account</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Narration</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Debit</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Credit</th>
              </tr>
            </thead>
            <tbody>
              {journal.lines.map((line) => (
                <tr key={line.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <td className="px-4 py-3">
                    {line.account ? (
                      <span>
                        <span className="font-mono text-gray-500">{line.account.code}</span>
                        {" – "}
                        {line.account.name}
                      </span>
                    ) : line.account_id}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{line.narration ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {parseFloat(line.debit) > 0 ? fmt(line.debit) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {parseFloat(line.credit) > 0 ? fmt(line.credit) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 font-semibold">
                <td className="px-4 pt-3 text-gray-600" colSpan={2}>Totals</td>
                <td className="px-4 pt-3 text-right font-mono">{fmt(totalDebit.toString())}</td>
                <td className="px-4 pt-3 text-right font-mono">{fmt(totalCredit.toString())}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Timestamps */}
      <div className="flex flex-wrap gap-6 text-xs text-gray-400">
        <span>Created: {new Date(journal.created_at).toLocaleString("en-BW")}</span>
        {journal.posted_at && <span>Posted: {new Date(journal.posted_at).toLocaleString("en-BW")}</span>}
        {journal.reversed_at && <span>Reversed: {new Date(journal.reversed_at).toLocaleString("en-BW")}</span>}
      </div>
    </div>
  );
}

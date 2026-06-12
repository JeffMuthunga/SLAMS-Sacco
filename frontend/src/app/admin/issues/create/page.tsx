"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateIssue, useIssueCategories } from "@/lib/api/issues";
import { useMembers } from "@/lib/api/members";
import { extractApiError, extractFieldErrors } from "@/lib/api";
import { toast } from "sonner";

const PRIORITIES = ["low", "medium", "high", "urgent"] as const;

export default function CreateIssuePage() {
  const router = useRouter();

  const [categoryId, setCategoryId]   = useState("");
  const [memberId, setMemberId]       = useState("");
  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority]       = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [errors, setErrors]           = useState<Record<string, string[]> | null>(null);

  const { data: categories = [] } = useIssueCategories();
  const { data: membersData }     = useMembers({ per_page: 200 });
  const members = membersData?.data ?? [];

  const createMutation = useCreateIssue();

  const err = (k: string) => errors?.[k]?.[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(null);

    createMutation.mutate(
      {
        category_id: categoryId,
        member_id: memberId || undefined,
        title,
        description: description || undefined,
        priority,
      },
      {
        onSuccess: (issue) => {
          toast.success("Issue created.");
          router.push(`/admin/issues/${issue.id}`);
        },
        onError: (err) => {
          const fe = extractFieldErrors(err);
          if (fe) { setErrors(fe); } else { toast.error(extractApiError(err)); }
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-dark dark:text-white">New Issue</h1>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-dark">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-2xl">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Category <span className="text-red-500">*</span></label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">— select —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {err("category_id") && <p className="mt-0.5 text-xs text-red-500">{err("category_id")}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as typeof priority)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Related Member (optional)</label>
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">— none —</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.full_name} ({m.member_number})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Title <span className="text-red-500">*</span></label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of the issue"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            />
            {err("title") && <p className="mt-0.5 text-xs text-red-500">{err("title")}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Detailed description, steps to reproduce, etc."
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
            >
              {createMutation.isPending ? "Creating…" : "Create Issue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

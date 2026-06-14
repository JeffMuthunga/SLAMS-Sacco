"use client";

import React, { useState } from "react";
import { useMemberIssues, useCreateMemberIssue, useAddMemberIssueComment } from "@/lib/api/member-portal";
import { useIssueCategories } from "@/lib/api/issues";
import { extractApiError, extractFieldErrors } from "@/lib/api";
import { toast } from "sonner";
import type { Issue, IssuePriority, IssueStatus } from "@/lib/api/issues";

const PRIORITY_CFG: Record<IssuePriority, { label: string; className: string }> = {
  low:    { label: "Low",    className: "bg-gray-100 text-gray-600" },
  medium: { label: "Medium", className: "bg-blue-100 text-blue-700" },
  high:   { label: "High",   className: "bg-orange-100 text-orange-700" },
  urgent: { label: "Urgent", className: "bg-red-100 text-red-700" },
};
const STATUS_CFG: Record<IssueStatus, { label: string; className: string }> = {
  open:        { label: "Open",        className: "bg-blue-100 text-blue-700" },
  in_progress: { label: "In Progress", className: "bg-yellow-100 text-yellow-700" },
  resolved:    { label: "Resolved",    className: "bg-green-100 text-green-700" },
  closed:      { label: "Closed",      className: "bg-gray-100 text-gray-600" },
};

function IssueDetail({ issue }: { issue: Issue }) {
  const [comment, setComment] = useState("");
  const addComment = useAddMemberIssueComment();

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    addComment.mutate(
      { issueId: issue.id, body: comment },
      {
        onSuccess: () => { toast.success("Comment added."); setComment(""); },
        onError: (err) => toast.error(extractApiError(err)),
      }
    );
  };

  const pCfg = PRIORITY_CFG[issue.priority];
  const sCfg = STATUS_CFG[issue.status];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-gray-500">{issue.reference_number}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${pCfg.className}`}>{pCfg.label}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${sCfg.className}`}>{sCfg.label}</span>
      </div>
      <h3 className="font-semibold text-dark dark:text-white">{issue.title}</h3>
      {issue.description && (
        <p className="whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-400">{issue.description}</p>
      )}
      <dl className="grid grid-cols-2 gap-2 text-xs">
        <div><dt className="text-gray-500">Category</dt><dd className="font-medium">{issue.category?.name ?? "—"}</dd></div>
        <div><dt className="text-gray-500">Assigned To</dt><dd className="font-medium">{issue.assignee?.name ?? "Unassigned"}</dd></div>
        <div><dt className="text-gray-500">Opened</dt><dd className="font-medium">{new Date(issue.created_at).toLocaleDateString("en-BW")}</dd></div>
        {issue.resolved_at && <div><dt className="text-gray-500">Resolved</dt><dd className="font-medium">{new Date(issue.resolved_at).toLocaleDateString("en-BW")}</dd></div>}
      </dl>

      <div>
        <p className="mb-2 text-sm font-medium text-dark dark:text-white">Comments ({issue.comments.length})</p>
        <div className="flex flex-col gap-2 mb-3">
          {issue.comments.map((c) => (
            <div key={c.id} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
              <div className="flex justify-between text-xs">
                <span className="font-medium">{c.user?.name ?? "Unknown"}</span>
                <span className="text-gray-400">{new Date(c.created_at).toLocaleString("en-BW")}</span>
              </div>
              <p className="mt-1 text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">{c.body}</p>
            </div>
          ))}
          {issue.comments.length === 0 && <p className="text-xs text-gray-400 italic">No comments yet.</p>}
        </div>
        {issue.status !== "closed" && (
          <form onSubmit={handleAddComment} className="flex flex-col gap-2">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              placeholder="Add a comment…"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm resize-none dark:bg-gray-dark"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={addComment.isPending || !comment.trim()}
                className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {addComment.isPending ? "Posting…" : "Post"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function MemberIssuesPage() {
  const [status, setStatus]         = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle]           = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority]     = useState<IssuePriority>("medium");
  const [formErrors, setFormErrors] = useState<Record<string, string[]> | null>(null);

  const { data, isLoading, error } = useMemberIssues({ status: status || undefined, per_page: 50 });
  const { data: categories = [] }  = useIssueCategories();
  const createMutation = useCreateMemberIssue();

  const issues = data?.data ?? [];
  const selectedIssue = issues.find((i) => i.id === selectedId) ?? null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors(null);
    createMutation.mutate(
      { category_id: categoryId, title, description: description || undefined, priority },
      {
        onSuccess: () => {
          toast.success("Issue created.");
          setShowCreate(false);
          setTitle(""); setDescription(""); setCategoryId(""); setPriority("medium");
        },
        onError: (err) => {
          const fe = extractFieldErrors(err);
          if (fe) setFormErrors(fe); else toast.error(extractApiError(err));
        },
      }
    );
  };

  const err = (k: string) => formErrors?.[k]?.[0];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-dark dark:text-white">My Issues</h1>
        <button
          onClick={() => { setShowCreate(true); setSelectedId(null); }}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
        >
          + New Issue
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{extractApiError(error)}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Issue list */}
        <div className="flex flex-col gap-3">
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:bg-gray-dark">
            <option value="">All Statuses</option>
            {(["open", "in_progress", "resolved", "closed"] as IssueStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_CFG[s].label}</option>
            ))}
          </select>

          {isLoading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : issues.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No issues found.</p>
          ) : (
            issues.map((issue) => {
              const pCfg = PRIORITY_CFG[issue.priority];
              const sCfg = STATUS_CFG[issue.status];
              return (
                <button
                  key={issue.id}
                  onClick={() => { setSelectedId(issue.id); setShowCreate(false); }}
                  className={`w-full rounded-xl border p-3 text-left transition-colors ${
                    selectedId === issue.id
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 bg-white hover:border-primary/50 dark:border-gray-700 dark:bg-gray-dark"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${sCfg.className}`}>{sCfg.label}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${pCfg.className}`}>{pCfg.label}</span>
                  </div>
                  <p className="text-sm font-medium text-dark dark:text-white line-clamp-2">{issue.title}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{new Date(issue.created_at).toLocaleDateString("en-BW")}</p>
                </button>
              );
            })
          )}
        </div>

        {/* Detail / Create panel */}
        <div className="lg:col-span-2">
          {showCreate ? (
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-dark">
              <h2 className="mb-4 font-semibold text-dark dark:text-white">New Issue</h2>
              <form onSubmit={handleCreate} className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium">Category <span className="text-red-500">*</span></label>
                    <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:bg-gray-dark">
                      <option value="">— select —</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {err("category_id") && <p className="mt-0.5 text-xs text-red-500">{err("category_id")}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">Priority</label>
                    <select value={priority} onChange={(e) => setPriority(e.target.value as IssuePriority)}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:bg-gray-dark">
                      {(["low", "medium", "high", "urgent"] as IssuePriority[]).map((p) => (
                        <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">Title <span className="text-red-500">*</span></label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:bg-gray-dark" />
                  {err("title") && <p className="mt-0.5 text-xs text-red-500">{err("title")}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                    rows={3} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm resize-none dark:bg-gray-dark" />
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowCreate(false)}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={createMutation.isPending}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                    {createMutation.isPending ? "Creating…" : "Create Issue"}
                  </button>
                </div>
              </form>
            </div>
          ) : selectedIssue ? (
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-dark">
              <IssueDetail issue={selectedIssue} />
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-400">Select an issue or create a new one.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

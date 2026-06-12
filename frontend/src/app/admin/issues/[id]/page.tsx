"use client";

import React, { use, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IssuePriority,
  IssueStatus,
  useAddIssueComment,
  useDeleteIssue,
  useIssue,
  useIssueCategories,
  useUpdateIssue,
} from "@/lib/api/issues";
import { extractApiError, extractFieldErrors } from "@/lib/api";
import { toast } from "sonner";

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

const STATUS_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  open:        ["in_progress", "closed"],
  in_progress: ["resolved", "open", "closed"],
  resolved:    ["closed", "open"],
  closed:      [],
};

export default function IssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }  = use(params);
  const router  = useRouter();

  const { data: issue, isLoading, error } = useIssue(id);
  const { data: categories = [] }         = useIssueCategories();

  const [editMode, setEditMode]       = useState(false);
  const [editTitle, setEditTitle]     = useState("");
  const [editDesc, setEditDesc]       = useState("");
  const [editCat, setEditCat]         = useState("");
  const [editPrio, setEditPrio]       = useState<IssuePriority>("medium");
  const [comment, setComment]         = useState("");
  const [editErrors, setEditErrors]   = useState<Record<string, string[]> | null>(null);

  const updateMutation  = useUpdateIssue();
  const commentMutation = useAddIssueComment();
  const deleteMutation  = useDeleteIssue();

  if (isLoading) return <p className="p-6 text-gray-500">Loading…</p>;
  if (error)     return <p className="p-6 text-red-500">{extractApiError(error)}</p>;
  if (!issue)    return null;

  const priorityCfg = PRIORITY_CFG[issue.priority];
  const statusCfg   = STATUS_CFG[issue.status];
  const transitions = STATUS_TRANSITIONS[issue.status];

  const openEdit = () => {
    setEditTitle(issue.title);
    setEditDesc(issue.description ?? "");
    setEditCat(issue.category_id);
    setEditPrio(issue.priority);
    setEditErrors(null);
    setEditMode(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditErrors(null);
    updateMutation.mutate(
      { id, title: editTitle, description: editDesc || null, category_id: editCat, priority: editPrio },
      {
        onSuccess: () => { toast.success("Issue updated."); setEditMode(false); },
        onError: (err) => {
          const fe = extractFieldErrors(err);
          if (fe) { setEditErrors(fe); } else { toast.error(extractApiError(err)); }
        },
      }
    );
  };

  const handleStatusChange = (status: IssueStatus) => {
    updateMutation.mutate(
      { id, status },
      {
        onSuccess: () => toast.success(`Issue moved to ${STATUS_CFG[status].label}.`),
        onError: (err) => toast.error(extractApiError(err)),
      }
    );
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    commentMutation.mutate(
      { issueId: id, body: comment },
      {
        onSuccess: () => { toast.success("Comment added."); setComment(""); },
        onError: (err) => toast.error(extractApiError(err)),
      }
    );
  };

  const handleDelete = () => {
    if (!confirm("Delete this issue?")) return;
    deleteMutation.mutate(id, {
      onSuccess: () => { toast.success("Issue deleted."); router.push("/admin/issues"); },
      onError: (err) => toast.error(extractApiError(err)),
    });
  };

  const errField = (k: string) => editErrors?.[k]?.[0];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-gray-500">{issue.reference_number}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityCfg.className}`}>{priorityCfg.label}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCfg.className}`}>{statusCfg.label}</span>
          </div>
          {!editMode && (
            <h1 className="text-2xl font-semibold text-dark dark:text-white">{issue.title}</h1>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {transitions.map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              disabled={updateMutation.isPending}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              → {STATUS_CFG[s].label}
            </button>
          ))}
          {!editMode && issue.status !== "closed" && (
            <button
              onClick={openEdit}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
            >
              Edit
            </button>
          )}
          {issue.status === "open" && (
            <button
              onClick={handleDelete}
              className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Edit form / description */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-dark">
            {editMode ? (
              <form onSubmit={handleSaveEdit} className="flex flex-col gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Title</label>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  />
                  {errField("title") && <p className="mt-0.5 text-xs text-red-500">{errField("title")}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Category</label>
                    <select value={editCat} onChange={(e) => setEditCat(e.target.value)} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Priority</label>
                    <select value={editPrio} onChange={(e) => setEditPrio(e.target.value as IssuePriority)} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                      {["low", "medium", "high", "urgent"].map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Description</label>
                  <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={4} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm resize-none" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={updateMutation.isPending} className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-opacity-90 disabled:opacity-50">
                    {updateMutation.isPending ? "Saving…" : "Save"}
                  </button>
                  <button type="button" onClick={() => setEditMode(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium hover:bg-gray-50">Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <h2 className="mb-3 font-semibold text-dark dark:text-white">Description</h2>
                {issue.description ? (
                  <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{issue.description}</p>
                ) : (
                  <p className="text-sm text-gray-400 italic">No description provided.</p>
                )}
              </>
            )}
          </div>

          {/* Comments */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-dark">
            <h2 className="mb-4 font-semibold text-dark dark:text-white">
              Comments ({issue.comments.length})
            </h2>

            <div className="flex flex-col gap-4 mb-4">
              {issue.comments.length === 0 && (
                <p className="text-sm text-gray-400 italic">No comments yet.</p>
              )}
              {issue.comments.map((c) => (
                <div key={c.id} className="flex flex-col gap-1 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{c.user?.name ?? "Unknown"}</span>
                    <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleString("en-KE")}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{c.body}</p>
                </div>
              ))}
            </div>

            {issue.status !== "closed" && (
              <form onSubmit={handleAddComment} className="flex flex-col gap-2">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  placeholder="Add a comment…"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm resize-none dark:bg-gray-dark"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={commentMutation.isPending || !comment.trim()}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
                  >
                    {commentMutation.isPending ? "Posting…" : "Post Comment"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Sidebar metadata */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-dark">
            <h3 className="mb-3 text-sm font-semibold text-dark dark:text-white">Details</h3>
            <dl className="flex flex-col gap-2 text-sm">
              <div>
                <dt className="text-xs text-gray-500">Category</dt>
                <dd className="font-medium">{issue.category?.name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Member</dt>
                <dd className="font-medium">
                  {issue.member ? `${issue.member.full_name} (${issue.member.member_number})` : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Reported By</dt>
                <dd className="font-medium">{issue.reporter?.name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Assigned To</dt>
                <dd className="font-medium">{issue.assignee?.name ?? "Unassigned"}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Opened</dt>
                <dd className="font-medium">{new Date(issue.created_at).toLocaleDateString("en-KE")}</dd>
              </div>
              {issue.resolved_at && (
                <div>
                  <dt className="text-xs text-gray-500">Resolved</dt>
                  <dd className="font-medium">{new Date(issue.resolved_at).toLocaleDateString("en-KE")}</dd>
                </div>
              )}
              {issue.closed_at && (
                <div>
                  <dt className="text-xs text-gray-500">Closed</dt>
                  <dd className="font-medium">{new Date(issue.closed_at).toLocaleDateString("en-KE")}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

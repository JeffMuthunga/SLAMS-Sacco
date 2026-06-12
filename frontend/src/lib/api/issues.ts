import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiEnvelope, ApiMeta } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────

export type IssuePriority = "low" | "medium" | "high" | "urgent";
export type IssueStatus   = "open" | "in_progress" | "resolved" | "closed";

export interface IssueCategory {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface IssueComment {
  id: string;
  issue_id: string;
  user_id: string;
  body: string;
  user: { id: string; name: string; email: string } | null;
  created_at: string;
}

export interface Issue {
  id: string;
  org_id: string;
  reference_number: string;
  title: string;
  description: string | null;
  priority: IssuePriority;
  status: IssueStatus;
  category_id: string;
  member_id: string | null;
  reported_by: string;
  assigned_to: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  category: { id: string; name: string } | null;
  member: { id: string; full_name: string; member_number: string } | null;
  reporter: { id: string; name: string } | null;
  assignee: { id: string; name: string } | null;
  comments: IssueComment[];
  created_at: string;
}

export interface IssuesParams {
  status?: IssueStatus | string;
  priority?: IssuePriority | string;
  category_id?: string;
  member_id?: string;
  assigned_to?: string;
  search?: string;
  per_page?: number;
  page?: number;
}

export interface IssuesResponse {
  data: Issue[];
  meta: ApiMeta;
}

// ── Query keys ─────────────────────────────────────────────────────────

export const ISSUE_CATEGORIES_KEY = ["issue-categories"] as const;
export const ISSUES_KEY           = ["issues"] as const;

// ── Issue Categories ───────────────────────────────────────────────────

export function useIssueCategories() {
  return useQuery<IssueCategory[]>({
    queryKey: ISSUE_CATEGORIES_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<IssueCategory[]>>("/configurations/issue-categories");
      return data.data;
    },
    staleTime: 60_000,
  });
}

export function useCreateIssueCategory() {
  const qc = useQueryClient();
  return useMutation<IssueCategory, Error, { name: string; description?: string }>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<IssueCategory>>("/configurations/issue-categories", payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ISSUE_CATEGORIES_KEY }),
  });
}

export function useUpdateIssueCategory() {
  const qc = useQueryClient();
  return useMutation<IssueCategory, Error, { id: string; name: string; description?: string }>({
    mutationFn: async ({ id, ...payload }) => {
      const { data } = await api.put<ApiEnvelope<IssueCategory>>(`/configurations/issue-categories/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ISSUE_CATEGORIES_KEY }),
  });
}

export function useDeleteIssueCategory() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => { await api.delete(`/configurations/issue-categories/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ISSUE_CATEGORIES_KEY }),
  });
}

// ── Issues ─────────────────────────────────────────────────────────────

export function useIssues(params?: IssuesParams) {
  return useQuery<IssuesResponse>({
    queryKey: [...ISSUES_KEY, params],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<Issue[]>>("/issues", { params });
      return { data: data.data, meta: data.meta! };
    },
    staleTime: 30_000,
  });
}

export function useIssue(id: string) {
  return useQuery<Issue>({
    queryKey: [...ISSUES_KEY, id],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<Issue>>(`/issues/${id}`);
      return data.data;
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useCreateIssue() {
  const qc = useQueryClient();
  return useMutation<Issue, Error, {
    category_id: string;
    member_id?: string;
    assigned_to?: string;
    title: string;
    description?: string;
    priority?: IssuePriority;
  }>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<Issue>>("/issues", payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ISSUES_KEY }),
  });
}

export function useUpdateIssue() {
  const qc = useQueryClient();
  return useMutation<Issue, Error, { id: string } & Partial<{
    category_id: string;
    assigned_to: string | null;
    title: string;
    description: string | null;
    priority: IssuePriority;
    status: IssueStatus;
  }>>({
    mutationFn: async ({ id, ...payload }) => {
      const { data } = await api.put<ApiEnvelope<Issue>>(`/issues/${id}`, payload);
      return data.data;
    },
    onSuccess: (issue) => {
      qc.invalidateQueries({ queryKey: ISSUES_KEY });
      qc.invalidateQueries({ queryKey: [...ISSUES_KEY, issue.id] });
    },
  });
}

export function useAddIssueComment() {
  const qc = useQueryClient();
  return useMutation<IssueComment, Error, { issueId: string; body: string }>({
    mutationFn: async ({ issueId, body }) => {
      const { data } = await api.post<ApiEnvelope<IssueComment>>(`/issues/${issueId}/comments`, { body });
      return data.data;
    },
    onSuccess: (_comment, { issueId }) => {
      qc.invalidateQueries({ queryKey: [...ISSUES_KEY, issueId] });
    },
  });
}

export function useDeleteIssue() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => { await api.delete(`/issues/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ISSUES_KEY }),
  });
}

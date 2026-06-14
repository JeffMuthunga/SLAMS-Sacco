import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiEnvelope, ApiMeta } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────

export type ApprovalStatus = "draft" | "pending" | "approved" | "rejected";

export interface PettyCashCategory {
  id: string;
  org_id: string;
  name: string;
  created_at: string;
}

export interface PettyCashItem {
  id: string;
  org_id: string;
  category_id: string;
  name: string;
  default_price: string;
  default_units: number;
  category: { id: string; name: string } | null;
  created_at: string;
}

export interface PettyCashAllocation {
  id: string;
  org_id: string;
  period_id: string;
  allocated_to: string;
  amount: string;
  spent: string;
  balance: string;
  narration: string | null;
  approval_status: ApprovalStatus;
  approved_at: string | null;
  period: { id: string; name: string } | null;
  user: { id: string; name: string; email: string } | null;
  created_at: string;
}

export interface PettyCashRequest {
  id: string;
  org_id: string;
  allocation_id: string | null;
  item_id: string | null;
  requested_by: string;
  units: number;
  unit_price: string;
  amount: string;
  receipt_number: string | null;
  expense_date: string;
  narration: string | null;
  approval_status: ApprovalStatus;
  approved_at: string | null;
  allocation: { id: string; amount: string } | null;
  item: { id: string; name: string } | null;
  requester: { id: string; name: string; email: string } | null;
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: ApiMeta;
}

// ── Query keys ─────────────────────────────────────────────────────────

export const PC_CATEGORIES_KEY   = ["petty-cash-categories"] as const;
export const PC_ITEMS_KEY        = ["petty-cash-items"] as const;
export const PC_ALLOCATIONS_KEY  = ["petty-cash-allocations"] as const;
export const PC_REQUESTS_KEY     = ["petty-cash-requests"] as const;

// ── Categories ─────────────────────────────────────────────────────────

export function usePettyCashCategories() {
  return useQuery<PettyCashCategory[]>({
    queryKey: PC_CATEGORIES_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<PettyCashCategory[]>>("/configurations/petty-cash-categories");
      return data.data;
    },
    staleTime: 60_000,
  });
}

export function useCreatePettyCashCategory() {
  const qc = useQueryClient();
  return useMutation<PettyCashCategory, Error, { name: string }>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<PettyCashCategory>>("/configurations/petty-cash-categories", payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PC_CATEGORIES_KEY }),
  });
}

export function useUpdatePettyCashCategory() {
  const qc = useQueryClient();
  return useMutation<PettyCashCategory, Error, { id: string; name: string }>({
    mutationFn: async ({ id, ...payload }) => {
      const { data } = await api.put<ApiEnvelope<PettyCashCategory>>(`/configurations/petty-cash-categories/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PC_CATEGORIES_KEY }),
  });
}

export function useDeletePettyCashCategory() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => { await api.delete(`/configurations/petty-cash-categories/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: PC_CATEGORIES_KEY }),
  });
}

// ── Items ──────────────────────────────────────────────────────────────

export function usePettyCashItems(categoryId?: string) {
  return useQuery<PettyCashItem[]>({
    queryKey: [...PC_ITEMS_KEY, categoryId],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<PettyCashItem[]>>("/configurations/petty-cash-items", {
        params: categoryId ? { category_id: categoryId } : undefined,
      });
      return data.data;
    },
    staleTime: 60_000,
  });
}

export function useCreatePettyCashItem() {
  const qc = useQueryClient();
  return useMutation<PettyCashItem, Error, { category_id: string; name: string; default_price: string; default_units?: number }>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<PettyCashItem>>("/configurations/petty-cash-items", payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PC_ITEMS_KEY }),
  });
}

export function useUpdatePettyCashItem() {
  const qc = useQueryClient();
  return useMutation<PettyCashItem, Error, { id: string; category_id: string; name: string; default_price: string; default_units?: number }>({
    mutationFn: async ({ id, ...payload }) => {
      const { data } = await api.put<ApiEnvelope<PettyCashItem>>(`/configurations/petty-cash-items/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PC_ITEMS_KEY }),
  });
}

export function useDeletePettyCashItem() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => { await api.delete(`/configurations/petty-cash-items/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: PC_ITEMS_KEY }),
  });
}

// ── Allocations ────────────────────────────────────────────────────────

export interface AllocationsParams {
  period_id?: string;
  approval_status?: string;
  per_page?: number;
  page?: number;
}

export function usePettyCashAllocation(id: string) {
  return useQuery<PettyCashAllocation>({
    queryKey: [...PC_ALLOCATIONS_KEY, id],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<PettyCashAllocation>>(`/petty-cash-allocations/${id}`);
      return data.data;
    },
    staleTime: 30_000,
    enabled: !!id,
  });
}

export function usePettyCashAllocations(params?: AllocationsParams) {
  return useQuery<PaginatedResponse<PettyCashAllocation>>({
    queryKey: [...PC_ALLOCATIONS_KEY, params],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<PettyCashAllocation[]>>("/petty-cash-allocations", { params });
      return { data: data.data, meta: data.meta! };
    },
    staleTime: 30_000,
  });
}

export function useCreatePettyCashAllocation() {
  const qc = useQueryClient();
  return useMutation<PettyCashAllocation, Error, { period_id: string; allocated_to: string; amount: string; narration?: string }>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<PettyCashAllocation>>("/petty-cash-allocations", payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PC_ALLOCATIONS_KEY }),
  });
}

export function useApprovePettyCashAllocation() {
  const qc = useQueryClient();
  return useMutation<PettyCashAllocation, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.post<ApiEnvelope<PettyCashAllocation>>(`/petty-cash-allocations/${id}/approve`);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PC_ALLOCATIONS_KEY }),
  });
}

export function useRejectPettyCashAllocation() {
  const qc = useQueryClient();
  return useMutation<PettyCashAllocation, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.post<ApiEnvelope<PettyCashAllocation>>(`/petty-cash-allocations/${id}/reject`);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PC_ALLOCATIONS_KEY }),
  });
}

export function useDeletePettyCashAllocation() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => { await api.delete(`/petty-cash-allocations/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: PC_ALLOCATIONS_KEY }),
  });
}

// ── Requests ───────────────────────────────────────────────────────────

export interface RequestsParams {
  allocation_id?: string;
  approval_status?: string;
  requested_by?: string;
  per_page?: number;
  page?: number;
}

export function usePettyCashRequests(params?: RequestsParams) {
  return useQuery<PaginatedResponse<PettyCashRequest>>({
    queryKey: [...PC_REQUESTS_KEY, params],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<PettyCashRequest[]>>("/petty-cash-requests", { params });
      return { data: data.data, meta: data.meta! };
    },
    staleTime: 30_000,
  });
}

export function useCreatePettyCashRequest() {
  const qc = useQueryClient();
  return useMutation<PettyCashRequest, Error, {
    allocation_id?: string;
    item_id?: string;
    units: number;
    unit_price: string;
    receipt_number?: string;
    expense_date: string;
    narration?: string;
  }>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<PettyCashRequest>>("/petty-cash-requests", payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PC_REQUESTS_KEY });
      qc.invalidateQueries({ queryKey: PC_ALLOCATIONS_KEY });
    },
  });
}

export function useApprovePettyCashRequest() {
  const qc = useQueryClient();
  return useMutation<PettyCashRequest, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.post<ApiEnvelope<PettyCashRequest>>(`/petty-cash-requests/${id}/approve`);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PC_REQUESTS_KEY });
      qc.invalidateQueries({ queryKey: PC_ALLOCATIONS_KEY });
    },
  });
}

export function useRejectPettyCashRequest() {
  const qc = useQueryClient();
  return useMutation<PettyCashRequest, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.post<ApiEnvelope<PettyCashRequest>>(`/petty-cash-requests/${id}/reject`);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PC_REQUESTS_KEY }),
  });
}

export function useDeletePettyCashRequest() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => { await api.delete(`/petty-cash-requests/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: PC_REQUESTS_KEY }),
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiEnvelope, ApiMeta } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────

export interface CommodityType {
  id: string;
  name: string;
  created_at: string;
}

export interface Commodity {
  id: string;
  commodity_type_id: string;
  commodity_type: { id: string; name: string } | null;
  name: string;
  unit_price: string;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
}

export interface CommodityRequestItem {
  id: string;
  commodity: { id: string; name: string } | null;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

export type CommodityRequestStatus = "pending" | "approved" | "rejected" | "issued" | "repaid";

export interface CommodityRequest {
  id: string;
  request_number: string;
  status: CommodityRequestStatus;
  total_amount: string;
  repayment_period: number | null;
  notes: string | null;
  approved_at: string | null;
  issued_at: string | null;
  member: { id: string; full_name: string; member_number: string } | null;
  items: CommodityRequestItem[];
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: ApiMeta;
}

// ── Query Keys ────────────────────────────────────────────────────────────

export const COMMODITY_TYPES_KEY    = ["commodity-types"]    as const;
export const COMMODITIES_KEY        = ["commodities"]         as const;
export const COMMODITY_REQUESTS_KEY = ["commodity-requests"]  as const;

// ── Commodity Types ───────────────────────────────────────────────────────

export function useCommodityTypes() {
  return useQuery<CommodityType[]>({
    queryKey: COMMODITY_TYPES_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<CommodityType[]>>("/configurations/commodity-types");
      return data.data;
    },
    staleTime: 60_000,
  });
}

export function useCreateCommodityType() {
  const qc = useQueryClient();
  return useMutation<CommodityType, Error, { name: string }>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<CommodityType>>("/configurations/commodity-types", payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: COMMODITY_TYPES_KEY }),
  });
}

export function useUpdateCommodityType() {
  const qc = useQueryClient();
  return useMutation<CommodityType, Error, { id: string; name: string }>({
    mutationFn: async ({ id, ...payload }) => {
      const { data } = await api.put<ApiEnvelope<CommodityType>>(`/configurations/commodity-types/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: COMMODITY_TYPES_KEY }),
  });
}

export function useDeleteCommodityType() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => { await api.delete(`/configurations/commodity-types/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: COMMODITY_TYPES_KEY }),
  });
}

// ── Commodities ───────────────────────────────────────────────────────────

export function useCommodities() {
  return useQuery<Commodity[]>({
    queryKey: COMMODITIES_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<Commodity[]>>("/configurations/commodities");
      return data.data;
    },
    staleTime: 30_000,
  });
}

export function useCreateCommodity() {
  const qc = useQueryClient();
  return useMutation<Commodity, Error, {
    commodity_type_id: string;
    name: string;
    unit_price: string;
    stock_quantity?: number;
    is_active?: boolean;
  }>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<Commodity>>("/configurations/commodities", payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: COMMODITIES_KEY }),
  });
}

export function useUpdateCommodity() {
  const qc = useQueryClient();
  return useMutation<Commodity, Error, {
    id: string;
    commodity_type_id: string;
    name: string;
    unit_price: string;
    stock_quantity?: number;
    is_active?: boolean;
  }>({
    mutationFn: async ({ id, ...payload }) => {
      const { data } = await api.put<ApiEnvelope<Commodity>>(`/configurations/commodities/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: COMMODITIES_KEY }),
  });
}

export function useDeleteCommodity() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => { await api.delete(`/configurations/commodities/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: COMMODITIES_KEY }),
  });
}

// ── Commodity Requests (Admin) ────────────────────────────────────────────

export interface CommodityRequestsParams {
  status?: string;
  member_id?: string;
  per_page?: number;
  page?: number;
}

export function useCommodityRequests(params?: CommodityRequestsParams) {
  return useQuery<PaginatedResponse<CommodityRequest>>({
    queryKey: [...COMMODITY_REQUESTS_KEY, params],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<{ data: CommodityRequest[]; meta: ApiMeta }>>("/commodity-requests", { params });
      return { data: data.data.data, meta: data.data.meta };
    },
    staleTime: 30_000,
  });
}

export function useCommodityRequest(id: string) {
  return useQuery<CommodityRequest>({
    queryKey: [...COMMODITY_REQUESTS_KEY, id],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<CommodityRequest>>(`/commodity-requests/${id}`);
      return data.data;
    },
    staleTime: 30_000,
    enabled: !!id,
  });
}

export function useCreateCommodityRequest() {
  const qc = useQueryClient();
  return useMutation<CommodityRequest, Error, {
    member_id: string;
    items: { commodity_id: string; quantity: number }[];
    repayment_period?: number;
  }>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<CommodityRequest>>("/commodity-requests", payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: COMMODITY_REQUESTS_KEY }),
  });
}

export function useApproveCommodityRequest() {
  const qc = useQueryClient();
  return useMutation<CommodityRequest, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.post<ApiEnvelope<CommodityRequest>>(`/commodity-requests/${id}/approve`);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: COMMODITY_REQUESTS_KEY }),
  });
}

export function useRejectCommodityRequest() {
  const qc = useQueryClient();
  return useMutation<CommodityRequest, Error, { id: string; reason: string }>({
    mutationFn: async ({ id, reason }) => {
      const { data } = await api.post<ApiEnvelope<CommodityRequest>>(`/commodity-requests/${id}/reject`, { reason });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: COMMODITY_REQUESTS_KEY }),
  });
}

export function useIssueCommodityRequest() {
  const qc = useQueryClient();
  return useMutation<CommodityRequest, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.post<ApiEnvelope<CommodityRequest>>(`/commodity-requests/${id}/issue`);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: COMMODITY_REQUESTS_KEY }),
  });
}

export function useMarkCommodityRequestRepaid() {
  const qc = useQueryClient();
  return useMutation<CommodityRequest, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.post<ApiEnvelope<CommodityRequest>>(`/commodity-requests/${id}/repaid`);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: COMMODITY_REQUESTS_KEY }),
  });
}

// ── Member Portal Hooks ──────────────────────────────────────────────────

export const PORTAL_COMMODITY_REQUESTS_KEY = ["me", "commodity-requests"] as const;
export const PORTAL_COMMODITIES_KEY        = ["me", "commodities"]         as const;

export function usePortalAvailableCommodities() {
  return useQuery<Commodity[]>({
    queryKey: PORTAL_COMMODITIES_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<Commodity[]>>("/me/commodities");
      return data.data;
    },
    staleTime: 60_000,
  });
}

export function usePortalCommodityRequests(params?: { per_page?: number; page?: number }) {
  return useQuery<PaginatedResponse<CommodityRequest>>({
    queryKey: [...PORTAL_COMMODITY_REQUESTS_KEY, params],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<CommodityRequest[]>>("/me/commodity-requests", { params });
      return { data: data.data, meta: data.meta! };
    },
    staleTime: 30_000,
  });
}

export function usePortalCreateCommodityRequest() {
  const qc = useQueryClient();
  return useMutation<CommodityRequest, Error, {
    items: { commodity_id: string; quantity: number }[];
    repayment_period?: number;
  }>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<CommodityRequest>>("/me/commodity-requests", payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PORTAL_COMMODITY_REQUESTS_KEY }),
  });
}

// frontend/src/lib/api/settings.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiEnvelope, ApiMeta, extractApiError } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────

export interface Org {
  id: string;
  name: string;
  full_name: string;
  suffix: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  logo_url: string | null;
  address: string | null;
  town: string | null;
  country_code: string | null;
  currency_code: string | null;
  pin: string | null;
  reg_number: string | null;
  member_limit: number | null;
  is_active: boolean;
  is_default: boolean;
}

export type UpdateOrgPayload = Partial<Omit<Org, "id" | "logo_url" | "is_active" | "is_default">>;

export interface Currency {
  id: string;
  name: string;
  code: string;
  symbol: string | null;
  exchange_rate: string;
  is_default: boolean;
}

export type CreateCurrencyPayload = Omit<Currency, "id" | "exchange_rate"> & { exchange_rate: number | string };
export type UpdateCurrencyPayload = CreateCurrencyPayload;

export interface Period {
  id: string;
  fiscal_year_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_opened: boolean;
  is_closed: boolean;
  is_posted: boolean;
}

export interface FiscalYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_opened: boolean;
  is_closed: boolean;
  closed_at: string | null;
  closed_by: string | null;
  periods?: Period[];
}

export type CreateFiscalYearPayload = Pick<FiscalYear, "name" | "start_date" | "end_date">;
export type UpdateFiscalYearPayload = CreateFiscalYearPayload;

// ── Query keys ─────────────────────────────────────────────────────────

export const SETTINGS_KEY = ["settings"] as const;
export const ORG_KEY = [...SETTINGS_KEY, "org"] as const;
export const CURRENCIES_KEY = [...SETTINGS_KEY, "currencies"] as const;
export const FISCAL_YEARS_KEY = [...SETTINGS_KEY, "fiscal_years"] as const;

// ── Queries ────────────────────────────────────────────────────────────

export function useOrg() {
  return useQuery<Org>({
    queryKey: ORG_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<Org>>("/configurations/org");
      return data.data;
    },
    staleTime: 300_000, // 5 mins
  });
}

export function useCurrencies() {
  return useQuery<Currency[]>({
    queryKey: CURRENCIES_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<Currency[]>>("/configurations/currencies");
      return data.data;
    },
    staleTime: 300_000,
  });
}

export function useFiscalYears() {
  return useQuery<FiscalYear[]>({
    queryKey: FISCAL_YEARS_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<FiscalYear[]>>("/configurations/fiscal-years");
      return data.data;
    },
    staleTime: 60_000,
  });
}

// ── Mutations ──────────────────────────────────────────────────────────

export function useUpdateOrg() {
  const qc = useQueryClient();
  return useMutation<Org, Error, UpdateOrgPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.put<ApiEnvelope<Org>>("/configurations/org", payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ORG_KEY });
    },
  });
}

export function useUploadOrgLogo() {
  const qc = useQueryClient();
  return useMutation<Org, Error, File>({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append("logo", file);
      const { data } = await api.post<ApiEnvelope<Org>>("/configurations/org/logo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ORG_KEY });
    },
  });
}

export function useCreateCurrency() {
  const qc = useQueryClient();
  return useMutation<Currency, Error, CreateCurrencyPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<Currency>>("/configurations/currencies", payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CURRENCIES_KEY });
    },
  });
}

export function useUpdateCurrency(id: string) {
  const qc = useQueryClient();
  return useMutation<Currency, Error, UpdateCurrencyPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.put<ApiEnvelope<Currency>>(`/configurations/currencies/${id}`, payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CURRENCIES_KEY });
    },
  });
}

export function useDeleteCurrency() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/configurations/currencies/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CURRENCIES_KEY });
    },
  });
}

export function useCreateFiscalYear() {
  const qc = useQueryClient();
  return useMutation<FiscalYear, Error, CreateFiscalYearPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<FiscalYear>>("/configurations/fiscal-years", payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FISCAL_YEARS_KEY });
    },
  });
}

export function useUpdateFiscalYear(id: string) {
  const qc = useQueryClient();
  return useMutation<FiscalYear, Error, UpdateFiscalYearPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.put<ApiEnvelope<FiscalYear>>(`/configurations/fiscal-years/${id}`, payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FISCAL_YEARS_KEY });
    },
  });
}

export function useCloseFiscalYear() {
  const qc = useQueryClient();
  return useMutation<FiscalYear, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.post<ApiEnvelope<FiscalYear>>(`/configurations/fiscal-years/${id}/close`);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FISCAL_YEARS_KEY });
    },
  });
}

export function useUpdatePeriodStatus() {
  const qc = useQueryClient();
  return useMutation<Period, Error, { id: string, status: "open" | "close" | "post" }>({
    mutationFn: async ({ id, status }) => {
      const { data } = await api.patch<ApiEnvelope<Period>>(`/configurations/periods/${id}/status`, { status });
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FISCAL_YEARS_KEY });
    },
  });
}

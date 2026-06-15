import { useQuery } from "@tanstack/react-query";
import { api, ApiEnvelope, ApiMeta } from "@/lib/api";

export interface AuditLogUser {
  id: string;
  name: string;
  email: string;
}

export interface AuditLogEntry {
  id: string;
  event: string;
  description: string;
  subject_type: string | null;
  subject_id: string | null;
  properties: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  user: AuditLogUser | null;
}

export interface AuditLogsParams {
  page?: number;
  per_page?: number;
  event?: string;
  user_id?: string;
  subject_type?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export const AUDIT_LOGS_KEY = ["audit-logs"] as const;

export function useAuditLogs(params: AuditLogsParams = {}) {
  return useQuery<{ data: AuditLogEntry[]; meta: ApiMeta }>({
    queryKey: [...AUDIT_LOGS_KEY, params],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<AuditLogEntry[]>>(
        "/audit-logs",
        { params }
      );
      return { data: data.data, meta: data.meta as ApiMeta };
    },
    staleTime: 30_000,
  });
}

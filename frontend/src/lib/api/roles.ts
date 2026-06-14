import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiEnvelope } from "@/lib/api";

export interface AppRole {
  id: number;
  name: string;
  is_built_in: boolean;
  permissions: string[];
}

export interface RolesData {
  roles: AppRole[];
  permissions: string[];
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
  is_active: boolean;
}

export const ROLES_KEY       = ["roles"] as const;
export const ADMIN_USERS_KEY = ["admin-users"] as const;

export function useRoles() {
  return useQuery<RolesData>({
    queryKey: ROLES_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<RolesData>>("/roles");
      return data.data;
    },
    staleTime: 60_000,
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation<AppRole, Error, { name: string; permissions: string[] }>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<AppRole>>("/roles", payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ROLES_KEY }),
  });
}

export function useUpdateRolePermissions() {
  const qc = useQueryClient();
  return useMutation<AppRole, Error, { id: number; permissions: string[] }>({
    mutationFn: async ({ id, permissions }) => {
      const { data } = await api.put<ApiEnvelope<AppRole>>(`/roles/${id}/permissions`, { permissions });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ROLES_KEY }),
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (id) => { await api.delete(`/roles/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ROLES_KEY }),
  });
}

export function useAdminUsers() {
  return useQuery<AdminUser[]>({
    queryKey: ADMIN_USERS_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<AdminUser[]>>("/admin-users");
      return data.data;
    },
    staleTime: 30_000,
  });
}

export function useCreateAdminUser() {
  const qc = useQueryClient();
  return useMutation<AdminUser, Error, { name: string; email: string; role: string }>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<AdminUser>>("/admin-users", payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_USERS_KEY }),
  });
}

export function useUpdateAdminUserRole() {
  const qc = useQueryClient();
  return useMutation<AdminUser, Error, { id: string; role: string }>({
    mutationFn: async ({ id, role }) => {
      const { data } = await api.put<ApiEnvelope<AdminUser>>(`/admin-users/${id}/role`, { role });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_USERS_KEY }),
  });
}

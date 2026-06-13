// frontend/src/lib/api/configurations.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiEnvelope } from "@/lib/api";

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
  primary_color: string | null;
  secondary_color: string | null;
}
export type UpdateOrgPayload = Partial<
  Omit<Org, "id" | "logo_url" | "is_active" | "is_default">
>;

export interface Currency {
  id: string;
  name: string;
  code: string;
  symbol: string | null;
  exchange_rate: string;
  is_default: boolean;
}
export type CreateCurrencyPayload = Omit<Currency, "id">;
export type UpdateCurrencyPayload = CreateCurrencyPayload;

export interface SaccoSetting {
  id: string;
  org_id: string;
  registration_fee: string;
  min_share_capital: string;
  min_monthly_contribution: string;
  loan_limit_multiplier: string;
  updated_at: string | null;
}
export type UpdateSaccoSettingPayload = Partial<
  Omit<SaccoSetting, "id" | "org_id" | "updated_at">
>;

export interface CollateralType {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
export type CreateCollateralTypePayload = Pick<
  CollateralType,
  "name" | "description" | "is_active"
>;
export type UpdateCollateralTypePayload = Partial<CreateCollateralTypePayload>;

export interface ActivityType {
  id: string;
  org_id: string;
  name: string;
  code: string | null;
  dr_account_id: string | null;
  cr_account_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
export type CreateActivityTypePayload = Pick<ActivityType, "name" | "is_active"> & {
  code?: string | null;
};
export type UpdateActivityTypePayload = Partial<CreateActivityTypePayload>;

export interface Bank {
  id: string;
  org_id: string;
  name: string;
  code: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
export type CreateBankPayload = Pick<Bank, "name" | "is_active"> & {
  code?: string | null;
};
export type UpdateBankPayload = Partial<CreateBankPayload>;

export interface BankAccount {
  id: string;
  org_id: string;
  bank_id: string;
  bank?: Bank;
  account_name: string;
  account_number: string;
  branch: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
export type CreateBankAccountPayload = Pick<
  BankAccount,
  "bank_id" | "account_name" | "account_number" | "is_active"
> & { branch?: string | null };
export type UpdateBankAccountPayload = Partial<CreateBankAccountPayload>;

export interface Department {
  id: string;
  org_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
export type CreateDepartmentPayload = Pick<Department, "name" | "is_active">;
export type UpdateDepartmentPayload = Partial<CreateDepartmentPayload>;

export interface FiscalYear {
  id: string;
  org_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_opened: boolean;
  is_closed: boolean;
  closed_at: string | null;
  closed_by: string | null;
  periods?: Period[];
}
export type CreateFiscalYearPayload = Pick<
  FiscalYear,
  "name" | "start_date" | "end_date"
>;
export type UpdateFiscalYearPayload = Partial<CreateFiscalYearPayload>;

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

export interface LoanProduct {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  interest_rate: string;
  interest_method: "flat" | "reducing_balance";
  repayment_frequency: "daily" | "weekly" | "monthly" | "quarterly" | "annually";
  min_amount: string;
  max_amount: string;
  min_period_months: number;
  max_period_months: number;
  max_repayments: number | null;
  requires_guarantor: boolean;
  requires_collateral: boolean;
  min_membership_months: number;
  processing_fee_amount: string;
  processing_fee_percent: string;
  penalty_rate: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
export type CreateLoanProductPayload = Omit<
  LoanProduct,
  "id" | "org_id" | "created_at" | "updated_at"
>;
export type UpdateLoanProductPayload = Partial<CreateLoanProductPayload>;

export interface SavingProduct {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  interest_rate: string;
  min_opening_balance: string;
  min_balance: string;
  max_balance: string | null;
  min_deposit: string;
  max_deposit: string | null;
  min_withdrawal: string;
  max_withdrawal: string | null;
  lock_in_months: number;
  withdrawal_frequency: "any" | "daily" | "weekly" | "monthly";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
export type CreateSavingProductPayload = Omit<
  SavingProduct,
  "id" | "org_id" | "created_at" | "updated_at"
>;
export type UpdateSavingProductPayload = Partial<CreateSavingProductPayload>;

// ── Query keys ─────────────────────────────────────────────────────────

export const CONFIGURATIONS_KEY = ["configurations"] as const;
export const ORG_KEY = [...CONFIGURATIONS_KEY, "org"] as const;
export const SACCO_SETTINGS_KEY = [...CONFIGURATIONS_KEY, "sacco-settings"] as const;
export const CURRENCIES_KEY = [...CONFIGURATIONS_KEY, "currencies"] as const;
export const COLLATERAL_TYPES_KEY = [...CONFIGURATIONS_KEY, "collateral-types"] as const;
export const ACTIVITY_TYPES_KEY = [...CONFIGURATIONS_KEY, "activity-types"] as const;
export const BANKS_KEY = [...CONFIGURATIONS_KEY, "banks"] as const;
export const BANK_ACCOUNTS_KEY = [...CONFIGURATIONS_KEY, "bank-accounts"] as const;
export const DEPARTMENTS_KEY = [...CONFIGURATIONS_KEY, "departments"] as const;
export const FISCAL_YEARS_KEY = [...CONFIGURATIONS_KEY, "fiscal-years"] as const;
export const LOAN_PRODUCTS_KEY = [...CONFIGURATIONS_KEY, "loan-products"] as const;
export const SAVING_PRODUCTS_KEY = [...CONFIGURATIONS_KEY, "saving-products"] as const;

// ── Org ────────────────────────────────────────────────────────────────

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

export function useUpdateOrg() {
  const qc = useQueryClient();
  return useMutation<Org, Error, UpdateOrgPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.put<ApiEnvelope<Org>>(
        "/configurations/org",
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ORG_KEY });
    },
  });
}

// ── SACCO Settings ─────────────────────────────────────────────────────

export function useSaccoSettings() {
  return useQuery<SaccoSetting>({
    queryKey: SACCO_SETTINGS_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<SaccoSetting>>(
        "/configurations/sacco-settings",
      );
      return data.data;
    },
    staleTime: 300_000,
  });
}

export function useUpdateSaccoSettings() {
  const qc = useQueryClient();
  return useMutation<SaccoSetting, Error, UpdateSaccoSettingPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.put<ApiEnvelope<SaccoSetting>>(
        "/configurations/sacco-settings",
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SACCO_SETTINGS_KEY });
    },
  });
}

// ── Currencies ─────────────────────────────────────────────────────────

export function useCurrencies() {
  return useQuery<Currency[]>({
    queryKey: CURRENCIES_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<Currency[]>>(
        "/configurations/currencies",
      );
      return data.data;
    },
    staleTime: 300_000,
  });
}

export function useCreateCurrency() {
  const qc = useQueryClient();
  return useMutation<Currency, Error, CreateCurrencyPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<Currency>>(
        "/configurations/currencies",
        payload,
      );
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
      const { data } = await api.put<ApiEnvelope<Currency>>(
        `/configurations/currencies/${id}`,
        payload,
      );
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

// ── Collateral Types ───────────────────────────────────────────────────

export function useCollateralTypes() {
  return useQuery<CollateralType[]>({
    queryKey: COLLATERAL_TYPES_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<CollateralType[]>>(
        "/configurations/collateral-types",
      );
      return data.data;
    },
    staleTime: 300_000,
  });
}

export function useCreateCollateralType() {
  const qc = useQueryClient();
  return useMutation<CollateralType, Error, CreateCollateralTypePayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<CollateralType>>(
        "/configurations/collateral-types",
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: COLLATERAL_TYPES_KEY });
    },
  });
}

export function useUpdateCollateralType(id: string) {
  const qc = useQueryClient();
  return useMutation<CollateralType, Error, UpdateCollateralTypePayload>({
    mutationFn: async (payload) => {
      const { data } = await api.put<ApiEnvelope<CollateralType>>(
        `/configurations/collateral-types/${id}`,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: COLLATERAL_TYPES_KEY });
    },
  });
}

export function useDeleteCollateralType() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/configurations/collateral-types/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: COLLATERAL_TYPES_KEY });
    },
  });
}

// ── Activity Types ─────────────────────────────────────────────────────

export function useActivityTypes() {
  return useQuery<ActivityType[]>({
    queryKey: ACTIVITY_TYPES_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<ActivityType[]>>(
        "/configurations/activity-types",
      );
      return data.data;
    },
    staleTime: 300_000,
  });
}

export function useCreateActivityType() {
  const qc = useQueryClient();
  return useMutation<ActivityType, Error, CreateActivityTypePayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<ActivityType>>(
        "/configurations/activity-types",
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ACTIVITY_TYPES_KEY });
    },
  });
}

export function useUpdateActivityType(id: string) {
  const qc = useQueryClient();
  return useMutation<ActivityType, Error, UpdateActivityTypePayload>({
    mutationFn: async (payload) => {
      const { data } = await api.put<ApiEnvelope<ActivityType>>(
        `/configurations/activity-types/${id}`,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ACTIVITY_TYPES_KEY });
    },
  });
}

export function useDeleteActivityType() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/configurations/activity-types/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ACTIVITY_TYPES_KEY });
    },
  });
}

// ── Banks ──────────────────────────────────────────────────────────────

export function useBanks() {
  return useQuery<Bank[]>({
    queryKey: BANKS_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<Bank[]>>(
        "/configurations/banks",
      );
      return data.data;
    },
    staleTime: 300_000,
  });
}

export function useCreateBank() {
  const qc = useQueryClient();
  return useMutation<Bank, Error, CreateBankPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<Bank>>(
        "/configurations/banks",
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BANKS_KEY });
    },
  });
}

export function useUpdateBank(id: string) {
  const qc = useQueryClient();
  return useMutation<Bank, Error, UpdateBankPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.put<ApiEnvelope<Bank>>(
        `/configurations/banks/${id}`,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BANKS_KEY });
    },
  });
}

export function useDeleteBank() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/configurations/banks/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BANKS_KEY });
    },
  });
}

// ── Bank Accounts ──────────────────────────────────────────────────────

export function useBankAccounts() {
  return useQuery<BankAccount[]>({
    queryKey: BANK_ACCOUNTS_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<BankAccount[]>>(
        "/configurations/bank-accounts",
      );
      return data.data;
    },
    staleTime: 300_000,
  });
}

export function useCreateBankAccount() {
  const qc = useQueryClient();
  return useMutation<BankAccount, Error, CreateBankAccountPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<BankAccount>>(
        "/configurations/bank-accounts",
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BANK_ACCOUNTS_KEY });
    },
  });
}

export function useUpdateBankAccount(id: string) {
  const qc = useQueryClient();
  return useMutation<BankAccount, Error, UpdateBankAccountPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.put<ApiEnvelope<BankAccount>>(
        `/configurations/bank-accounts/${id}`,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BANK_ACCOUNTS_KEY });
    },
  });
}

export function useDeleteBankAccount() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/configurations/bank-accounts/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BANK_ACCOUNTS_KEY });
    },
  });
}

// ── Departments ────────────────────────────────────────────────────────

export function useDepartments() {
  return useQuery<Department[]>({
    queryKey: DEPARTMENTS_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<Department[]>>(
        "/configurations/departments",
      );
      return data.data;
    },
    staleTime: 300_000,
  });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation<Department, Error, CreateDepartmentPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<Department>>(
        "/configurations/departments",
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DEPARTMENTS_KEY });
    },
  });
}

export function useUpdateDepartment(id: string) {
  const qc = useQueryClient();
  return useMutation<Department, Error, UpdateDepartmentPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.put<ApiEnvelope<Department>>(
        `/configurations/departments/${id}`,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DEPARTMENTS_KEY });
    },
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/configurations/departments/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DEPARTMENTS_KEY });
    },
  });
}

// ── Loan Products ──────────────────────────────────────────────────────

export function useLoanProducts() {
  return useQuery<LoanProduct[]>({
    queryKey: LOAN_PRODUCTS_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<LoanProduct[]>>(
        "/configurations/loan-products",
      );
      return data.data;
    },
    staleTime: 300_000,
  });
}

export function useCreateLoanProduct() {
  const qc = useQueryClient();
  return useMutation<LoanProduct, Error, CreateLoanProductPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<LoanProduct>>(
        "/configurations/loan-products",
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LOAN_PRODUCTS_KEY });
    },
  });
}

export function useUpdateLoanProduct(id: string) {
  const qc = useQueryClient();
  return useMutation<LoanProduct, Error, UpdateLoanProductPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.put<ApiEnvelope<LoanProduct>>(
        `/configurations/loan-products/${id}`,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LOAN_PRODUCTS_KEY });
    },
  });
}

export function useDeleteLoanProduct() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/configurations/loan-products/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LOAN_PRODUCTS_KEY });
    },
  });
}

// ── Saving Products ────────────────────────────────────────────────────

export function useSavingProducts() {
  return useQuery<SavingProduct[]>({
    queryKey: SAVING_PRODUCTS_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<SavingProduct[]>>(
        "/configurations/saving-products",
      );
      return data.data;
    },
    staleTime: 300_000,
  });
}

export function useCreateSavingProduct() {
  const qc = useQueryClient();
  return useMutation<SavingProduct, Error, CreateSavingProductPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<SavingProduct>>(
        "/configurations/saving-products",
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SAVING_PRODUCTS_KEY });
    },
  });
}

export function useUpdateSavingProduct(id: string) {
  const qc = useQueryClient();
  return useMutation<SavingProduct, Error, UpdateSavingProductPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.put<ApiEnvelope<SavingProduct>>(
        `/configurations/saving-products/${id}`,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SAVING_PRODUCTS_KEY });
    },
  });
}

export function useDeleteSavingProduct() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/configurations/saving-products/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SAVING_PRODUCTS_KEY });
    },
  });
}

// ── Fiscal Years ───────────────────────────────────────────────────────

export function useFiscalYears() {
  return useQuery<FiscalYear[]>({
    queryKey: FISCAL_YEARS_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<FiscalYear[]>>(
        "/configurations/fiscal-years",
      );
      return data.data;
    },
    staleTime: 60_000,
  });
}

export function useCreateFiscalYear() {
  const qc = useQueryClient();
  return useMutation<FiscalYear, Error, CreateFiscalYearPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ApiEnvelope<FiscalYear>>(
        "/configurations/fiscal-years",
        payload,
      );
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
      const { data } = await api.post<ApiEnvelope<FiscalYear>>(
        `/configurations/fiscal-years/${id}/close`,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FISCAL_YEARS_KEY });
    },
  });
}

// ── Periods ────────────────────────────────────────────────────────────

export function usePeriods(fyId: string) {
  return useQuery<Period[]>({
    queryKey: [...FISCAL_YEARS_KEY, fyId, "periods"],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<Period[]>>(
        `/configurations/fiscal-years/${fyId}/periods`,
      );
      return data.data;
    },
    staleTime: 60_000,
    enabled: Boolean(fyId),
  });
}

export function useUpdatePeriodStatus() {
  const qc = useQueryClient();
  return useMutation<
    Period,
    Error,
    { id: string; status: "open" | "close" | "post" }
  >({
    mutationFn: async ({ id, status }) => {
      const { data } = await api.patch<ApiEnvelope<Period>>(
        `/configurations/periods/${id}/status`,
        { status },
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FISCAL_YEARS_KEY });
    },
  });
}

// ── Org Logo Upload ────────────────────────────────────────────────────

export function useUploadOrgLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("logo", file);
      const { data } = await api.post<ApiEnvelope<Org>>("/configurations/org/logo", fd);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ORG_KEY }),
  });
}

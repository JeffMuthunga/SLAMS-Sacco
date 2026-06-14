import { api, ApiEnvelope } from "@/lib/api";

export type ImportEntity = "members" | "accounts" | "loans";

export interface ImportFailure {
  row: number;
  errors: string[];
  values: Record<string, string>;
}

export interface DryRunResult {
  rows_valid: number;
  rows_skipped: number;
  failure_count: number;
  failures: ImportFailure[];
}

export interface CommitResult {
  inserted: number;
  skipped: number;
  failure_count: number;
}

export async function downloadTemplate(entity: ImportEntity): Promise<void> {
  const response = await api.get(`/imports/templates/${entity}`, { responseType: "blob" });
  const url      = URL.createObjectURL(new Blob([response.data as BlobPart]));
  const link     = document.createElement("a");
  link.href      = url;
  link.download  = `${entity}_template.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function dryRunImport(entity: ImportEntity, file: File): Promise<DryRunResult> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<ApiEnvelope<DryRunResult>>(
    `/imports/${entity}/dry-run`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data.data;
}

export async function commitImport(entity: ImportEntity, file: File): Promise<CommitResult> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<ApiEnvelope<CommitResult>>(
    `/imports/${entity}/commit`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data.data;
}

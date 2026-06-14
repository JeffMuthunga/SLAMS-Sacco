"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import SelectInput from "@/components/Forms/SelectInput";
import DateInput from "@/components/Forms/DateInput";
import NumberInput from "@/components/Forms/NumberInput";
import KinRow, { KinFormValues } from "./KinRow";
import {
  Member,
  useCreateMember,
  useUpdateMember,
} from "@/lib/api/members";
import { api, extractApiError, extractFieldErrors } from "@/lib/api";
import { useEligibleEmployers } from "@/lib/api/configurations";

// ── Option lists ───────────────────────────────────────────────────────

const TITLE_OPTIONS = [
  { value: "Mr",   label: "Mr" },
  { value: "Mrs",  label: "Mrs" },
  { value: "Miss", label: "Miss" },
  { value: "Dr",   label: "Dr" },
  { value: "Prof", label: "Prof" },
  { value: "Rev",  label: "Rev" },
];

const ID_TYPE_OPTIONS = [
  { value: "national", label: "National ID" },
  { value: "passport", label: "Passport" },
  { value: "alien",    label: "Alien Card" },
  { value: "military", label: "Military ID" },
];

const GENDER_OPTIONS = [
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
];

const MARITAL_OPTIONS = [
  { value: "single",   label: "Single" },
  { value: "married",  label: "Married" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed",  label: "Widowed" },
];

// ── Types ──────────────────────────────────────────────────────────────

interface FormState {
  title: string;
  full_name: string;
  id_type: string;
  id_number: string;
  email: string;
  phone: string;
  phone2: string;
  date_of_birth: string;
  gender: string;
  nationality: string;
  marital_status: string;
  address: string;
  town: string;
  postal_code: string;
  employed: boolean;
  self_employed: boolean;
  employer_name: string;
  monthly_salary: string;
  monthly_net_income: string;
  entry_date: string;
}

interface MemberKinInit {
  id?: string;
  full_name?: string;
  relationship?: string;
  date_of_birth?: string | null;
  id_number?: string | null;
  id_type?: string | null;
  phone?: string | null;
  is_emergency_contact?: boolean;
  is_beneficiary?: boolean;
  beneficiary_percent?: string | null;
}

interface Props {
  defaultValues?: Partial<FormState> & { kins?: MemberKinInit[] };
  memberId?: string;
}

const EMPTY_STATE: FormState = {
  title: "", full_name: "", id_type: "", id_number: "",
  email: "", phone: "", phone2: "", date_of_birth: "",
  gender: "", nationality: "KEN", marital_status: "",
  address: "", town: "", postal_code: "",
  employed: false, self_employed: false,
  employer_name: "", monthly_salary: "", monthly_net_income: "",
  entry_date: "",
};

function initKin(init?: MemberKinInit): KinFormValues {
  return {
    _key: uuidv4(),
    id: init?.id,
    full_name: init?.full_name ?? "",
    relationship: init?.relationship ?? "",
    date_of_birth: init?.date_of_birth ?? "",
    id_number: init?.id_number ?? "",
    id_type: init?.id_type ?? "",
    phone: init?.phone ?? "",
    is_emergency_contact: init?.is_emergency_contact ?? false,
    is_beneficiary: init?.is_beneficiary ?? false,
    beneficiary_percent: init?.beneficiary_percent ?? "",
  };
}

// ── Component ──────────────────────────────────────────────────────────

export default function MemberForm({ defaultValues, memberId }: Props) {
  const router = useRouter();
  const isEdit = !!memberId;

  const [form, setForm] = useState<FormState>({ ...EMPTY_STATE, ...defaultValues });
  const [kins, setKins] = useState<KinFormValues[]>(
    (defaultValues?.kins ?? []).map(initKin)
  );
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const createMutation = useCreateMember();
  const updateMutation = useUpdateMember(memberId ?? "");

  const { data: eligibleEmployers } = useEligibleEmployers();

  const employerNotOnList =
    !!form.employer_name &&
    !!eligibleEmployers &&
    eligibleEmployers.length > 0 &&
    !eligibleEmployers.some(
      (e) =>
        e.is_active &&
        e.name.toLowerCase() === form.employer_name.toLowerCase(),
    );

  const submitting = createMutation.isPending || updateMutation.isPending;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const err = (name: string) => fieldErrors[name]?.[0];

  const buildPayload = () => ({
    ...form,
    monthly_salary: form.monthly_salary || null,
    monthly_net_income: form.monthly_net_income || null,
    kins: kins.map(({ _key, ...rest }) => rest),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    try {
      let member: Member;

      if (isEdit) {
        member = await updateMutation.mutateAsync(buildPayload());
      } else {
        member = await createMutation.mutateAsync(buildPayload());
      }

      if (photoFile) {
        const fd = new FormData();
        fd.append("photo", photoFile);
        try {
          await api.post(`/members/${member.id}/photo`, fd);
        } catch {
          toast.warning("Member saved but photo upload failed. You can re-upload from the profile page.");
        }
      }

      toast.success(isEdit ? "Member updated." : "Member created — pending approval.");
      router.push(`/admin/members/${member.id}`);
    } catch (error) {
      const fe = extractFieldErrors(error);
      if (fe) {
        setFieldErrors(fe);
      } else {
        toast.error(extractApiError(error));
      }
    }
  };

  const addKin = () => setKins((k) => [...k, initKin()]);
  const removeKin = (key: string) => setKins((k) => k.filter((x) => x._key !== key));
  const updateKin = (key: string, updated: KinFormValues) =>
    setKins((k) => k.map((x) => (x._key === key ? updated : x)));

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

      {/* ── Personal Details ── */}
      <div className="rounded-xl border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
        <h2 className="mb-5 text-lg font-semibold text-dark dark:text-white">Personal Details</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

          <SelectInput
            label="Title"
            options={TITLE_OPTIONS}
            value={TITLE_OPTIONS.find((o) => o.value === form.title) ?? null}
            onChange={(opt) => set("title", opt?.value ?? "")}
            isClearable
            usePortal
          />

          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => set("full_name", e.target.value)}
              required
              className={`w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 ${
                err("full_name") ? "border-red-600 focus:ring-red-600" : "border-gray-300 hover:border-green-600 focus:ring-green-600"
              }`}
            />
            {err("full_name") && <p className="mt-1 text-xs text-red-500">{err("full_name")}</p>}
          </div>

          <SelectInput
            label="ID Type *"
            options={ID_TYPE_OPTIONS}
            value={ID_TYPE_OPTIONS.find((o) => o.value === form.id_type) ?? null}
            onChange={(opt) => set("id_type", opt?.value ?? "")}
            error={err("id_type")}
            required
            usePortal
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              ID Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.id_number}
              onChange={(e) => set("id_number", e.target.value)}
              required
              className={`w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 ${
                err("id_number") ? "border-red-600 focus:ring-red-600" : "border-gray-300 hover:border-green-600 focus:ring-green-600"
              }`}
            />
            {err("id_number") && <p className="mt-1 text-xs text-red-500">{err("id_number")}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:border-green-600 focus:ring-2 focus:ring-green-600"
            />
            {err("email") && <p className="mt-1 text-xs text-red-500">{err("email")}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              required
              className={`w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 ${
                err("phone") ? "border-red-600 focus:ring-red-600" : "border-gray-300 hover:border-green-600 focus:ring-green-600"
              }`}
            />
            {err("phone") && <p className="mt-1 text-xs text-red-500">{err("phone")}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Phone 2</label>
            <input
              type="text"
              value={form.phone2}
              onChange={(e) => set("phone2", e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:border-green-600 focus:ring-2 focus:ring-green-600"
            />
          </div>

          <DateInput
            label="Date of Birth *"
            name="date_of_birth"
            value={form.date_of_birth}
            onChange={(d) => set("date_of_birth", d)}
            required
            disableTime
            error={err("date_of_birth")}
          />

          <SelectInput
            label="Gender"
            options={GENDER_OPTIONS}
            value={GENDER_OPTIONS.find((o) => o.value === form.gender) ?? null}
            onChange={(opt) => set("gender", opt?.value ?? "")}
            isClearable
            usePortal
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Nationality</label>
            <input
              type="text"
              value={form.nationality}
              onChange={(e) => set("nationality", e.target.value)}
              maxLength={3}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:border-green-600 focus:ring-2 focus:ring-green-600"
            />
          </div>

          <SelectInput
            label="Marital Status"
            options={MARITAL_OPTIONS}
            value={MARITAL_OPTIONS.find((o) => o.value === form.marital_status) ?? null}
            onChange={(opt) => set("marital_status", opt?.value ?? "")}
            isClearable
            usePortal
          />

          <div className="sm:col-span-2 lg:col-span-3">
            <label className="mb-2 block text-sm font-medium text-gray-700">Address</label>
            <textarea
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              rows={2}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:border-green-600 focus:ring-2 focus:ring-green-600"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Town</label>
            <input
              type="text"
              value={form.town}
              onChange={(e) => set("town", e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:border-green-600 focus:ring-2 focus:ring-green-600"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Postal Code</label>
            <input
              type="text"
              value={form.postal_code}
              onChange={(e) => set("postal_code", e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:border-green-600 focus:ring-2 focus:ring-green-600"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-green-50 file:px-3 file:py-1.5 file:text-green-700 hover:file:bg-green-100"
            />
          </div>
        </div>
      </div>

      {/* ── Employment ── */}
      <div className="rounded-xl border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
        <h2 className="mb-5 text-lg font-semibold text-dark dark:text-white">Employment</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

          <DateInput
            label="Entry Date *"
            name="entry_date"
            value={form.entry_date}
            onChange={(d) => set("entry_date", d)}
            required
            disableTime
            error={err("entry_date")}
          />

          <div className="flex items-center gap-6 pt-7">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.employed}
                onChange={(e) => set("employed", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-600"
              />
              Employed
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.self_employed}
                onChange={(e) => set("self_employed", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-600"
              />
              Self-Employed
            </label>
          </div>

          {form.employed && (
            <>
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="mb-2 block text-sm font-medium text-gray-700">Employer Name</label>
                <input
                  type="text"
                  value={form.employer_name}
                  onChange={(e) => set("employer_name", e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:border-green-600 focus:ring-2 focus:ring-green-600"
                />
                {employerNotOnList && (
                  <p className="mt-1 text-xs text-amber-600">
                    This employer is not on the approved eligible employers list. The member application may be rejected.
                  </p>
                )}
              </div>
              <NumberInput
                label="Monthly Salary"
                name="monthly_salary"
                value={form.monthly_salary}
                onChange={(e) => set("monthly_salary", e.target.value)}
                step="any"
                min={0}
                error={err("monthly_salary")}
              />
              <NumberInput
                label="Monthly Net Income"
                name="monthly_net_income"
                value={form.monthly_net_income}
                onChange={(e) => set("monthly_net_income", e.target.value)}
                step="any"
                min={0}
                error={err("monthly_net_income")}
              />
            </>
          )}
        </div>
      </div>

      {/* ── Next of Kin ── */}
      <div className="rounded-xl border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-dark dark:text-white">Next of Kin</h2>
          <button
            type="button"
            onClick={addKin}
            className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
          >
            + Add Kin
          </button>
        </div>

        {fieldErrors["kins"] && (
          <p className="mb-3 text-sm text-red-500">{fieldErrors["kins"]?.[0]}</p>
        )}

        <div className="flex flex-col gap-4">
          {kins.map((kin, i) => (
            <KinRow
              key={kin._key}
              kin={kin}
              index={i}
              errors={fieldErrors}
              onChange={(updated) => updateKin(kin._key, updated)}
              onRemove={() => removeKin(kin._key)}
            />
          ))}
          {kins.length === 0 && (
            <p className="text-sm text-gray-500">No next of kin added yet.</p>
          )}
        </div>
      </div>

      {/* ── Submit ── */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "Saving…" : isEdit ? "Update Member" : "Create Member"}
        </button>
      </div>
    </form>
  );
}

"use client";

import React from "react";
import SelectInput from "@/components/Forms/SelectInput";
import DateInput from "@/components/Forms/DateInput";

export interface KinFormValues {
  _key: string;
  id?: string;
  full_name: string;
  relationship: string;
  date_of_birth: string;
  id_number: string;
  id_type: string;
  phone: string;
  is_emergency_contact: boolean;
  is_beneficiary: boolean;
  beneficiary_percent: string;
}

interface Props {
  kin: KinFormValues;
  index: number;
  errors: Record<string, string[]>;
  onChange: (updated: KinFormValues) => void;
  onRemove: () => void;
}

const RELATIONSHIP_OPTIONS = [
  { value: "spouse",  label: "Spouse" },
  { value: "child",   label: "Child" },
  { value: "parent",  label: "Parent" },
  { value: "sibling", label: "Sibling" },
  { value: "other",   label: "Other" },
];

const ID_TYPE_OPTIONS = [
  { value: "national",  label: "National ID" },
  { value: "passport",  label: "Passport" },
  { value: "alien",     label: "Alien Card" },
  { value: "military",  label: "Military ID" },
];

export default function KinRow({ kin, index, errors, onChange, onRemove }: Props) {
  const field = (name: string) => errors[`kins.${index}.${name}`]?.[0];

  const set = (patch: Partial<KinFormValues>) => onChange({ ...kin, ...patch });

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Next of Kin {index + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="text-sm text-red-500 hover:text-red-700"
        >
          Remove
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={kin.full_name}
            onChange={(e) => set({ full_name: e.target.value })}
            className={`w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 ${
              field("full_name")
                ? "border-red-600 focus:ring-red-600"
                : "border-gray-300 hover:border-green-600 focus:ring-green-600"
            }`}
          />
          {field("full_name") && <p className="mt-1 text-xs text-red-500">{field("full_name")}</p>}
        </div>

        <SelectInput
          label="Relationship *"
          options={RELATIONSHIP_OPTIONS}
          value={RELATIONSHIP_OPTIONS.find((o) => o.value === kin.relationship) ?? null}
          onChange={(opt) => set({ relationship: opt?.value ?? "" })}
          error={field("relationship")}
          usePortal
        />

        <DateInput
          label="Date of Birth"
          name={`kin_${index}_dob`}
          value={kin.date_of_birth}
          onChange={(d) => set({ date_of_birth: d })}
          disableTime
          error={field("date_of_birth")}
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
          <input
            type="text"
            value={kin.phone}
            onChange={(e) => set({ phone: e.target.value })}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:border-green-600 focus:ring-2 focus:ring-green-600"
          />
        </div>

        <SelectInput
          label="ID Type"
          options={ID_TYPE_OPTIONS}
          value={ID_TYPE_OPTIONS.find((o) => o.value === kin.id_type) ?? null}
          onChange={(opt) => set({ id_type: opt?.value ?? "" })}
          isClearable
          usePortal
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">ID Number</label>
          <input
            type="text"
            value={kin.id_number}
            onChange={(e) => set({ id_number: e.target.value })}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:border-green-600 focus:ring-2 focus:ring-green-600"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-6">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={kin.is_emergency_contact}
            onChange={(e) => set({ is_emergency_contact: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-600"
          />
          Emergency Contact
        </label>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={kin.is_beneficiary}
            onChange={(e) => set({ is_beneficiary: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-600"
          />
          Beneficiary
        </label>

        {kin.is_beneficiary && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Percent:</label>
            <input
              type="number"
              min={0}
              max={100}
              step="any"
              value={kin.beneficiary_percent}
              onChange={(e) => set({ beneficiary_percent: e.target.value })}
              className={`w-24 rounded-md border px-2 py-1.5 text-sm focus:ring-2 ${
                field("beneficiary_percent")
                  ? "border-red-600 focus:ring-red-600"
                  : "border-gray-300 focus:ring-green-600"
              }`}
            />
            <span className="text-sm text-gray-500">%</span>
            {field("beneficiary_percent") && (
              <p className="text-xs text-red-500">{field("beneficiary_percent")}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

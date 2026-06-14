"use client";

import React from "react";
import { useMemberProfile } from "@/lib/api/member-portal";
import { extractApiError } from "@/lib/api";

function Row({ label, value }: { label: string; value?: string | number | boolean | null }) {
  const display = value === null || value === undefined || value === ""
    ? <span className="text-gray-400 italic">—</span>
    : typeof value === "boolean"
      ? <span className={value ? "text-green-600" : "text-gray-400"}>{value ? "Yes" : "No"}</span>
      : <span>{String(value)}</span>;

  return (
    <div className="flex flex-col gap-0.5 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-dark dark:text-white">{display}</dd>
    </div>
  );
}

export default function MyDetailsPage() {
  const { data: member, isLoading, error } = useMemberProfile();

  if (isLoading) return <p className="p-6 text-gray-500">Loading…</p>;
  if (error)     return <p className="p-6 text-red-500">{extractApiError(error)}</p>;
  if (!member)   return null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-dark dark:text-white">My Details</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Personal */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-dark">
          <h2 className="mb-3 font-semibold text-dark dark:text-white">Personal Information</h2>
          <dl>
            <Row label="Member Number"   value={member.member_number} />
            <Row label="Full Name"        value={member.full_name} />
            <Row label="Title"            value={member.title} />
            <Row label="Gender"           value={member.gender} />
            <Row label="Date of Birth"    value={member.date_of_birth} />
            <Row label="Nationality"      value={member.nationality} />
            <Row label="Marital Status"   value={member.marital_status} />
            <Row label="ID Type"          value={member.id_type} />
            <Row label="ID Number"        value={member.id_number} />
          </dl>
        </div>

        {/* Contact */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-dark">
          <h2 className="mb-3 font-semibold text-dark dark:text-white">Contact & Address</h2>
          <dl>
            <Row label="Email"       value={member.email} />
            <Row label="Phone"       value={member.phone} />
            <Row label="Phone 2"     value={member.phone2} />
            <Row label="Address"     value={member.address} />
            <Row label="Town"        value={member.town} />
            <Row label="Postal Code" value={member.postal_code} />
          </dl>
        </div>

        {/* Employment */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-dark">
          <h2 className="mb-3 font-semibold text-dark dark:text-white">Employment</h2>
          <dl>
            <Row label="Employed"          value={member.employed} />
            <Row label="Self-Employed"     value={member.self_employed} />
            <Row label="Employer Name"     value={member.employer_name} />
            <Row label="Monthly Salary"    value={member.monthly_salary ? `BWP ${Number(member.monthly_salary).toLocaleString("en-BW", { minimumFractionDigits: 2 })}` : null} />
            <Row label="Monthly Net Income" value={member.monthly_net_income ? `BWP ${Number(member.monthly_net_income).toLocaleString("en-BW", { minimumFractionDigits: 2 })}` : null} />
          </dl>
        </div>

        {/* Membership */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-dark">
          <h2 className="mb-3 font-semibold text-dark dark:text-white">Membership</h2>
          <dl>
            <Row label="Entry Date"       value={member.entry_date} />
            <Row label="Status"           value={member.is_active ? "Active" : "Inactive"} />
            <Row label="Approval Status"  value={member.approval_status} />
          </dl>
        </div>

        {/* Next of Kin */}
        {member.kins && member.kins.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-dark lg:col-span-2">
            <h2 className="mb-3 font-semibold text-dark dark:text-white">Next of Kin / Beneficiaries</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-2 text-left text-xs text-gray-500">Name</th>
                    <th className="pb-2 text-left text-xs text-gray-500">Relationship</th>
                    <th className="pb-2 text-left text-xs text-gray-500">Phone</th>
                    <th className="pb-2 text-left text-xs text-gray-500">Emergency</th>
                    <th className="pb-2 text-left text-xs text-gray-500">Beneficiary %</th>
                  </tr>
                </thead>
                <tbody>
                  {member.kins.map((kin) => (
                    <tr key={kin.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <td className="py-2 font-medium">{kin.full_name}</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{kin.relationship}</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{kin.phone ?? "—"}</td>
                      <td className="py-2">{kin.is_emergency_contact ? "Yes" : "—"}</td>
                      <td className="py-2">{kin.is_beneficiary ? `${kin.beneficiary_percent}%` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import ApprovalStatusBadge from "@/components/Members/ApprovalStatusBadge";
import {
  useMember,
  useApproveMember,
  useRejectMember,
  useDeleteMember,
  useCreatePortalAccount,
} from "@/lib/api/members";
import { extractApiError } from "@/lib/api";
import { Can } from "@/lib/AbilityContext";
import { useMemberShares, MemberShare } from "@/lib/api/shares";

type Tab = "details" | "shares";

const TABS: { key: Tab; label: string }[] = [
  { key: "details", label: "Details" },
  { key: "shares",  label: "Shares" },
];

const SHARE_STATUS_CFG: Record<MemberShare["status"], { label: string; className: string }> = {
  pending:  { label: "Pending",  className: "bg-yellow-100 text-yellow-700" },
  approved: { label: "Approved", className: "bg-green-100 text-green-700" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-700" },
};

export default function MemberDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const { data: member, isLoading, error } = useMember(id);
  const approveMutation      = useApproveMember();
  const rejectMutation       = useRejectMember();
  const deleteMutation       = useDeleteMember();
  const portalAccountMutation = useCreatePortalAccount();

  const [tab, setTab] = useState<Tab>("details");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");

  const { data: sharesData, isLoading: sharesLoading } = useMemberShares({ member_id: id });
  const shares = sharesData?.data ?? [];

  const totalApprovedValue = shares
    .filter((s) => s.status === "approved")
    .reduce((sum, s) => sum + Number(s.total_amount), 0);

  const handleApprove = async () => {
    if (!window.confirm("Approve this member?")) return;
    try {
      await approveMutation.mutateAsync(id);
      toast.success("Member approved.");
    } catch (err) {
      toast.error(extractApiError(err));
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setRejectError("Reason is required.");
      return;
    }
    try {
      await rejectMutation.mutateAsync({ id, reason: rejectReason });
      toast.success("Member rejected.");
      setShowRejectModal(false);
    } catch (err) {
      toast.error(extractApiError(err));
    }
  };

  const handleCreatePortalAccount = async () => {
    if (!window.confirm("Create a portal account for this member? They will receive a temporary password.")) return;
    try {
      await portalAccountMutation.mutateAsync(id);
      toast.success("Portal account created. Temporary password: password");
    } catch (err) {
      toast.error(extractApiError(err));
    }
  };

  const handleArchive = async () => {
    if (!window.confirm("Archive this member?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Member archived.");
      router.push("/admin/members");
    } catch (err) {
      toast.error(extractApiError(err));
    }
  };

  if (isLoading) return <p className="text-gray-500">Loading…</p>;
  if (error) return <p className="text-red-500">Failed to load member.</p>;
  if (!member) return <p className="text-red-500">Member not found.</p>;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">{member.member_number}</p>
          <h1 className="text-2xl font-semibold text-dark dark:text-white">{member.full_name}</h1>
          <div className="mt-2">
            <ApprovalStatusBadge status={member.approval_status} />
          </div>
        </div>
        <Can I="manage_members" a="all">
          <div className="flex flex-wrap gap-2">
            {member.approval_status === "pending" && (
              <>
                <button
                  onClick={handleApprove}
                  disabled={approveMutation.isPending}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
                >
                  Approve
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
                >
                  Reject
                </button>
              </>
            )}
            {member.approval_status === "approved" && !member.user_id && member.email && (
              <button
                onClick={handleCreatePortalAccount}
                disabled={portalAccountMutation.isPending}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                Create Portal Account
              </button>
            )}
            <Link
              href={`/admin/members/${id}/edit`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Edit
            </Link>
            <button
              onClick={handleArchive}
              disabled={deleteMutation.isPending}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              Archive
            </button>
          </div>
        </Can>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-dark w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-primary text-white"
                : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Details tab ─────────────────────────────────────────────── */}
      {tab === "details" && (
        <>
      {/* Details grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Personal */}
        <div className="rounded-xl border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
          <h2 className="mb-4 text-base font-semibold text-dark dark:text-white">Personal Details</h2>
          {member.photo_url && (
            <Image
              src={member.photo_url}
              alt="Member photo"
              width={96}
              height={96}
              className="mb-4 rounded-full object-cover"
            />
          )}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <dt className="font-medium text-gray-500">ID Type</dt>
            <dd className="capitalize text-gray-900 dark:text-gray-100">{member.id_type}</dd>
            <dt className="font-medium text-gray-500">ID Number</dt>
            <dd className="text-gray-900 dark:text-gray-100">{member.id_number}</dd>
            <dt className="font-medium text-gray-500">Phone</dt>
            <dd className="text-gray-900 dark:text-gray-100">{member.phone}</dd>
            {member.phone2 && (
              <>
                <dt className="font-medium text-gray-500">Phone 2</dt>
                <dd className="text-gray-900 dark:text-gray-100">{member.phone2}</dd>
              </>
            )}
            {member.email && (
              <>
                <dt className="font-medium text-gray-500">Email</dt>
                <dd className="text-gray-900 dark:text-gray-100">{member.email}</dd>
              </>
            )}
            <dt className="font-medium text-gray-500">Date of Birth</dt>
            <dd className="text-gray-900 dark:text-gray-100">
              {member.date_of_birth ? new Date(member.date_of_birth).toLocaleDateString("en-BW") : "—"}
            </dd>
            {member.gender && (
              <>
                <dt className="font-medium text-gray-500">Gender</dt>
                <dd className="text-gray-900 dark:text-gray-100">{{ M: "Male", F: "Female" }[member.gender] ?? member.gender}</dd>
              </>
            )}
            {member.nationality && (
              <>
                <dt className="font-medium text-gray-500">Nationality</dt>
                <dd className="text-gray-900 dark:text-gray-100">{member.nationality}</dd>
              </>
            )}
            {member.marital_status && (
              <>
                <dt className="font-medium text-gray-500">Marital Status</dt>
                <dd className="capitalize text-gray-900 dark:text-gray-100">{member.marital_status}</dd>
              </>
            )}
            {member.address && (
              <>
                <dt className="font-medium text-gray-500">Address</dt>
                <dd className="text-gray-900 dark:text-gray-100">{member.address}</dd>
              </>
            )}
            {member.town && (
              <>
                <dt className="font-medium text-gray-500">Town</dt>
                <dd className="text-gray-900 dark:text-gray-100">{member.town}</dd>
              </>
            )}
          </dl>
        </div>

        {/* Employment */}
        <div className="rounded-xl border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
          <h2 className="mb-4 text-base font-semibold text-dark dark:text-white">Employment</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <dt className="font-medium text-gray-500">Entry Date</dt>
            <dd className="text-gray-900 dark:text-gray-100">
              {member.entry_date ? new Date(member.entry_date).toLocaleDateString("en-BW") : "—"}
            </dd>
            <dt className="font-medium text-gray-500">Employed</dt>
            <dd className="text-gray-900 dark:text-gray-100">{member.employed ? "Yes" : "No"}</dd>
            <dt className="font-medium text-gray-500">Self-Employed</dt>
            <dd className="text-gray-900 dark:text-gray-100">{member.self_employed ? "Yes" : "No"}</dd>
            {member.employer_name && (
              <>
                <dt className="font-medium text-gray-500">Employer</dt>
                <dd className="text-gray-900 dark:text-gray-100">{member.employer_name}</dd>
              </>
            )}
            {member.monthly_salary && (
              <>
                <dt className="font-medium text-gray-500">Monthly Salary</dt>
                <dd className="text-gray-900 dark:text-gray-100">
                  {Number(member.monthly_salary).toLocaleString("en-BW")}
                </dd>
              </>
            )}
            {member.monthly_net_income && (
              <>
                <dt className="font-medium text-gray-500">Net Income</dt>
                <dd className="text-gray-900 dark:text-gray-100">
                  {Number(member.monthly_net_income).toLocaleString("en-BW")}
                </dd>
              </>
            )}
          </dl>
        </div>
      </div>

      {/* Kins */}
      {member.kins.length > 0 && (
        <div className="rounded-xl border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
          <h2 className="mb-4 text-base font-semibold text-dark dark:text-white">Next of Kin</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium uppercase text-gray-500">
                  <th className="pb-2 pr-4">Name</th>
                  <th className="pb-2 pr-4">Relationship</th>
                  <th className="pb-2 pr-4">Phone</th>
                  <th className="pb-2 pr-4">Emergency</th>
                  <th className="pb-2">Beneficiary %</th>
                </tr>
              </thead>
              <tbody>
                {member.kins.map((kin) => (
                  <tr key={kin.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium text-gray-900 dark:text-gray-100">{kin.full_name}</td>
                    <td className="py-2 pr-4 capitalize text-gray-600">{kin.relationship}</td>
                    <td className="py-2 pr-4 text-gray-600">{kin.phone ?? "—"}</td>
                    <td className="py-2 pr-4 text-gray-600">{kin.is_emergency_contact ? "Yes" : "No"}</td>
                    <td className="py-2 text-gray-600">
                      {kin.is_beneficiary ? `${kin.beneficiary_percent}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

        </>
      )}

      {/* ── Shares tab ──────────────────────────────────────────────── */}
      {tab === "shares" && (
        <div className="flex flex-col gap-4">
          {/* Balance summary */}
          <div className="rounded-xl border border-stroke bg-white p-5 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
            <p className="text-xs font-medium uppercase text-gray-500">Total Approved Shares Value</p>
            <p className="mt-1 text-2xl font-bold text-dark dark:text-white">
              BWP {totalApprovedValue.toLocaleString("en-BW", { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Shares table */}
          <div className="rounded-xl border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
            <h2 className="mb-4 text-base font-semibold text-dark dark:text-white">Share Purchases</h2>

            {sharesLoading && <p className="text-sm text-gray-500">Loading…</p>}

            {!sharesLoading && shares.length === 0 && (
              <p className="text-sm text-gray-500">No share purchases recorded for this member.</p>
            )}

            {!sharesLoading && shares.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs font-medium uppercase text-gray-500">
                      <th className="pb-2 pr-4">Share Product</th>
                      <th className="pb-2 pr-4">Quantity</th>
                      <th className="pb-2 pr-4">Price/Share (BWP)</th>
                      <th className="pb-2 pr-4">Total Amount (BWP)</th>
                      <th className="pb-2 pr-4">Purchase Date</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shares.map((share) => {
                      const cfg = SHARE_STATUS_CFG[share.status];
                      return (
                        <tr key={share.id} className="border-b last:border-0">
                          <td className="py-2 pr-4 font-medium text-gray-900 dark:text-gray-100">
                            {share.share_product?.name ?? "—"}
                          </td>
                          <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">
                            {share.quantity.toLocaleString("en-BW")}
                          </td>
                          <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">
                            {Number(share.price_per_share).toLocaleString("en-BW", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">
                            {Number(share.total_amount).toLocaleString("en-BW", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 pr-4 text-gray-600">
                            {new Date(share.purchase_date).toLocaleDateString("en-BW")}
                          </td>
                          <td className="py-2">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
                              {cfg.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal — always rendered outside tab panels */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-dark">
            <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">Reject Member</h3>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => { setRejectReason(e.target.value); setRejectError(""); }}
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
            />
            {rejectError && <p className="mt-1 text-xs text-red-500">{rejectError}</p>}
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => { setShowRejectModal(false); setRejectReason(""); setRejectError(""); }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={rejectMutation.isPending}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

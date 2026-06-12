"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import DateInput from "@/components/Forms/DateInput";
import NumberInput from "@/components/Forms/NumberInput";
import SelectInput from "@/components/Forms/SelectInput";
import { useCreateLoan } from "@/lib/api/loans";
import { useMembers } from "@/lib/api/members";
import { useLoanProducts } from "@/lib/api/configurations";
import { extractApiError, extractFieldErrors } from "@/lib/api";

interface Guarantor { member_id: string; guaranteed_amount: string; label: string }
interface Collateral { collateral_type: string; description: string; estimated_value: string }
interface FormErrors { [key: string]: string | string[] }
const fe = (e: FormErrors, k: string): string | undefined => {
  const v = e[k];
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
};

export default function CreateLoanPage() {
  const router = useRouter();

  const [memberId, setMemberId]           = useState("");
  const [productId, setProductId]         = useState("");
  const [principal, setPrincipal]         = useState("");
  const [interestRate, setInterestRate]   = useState("");
  const [period, setPeriod]               = useState("");
  const [frequency, setFrequency]         = useState("monthly");
  const [note, setNote]                   = useState("");
  const [memberSearch, setMemberSearch]   = useState("");
  const [guarantors, setGuarantors]       = useState<Guarantor[]>([]);
  const [collaterals, setCollaterals]     = useState<Collateral[]>([]);
  const [gMemberId, setGMemberId]         = useState("");
  const [gAmount, setGAmount]             = useState("");
  const [gMemberSearch, setGMemberSearch] = useState("");
  const [cType, setCType]                 = useState("");
  const [cDesc, setCDesc]                 = useState("");
  const [cValue, setCValue]               = useState("");
  const [errors, setErrors]               = useState<FormErrors>({});

  const createLoan   = useCreateLoan();
  const { data: membersData } = useMembers(
    memberSearch.length >= 2
      ? { search: memberSearch, status: "approved", per_page: 30 }
      : { status: "approved", per_page: 30 }
  );
  const { data: gMembersData } = useMembers(
    gMemberSearch.length >= 2
      ? { search: gMemberSearch, status: "approved", per_page: 20 }
      : undefined
  );
  const { data: products } = useLoanProducts();

  const memberOptions = (membersData?.data ?? []).map((m) => ({
    value: m.id,
    label: `${m.full_name} (${m.member_number})`,
  }));

  const gMemberOptions = (gMembersData?.data ?? [])
    .filter((m) => m.id !== memberId)
    .map((m) => ({ value: m.id, label: `${m.full_name} (${m.member_number})` }));

  const productOptions = (products ?? [])
    .filter((p) => p.is_active)
    .map((p) => ({ value: p.id, label: p.name }));

  const addGuarantor = () => {
    if (!gMemberId || !gAmount) return;
    const member = gMembersData?.data?.find((m) => m.id === gMemberId);
    setGuarantors((prev) => [
      ...prev,
      { member_id: gMemberId, guaranteed_amount: gAmount, label: member?.full_name ?? gMemberId },
    ]);
    setGMemberId("");
    setGAmount("");
    setGMemberSearch("");
  };

  const addCollateral = () => {
    if (!cType || !cValue) return;
    setCollaterals((prev) => [...prev, { collateral_type: cType, description: cDesc, estimated_value: cValue }]);
    setCType("");
    setCDesc("");
    setCValue("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    try {
      const loan = await createLoan.mutateAsync({
        member_id: memberId,
        loan_product_id: productId,
        principal_amount: principal,
        interest_rate: interestRate || undefined,
        repayment_period: parseInt(period),
        repayment_frequency: frequency,
        note: note || undefined,
        guarantors: guarantors.map(({ member_id, guaranteed_amount }) => ({ member_id, guaranteed_amount })),
        collaterals: collaterals.map(({ collateral_type, description, estimated_value }) => ({
          collateral_type,
          description: description || undefined,
          estimated_value,
        })),
      });
      toast.success("Loan application submitted.");
      router.push(`/admin/loans/${loan.id}`);
    } catch (err) {
      const fieldErrors = extractFieldErrors(err);
      if (fieldErrors && Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors as FormErrors);
      } else {
        toast.error(extractApiError(err));
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-dark dark:text-white">New Loan Application</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl flex flex-col gap-6">
        {/* Loan Details */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 flex flex-col gap-4">
          <h2 className="font-semibold text-gray-800 dark:text-white">Loan Details</h2>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Member <span className="text-red-500">*</span>
            </label>
            <SelectInput
              options={memberOptions}
              value={memberOptions.find((o) => o.value === memberId) ?? null}
              onChange={(opt) => setMemberId(opt?.value ?? "")}
              onInputChange={(val) => setMemberSearch(val)}
              placeholder="Search member…"
            />
            {errors.member_id && <p className="mt-1 text-sm text-red-500">{errors.member_id}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Loan Product <span className="text-red-500">*</span>
            </label>
            <SelectInput
              options={productOptions}
              value={productOptions.find((o) => o.value === productId) ?? null}
              onChange={(opt) => setProductId(opt?.value ?? "")}
              placeholder="Select product…"
            />
            {errors.loan_product_id && <p className="mt-1 text-sm text-red-500">{errors.loan_product_id}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <NumberInput
              label="Principal Amount"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              min={1}
              step="any"
              required
              error={fe(errors, "principal_amount")}
            />
            <NumberInput
              label="Interest Rate (% p.a.)"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              placeholder="From product"
              min={0}
              max={100}
              step="any"
              error={fe(errors, "interest_rate")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <NumberInput
              label="Repayment Period (months)"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              min={1}
              max={360}
              required
              error={fe(errors, "repayment_period")}
            />
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:border-green-600 focus:ring-2 focus:ring-green-600"
              >
                {["daily","weekly","monthly","quarterly","annually"].map((f) => (
                  <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={2000}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:border-green-600 focus:ring-2 focus:ring-green-600"
            />
          </div>
        </div>

        {/* Guarantors */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 flex flex-col gap-3">
          <h2 className="font-semibold text-gray-800 dark:text-white">Guarantors</h2>
          {guarantors.map((g, i) => (
            <div key={i} className="flex items-center justify-between rounded bg-gray-50 px-3 py-2 text-sm">
              <span>{g.label} — <span className="font-mono">{parseFloat(g.guaranteed_amount).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</span></span>
              <button type="button" onClick={() => setGuarantors((p) => p.filter((_, j) => j !== i))} className="text-red-500 hover:underline">Remove</button>
            </div>
          ))}
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-48">
              <SelectInput
                options={gMemberOptions}
                value={gMemberOptions.find((o) => o.value === gMemberId) ?? null}
                onChange={(opt) => setGMemberId(opt?.value ?? "")}
                onInputChange={(val) => setGMemberSearch(val)}
                placeholder="Search guarantor…"
              />
            </div>
            <NumberInput
              placeholder="Amount"
              value={gAmount}
              onChange={(e) => setGAmount(e.target.value)}
              min={0}
              step="any"
              className="w-36"
            />
            <button type="button" onClick={addGuarantor} className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300">
              + Add
            </button>
          </div>
        </div>

        {/* Collaterals */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 flex flex-col gap-3">
          <h2 className="font-semibold text-gray-800 dark:text-white">Collateral</h2>
          {collaterals.map((c, i) => (
            <div key={i} className="flex items-center justify-between rounded bg-gray-50 px-3 py-2 text-sm">
              <span>{c.collateral_type} — <span className="font-mono">{parseFloat(c.estimated_value).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</span></span>
              <button type="button" onClick={() => setCollaterals((p) => p.filter((_, j) => j !== i))} className="text-red-500 hover:underline">Remove</button>
            </div>
          ))}
          <div className="flex flex-wrap items-end gap-3">
            <input
              type="text"
              placeholder="Collateral type"
              value={cType}
              onChange={(e) => setCType(e.target.value)}
              className="flex-1 min-w-36 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:border-green-600 focus:ring-2 focus:ring-green-600"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={cDesc}
              onChange={(e) => setCDesc(e.target.value)}
              className="flex-1 min-w-36 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none hover:border-green-600 focus:ring-2 focus:ring-green-600"
            />
            <NumberInput
              placeholder="Value"
              value={cValue}
              onChange={(e) => setCValue(e.target.value)}
              min={0}
              step="any"
              className="w-36"
            />
            <button type="button" onClick={addCollateral} className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300">
              + Add
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={createLoan.isPending}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-60"
          >
            {createLoan.isPending ? "Submitting…" : "Submit Application"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

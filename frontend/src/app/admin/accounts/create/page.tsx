"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import DateInput from "@/components/Forms/DateInput";
import NumberInput from "@/components/Forms/NumberInput";
import SelectInput from "@/components/Forms/SelectInput";
import { useCreateAccount } from "@/lib/api/accounts";
import { useMembers } from "@/lib/api/members";
import { useSavingProducts } from "@/lib/api/configurations";
import { extractApiError, extractFieldErrors } from "@/lib/api";

interface FormErrors {
  member_id?: string;
  product_id?: string;
  opening_date?: string;
  interest_rate?: string;
}

export default function CreateAccountPage() {
  const router = useRouter();

  const [memberId, setMemberId]         = useState("");
  const [productId, setProductId]       = useState("");
  const [openingDate, setOpeningDate]   = useState(new Date().toISOString().slice(0, 10));
  const [interestRate, setInterestRate] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [errors, setErrors]             = useState<FormErrors>({});

  const createAccount = useCreateAccount();

  const { data: membersData } = useMembers(
    memberSearch.length >= 2
      ? { search: memberSearch, status: "approved", per_page: 30 }
      : { status: "approved", per_page: 30 }
  );

  const { data: products } = useSavingProducts();

  const memberOptions = (membersData?.data ?? []).map((m) => ({
    value: m.id,
    label: `${m.full_name} (${m.member_number})`,
  }));

  const productOptions = (products ?? [])
    .filter((p) => p.is_active)
    .map((p) => ({ value: p.id, label: p.name }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const account = await createAccount.mutateAsync({
        member_id: memberId,
        product_id: productId,
        opening_date: openingDate,
        interest_rate: interestRate || undefined,
      });
      toast.success("Account opened successfully.");
      router.push(`/admin/accounts/${account.id}`);
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
      <h1 className="text-2xl font-semibold text-dark dark:text-white">Open Deposit Account</h1>

      <form onSubmit={handleSubmit} className="max-w-lg rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 flex flex-col gap-5">
        {/* Member */}
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

        {/* Product */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Saving Product <span className="text-red-500">*</span>
          </label>
          <SelectInput
            options={productOptions}
            value={productOptions.find((o) => o.value === productId) ?? null}
            onChange={(opt) => setProductId(opt?.value ?? "")}
            placeholder="Select product…"
          />
          {errors.product_id && <p className="mt-1 text-sm text-red-500">{errors.product_id}</p>}
        </div>

        {/* Opening Date */}
        <DateInput
          label="Opening Date"
          id="openingDate"
          value={openingDate}
          onChange={(d) => setOpeningDate(d)}
          required
          error={errors.opening_date}
        />

        {/* Interest Rate */}
        <NumberInput
          label="Interest Rate (% p.a.)"
          id="interestRate"
          value={interestRate}
          onChange={(e) => setInterestRate(e.target.value)}
          placeholder="Leave blank to use product default"
          min={0}
          max={100}
          step="any"
          error={errors.interest_rate}
        />

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={createAccount.isPending}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-60"
          >
            {createAccount.isPending ? "Opening…" : "Open Account"}
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

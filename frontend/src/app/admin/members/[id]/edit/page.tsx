"use client";

import React from "react";
import { useParams } from "next/navigation";
import MemberForm from "@/components/Members/MemberForm";
import { useMember } from "@/lib/api/members";

export default function EditMemberPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data: member, isLoading } = useMember(id);

  if (isLoading) return <p className="text-gray-500">Loading…</p>;
  if (!member) return <p className="text-red-500">Member not found.</p>;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-dark dark:text-white">
        Edit Member — {member.full_name}
      </h1>
      <MemberForm
        memberId={id}
        defaultValues={{
          title: member.title ?? "",
          full_name: member.full_name,
          id_type: member.id_type,
          id_number: member.id_number,
          email: member.email ?? "",
          phone: member.phone,
          phone2: member.phone2 ?? "",
          date_of_birth: member.date_of_birth,
          gender: member.gender ?? "",
          nationality: member.nationality ?? "KEN",
          marital_status: member.marital_status ?? "",
          address: member.address ?? "",
          town: member.town ?? "",
          postal_code: member.postal_code ?? "",
          employed: member.employed,
          self_employed: member.self_employed,
          employer_name: member.employer_name ?? "",
          monthly_salary: member.monthly_salary ?? "",
          monthly_net_income: member.monthly_net_income ?? "",
          entry_date: member.entry_date,
          kins: member.kins,
        }}
      />
    </div>
  );
}

"use client";

import { useOrg, useUpdateOrg } from "@/lib/api/settings";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { toast } from "sonner";

interface GeneralSettingsForm {
  name: string;
  full_name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  town: string;
  country_code: string;
  currency_code: string;
  pin: string;
  reg_number: string;
  member_limit: string;
}

export default function GeneralSettingsPage() {
  const { data: org, isLoading } = useOrg();
  const updateOrg = useUpdateOrg();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<GeneralSettingsForm>();

  useEffect(() => {
    if (org) {
      reset({
        name: org.name || "",
        full_name: org.full_name || "",
        email: org.email || "",
        phone: org.phone || "",
        website: org.website || "",
        address: org.address || "",
        town: org.town || "",
        country_code: org.country_code || "",
        currency_code: org.currency_code || "",
        pin: org.pin || "",
        reg_number: org.reg_number || "",
        member_limit: org.member_limit ? org.member_limit.toString() : "",
      });
    }
  }, [org, reset]);

  const onSubmit = (data: GeneralSettingsForm) => {
    const payload = {
      ...data,
      member_limit: data.member_limit ? parseInt(data.member_limit, 10) : null,
    };
    updateOrg.mutate(payload, {
      onSuccess: () => {
        toast.success("Organization details updated successfully");
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to update organization details");
      }
    });
  };

  if (isLoading) {
    return <div className="py-10 text-center text-gray-500">Loading settings...</div>;
  }

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold leading-7 text-gray-900 mb-6">General Settings</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow-sm ring-1 ring-gray-900/5">
        <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
          <div className="sm:col-span-3">
            <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
              Short Name
            </label>
            <div className="mt-2">
              <Input id="name" {...register("name", { required: "Name is required" })} />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="full_name" className="block text-sm font-medium leading-6 text-gray-900">
              Full Legal Name
            </label>
            <div className="mt-2">
              <Input id="full_name" {...register("full_name", { required: "Full name is required" })} />
              {errors.full_name && <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>}
            </div>
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
              Email Address
            </label>
            <div className="mt-2">
              <Input id="email" type="email" {...register("email")} />
            </div>
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="phone" className="block text-sm font-medium leading-6 text-gray-900">
              Phone Number
            </label>
            <div className="mt-2">
              <Input id="phone" {...register("phone")} />
            </div>
          </div>

          <div className="sm:col-span-6">
            <label htmlFor="address" className="block text-sm font-medium leading-6 text-gray-900">
              Physical Address
            </label>
            <div className="mt-2">
              <Input id="address" {...register("address")} />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="town" className="block text-sm font-medium leading-6 text-gray-900">
              Town/City
            </label>
            <div className="mt-2">
              <Input id="town" {...register("town")} />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="country_code" className="block text-sm font-medium leading-6 text-gray-900">
              Country Code
            </label>
            <div className="mt-2">
              <Input id="country_code" maxLength={3} {...register("country_code")} placeholder="KEN" />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="currency_code" className="block text-sm font-medium leading-6 text-gray-900">
              Default Currency Code
            </label>
            <div className="mt-2">
              <Input id="currency_code" maxLength={3} {...register("currency_code")} placeholder="KES" />
            </div>
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="pin" className="block text-sm font-medium leading-6 text-gray-900">
              Tax PIN
            </label>
            <div className="mt-2">
              <Input id="pin" {...register("pin")} />
            </div>
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="reg_number" className="block text-sm font-medium leading-6 text-gray-900">
              Registration Number
            </label>
            <div className="mt-2">
              <Input id="reg_number" {...register("reg_number")} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-x-4 border-t border-gray-900/10 pt-6">
          <Button type="button" variant="outline" onClick={() => reset()}>
            Reset
          </Button>
          <Button type="submit" disabled={updateOrg.isPending}>
            {updateOrg.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}

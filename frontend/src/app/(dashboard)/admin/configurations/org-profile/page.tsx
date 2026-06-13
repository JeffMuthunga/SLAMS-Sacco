"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useOrg,
  useUpdateOrg,
  useUploadOrgLogo,
  type UpdateOrgPayload,
} from "@/lib/api/configurations";

type FormValues = {
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
};

export default function OrgProfilePage() {
  const { data: org, isLoading } = useOrg();
  const updateOrg = useUpdateOrg();
  const uploadLogo = useUploadOrgLogo();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [colorForm, setColorForm] = useState({ primary: "#5750f1", secondary: "#10b981" });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      full_name: "",
      email: "",
      phone: "",
      website: "",
      address: "",
      town: "",
      country_code: "",
      currency_code: "",
      pin: "",
      reg_number: "",
    },
  });

  useEffect(() => {
    if (org) {
      reset({
        name: org.name ?? "",
        full_name: org.full_name ?? "",
        email: org.email ?? "",
        phone: org.phone ?? "",
        website: org.website ?? "",
        address: org.address ?? "",
        town: org.town ?? "",
        country_code: org.country_code ?? "",
        currency_code: org.currency_code ?? "",
        pin: org.pin ?? "",
        reg_number: org.reg_number ?? "",
      });
    }
  }, [org, reset]);

  useEffect(() => {
    if (org) {
      setColorForm({
        primary: org.primary_color ?? "#5750f1",
        secondary: org.secondary_color ?? "#10b981",
      });
    }
  }, [org]);

  function saveColors() {
    updateOrg.mutate(
      { primary_color: colorForm.primary, secondary_color: colorForm.secondary } as any,
      {
        onSuccess: () => toast.success("Brand colors updated."),
        onError: () => toast.error("Failed to save colors."),
      }
    );
  }

  function onSubmit(values: FormValues) {
    const payload: UpdateOrgPayload = {
      name: values.name || undefined,
      full_name: values.full_name || undefined,
      email: values.email || undefined,
      phone: values.phone || undefined,
      website: values.website || undefined,
      address: values.address || undefined,
      town: values.town || undefined,
      country_code: values.country_code || undefined,
      currency_code: values.currency_code || undefined,
      pin: values.pin || undefined,
      reg_number: values.reg_number || undefined,
    };

    updateOrg.mutate(payload, {
      onSuccess: () => toast.success("Organisation profile updated."),
      onError: (err) => toast.error(err.message ?? "Failed to update profile."),
    });
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Organisation Profile
      </h2>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 bg-white p-6 rounded-lg shadow-sm ring-1 ring-gray-900/5"
      >
        {/* 2-column grid */}
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
          {/* Short Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Short Name <span className="text-red-500">*</span>
            </label>
            <Input
              {...register("name", { required: "Short name is required" })}
              placeholder="SLAMS SACCO"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Full Legal Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Legal Name <span className="text-red-500">*</span>
            </label>
            <Input
              {...register("full_name", {
                required: "Full legal name is required",
              })}
              placeholder="SLAMS Savings & Credit Cooperative"
            />
            {errors.full_name && (
              <p className="mt-1 text-xs text-red-600">
                {errors.full_name.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <Input
              type="email"
              {...register("email")}
              placeholder="info@sacco.co.ke"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <Input
              {...register("phone")}
              placeholder="+254 700 000 000"
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <Input
              {...register("website")}
              placeholder="https://sacco.co.ke"
            />
          </div>

          {/* Town */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Town / City
            </label>
            <Input {...register("town")} placeholder="Nairobi" />
          </div>

          {/* Address — full width */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Physical Address
            </label>
            <Input
              {...register("address")}
              placeholder="P.O. Box 12345-00100"
            />
          </div>

          {/* Country Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country Code
            </label>
            <Input
              {...register("country_code", { maxLength: 3 })}
              maxLength={3}
              placeholder="KEN"
            />
          </div>

          {/* Default Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Currency
            </label>
            <Input
              {...register("currency_code", { maxLength: 3 })}
              maxLength={3}
              placeholder="KES"
            />
          </div>

          {/* Tax PIN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tax PIN
            </label>
            <Input {...register("pin")} placeholder="P051234567X" />
          </div>

          {/* Registration Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Registration Number
            </label>
            <Input
              {...register("reg_number")}
              placeholder="CS/001234"
            />
          </div>
        </div>

        <div className="flex justify-end gap-x-4 border-t border-gray-900/10 pt-6">
          <Button type="submit" disabled={isSubmitting || updateOrg.isPending}>
            {updateOrg.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>

      {/* Logo Upload */}
      <div className="mt-6 space-y-6 bg-white p-6 rounded-lg shadow-sm ring-1 ring-gray-900/5">
        <h3 className="text-base font-semibold text-gray-900">Organisation Logo</h3>
        <div className="flex items-center gap-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden">
            {org?.logo_url ? (
              <Image
                src={org.logo_url}
                alt="Org logo"
                width={80}
                height={80}
                className="object-contain"
              />
            ) : (
              <span className="text-xs text-gray-400 text-center px-1">No logo</span>
            )}
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file)
                  uploadLogo.mutate(file, {
                    onSuccess: () => toast.success("Logo updated."),
                    onError: () => toast.error("Failed to upload logo."),
                  });
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadLogo.isPending}
            >
              {uploadLogo.isPending ? "Uploading..." : "Upload Logo"}
            </Button>
            <p className="mt-1.5 text-xs text-gray-500">PNG, JPG, SVG — max 2 MB</p>
          </div>
        </div>
      </div>

      {/* Brand Colors */}
      <div className="mt-6 space-y-6 bg-white p-6 rounded-lg shadow-sm ring-1 ring-gray-900/5">
        <h3 className="text-base font-semibold text-gray-900">Brand Colors</h3>
        <p className="text-sm text-gray-500">
          These colors are applied to the sidebar and UI elements across the system.
        </p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colorForm.primary}
                onChange={(e) =>
                  setColorForm((p) => ({ ...p, primary: e.target.value }))
                }
                className="h-10 w-14 cursor-pointer rounded border border-gray-300 p-1"
              />
              <Input
                value={colorForm.primary}
                onChange={(e) =>
                  setColorForm((p) => ({ ...p, primary: e.target.value }))
                }
                maxLength={7}
                placeholder="#5750f1"
                className="font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Secondary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colorForm.secondary}
                onChange={(e) =>
                  setColorForm((p) => ({ ...p, secondary: e.target.value }))
                }
                className="h-10 w-14 cursor-pointer rounded border border-gray-300 p-1"
              />
              <Input
                value={colorForm.secondary}
                onChange={(e) =>
                  setColorForm((p) => ({ ...p, secondary: e.target.value }))
                }
                maxLength={7}
                placeholder="#10b981"
                className="font-mono"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end border-t border-gray-900/10 pt-4">
          <Button type="button" onClick={saveColors} disabled={updateOrg.isPending}>
            {updateOrg.isPending ? "Saving..." : "Save Colors"}
          </Button>
        </div>
      </div>
    </div>
  );
}

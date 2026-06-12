"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useSaccoSettings,
  useUpdateSaccoSettings,
  type UpdateSaccoSettingPayload,
} from "@/lib/api/configurations";

type FormValues = {
  registration_fee: string;
  min_share_capital: string;
  min_monthly_contribution: string;
  loan_limit_multiplier: string;
};

export default function SaccoSettingsPage() {
  const { data: settings, isLoading } = useSaccoSettings();
  const updateSettings = useUpdateSaccoSettings();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      registration_fee: "",
      min_share_capital: "",
      min_monthly_contribution: "",
      loan_limit_multiplier: "",
    },
  });

  useEffect(() => {
    if (settings) {
      reset({
        registration_fee: settings.registration_fee ?? "",
        min_share_capital: settings.min_share_capital ?? "",
        min_monthly_contribution: settings.min_monthly_contribution ?? "",
        loan_limit_multiplier: settings.loan_limit_multiplier ?? "",
      });
    }
  }, [settings, reset]);

  function onSubmit(values: FormValues) {
    const payload: UpdateSaccoSettingPayload = {
      registration_fee: values.registration_fee || undefined,
      min_share_capital: values.min_share_capital || undefined,
      min_monthly_contribution: values.min_monthly_contribution || undefined,
      loan_limit_multiplier: values.loan_limit_multiplier || undefined,
    };

    updateSettings.mutate(payload, {
      onSuccess: () => toast.success("SACCO settings saved."),
      onError: (err) =>
        toast.error(err.message ?? "Failed to save settings."),
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
        SACCO Settings
      </h2>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 bg-white p-6 rounded-lg shadow-sm ring-1 ring-gray-900/5"
      >
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
          {/* Registration Fee */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Registration Fee
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              {...register("registration_fee", {
                min: { value: 0, message: "Must be 0 or more" },
              })}
              placeholder="500.00"
            />
            {errors.registration_fee && (
              <p className="mt-1 text-xs text-red-600">
                {errors.registration_fee.message}
              </p>
            )}
          </div>

          {/* Min Share Capital */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Share Capital
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              {...register("min_share_capital", {
                min: { value: 0, message: "Must be 0 or more" },
              })}
              placeholder="5000.00"
            />
            {errors.min_share_capital && (
              <p className="mt-1 text-xs text-red-600">
                {errors.min_share_capital.message}
              </p>
            )}
          </div>

          {/* Min Monthly Contribution */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Monthly Contribution
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              {...register("min_monthly_contribution", {
                min: { value: 0, message: "Must be 0 or more" },
              })}
              placeholder="1000.00"
            />
            {errors.min_monthly_contribution && (
              <p className="mt-1 text-xs text-red-600">
                {errors.min_monthly_contribution.message}
              </p>
            )}
          </div>

          {/* Loan Limit Multiplier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loan Limit Multiplier
            </label>
            <Input
              type="number"
              step="0.01"
              min="1"
              max="10"
              {...register("loan_limit_multiplier", {
                min: { value: 1, message: "Must be at least 1" },
                max: { value: 10, message: "Cannot exceed 10" },
              })}
              placeholder="3.00"
            />
            {errors.loan_limit_multiplier && (
              <p className="mt-1 text-xs text-red-600">
                {errors.loan_limit_multiplier.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-x-4 border-t border-gray-900/10 pt-6">
          <Button
            type="submit"
            disabled={isSubmitting || updateSettings.isPending}
          >
            {updateSettings.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}

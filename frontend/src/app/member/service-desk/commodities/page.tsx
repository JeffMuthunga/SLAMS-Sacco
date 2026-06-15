"use client";

import React, { useState } from "react";
import { usePortalAvailableCommodities, usePortalCreateCommodityRequest, Commodity } from "@/lib/api/commodities";
import { toast } from "sonner";
import { extractApiError } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function MemberCommoditiesPage() {
  const { data: commodities, isLoading, error } = usePortalAvailableCommodities();
  const createMut = usePortalCreateCommodityRequest();
  const router = useRouter();

  // Simple cart state: { commodityId: quantity }
  const [cart, setCart] = useState<Record<string, number>>({});
  const [repaymentPeriod, setRepaymentPeriod] = useState<string>("");

  const handleAdd = (c: Commodity) => {
    setCart((prev) => ({
      ...prev,
      [c.id]: (prev[c.id] || 0) + 1,
    }));
    toast.success(`${c.name} added to cart.`);
  };

  const handleRemove = (cId: string) => {
    setCart((prev) => {
      const copy = { ...prev };
      delete copy[cId];
      return copy;
    });
  };

  const handleSubmitRequest = () => {
    const items = Object.entries(cart).map(([commodity_id, quantity]) => ({
      commodity_id,
      quantity,
    }));

    if (items.length === 0) return toast.error("Cart is empty");

    createMut.mutate(
      {
        items,
        repayment_period: repaymentPeriod ? parseInt(repaymentPeriod, 10) : undefined,
      },
      {
        onSuccess: () => {
          toast.success("Commodity request submitted successfully.");
          setCart({});
          setRepaymentPeriod("");
          router.push("/member/service-desk/commodity-requests");
        },
        onError: (err) => toast.error(extractApiError(err)),
      }
    );
  };

  const cartTotal = commodities?.reduce((sum, c) => {
    const qty = cart[c.id] || 0;
    return sum + (qty * parseFloat(c.unit_price));
  }, 0) ?? 0;

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex-1 space-y-6">
        <h1 className="text-2xl font-semibold text-dark dark:text-white">Available Commodities</h1>
        {error && <p className="text-red-500">{extractApiError(error)}</p>}
        {isLoading && <p className="text-gray-500">Loading catalog...</p>}
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {commodities?.map((c) => (
            <div key={c.id} className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-dark">
              <span className="mb-2 w-fit rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                {c.commodity_type?.name ?? "Uncategorized"}
              </span>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">{c.name}</h3>
              <p className="mt-1 font-mono text-xl text-primary">P {parseFloat(c.unit_price).toLocaleString("en-BW", { minimumFractionDigits: 2 })}</p>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-500">{c.stock_quantity} in stock</p>
                <button
                  onClick={() => handleAdd(c)}
                  disabled={(cart[c.id] || 0) >= c.stock_quantity}
                  className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          ))}
          {commodities?.length === 0 && <p className="col-span-full text-gray-500">No commodities available at the moment.</p>}
        </div>
      </div>

      <div className="w-full lg:w-80 shrink-0 space-y-6">
        <div className="sticky top-20 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-dark">
          <h2 className="text-lg font-semibold text-dark dark:text-white">Your Cart</h2>
          
          <div className="mt-4 space-y-3">
            {Object.entries(cart).map(([cId, qty]) => {
              const c = commodities?.find(x => x.id === cId);
              if (!c) return null;
              return (
                <div key={cId} className="flex items-center justify-between border-b border-gray-100 pb-2 dark:border-gray-800">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-gray-500">{qty} x P {c.unit_price}</p>
                  </div>
                  <button onClick={() => handleRemove(cId)} className="text-xs text-red-500 hover:underline">
                    Remove
                  </button>
                </div>
              );
            })}
            {Object.keys(cart).length === 0 && (
              <p className="text-sm text-gray-500">Cart is empty.</p>
            )}
          </div>

          <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-800">
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span className="font-mono text-primary">P {cartTotal.toLocaleString("en-BW", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Repayment Period (Months)</label>
              <input
                type="number"
                min="1"
                placeholder="Optional"
                value={repaymentPeriod}
                onChange={(e) => setRepaymentPeriod(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              />
            </div>
            <button
              onClick={handleSubmitRequest}
              disabled={Object.keys(cart).length === 0 || createMut.isPending}
              className="w-full rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
            >
              {createMut.isPending ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

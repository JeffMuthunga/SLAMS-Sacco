"use client";

import { useState } from "react";
import { useCurrencies, useCreateCurrency, useUpdateCurrency, useDeleteCurrency, Currency } from "@/lib/api/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { TrashIcon, PencilIcon } from "@heroicons/react/24/outline";

export default function CurrenciesPage() {
  const { data: currencies, isLoading } = useCurrencies();
  const createCurrency = useCreateCurrency();
  const updateCurrency = useUpdateCurrency(""); // We will pass ID on mutate
  const deleteCurrency = useDeleteCurrency();

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    symbol: "",
    exchange_rate: "1.00",
    is_default: false,
  });

  const resetForm = () => {
    setFormData({ name: "", code: "", symbol: "", exchange_rate: "1.00", is_default: false });
    setIsEditing(false);
    setEditingId(null);
  };

  const handleEdit = (c: Currency) => {
    setFormData({
      name: c.name,
      code: c.code,
      symbol: c.symbol || "",
      exchange_rate: c.exchange_rate,
      is_default: c.is_default,
    });
    setEditingId(c.id);
    setIsEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateCurrency.mutate({ ...formData, id: editingId } as any, {
        onSuccess: () => {
          toast.success("Currency updated successfully");
          resetForm();
        },
        onError: (err: any) => toast.error(err.message || "Update failed")
      });
    } else {
      createCurrency.mutate(formData as any, {
        onSuccess: () => {
          toast.success("Currency created successfully");
          resetForm();
        },
        onError: (err: any) => toast.error(err.message || "Creation failed")
      });
    }
  };

  if (isLoading) return <div className="py-10 text-gray-500 text-center">Loading currencies...</div>;

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold leading-7 text-gray-900">Currencies</h2>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>Add Currency</Button>
        )}
      </div>

      {isEditing && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-4">
            {editingId ? "Edit Currency" : "New Currency"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <Input 
                required 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="e.g. US Dollar" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Code</label>
              <Input 
                required 
                maxLength={3} 
                value={formData.code} 
                onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} 
                placeholder="e.g. USD" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Symbol</label>
              <Input 
                value={formData.symbol} 
                onChange={e => setFormData({...formData, symbol: e.target.value})} 
                placeholder="e.g. $" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Exchange Rate</label>
              <Input 
                required 
                type="number" 
                step="0.01" 
                min="0" 
                value={formData.exchange_rate} 
                onChange={e => setFormData({...formData, exchange_rate: e.target.value})} 
              />
            </div>
            <div className="sm:col-span-2 flex items-center mt-2">
              <input
                id="is_default"
                type="checkbox"
                checked={formData.is_default}
                onChange={e => setFormData({...formData, is_default: e.target.checked})}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
              />
              <label htmlFor="is_default" className="ml-2 block text-sm text-gray-900">
                Set as Default Currency
              </label>
            </div>
          </div>
          <div className="mt-4 flex gap-x-3 justify-end">
            <Button variant="outline" type="button" onClick={resetForm}>Cancel</Button>
            <Button type="submit" disabled={createCurrency.isPending || updateCurrency.isPending}>
              Save
            </Button>
          </div>
        </form>
      )}

      <div className="overflow-hidden bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Code</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Name</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Symbol</th>
              <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Rate</th>
              <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Default</th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {currencies?.map((c) => (
              <tr key={c.id}>
                <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">{c.code}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{c.name}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{c.symbol}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">{c.exchange_rate}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-center">
                  {c.is_default && <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">Default</span>}
                </td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  <button onClick={() => handleEdit(c)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  {!c.is_default && (
                    <button 
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this currency?")) {
                          deleteCurrency.mutate(c.id, {
                            onSuccess: () => toast.success("Currency deleted"),
                            onError: (err: any) => toast.error(err.message || "Delete failed")
                          });
                        }
                      }} 
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {currencies?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center text-sm text-gray-500">No currencies configured.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

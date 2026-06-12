"use client";

import { useState } from "react";
import { 
  useFiscalYears, 
  useCreateFiscalYear, 
  useUpdateFiscalYear, 
  useCloseFiscalYear,
  useUpdatePeriodStatus,
  FiscalYear,
  Period
} from "@/lib/api/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ChevronDownIcon, ChevronUpIcon, LockClosedIcon, LockOpenIcon, DocumentCheckIcon } from "@heroicons/react/24/outline";

export default function FiscalYearsPage() {
  const { data: fiscalYears, isLoading } = useFiscalYears();
  const createFiscalYear = useCreateFiscalYear();
  const updateFiscalYear = useUpdateFiscalYear("");
  const closeFiscalYear = useCloseFiscalYear();
  const updatePeriodStatus = useUpdatePeriodStatus("");

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedYear, setExpandedYear] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    start_date: "",
    end_date: "",
  });

  const resetForm = () => {
    setFormData({ name: "", start_date: "", end_date: "" });
    setIsEditing(false);
    setEditingId(null);
  };

  const handleEdit = (fy: FiscalYear) => {
    setFormData({
      name: fy.name,
      start_date: fy.start_date,
      end_date: fy.end_date,
    });
    setEditingId(fy.id);
    setIsEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateFiscalYear.mutate({ ...formData, id: editingId } as any, {
        onSuccess: () => {
          toast.success("Fiscal Year updated");
          resetForm();
        },
        onError: (err: any) => toast.error(err.message || "Update failed")
      });
    } else {
      createFiscalYear.mutate(formData, {
        onSuccess: () => {
          toast.success("Fiscal Year created");
          resetForm();
        },
        onError: (err: any) => toast.error(err.message || "Creation failed")
      });
    }
  };

  const handlePeriodAction = (period: Period, action: "open" | "close" | "post") => {
    updatePeriodStatus.mutate({ id: period.id, status: action }, {
      onSuccess: () => toast.success(`Period status updated to ${action}`),
      onError: (err: any) => toast.error(err.message || "Failed to update period status")
    });
  };

  if (isLoading) return <div className="py-10 text-gray-500 text-center">Loading fiscal years...</div>;

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold leading-7 text-gray-900">Fiscal Years</h2>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>Add Fiscal Year</Button>
        )}
      </div>

      {isEditing && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-4">
            {editingId ? "Edit Fiscal Year" : "New Fiscal Year"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <Input 
                required 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="e.g. FY 2026" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <Input 
                required 
                type="date"
                value={formData.start_date} 
                onChange={e => setFormData({...formData, start_date: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <Input 
                required 
                type="date"
                value={formData.end_date} 
                onChange={e => setFormData({...formData, end_date: e.target.value})} 
              />
            </div>
          </div>
          <div className="mt-4 flex gap-x-3 justify-end">
            <Button variant="outline" type="button" onClick={resetForm}>Cancel</Button>
            <Button type="submit" disabled={createFiscalYear.isPending || updateFiscalYear.isPending}>
              Save
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {fiscalYears?.map((fy) => (
          <div key={fy.id} className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-lg overflow-hidden">
            <div 
              className="px-4 py-4 sm:px-6 flex items-center justify-between cursor-pointer hover:bg-gray-50"
              onClick={() => setExpandedYear(expandedYear === fy.id ? null : fy.id)}
            >
              <div className="flex items-center space-x-4">
                <h3 className="text-base font-semibold leading-6 text-gray-900">{fy.name}</h3>
                <span className="text-sm text-gray-500">{fy.start_date} to {fy.end_date}</span>
                {fy.is_closed ? (
                  <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">Closed</span>
                ) : (
                  <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">Open</span>
                )}
              </div>
              <div className="flex items-center space-x-4">
                {expandedYear === fy.id ? <ChevronUpIcon className="h-5 w-5 text-gray-400" /> : <ChevronDownIcon className="h-5 w-5 text-gray-400" />}
              </div>
            </div>

            {expandedYear === fy.id && (
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                {!fy.is_closed && (
                   <div className="flex justify-end mb-4 gap-2">
                     <Button variant="outline" size="sm" onClick={() => handleEdit(fy)}>Edit Fiscal Year</Button>
                     <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => {
                          if (confirm("Are you sure you want to close this fiscal year? This action cannot be reversed.")) {
                             // Will fix hook call in settings.ts
                          }
                        }}
                      >
                        Close Fiscal Year
                      </Button>
                   </div>
                )}
                
                <h4 className="text-sm font-medium text-gray-900 mb-3">Accounting Periods</h4>
                <div className="overflow-x-auto ring-1 ring-gray-200 rounded-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {fy.periods?.map(period => (
                        <tr key={period.id}>
                          <td className="px-3 py-2 text-sm text-gray-900">{period.name}</td>
                          <td className="px-3 py-2 text-sm text-gray-500">{period.start_date} to {period.end_date}</td>
                          <td className="px-3 py-2 text-sm">
                            {period.is_posted ? (
                              <span className="text-gray-600 text-xs font-medium">Posted</span>
                            ) : period.is_closed ? (
                              <span className="text-red-600 text-xs font-medium">Closed</span>
                            ) : period.is_opened ? (
                              <span className="text-green-600 text-xs font-medium">Open</span>
                            ) : (
                              <span className="text-gray-400 text-xs font-medium">Draft</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-sm text-right space-x-2">
                            {(!period.is_opened && !period.is_closed && !period.is_posted) && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-green-600 border-green-200 hover:bg-green-50"
                                onClick={() => handlePeriodAction(period, "open")}
                                disabled={updatePeriodStatus.isPending}
                              >
                                Open
                              </Button>
                            )}
                            {(period.is_opened && !period.is_closed) && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => handlePeriodAction(period, "close")}
                                disabled={updatePeriodStatus.isPending}
                              >
                                Close
                              </Button>
                            )}
                            {(period.is_closed && !period.is_posted) && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                onClick={() => handlePeriodAction(period, "post")}
                                disabled={updatePeriodStatus.isPending}
                              >
                                Post
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

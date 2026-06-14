"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  useRoles,
  useCreateRole,
  useUpdateRolePermissions,
  useDeleteRole,
  type AppRole,
} from "@/lib/api/roles";
import { extractApiError, extractFieldErrors } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PERMISSION_LABELS: Record<string, string> = {
  manage_members:        "Members",
  manage_configurations: "Configurations",
  manage_accounts:       "Accounts",
  manage_loans:          "Loans",
  manage_contributions:  "Contributions",
  manage_journals:       "Journals",
  manage_petty_cash:     "Petty Cash",
  manage_issues:         "Issues",
  manage_shares:         "Shares",
  manage_dividends:      "Dividends",
  manage_commodities:    "Commodities",
  manage_imports:        "Data Import",
  manage_reports:        "Reports",
  view_own_data:         "View Own Data",
};

export default function RolesPage() {
  const { data, isLoading } = useRoles();
  const createMut      = useCreateRole();
  const updatePermsMut = useUpdateRolePermissions();
  const deleteMut      = useDeleteRole();

  const roles       = data?.roles ?? [];
  const permissions = data?.permissions ?? [];

  const [open, setOpen]             = useState(false);
  const [editingRole, setEditingRole] = useState<AppRole | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function openCreate() {
    setEditingRole(null);
    setNewRoleName("");
    setSelectedPerms([]);
    setErrors({});
    setOpen(true);
  }

  function openEditPerms(role: AppRole) {
    if (role.is_built_in) {
      toast.info("Built-in role permissions are managed in code (RbacSeeder).");
      return;
    }
    setEditingRole(role);
    setSelectedPerms([...role.permissions]);
    setErrors({});
    setOpen(true);
  }

  function togglePerm(p: string) {
    setSelectedPerms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    try {
      if (editingRole) {
        await updatePermsMut.mutateAsync({ id: editingRole.id, permissions: selectedPerms });
        toast.success("Permissions updated.");
      } else {
        await createMut.mutateAsync({ name: newRoleName, permissions: selectedPerms });
        toast.success("Role created.");
      }
      setOpen(false);
    } catch (err) {
      const fe = extractFieldErrors(err);
      if (Object.keys(fe).length) { setErrors(fe); return; }
      toast.error(extractApiError(err));
    }
  }

  async function handleDelete(role: AppRole) {
    if (!confirm(`Delete role "${role.name}"?`)) return;
    try {
      await deleteMut.mutateAsync(role.id);
      toast.success("Role deleted.");
    } catch (err) { toast.error(extractApiError(err)); }
  }

  if (isLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Roles & Permissions</h1>
        <Button onClick={openCreate}>+ New Role</Button>
      </div>

      <div className="space-y-4">
        {roles.map((role) => (
          <div key={role.id} className="border rounded p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-semibold capitalize">
                  {role.name.replace(/_/g, " ")}
                </span>
                {role.is_built_in && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                    Built-in
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {!role.is_built_in && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditPerms(role)}
                    >
                      Edit Permissions
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(role)}
                    >
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {role.permissions.map((p) => (
                <span
                  key={p}
                  className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200"
                >
                  {PERMISSION_LABELS[p] ?? p}
                </span>
              ))}
              {role.permissions.length === 0 && (
                <span className="text-xs text-gray-400">
                  No permissions assigned.
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRole
                ? `Edit Permissions - ${editingRole.name}`
                : "New Role"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editingRole && (
              <div>
                <Label>Role Name (snake_case)</Label>
                <Input
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g. branch_manager"
                  required
                />
                {errors.name && (
                  <p className="text-red-500 text-xs">{errors.name}</p>
                )}
              </div>
            )}

            <div>
              <Label className="mb-2 block">Permissions</Label>
              <div className="grid grid-cols-2 gap-2">
                {permissions
                  .filter((p) => p !== "view_own_data")
                  .map((p) => (
                    <label
                      key={p}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPerms.includes(p)}
                        onChange={() => togglePerm(p)}
                      />
                      {PERMISSION_LABELS[p] ?? p}
                    </label>
                  ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMut.isPending || updatePermsMut.isPending}
              >
                {editingRole ? "Save Permissions" : "Create Role"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

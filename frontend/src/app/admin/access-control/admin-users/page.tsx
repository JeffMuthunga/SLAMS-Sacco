"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  useAdminUsers,
  useCreateAdminUser,
  useUpdateAdminUserRole,
  useRoles,
  type AdminUser,
} from "@/lib/api/roles";
import { extractApiError, extractFieldErrors } from "@/lib/api";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ColumnDef } from "@tanstack/react-table";

export default function AdminUsersPage() {
  const { data: users = [], isLoading } = useAdminUsers();
  const { data: rolesData }             = useRoles();
  const createMut    = useCreateAdminUser();
  const updateRoleMut = useUpdateAdminUserRole();

  const roles = (rolesData?.roles ?? []).filter((r) => r.name !== "member");

  const [open, setOpen]         = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<AdminUser | null>(null);
  const [newRole, setNewRole]   = useState("");
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [form, setForm]         = useState({ name: "", email: "", role: "" });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    try {
      await createMut.mutateAsync(form);
      toast.success('Admin user created. Temporary password: "password"');
      setOpen(false);
    } catch (err) {
      const fe = extractFieldErrors(err);
      if (Object.keys(fe).length) { setErrors(fe); return; }
      toast.error(extractApiError(err));
    }
  }

  async function handleRoleUpdate() {
    if (!targetUser) return;
    try {
      await updateRoleMut.mutateAsync({ id: targetUser.id, role: newRole });
      toast.success("Role updated.");
      setRoleOpen(false);
    } catch (err) { toast.error(extractApiError(err)); }
  }

  const columns: ColumnDef<AdminUser>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "email", header: "Email" },
    {
      accessorKey: "roles",
      header: "Role",
      cell: ({ row }) => (
        <span className="capitalize">
          {(row.original.roles[0] ?? "-").replace(/_/g, " ")}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setTargetUser(row.original);
            setNewRole(row.original.roles[0] ?? "");
            setRoleOpen(true);
          }}
        >
          Change Role
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Users</h1>
        <Button
          onClick={() => {
            setForm({ name: "", email: "", role: "" });
            setErrors({});
            setOpen(true);
          }}
        >
          + Add Staff
        </Button>
      </div>

      <DataTable columns={columns} data={users} isLoading={isLoading} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Admin User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
              {errors.name && (
                <p className="text-red-500 text-xs">{errors.name}</p>
              )}
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
              {errors.email && (
                <p className="text-red-500 text-xs">{errors.email}</p>
              )}
            </div>
            <div>
              <Label>Role</Label>
              <select
                className="w-full border rounded p-2 text-sm"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                required
              >
                <option value="">Select role...</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
              {errors.role && (
                <p className="text-red-500 text-xs">{errors.role}</p>
              )}
            </div>
            <p className="text-xs text-amber-600">
              Temporary password will be "password" - user must change it on
              first login.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMut.isPending}>
                Create
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={roleOpen} onOpenChange={setRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role - {targetUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>New Role</Label>
              <select
                className="w-full border rounded p-2 text-sm"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setRoleOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRoleUpdate}
                disabled={!newRole || updateRoleMut.isPending}
              >
                Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

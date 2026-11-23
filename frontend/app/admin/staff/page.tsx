"use client";

import { useCallback, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AlertCircle, RefreshCw, UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  adminService,
  staffInviteSchema,
  type StaffInviteInput,
} from "@/services/admin.service";
import { getApiError } from "@/lib/api-error";
import { readList } from "@/lib/api-shape";
import { useAuth } from "@/context/AuthContext";
import { ROLE_LABELS, type Role } from "@/lib/auth-redirect";
import type { StaffMember } from "@/services/types";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { LoadingState } from "@/components/shared/loading-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePageMeta } from "@/lib/use-page-meta";

export default function AdminStaffPage() {
  usePageMeta({
    title: "Staff Management",
    description: "Invite and manage receptionist and clinic administration staff.",
  });
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<StaffInviteInput>({
    resolver: zodResolver(staffInviteSchema),
    defaultValues: { name: "", email: "", role: "RECEPTIONIST" },
    mode: "onBlur",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getStaff();
      setStaff(readList<StaffMember>(response.data, "staff", "users"));
    } catch (err) {
      setError(getApiError(err, "Staff accounts could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onSubmit = async (values: StaffInviteInput) => {
    try {
      await adminService.inviteStaff(values);
      toast.success("Invitation sent. The account stays invited until accepted.");
      form.reset({ name: "", email: "", role: "RECEPTIONIST" });
      await load();
    } catch (err) {
      toast.error(getApiError(err, "The invitation could not be sent."));
    }
  };

  const toggleStatus = async (member: StaffMember) => {
    const next = member.status.toUpperCase() === "ACTIVE" ? "DISABLED" : "ACTIVE";
    try {
      await adminService.updateStaff(member.id, { status: next });
      toast.success(next === "ACTIVE" ? "Account enabled." : "Account disabled.");
      await load();
    } catch (err) {
      toast.error(getApiError(err, "The account status could not be changed."));
      throw err;
    }
  };

  const columns: DataTableColumn<StaffMember>[] = [
    {
      key: "name",
      header: "Name",
      cell: (member) => (
        <div>
          <p className="font-medium">{member.name}</p>
          <p className="text-xs text-muted-foreground">{member.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      cell: (member) =>
        ROLE_LABELS[member.role.toUpperCase() as Role] ?? member.role,
    },
    {
      key: "status",
      header: "Status",
      cell: (member) => (
        <Badge
          variant={
            member.status.toUpperCase() === "ACTIVE" ? "secondary" : "outline"
          }
        >
          {member.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (member) => {
        const isSelf = member.id === user?.id;
        const isActive = member.status.toUpperCase() === "ACTIVE";
        return (
          <div className="flex justify-end">
            <ConfirmDialog
              trigger={
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isSelf}
                  title={isSelf ? "You cannot disable your own account." : undefined}
                >
                  {isActive ? "Disable" : "Enable"}
                </Button>
              }
              title={isActive ? "Disable this account?" : "Enable this account?"}
              description={
                isActive
                  ? "The account loses access immediately. Existing appointments and audit records stay intact."
                  : "The account can sign in again with its existing role."
              }
              confirmLabel={isActive ? "Disable account" : "Enable account"}
              destructive={isActive}
              onConfirm={() => toggleStatus(member)}
            />
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Staff"
        title="Clinic staff accounts"
        description="Staff accounts are invitation-only. Public registration can never create a doctor, receptionist, or administrator."
        actions={
          <Button type="button" variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className="size-4" /> Refresh
          </Button>
        }
      />

      {error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="size-4" /> Invite a staff member
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field data-invalid={Boolean(form.formState.errors.name)}>
                  <FieldLabel htmlFor="staff-name">Name</FieldLabel>
                  <Input
                    id="staff-name"
                    aria-invalid={Boolean(form.formState.errors.name)}
                    {...form.register("name")}
                  />
                  <FieldError errors={[form.formState.errors.name]} />
                </Field>
                <Field data-invalid={Boolean(form.formState.errors.email)}>
                  <FieldLabel htmlFor="staff-email">Email</FieldLabel>
                  <Input
                    id="staff-email"
                    type="email"
                    aria-invalid={Boolean(form.formState.errors.email)}
                    {...form.register("email")}
                  />
                  <FieldError errors={[form.formState.errors.email]} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="staff-role">Role</FieldLabel>
                  <Select
                    value={form.watch("role")}
                    onValueChange={(value) =>
                      form.setValue("role", value as StaffInviteInput["role"], {
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger id="staff-role" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RECEPTIONIST">Receptionist</SelectItem>
                      <SelectItem value="DOCTOR">Doctor</SelectItem>
                      <SelectItem value="ADMIN">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError errors={[form.formState.errors.role]} />
                </Field>
              </div>
              <FieldDescription>
                The invitee sets their own password through the invitation link.
                No password is created or displayed here.
              </FieldDescription>
            </FieldGroup>

            <Button type="submit" className="mt-5" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Sending…" : "Send invitation"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <LoadingState title="Loading staff accounts" />
      ) : (
        <DataTable
          columns={columns}
          rows={staff}
          getRowKey={(member) => member.id}
          emptyTitle="No staff accounts"
          emptyDescription="Invite the first receptionist, doctor, or administrator."
        />
      )}
    </div>
  );
}

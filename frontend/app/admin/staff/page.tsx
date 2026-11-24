"use client";

import { useCallback, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AlertCircle, Plus, RefreshCw, UserPlus } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePageMeta } from "@/lib/use-page-meta";

export default function AdminStaffPage() {
  usePageMeta({
    title: "Staff Management",
    description: "Invite and manage receptionist, clinician, and clinic administration staff.",
  });
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
      toast.success("Invitation sent successfully. The user sets their password upon accepting.");
      setIsDialogOpen(false);
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
      header: "Staff Member",
      cell: (member) => (
        <div className="space-y-0.5">
          <p className="font-semibold text-base text-foreground">{member.name}</p>
          <p className="text-sm text-muted-foreground">{member.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role / Permissions",
      cell: (member) => (
        <Badge variant="outline" className="text-xs px-2.5 py-0.5 font-normal">
          {ROLE_LABELS[member.role.toUpperCase() as Role] ?? member.role}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Account Status",
      cell: (member) => {
        const isActive = member.status.toUpperCase() === "ACTIVE";
        return (
          <Badge
            variant={isActive ? "secondary" : "outline"}
            className="text-xs px-2.5 py-0.5"
          >
            {member.status}
          </Badge>
        );
      },
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
                  className="text-sm font-medium cursor-pointer"
                  title={isSelf ? "You cannot disable your own active account." : undefined}
                >
                  {isActive ? "Disable Access" : "Enable Access"}
                </Button>
              }
              title={isActive ? "Disable this staff account?" : "Enable this staff account?"}
              description={
                isActive
                  ? "The staff member loses portal access immediately. Historical clinic logs and appointment records remain intact."
                  : "The staff member can sign in again with their designated role."
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
    <div className="space-y-8">
      <PageHeader
        eyebrow="Staff Directory"
        title="Staff Accounts & Roles"
        description="Manage receptionist, clinician, and administrative accounts. Staff accounts are invitation-only."
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={load}
              disabled={loading}
              className="rounded-xl border-border/80 shadow-2xs hover:bg-secondary cursor-pointer"
            >
              <RefreshCw className="size-4 mr-2" />
              Refresh
            </Button>
            <Button
              type="button"
              size="default"
              onClick={() => {
                form.reset({ name: "", email: "", role: "RECEPTIONIST" });
                setIsDialogOpen(true);
              }}
              className="rounded-xl shadow-xs cursor-pointer"
            >
              <Plus className="size-4 mr-1.5" />
              Invite Staff
            </Button>
          </div>
        }
      />

      {error ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p className="leading-relaxed">{error}</p>
        </div>
      ) : null}

      {/* Main Clean Staff DataTable */}
      {loading ? (
        <LoadingState title="Loading clinic staff accounts…" />
      ) : (
        <DataTable
          columns={columns}
          rows={staff}
          getRowKey={(member) => member.id}
          emptyTitle="No staff accounts found"
          emptyDescription="Send the clinic's first invitation to a receptionist, doctor, or administrator."
        />
      )}

      {/* Focused Modal Dialog for Inviting Staff */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Invite a Staff Member</DialogTitle>
            <DialogDescription>
              Send an email invitation. The recipient configures their own secure credentials upon clicking the link.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-2" noValidate>
            <FieldGroup>
              <Field data-invalid={Boolean(form.formState.errors.name)}>
                <FieldLabel htmlFor="staff-name" className="text-sm font-medium">Full name</FieldLabel>
                <Input
                  id="staff-name"
                  placeholder="e.g. Maria Santos"
                  className="h-10 text-sm"
                  aria-invalid={Boolean(form.formState.errors.name)}
                  {...form.register("name")}
                />
                <FieldError errors={[form.formState.errors.name]} />
              </Field>

              <Field data-invalid={Boolean(form.formState.errors.email)}>
                <FieldLabel htmlFor="staff-email" className="text-sm font-medium">Work email address</FieldLabel>
                <Input
                  id="staff-email"
                  type="email"
                  placeholder="reception@optico.com.ph"
                  className="h-10 text-sm"
                  aria-invalid={Boolean(form.formState.errors.email)}
                  {...form.register("email")}
                />
                <FieldError errors={[form.formState.errors.email]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="staff-role" className="text-sm font-medium">Assigned portal role</FieldLabel>
                <Select
                  value={form.watch("role")}
                  onValueChange={(value) =>
                    form.setValue("role", value as StaffInviteInput["role"], {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger id="staff-role" className="w-full h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RECEPTIONIST">Receptionist (Walk-ins, queues & calendar)</SelectItem>
                    <SelectItem value="DOCTOR">Doctor (Schedule, patients & availability)</SelectItem>
                    <SelectItem value="ADMIN">Administrator (Full clinic configuration)</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError errors={[form.formState.errors.role]} />
              </Field>
            </FieldGroup>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="cursor-pointer"
              >
                <UserPlus className="size-4 mr-1.5" />
                {form.formState.isSubmitting ? "Sending invitation…" : "Send Invitation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

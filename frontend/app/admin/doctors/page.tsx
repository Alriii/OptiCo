"use client";

import { useCallback, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AlertCircle, Pencil, Plus, RefreshCw, Stethoscope, UserCheck } from "lucide-react";
import { toast } from "sonner";
import {
  adminService,
  doctorFormSchema,
  type DoctorFormInput,
} from "@/services/admin.service";
import { getApiError } from "@/lib/api-error";
import { readList } from "@/lib/api-shape";
import type { Doctor, Service } from "@/services/types";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
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

const EMPTY: DoctorFormInput = {
  name: "",
  slug: "",
  credentials: "",
  bio: "",
  photoUrl: "",
  isActive: true,
  email: "",
};

export default function AdminDoctorsPage() {
  usePageMeta({
    title: "Doctor Management",
    description: "Manage optometrist roster, specialties, and service assignments.",
  });

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [savingServices, setSavingServices] = useState(false);

  const form = useForm<DoctorFormInput>({
    resolver: zodResolver(doctorFormSchema),
    defaultValues: EMPTY,
    mode: "onBlur",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [doctorsResponse, servicesResponse] = await Promise.all([
        adminService.getDoctors(),
        adminService.getServices(),
      ]);
      setDoctors(readList<Doctor>(doctorsResponse.data, "doctors"));
      setServices(readList<Service>(servicesResponse.data, "services"));
    } catch (err) {
      setError(getApiError(err, "Doctors could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const startCreate = () => {
    setEditingId(null);
    form.reset(EMPTY);
    setIsDialogOpen(true);
  };

  const startEdit = (doctor: Doctor) => {
    setEditingId(doctor.id);
    form.reset({
      name: doctor.displayName,
      slug: doctor.slug ?? "",
      credentials: doctor.credentials ?? "",
      bio: doctor.bio ?? "",
      photoUrl: doctor.photoUrl ?? "",
      isActive: doctor.isActive ?? true,
      email: "",
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: DoctorFormInput) => {
    if (!editingId && !values.email?.trim()) {
      form.setError("email", {
        message: "An invitation email is required for a new doctor profile.",
      });
      return;
    }

    try {
      if (editingId) {
        await adminService.updateDoctor(editingId, values);
        toast.success("Doctor profile updated.");
      } else {
        await adminService.createDoctor(values);
        toast.success("Doctor created and invitation sent. Set availability in schedules.");
      }
      setIsDialogOpen(false);
      setEditingId(null);
      form.reset(EMPTY);
      await load();
    } catch (err) {
      toast.error(getApiError(err, "The doctor profile could not be saved."));
    }
  };

  const toggleActive = async (doctor: Doctor) => {
    try {
      await adminService.updateDoctor(doctor.id, { isActive: !doctor.isActive });
      toast.success(doctor.isActive ? "Doctor deactivated." : "Doctor activated.");
      await load();
    } catch (err) {
      toast.error(getApiError(err, "The doctor status could not be changed."));
      throw err;
    }
  };

  const pickDoctorForServices = (id: string) => {
    setSelectedDoctorId(id);
    const doctor = doctors.find((item) => item.id === id);
    setSelectedServiceIds(doctor?.serviceIds ?? []);
  };

  const toggleService = (id: string) => {
    setSelectedServiceIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const saveServices = async () => {
    if (!selectedDoctorId) return;
    setSavingServices(true);
    try {
      await adminService.setDoctorServices(selectedDoctorId, selectedServiceIds);
      toast.success("Doctor-service assignments saved.");
      await load();
    } catch (err) {
      toast.error(getApiError(err, "The assignments could not be saved."));
    } finally {
      setSavingServices(false);
    }
  };

  const columns: DataTableColumn<Doctor>[] = [
    {
      key: "name",
      header: "Doctor",
      cell: (doctor) => (
        <div className="flex items-center gap-3">
          {doctor.photoUrl ? (
            <img
              src={doctor.photoUrl}
              alt={doctor.displayName}
              className="size-10 rounded-full object-cover ring-1 ring-border/80 shrink-0"
            />
          ) : (
            <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20 font-semibold text-sm shrink-0">
              {doctor.displayName.charAt(0)}
            </div>
          )}
          <div className="space-y-0.5">
            <p className="font-semibold text-base text-foreground">{doctor.displayName}</p>
            <p className="text-xs text-muted-foreground">
              {doctor.credentials || "Licensed Optometrist"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "slug",
      header: "Public Slug",
      cell: (doctor) => (
        <span className="font-mono text-xs text-muted-foreground">
          {doctor.slug ?? "—"}
        </span>
      ),
    },
    {
      key: "services",
      header: "Assigned Services",
      cell: (doctor) => (
        <Badge variant="outline" className="text-xs font-normal">
          {doctor.serviceIds?.length ?? 0} eligible services
        </Badge>
      ),
    },
    {
      key: "active",
      header: "Status",
      cell: (doctor) => (
        <Badge
          variant={doctor.isActive === false ? "outline" : "secondary"}
          className="text-xs px-2.5 py-0.5"
        >
          {doctor.isActive === false ? "Inactive" : "Active"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (doctor) => (
        <div className="flex justify-end items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => startEdit(doctor)}
            className="text-sm font-medium hover:bg-muted cursor-pointer"
          >
            <Pencil className="size-4 mr-1.5" /> Edit
          </Button>
          <ConfirmDialog
            trigger={
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="text-sm font-medium cursor-pointer"
              >
                {doctor.isActive === false ? "Activate" : "Deactivate"}
              </Button>
            }
            title={
              doctor.isActive === false
                ? "Activate this doctor?"
                : "Deactivate this doctor?"
            }
            description={
              doctor.isActive === false
                ? "The doctor will become eligible for consultation bookings once their schedules are active."
                : "The doctor will be excluded from new automatic assignments. Existing appointments remain intact."
            }
            confirmLabel={doctor.isActive === false ? "Activate" : "Deactivate"}
            destructive={doctor.isActive !== false}
            onConfirm={() => toggleActive(doctor)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Optometrist Roster"
        title="Doctors & Specialists"
        description="Public clinician profiles, professional credentials, and service assignment eligibility."
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
              onClick={startCreate}
              className="rounded-xl shadow-xs cursor-pointer"
            >
              <Plus className="size-4 mr-1.5" />
              New Doctor
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

      {/* Main Clean Doctors DataTable */}
      {loading ? (
        <LoadingState title="Loading doctor roster…" />
      ) : (
        <DataTable
          columns={columns}
          rows={doctors}
          getRowKey={(doctor) => doctor.id}
          emptyTitle="No doctor profiles found"
          emptyDescription="Add the first optometrist profile to begin accepting appointments."
        />
      )}

      {/* Service Eligibility Assignment Card */}
      <Card className="rounded-2xl border-border/80 shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Stethoscope className="size-5 text-emerald-600 dark:text-emerald-400" />
              Doctor-Service Eligibility Matrix
            </CardTitle>
            <Badge variant="outline" className="text-xs font-normal">
              Assignment Rules
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {doctors.length === 0 ? (
            <EmptyState
              title="Add a doctor first"
              description="Service eligibility links an optometrist to the specific exams and procedures they perform."
            />
          ) : (
            <>
              <Field className="max-w-md">
                <FieldLabel htmlFor="service-doctor" className="text-sm font-medium">
                  Select doctor to configure
                </FieldLabel>
                <Select value={selectedDoctorId} onValueChange={pickDoctorForServices}>
                  <SelectTrigger id="service-doctor" className="w-full h-10 text-sm">
                    <SelectValue placeholder="Choose an optometrist…" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {selectedDoctorId ? (
                <div className="space-y-4 pt-2">
                  <p className="text-sm text-muted-foreground">
                    Check the clinical services this optometrist is qualified and scheduled to conduct:
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {services.map((service) => {
                      const isChecked = selectedServiceIds.includes(service.id);
                      return (
                        <label
                          key={service.id}
                          className={`flex items-start gap-3 rounded-xl border p-3.5 transition-colors cursor-pointer select-none ${
                            isChecked
                              ? "border-primary/50 bg-primary/5 dark:bg-primary/10"
                              : "border-border/70 bg-card hover:bg-secondary/40"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5 size-4.5 rounded border-input text-primary focus:ring-primary cursor-pointer"
                            checked={isChecked}
                            onChange={() => toggleService(service.id)}
                          />
                          <div>
                            <span className="text-sm font-semibold text-foreground block">
                              {service.name}
                            </span>
                            <span className="text-xs text-muted-foreground block">
                              {service.durationMinutes} min consultation
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <div className="pt-2">
                    <Button
                      type="button"
                      onClick={saveServices}
                      disabled={savingServices}
                      className="cursor-pointer"
                    >
                      <UserCheck className="size-4 mr-1.5" />
                      {savingServices ? "Saving assignments…" : "Save Service Eligibility"}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Select an optometrist above to review and assign their eligible exam procedures.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Focused Modal Dialog for Create & Edit Doctor */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Doctor Profile" : "Create Optometrist Profile"}
            </DialogTitle>
            <DialogDescription>
              Public bio, professional credentials, and login invitation details.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-2" noValidate>
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field data-invalid={Boolean(form.formState.errors.name)}>
                  <FieldLabel htmlFor="doctor-name" className="text-sm font-medium">Display name</FieldLabel>
                  <Input
                    id="doctor-name"
                    placeholder="e.g. Dr. Elena Reyes"
                    className="h-10 text-sm"
                    aria-invalid={Boolean(form.formState.errors.name)}
                    {...form.register("name")}
                  />
                  <FieldError errors={[form.formState.errors.name]} />
                </Field>

                <Field data-invalid={Boolean(form.formState.errors.slug)}>
                  <FieldLabel htmlFor="doctor-slug" className="text-sm font-medium">Public URL slug</FieldLabel>
                  <Input
                    id="doctor-slug"
                    placeholder="dr-elena-reyes"
                    className="h-10 text-sm"
                    aria-invalid={Boolean(form.formState.errors.slug)}
                    {...form.register("slug")}
                  />
                  <FieldError errors={[form.formState.errors.slug]} />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="doctor-credentials" className="text-sm font-medium">Credentials</FieldLabel>
                <Input
                  id="doctor-credentials"
                  placeholder="OD, Doctor of Optometry"
                  className="h-10 text-sm"
                  {...form.register("credentials")}
                />
                <FieldDescription className="text-xs">
                  Displayed prominently under the clinician's name.
                </FieldDescription>
              </Field>

              {!editingId ? (
                <Field data-invalid={Boolean(form.formState.errors.email)}>
                  <FieldLabel htmlFor="doctor-email" className="text-sm font-medium">
                    Invitation Email <span className="font-normal text-muted-foreground">(New profiles)</span>
                  </FieldLabel>
                  <Input
                    id="doctor-email"
                    type="email"
                    placeholder="doctor@optico.com.ph"
                    className="h-10 text-sm"
                    {...form.register("email")}
                  />
                  <FieldDescription className="text-xs">
                    Staff accounts are invitation-only. The doctor sets their password securely via email.
                  </FieldDescription>
                  <FieldError errors={[form.formState.errors.email]} />
                </Field>
              ) : null}

              <Field>
                <FieldLabel htmlFor="doctor-bio" className="text-sm font-medium">Public biography</FieldLabel>
                <Textarea
                  id="doctor-bio"
                  rows={3}
                  placeholder="Doctor's background, clinical specializations, and patient care philosophy…"
                  className="text-sm"
                  {...form.register("bio")}
                />
                <FieldError errors={[form.formState.errors.bio]} />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="doctor-photo" className="text-sm font-medium">Photo URL</FieldLabel>
                  <Input
                    id="doctor-photo"
                    placeholder="https://images.unsplash.com/…"
                    className="h-10 text-sm"
                    {...form.register("photoUrl")}
                  />
                  <FieldError errors={[form.formState.errors.photoUrl]} />
                </Field>

                <Field orientation="horizontal" className="flex items-center gap-2 pt-6">
                  <input
                    id="doctor-active"
                    type="checkbox"
                    className="size-4.5 rounded border-input cursor-pointer"
                    {...form.register("isActive")}
                  />
                  <FieldLabel htmlFor="doctor-active" className="text-sm font-medium cursor-pointer">
                    Active for appointment scheduling
                  </FieldLabel>
                </Field>
              </div>
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
                {form.formState.isSubmitting
                  ? "Saving…"
                  : editingId
                    ? "Save Changes"
                    : "Create Doctor"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

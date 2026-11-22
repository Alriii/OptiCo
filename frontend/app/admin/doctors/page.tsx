"use client";

import { useCallback, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AlertCircle, Pencil, Plus, RefreshCw, Stethoscope } from "lucide-react";
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

const EMPTY: DoctorFormInput = {
  name: "",
  slug: "",
  title: "",
  credentials: "",
  bio: "",
  photoUrl: "",
  active: true,
  email: "",
};

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
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
  };

  const startEdit = (doctor: Doctor) => {
    setEditingId(doctor.id);
    form.reset({
      name: doctor.name,
      slug: doctor.slug ?? "",
      title: doctor.title ?? "",
      credentials: doctor.credentials ?? "",
      bio: doctor.bio ?? "",
      photoUrl: doctor.photoUrl ?? "",
      active: doctor.active ?? true,
      email: "",
    });
  };

  const onSubmit = async (values: DoctorFormInput) => {
    try {
      if (editingId) {
        await adminService.updateDoctor(editingId, values);
        toast.success("Doctor profile updated.");
      } else {
        await adminService.createDoctor(values);
        toast.success("Doctor created. Set availability before assignments.");
      }
      setEditingId(null);
      form.reset(EMPTY);
      await load();
    } catch (err) {
      toast.error(getApiError(err, "The doctor profile could not be saved."));
    }
  };

  const toggleActive = async (doctor: Doctor) => {
    try {
      await adminService.updateDoctor(doctor.id, { active: !doctor.active });
      toast.success(doctor.active ? "Doctor deactivated." : "Doctor activated.");
      await load();
    } catch (err) {
      toast.error(getApiError(err, "The doctor status could not be changed."));
      throw err;
    }
  };

  const pickDoctorForServices = (id: string) => {
    setSelectedDoctorId(id);
    const doctor = doctors.find((item) => item.id === id);
    setSelectedServiceIds(doctor?.services?.map((service) => service.id) ?? []);
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
        <div>
          <p className="font-medium">{doctor.name}</p>
          <p className="text-xs text-muted-foreground">
            {[doctor.title, doctor.credentials].filter(Boolean).join(", ") ||
              "No title"}
          </p>
        </div>
      ),
    },
    {
      key: "slug",
      header: "Public slug",
      cell: (doctor) => doctor.slug ?? "—",
    },
    {
      key: "services",
      header: "Services",
      cell: (doctor) => doctor.services?.length ?? 0,
    },
    {
      key: "active",
      header: "Status",
      cell: (doctor) => (
        <Badge variant={doctor.active === false ? "outline" : "secondary"}>
          {doctor.active === false ? "Inactive" : "Active"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (doctor) => (
        <div className="flex justify-end gap-2">
          <Button type="button" size="sm" variant="ghost" onClick={() => startEdit(doctor)}>
            <Pencil className="size-4" /> Edit
          </Button>
          <ConfirmDialog
            trigger={
              <Button type="button" size="sm" variant="outline">
                {doctor.active === false ? "Activate" : "Deactivate"}
              </Button>
            }
            title={
              doctor.active === false
                ? "Activate this doctor?"
                : "Deactivate this doctor?"
            }
            description={
              doctor.active === false
                ? "The doctor can be assigned appointments again once availability is set."
                : "The doctor is excluded from new automatic assignments. Existing appointments are unchanged."
            }
            confirmLabel={doctor.active === false ? "Activate" : "Deactivate"}
            destructive={doctor.active !== false}
            onConfirm={() => toggleActive(doctor)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Doctors"
        title="Doctor profiles and services"
        description="Public profile data and service eligibility. Availability is configured in Schedules before a doctor can receive assignments."
        actions={
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className="size-4" /> Refresh
            </Button>
            <Button type="button" onClick={startCreate}>
              <Plus className="size-4" /> New doctor
            </Button>
          </div>
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
          <CardTitle className="text-base">
            {editingId ? "Edit doctor profile" : "Create a doctor profile"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field data-invalid={Boolean(form.formState.errors.name)}>
                  <FieldLabel htmlFor="doctor-name">Display name</FieldLabel>
                  <Input
                    id="doctor-name"
                    aria-invalid={Boolean(form.formState.errors.name)}
                    {...form.register("name")}
                  />
                  <FieldError errors={[form.formState.errors.name]} />
                </Field>
                <Field data-invalid={Boolean(form.formState.errors.slug)}>
                  <FieldLabel htmlFor="doctor-slug">Public slug</FieldLabel>
                  <Input
                    id="doctor-slug"
                    placeholder="dr-sample-santos"
                    aria-invalid={Boolean(form.formState.errors.slug)}
                    {...form.register("slug")}
                  />
                  <FieldError errors={[form.formState.errors.slug]} />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="doctor-title">Title</FieldLabel>
                  <Input
                    id="doctor-title"
                    placeholder="Optometrist"
                    {...form.register("title")}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="doctor-credentials">Credentials</FieldLabel>
                  <Input id="doctor-credentials" placeholder="OD" {...form.register("credentials")} />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="doctor-email">
                  Invitation email{" "}
                  <span className="font-normal text-muted-foreground">
                    (new profiles only)
                  </span>
                </FieldLabel>
                <Input
                  id="doctor-email"
                  type="email"
                  placeholder="doctor@example.com"
                  {...form.register("email")}
                />
                <FieldDescription>
                  Staff accounts are created through a secure invitation. Never
                  set a password here.
                </FieldDescription>
                <FieldError errors={[form.formState.errors.email]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="doctor-bio">Public biography</FieldLabel>
                <Textarea id="doctor-bio" rows={3} {...form.register("bio")} />
                <FieldDescription>
                  Approved public information only. No personal phone numbers or
                  internal notes.
                </FieldDescription>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="doctor-photo">Photo URL</FieldLabel>
                  <Input
                    id="doctor-photo"
                    placeholder="https://…"
                    {...form.register("photoUrl")}
                  />
                  <FieldError errors={[form.formState.errors.photoUrl]} />
                </Field>
                <Field orientation="horizontal" className="items-center pt-6">
                  <input
                    id="doctor-active"
                    type="checkbox"
                    className="size-4 rounded border-input"
                    {...form.register("active")}
                  />
                  <FieldLabel htmlFor="doctor-active">Active for assignment</FieldLabel>
                </Field>
              </div>
            </FieldGroup>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? "Saving…"
                  : editingId
                    ? "Save changes"
                    : "Create doctor"}
              </Button>
              {editingId ? (
                <Button type="button" variant="outline" onClick={startCreate}>
                  Cancel edit
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <LoadingState title="Loading doctors" />
      ) : (
        <DataTable
          columns={columns}
          rows={doctors}
          getRowKey={(doctor) => doctor.id}
          emptyTitle="No doctor profiles"
          emptyDescription="Create a doctor profile and set availability before accepting assignments."
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Stethoscope className="size-4" /> Service eligibility
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {doctors.length === 0 ? (
            <EmptyState
              title="Add a doctor first"
              description="Service eligibility links a doctor to the services they can be assigned."
            />
          ) : (
            <>
              <Field className="max-w-sm">
                <FieldLabel htmlFor="service-doctor">Doctor</FieldLabel>
                <Select value={selectedDoctorId} onValueChange={pickDoctorForServices}>
                  <SelectTrigger id="service-doctor" className="w-full">
                    <SelectValue placeholder="Choose a doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {selectedDoctorId ? (
                <>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {services.map((service) => (
                      <label
                        key={service.id}
                        className="flex items-center gap-2 rounded-md border bg-secondary/30 px-3 py-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          className="size-4 rounded border-input"
                          checked={selectedServiceIds.includes(service.id)}
                          onChange={() => toggleService(service.id)}
                        />
                        {service.name}
                      </label>
                    ))}
                  </div>
                  <Button
                    type="button"
                    onClick={saveServices}
                    disabled={savingServices}
                  >
                    {savingServices ? "Saving…" : "Save assignments"}
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Choose a doctor to review which services can be assigned.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

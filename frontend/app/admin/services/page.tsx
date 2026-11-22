"use client";

import { useCallback, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AlertCircle, Pencil, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  adminService,
  serviceFormSchema,
  type ServiceFormInput,
} from "@/services/admin.service";
import { getApiError } from "@/lib/api-error";
import { readList } from "@/lib/api-shape";
import { formatCurrency } from "@/lib/format";
import type { Service } from "@/services/types";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { LoadingState } from "@/components/shared/loading-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";

const EMPTY: ServiceFormInput = {
  name: "",
  slug: "",
  description: "",
  durationMinutes: 30,
  bufferBeforeMinutes: 0,
  bufferAfterMinutes: 0,
  fee: 0,
  active: true,
  displayOrder: 0,
};

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<ServiceFormInput>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: EMPTY,
    mode: "onBlur",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getServices();
      setServices(readList<Service>(response.data, "services"));
    } catch (err) {
      setError(getApiError(err, "Services could not be loaded."));
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

  const startEdit = (service: Service) => {
    setEditingId(service.id);
    form.reset({
      name: service.name,
      slug: service.slug ?? "",
      description: service.description ?? "",
      durationMinutes: service.durationMinutes ?? 30,
      bufferBeforeMinutes: service.bufferBeforeMinutes ?? 0,
      bufferAfterMinutes: service.bufferAfterMinutes ?? 0,
      fee: Number(service.fee ?? 0),
      active: service.active ?? true,
      displayOrder: service.displayOrder ?? 0,
    });
  };

  const onSubmit = async (values: ServiceFormInput) => {
    try {
      if (editingId) {
        await adminService.updateService(editingId, values);
        toast.success("Service updated.");
      } else {
        await adminService.createService(values);
        toast.success("Service created.");
      }
      setEditingId(null);
      form.reset(EMPTY);
      await load();
    } catch (err) {
      toast.error(getApiError(err, "The service could not be saved."));
    }
  };

  const toggleActive = async (service: Service) => {
    try {
      await adminService.updateService(service.id, { active: !service.active });
      toast.success(service.active ? "Service deactivated." : "Service activated.");
      await load();
    } catch (err) {
      toast.error(getApiError(err, "The service status could not be changed."));
      throw err;
    }
  };

  const columns: DataTableColumn<Service>[] = [
    {
      key: "name",
      header: "Service",
      cell: (service) => (
        <div>
          <p className="font-medium">{service.name}</p>
          <p className="text-xs text-muted-foreground">{service.slug ?? "—"}</p>
        </div>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      cell: (service) => `${service.durationMinutes ?? "—"} min`,
    },
    {
      key: "buffers",
      header: "Buffers",
      cell: (service) =>
        `${service.bufferBeforeMinutes ?? 0} / ${service.bufferAfterMinutes ?? 0} min`,
    },
    {
      key: "fee",
      header: "Fee",
      cell: (service) => formatCurrency(service.fee),
    },
    {
      key: "active",
      header: "Status",
      cell: (service) => (
        <Badge variant={service.active === false ? "outline" : "secondary"}>
          {service.active === false ? "Inactive" : "Active"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (service) => (
        <div className="flex justify-end gap-2">
          <Button type="button" size="sm" variant="ghost" onClick={() => startEdit(service)}>
            <Pencil className="size-4" /> Edit
          </Button>
          <ConfirmDialog
            trigger={
              <Button type="button" size="sm" variant="outline">
                {service.active === false ? "Activate" : "Deactivate"}
              </Button>
            }
            title={
              service.active === false
                ? "Activate this service?"
                : "Deactivate this service?"
            }
            description={
              service.active === false
                ? "The service becomes available for public booking."
                : "The service is hidden from new public booking. Existing appointments keep their snapshots."
            }
            confirmLabel={service.active === false ? "Activate" : "Deactivate"}
            destructive={service.active !== false}
            onConfirm={() => toggleActive(service)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Service catalog"
        title="Services and fees"
        description="Durations, buffers, fees, and display order are clinic configuration. Appointment snapshots protect historical records."
        actions={
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className="size-4" /> Refresh
            </Button>
            <Button type="button" onClick={startCreate}>
              <Plus className="size-4" /> New service
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
            {editingId ? "Edit service" : "Create a service"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field data-invalid={Boolean(form.formState.errors.name)}>
                  <FieldLabel htmlFor="service-name">Name</FieldLabel>
                  <Input
                    id="service-name"
                    aria-invalid={Boolean(form.formState.errors.name)}
                    {...form.register("name")}
                  />
                  <FieldError errors={[form.formState.errors.name]} />
                </Field>
                <Field data-invalid={Boolean(form.formState.errors.slug)}>
                  <FieldLabel htmlFor="service-slug">Slug</FieldLabel>
                  <Input
                    id="service-slug"
                    placeholder="comprehensive-eye-exam"
                    aria-invalid={Boolean(form.formState.errors.slug)}
                    {...form.register("slug")}
                  />
                  <FieldError errors={[form.formState.errors.slug]} />
                </Field>
              </div>

              <Field data-invalid={Boolean(form.formState.errors.description)}>
                <FieldLabel htmlFor="service-description">Description</FieldLabel>
                <Textarea
                  id="service-description"
                  rows={2}
                  {...form.register("description")}
                />
                <FieldError errors={[form.formState.errors.description]} />
              </Field>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field data-invalid={Boolean(form.formState.errors.durationMinutes)}>
                  <FieldLabel htmlFor="service-duration">Duration (min)</FieldLabel>
                  <Input
                    id="service-duration"
                    type="number"
                    min="5"
                    aria-invalid={Boolean(form.formState.errors.durationMinutes)}
                    {...form.register("durationMinutes", { valueAsNumber: true })}
                  />
                  <FieldError errors={[form.formState.errors.durationMinutes]} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="service-buffer-before">Buffer before</FieldLabel>
                  <Input
                    id="service-buffer-before"
                    type="number"
                    min="0"
                    {...form.register("bufferBeforeMinutes", { valueAsNumber: true })}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="service-buffer-after">Buffer after</FieldLabel>
                  <Input
                    id="service-buffer-after"
                    type="number"
                    min="0"
                    {...form.register("bufferAfterMinutes", { valueAsNumber: true })}
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field data-invalid={Boolean(form.formState.errors.fee)}>
                  <FieldLabel htmlFor="service-fee">Fee (PHP)</FieldLabel>
                  <Input
                    id="service-fee"
                    type="number"
                    min="0"
                    step="0.01"
                    aria-invalid={Boolean(form.formState.errors.fee)}
                    {...form.register("fee", { valueAsNumber: true })}
                  />
                  <FieldError errors={[form.formState.errors.fee]} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="service-order">Display order</FieldLabel>
                  <Input
                    id="service-order"
                    type="number"
                    min="0"
                    {...form.register("displayOrder", { valueAsNumber: true })}
                  />
                </Field>
                <Field orientation="horizontal" className="items-center pt-6">
                  <input
                    id="service-active"
                    type="checkbox"
                    className="size-4 rounded border-input"
                    {...form.register("active")}
                  />
                  <FieldLabel htmlFor="service-active">Active for booking</FieldLabel>
                </Field>
              </div>
            </FieldGroup>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? "Saving…"
                  : editingId
                    ? "Save changes"
                    : "Create service"}
              </Button>
              {editingId ? (
                <Button type="button" variant="outline" onClick={startCreate}>
                  Cancel edit
                </Button>
              ) : null}
              <FieldDescription className="self-center">
                Fees are demo values until the clinic confirms them.
              </FieldDescription>
            </div>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <LoadingState title="Loading services" />
      ) : (
        <DataTable
          columns={columns}
          rows={services}
          getRowKey={(service) => service.id}
          emptyTitle="No services configured"
          emptyDescription="Create the clinic's first service to enable public booking."
        />
      )}
    </div>
  );
}

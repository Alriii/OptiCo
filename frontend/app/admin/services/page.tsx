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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePageMeta } from "@/lib/use-page-meta";

const EMPTY: ServiceFormInput = {
  name: "",
  slug: "",
  description: "",
  durationMinutes: 30,
  bufferBeforeMinutes: 0,
  bufferAfterMinutes: 0,
  fee: 0,
  isActive: true,
  displayOrder: 0,
};

export default function AdminServicesPage() {
  usePageMeta({
    title: "Service Catalog",
    description: "Manage clinical services, durations, and standard fees.",
  });

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
    setIsDialogOpen(true);
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
      isActive: service.isActive ?? true,
      displayOrder: service.displayOrder ?? 0,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: ServiceFormInput) => {
    try {
      if (editingId) {
        await adminService.updateService(editingId, values);
        toast.success("Service updated successfully.");
      } else {
        await adminService.createService(values);
        toast.success("New service created.");
      }
      setIsDialogOpen(false);
      setEditingId(null);
      form.reset(EMPTY);
      await load();
    } catch (err) {
      toast.error(getApiError(err, "The service could not be saved."));
    }
  };

  const toggleActive = async (service: Service) => {
    try {
      await adminService.updateService(service.id, { isActive: !service.isActive });
      toast.success(service.isActive ? "Service deactivated." : "Service activated.");
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
        <div className="space-y-0.5">
          <p className="font-semibold text-base text-foreground">{service.name}</p>
          {service.description ? (
            <p className="text-xs text-muted-foreground line-clamp-1 max-w-sm">
              {service.description}
            </p>
          ) : null}
          <p className="text-xs font-mono text-muted-foreground/70">{service.slug ?? "—"}</p>
        </div>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      cell: (service) => (
        <span className="font-medium text-sm text-foreground">
          {service.durationMinutes ?? "—"} min
        </span>
      ),
    },
    {
      key: "buffers",
      header: "Buffers (Before / After)",
      cell: (service) => (
        <span className="text-sm text-muted-foreground">
          {service.bufferBeforeMinutes ?? 0}m / {service.bufferAfterMinutes ?? 0}m
        </span>
      ),
    },
    {
      key: "fee",
      header: "Standard Fee",
      cell: (service) => (
        <span className="font-semibold text-base text-foreground">
          {formatCurrency(service.fee)}
        </span>
      ),
    },
    {
      key: "active",
      header: "Status",
      cell: (service) => (
        <Badge
          variant={service.isActive === false ? "outline" : "secondary"}
          className="text-xs px-2.5 py-0.5"
        >
          {service.isActive === false ? "Inactive" : "Active"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (service) => (
        <div className="flex justify-end items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => startEdit(service)}
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
                {service.isActive === false ? "Activate" : "Deactivate"}
              </Button>
            }
            title={
              service.isActive === false
                ? "Activate this service?"
                : "Deactivate this service?"
            }
            description={
              service.isActive === false
                ? "The service will become available for public patient bookings."
                : "The service will be hidden from new bookings. Existing appointments retain their records."
            }
            confirmLabel={service.isActive === false ? "Activate" : "Deactivate"}
            destructive={service.isActive !== false}
            onConfirm={() => toggleActive(service)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Service Catalog"
        title="Services & Fees"
        description="Configure clinical exam types, consultation durations, buffers, and standard fees."
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
              New Service
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

      {/* Main Clean Data Table */}
      {loading ? (
        <LoadingState title="Loading service catalog…" />
      ) : (
        <DataTable
          columns={columns}
          rows={services}
          getRowKey={(service) => service.id}
          emptyTitle="No services configured"
          emptyDescription="Create the clinic's first optical service to enable online booking."
        />
      )}

      {/* Focused Modal Dialog for Create & Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Service" : "Create New Service"}
            </DialogTitle>
            <DialogDescription>
              Set service name, duration, consultation fees, and appointment buffers.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-2" noValidate>
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field data-invalid={Boolean(form.formState.errors.name)}>
                  <FieldLabel htmlFor="service-name" className="text-sm font-medium">Service name</FieldLabel>
                  <Input
                    id="service-name"
                    placeholder="e.g. Comprehensive Eye Exam"
                    className="h-10 text-sm"
                    aria-invalid={Boolean(form.formState.errors.name)}
                    {...form.register("name")}
                  />
                  <FieldError errors={[form.formState.errors.name]} />
                </Field>

                <Field data-invalid={Boolean(form.formState.errors.slug)}>
                  <FieldLabel htmlFor="service-slug" className="text-sm font-medium">URL Slug</FieldLabel>
                  <Input
                    id="service-slug"
                    placeholder="comprehensive-eye-exam"
                    className="h-10 text-sm"
                    aria-invalid={Boolean(form.formState.errors.slug)}
                    {...form.register("slug")}
                  />
                  <FieldError errors={[form.formState.errors.slug]} />
                </Field>
              </div>

              <Field data-invalid={Boolean(form.formState.errors.description)}>
                <FieldLabel htmlFor="service-description" className="text-sm font-medium">Description</FieldLabel>
                <Textarea
                  id="service-description"
                  rows={3}
                  placeholder="Clinical purpose and what is included in this examination…"
                  className="text-sm"
                  {...form.register("description")}
                />
                <FieldError errors={[form.formState.errors.description]} />
              </Field>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field data-invalid={Boolean(form.formState.errors.durationMinutes)}>
                  <FieldLabel htmlFor="service-duration" className="text-sm font-medium">Duration (min)</FieldLabel>
                  <Input
                    id="service-duration"
                    type="number"
                    min="5"
                    className="h-10 text-sm"
                    aria-invalid={Boolean(form.formState.errors.durationMinutes)}
                    {...form.register("durationMinutes", { valueAsNumber: true })}
                  />
                  <FieldError errors={[form.formState.errors.durationMinutes]} />
                </Field>

                <Field>
                  <FieldLabel htmlFor="service-buffer-before" className="text-sm font-medium">Buffer before</FieldLabel>
                  <Input
                    id="service-buffer-before"
                    type="number"
                    min="0"
                    className="h-10 text-sm"
                    {...form.register("bufferBeforeMinutes", { valueAsNumber: true })}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="service-buffer-after" className="text-sm font-medium">Buffer after</FieldLabel>
                  <Input
                    id="service-buffer-after"
                    type="number"
                    min="0"
                    className="h-10 text-sm"
                    {...form.register("bufferAfterMinutes", { valueAsNumber: true })}
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field data-invalid={Boolean(form.formState.errors.fee)}>
                  <FieldLabel htmlFor="service-fee" className="text-sm font-medium">Fee (PHP)</FieldLabel>
                  <Input
                    id="service-fee"
                    type="number"
                    min="0"
                    step="0.01"
                    className="h-10 text-sm"
                    aria-invalid={Boolean(form.formState.errors.fee)}
                    {...form.register("fee", { valueAsNumber: true })}
                  />
                  <FieldError errors={[form.formState.errors.fee]} />
                </Field>

                <Field>
                  <FieldLabel htmlFor="service-order" className="text-sm font-medium">Display order</FieldLabel>
                  <Input
                    id="service-order"
                    type="number"
                    min="0"
                    className="h-10 text-sm"
                    {...form.register("displayOrder", { valueAsNumber: true })}
                  />
                </Field>

                <Field orientation="horizontal" className="flex items-center gap-2 pt-6">
                  <input
                    id="service-active"
                    type="checkbox"
                    className="size-4.5 rounded border-input cursor-pointer"
                    {...form.register("isActive")}
                  />
                  <FieldLabel htmlFor="service-active" className="text-sm font-medium cursor-pointer">
                    Active for booking
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
                    : "Create Service"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

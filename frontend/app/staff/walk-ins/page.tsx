"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, ListOrdered, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { staffService } from "@/services/staff.service";
import { publicService } from "@/services/public.service";
import { getApiError } from "@/lib/api-error";
import { readList } from "@/lib/api-shape";
import { requiresGuardian } from "@/lib/booking";
import { formatDate, todayInClinic } from "@/lib/format";
import type { Service, WalkIn } from "@/services/types";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WalkInFormState {
  fullName: string;
  email: string;
  mobile: string;
  dateOfBirth: string;
  serviceId: string;
  note: string;
  guardianName: string;
  guardianRelationship: string;
  guardianContact: string;
}

const EMPTY_FORM: WalkInFormState = {
  fullName: "",
  email: "",
  mobile: "",
  dateOfBirth: "",
  serviceId: "",
  note: "",
  guardianName: "",
  guardianRelationship: "",
  guardianContact: "",
};

export default function StaffWalkInsPage() {
  const [date, setDate] = useState(todayInClinic());
  const [walkIns, setWalkIns] = useState<WalkIn[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<WalkInFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const guardianRequired = requiresGuardian(form.dateOfBirth, date);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await staffService.getWalkIns(date);
      setWalkIns(readList<WalkIn>(response.data, "walkIns", "queue"));
    } catch (err) {
      setError(getApiError(err, "The walk-in queue could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    publicService
      .getServices()
      .then((response) => {
        setServices(readList<Service>(response.data, "services"));
      })
      .catch(() => {
        // The form explains that a service is required when the list is empty.
      });
  }, []);

  const setField = <K extends keyof WalkInFormState>(
    key: K,
    value: WalkInFormState[K],
  ) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!form.fullName.trim() || !form.email.trim() || !form.mobile.trim()) {
      setFormError("Name, email, and mobile number are required.");
      return;
    }
    if (!form.serviceId) {
      setFormError("Choose the service for this walk-in.");
      return;
    }
    if (
      guardianRequired &&
      (!form.guardianName.trim() || !form.guardianContact.trim())
    ) {
      setFormError(
        "Guardian name and contact are required because the patient is a minor.",
      );
      return;
    }

    setSubmitting(true);
    try {
      await staffService.createWalkIn({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        dateOfBirth: form.dateOfBirth || undefined,
        serviceId: form.serviceId,
        note: form.note.trim() || undefined,
        guardianName: guardianRequired ? form.guardianName.trim() : undefined,
        guardianRelationship: guardianRequired
          ? form.guardianRelationship.trim()
          : undefined,
        guardianContact: guardianRequired ? form.guardianContact.trim() : undefined,
      });
      toast.success("Walk-in added to the queue.");
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      const message = getApiError(err, "The walk-in could not be registered.");
      setFormError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const action = async (
    id: string,
    run: (id: string) => Promise<unknown>,
    success: string,
  ) => {
    try {
      await run(id);
      toast.success(success);
      await load();
    } catch (err) {
      toast.error(getApiError(err, "The queue action failed."));
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Walk-ins"
        title="Waiting queue"
        description="Register walk-in patients and move them through the clinic queue. Queue tickets are unique per clinic day."
        actions={
          <Button type="button" variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className="size-4" /> Refresh
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Register a walk-in</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4" noValidate>
              {formError ? (
                <p
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  {formError}
                </p>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="walkin-name">Full name</FieldLabel>
                  <Input
                    id="walkin-name"
                    value={form.fullName}
                    onChange={(event) => setField("fullName", event.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="walkin-mobile">Mobile</FieldLabel>
                  <Input
                    id="walkin-mobile"
                    type="tel"
                    value={form.mobile}
                    onChange={(event) => setField("mobile", event.target.value)}
                    required
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="walkin-email">Email</FieldLabel>
                <Input
                  id="walkin-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setField("email", event.target.value)}
                  required
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="walkin-dob">Date of birth</FieldLabel>
                  <Input
                    id="walkin-dob"
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(event) => setField("dateOfBirth", event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="walkin-service">Service</FieldLabel>
                  <Select
                    value={form.serviceId}
                    onValueChange={(value) => setField("serviceId", value)}
                  >
                    <SelectTrigger id="walkin-service" className="w-full">
                      <SelectValue placeholder="Choose a service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {services.length === 0 ? (
                    <FieldDescription>
                      No services loaded. Check the clinic API or ask an
                      administrator to publish services.
                    </FieldDescription>
                  ) : null}
                </Field>
              </div>

              {guardianRequired ? (
                <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-900 dark:bg-amber-950/40">
                  <p className="text-sm font-medium">Parent or guardian</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field>
                      <FieldLabel htmlFor="walkin-guardian-name">Name</FieldLabel>
                      <Input
                        id="walkin-guardian-name"
                        value={form.guardianName}
                        onChange={(event) =>
                          setField("guardianName", event.target.value)
                        }
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="walkin-guardian-relationship">
                        Relationship
                      </FieldLabel>
                      <Input
                        id="walkin-guardian-relationship"
                        value={form.guardianRelationship}
                        onChange={(event) =>
                          setField("guardianRelationship", event.target.value)
                        }
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="walkin-guardian-contact">
                        Contact
                      </FieldLabel>
                      <Input
                        id="walkin-guardian-contact"
                        type="tel"
                        value={form.guardianContact}
                        onChange={(event) =>
                          setField("guardianContact", event.target.value)
                        }
                      />
                    </Field>
                  </div>
                </div>
              ) : null}

              <Field>
                <FieldLabel htmlFor="walkin-note">Operational note</FieldLabel>
                <Textarea
                  id="walkin-note"
                  rows={2}
                  value={form.note}
                  onChange={(event) => setField("note", event.target.value)}
                  placeholder="Optional scheduling context only."
                />
                <FieldDescription>
                  Do not enter diagnoses, prescriptions, or sensitive clinical
                  details.
                </FieldDescription>
              </Field>

              <Button type="submit" disabled={submitting}>
                {submitting ? "Adding…" : "Add to queue"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <Field className="max-w-xs">
              <FieldLabel htmlFor="walkin-date">Clinic date</FieldLabel>
              <Input
                id="walkin-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </Field>
            <p className="text-sm text-muted-foreground">{formatDate(date)}</p>
          </div>

          {error ? (
            <div
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </div>
          ) : null}

          {loading ? (
            <LoadingState title="Loading the queue" />
          ) : walkIns.length === 0 ? (
            <EmptyState
              icon={ListOrdered}
              title="Queue is empty"
              description="Registered walk-ins for this clinic day will appear here."
            />
          ) : (
            <div className="grid gap-3">
              {walkIns.map((entry) => {
                const status = entry.status.toUpperCase();
                return (
                  <article key={entry.id} className="rounded-xl border bg-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                          Queue ticket
                        </p>
                        <p className="text-2xl font-semibold">
                          {entry.queueNumber ?? "—"}
                        </p>
                        <p className="mt-1 font-medium">
                          {entry.patientName ?? "Walk-in patient"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {entry.serviceName ?? "Service"} ·{" "}
                          {entry.doctorName ?? "Doctor not assigned"}
                        </p>
                      </div>
                      <StatusBadge kind="queue" status={entry.status} />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {status === "WAITING" ? (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() =>
                            action(entry.id, staffService.callWalkIn, "Patient called.")
                          }
                        >
                          Call
                        </Button>
                      ) : null}

                      {status === "CALLED" ? (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() =>
                            action(
                              entry.id,
                              staffService.startWalkIn,
                              "Service started.",
                            )
                          }
                        >
                          Start service
                        </Button>
                      ) : null}

                      {status === "IN_SERVICE" ? (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() =>
                            action(
                              entry.id,
                              staffService.completeWalkIn,
                              "Walk-in completed.",
                            )
                          }
                        >
                          Complete
                        </Button>
                      ) : null}

                      {["WAITING", "CALLED"].includes(status) ? (
                        <ConfirmDialog
                          trigger={
                            <Button type="button" size="sm" variant="outline">
                              Cancel
                            </Button>
                          }
                          title="Cancel this queue entry?"
                          description="The queue entry is closed. The patient record stays available for reporting."
                          confirmLabel="Cancel entry"
                          destructive
                          onConfirm={() =>
                            action(
                              entry.id,
                              staffService.cancelWalkIn,
                              "Queue entry cancelled.",
                            )
                          }
                        />
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

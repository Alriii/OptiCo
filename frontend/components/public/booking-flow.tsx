"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Info,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { publicService, bookingDetailsSchema, type BookingDetails } from "@/services/public.service";
import { patientService } from "@/services/patient.service";
import { getApiError, isConflictError } from "@/lib/api-error";
import { readList } from "@/lib/api-shape";
import { requiresGuardian } from "@/lib/booking";
import { formatCurrency, formatDate, formatTime, todayInClinic } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import type { AvailabilitySlot, Service } from "@/services/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

const STEPS = ["Service", "Date", "Time", "Details", "Review"] as const;

const DEFAULT_VALUES: BookingDetails = {
  fullName: "",
  email: "",
  mobile: "",
  dateOfBirth: "",
  note: "",
  guardianName: "",
  guardianRelationship: "",
  guardianContact: "",
};

export function BookingFlow({ initialServiceId }: { initialServiceId?: string }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [result, setResult] = useState<{ reference?: string; id?: string } | null>(null);
  const [prefilled, setPrefilled] = useState(false);

  const form = useForm<BookingDetails>({
    resolver: zodResolver(bookingDetailsSchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onBlur",
  });

  const dateOfBirth = form.watch("dateOfBirth");
  const guardianRequired = useMemo(
    () => requiresGuardian(dateOfBirth, date || undefined),
    [dateOfBirth, date],
  );

  const minDate = todayInClinic();
  const maxDate = useMemo(() => {
    const next = new Date();
    next.setDate(next.getDate() + 90);
    return next.toISOString().slice(0, 10);
  }, []);

  const loadServices = () => {
    setLoadingServices(true);
    setServicesError(null);
    publicService
      .getServices()
      .then((response) => {
        const list = readList<Service>(response.data, "services");
        setServices(list);
        if (initialServiceId) {
          const match = list.find((item) => item.id === initialServiceId);
          if (match) {
            setSelectedService(match);
            setStep(2);
          }
        }
      })
      .catch((error) => {
        setServicesError(
          getApiError(error, "Services could not be loaded. Please try again."),
        );
      })
      .finally(() => setLoadingServices(false));
  };

  useEffect(() => {
    loadServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user || user.role.toUpperCase() !== "PATIENT" || prefilled) return;

    patientService
      .getProfile()
      .then((response) => {
        const profile = response.data;
        if (!profile) return;
        form.reset({
          ...DEFAULT_VALUES,
          fullName: profile.fullName ?? "",
          email: profile.email ?? "",
          mobile: profile.mobile ?? "",
          dateOfBirth: profile.dateOfBirth ?? "",
        });
        setPrefilled(true);
      })
      .catch(() => {
        // Prefill is a convenience; the form still works without it.
      });
  }, [user, prefilled, form]);

  useEffect(() => {
    if (!selectedService || !date) return;

    let cancelled = false;
    setLoadingSlots(true);
    setSlotsError(null);
    setSelectedSlot(null);

    publicService
      .getAvailability(selectedService.id, date)
      .then((response) => {
        if (cancelled) return;
        setSlots(response.data?.slots ?? []);
      })
      .catch((error) => {
        if (cancelled) return;
        setSlots([]);
        setSlotsError(
          getApiError(error, "Available times could not be loaded for this date."),
        );
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedService, date]);

  const goBack = () => {
    setSubmitError(null);
    setConflict(false);
    setStep((current) => Math.max(1, current - 1));
  };

  const continueFromDetails = async () => {
    const valid = await form.trigger();
    if (!valid) return;

    if (guardianRequired) {
      const values = form.getValues();
      let hasError = false;

      if (!values.guardianName?.trim()) {
        form.setError("guardianName", {
          message: "Guardian name is required for a minor patient.",
        });
        hasError = true;
      }
      if (!values.guardianRelationship?.trim()) {
        form.setError("guardianRelationship", {
          message: "Guardian relationship is required.",
        });
        hasError = true;
      }
      if (!values.guardianContact?.trim()) {
        form.setError("guardianContact", {
          message: "Guardian contact is required.",
        });
        hasError = true;
      }
      if (hasError) return;
    }

    setStep(5);
  };

  const submit = async () => {
    if (!selectedService || !selectedSlot) return;

    const values = form.getValues();
    if (guardianRequired && (!values.guardianName || !values.guardianContact)) {
      setStep(4);
      toast.error("Guardian details are required for a minor patient.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setConflict(false);

    const note = values.note?.trim() || undefined;
    const isRegisteredPatient = user?.role.toUpperCase() === "PATIENT";

    try {
      const response = isRegisteredPatient
        ? await patientService.requestAppointment({
            serviceId: selectedService.id,
            startAt: selectedSlot.startAt,
            note,
          })
        : await publicService.createAppointment({
            serviceId: selectedService.id,
            startAt: selectedSlot.startAt,
            note,
            patient: {
              fullName: values.fullName.trim(),
              email: values.email.trim(),
              mobile: values.mobile.trim() || undefined,
              dateOfBirth: values.dateOfBirth || undefined,
              guardianName: guardianRequired
                ? values.guardianName?.trim() || undefined
                : undefined,
              guardianRelationship: guardianRequired
                ? values.guardianRelationship?.trim() || undefined
                : undefined,
              guardianContact: guardianRequired
                ? values.guardianContact?.trim() || undefined
                : undefined,
            },
          });

      setResult({
        reference: response.data.reference,
        id: response.data.id,
      });
      setStep(6);
    } catch (error) {
      setSubmitError(getApiError(error, "The request could not be submitted."));
      setConflict(isConflictError(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingServices) {
    return <LoadingState title="Loading services" description="Getting the clinic menu ready." />;
  }

  if (servicesError) {
    return (
      <Card>
        <CardContent className="space-y-4 px-6 py-8">
          <div role="alert" className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>{servicesError}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Booking needs live service and availability data. Please retry, or
            call the clinic if the problem continues.
          </p>
          <Button type="button" onClick={loadServices}>
            <RefreshCw className="size-4" /> Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 6 && result) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardContent className="space-y-5 px-6 py-8">
          <span className="flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">
            <CheckCircle2 className="size-6" aria-hidden="true" />
          </span>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              Request received
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Your appointment request is now awaiting clinic review. This is
              not a confirmed schedule yet.
            </p>
          </div>

          <div className="rounded-xl border bg-secondary/60 px-4 py-3 text-sm">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Booking reference
            </p>
            <p className="mt-1 font-mono text-lg font-semibold">
              {result.reference ?? result.id ?? "Provided by email"}
            </p>
            <p className="mt-2 text-muted-foreground">
              {selectedService?.name} · {formatDate(date)} ·{" "}
              {selectedSlot?.label ?? formatTime(selectedSlot?.startAt)}
            </p>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
            <p className="flex items-start gap-2">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                The clinic will email you when the request is approved or
                rejected. If you booked as a guest, that email includes a
                private link to manage this booking.
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/">Back to home</Link>
            </Button>
            {user ? (
              <Button asChild variant="outline">
                <Link href="/patient/appointments">View my appointments</Link>
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href="/guest/manage">Manage guest booking</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-secondary/50 px-4 py-3 text-sm">
        <p className="flex items-start gap-2 text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <span>
            <strong className="font-medium text-foreground">
              Appointment request only.
            </strong>{" "}
            Your schedule is confirmed after clinic approval. A requested slot
            is not reserved.
          </span>
        </p>
      </div>

      <ol className="grid grid-cols-5 gap-1 text-center text-[11px] sm:text-xs" aria-label="Booking steps">
        {STEPS.map((label, index) => {
          const number = index + 1;
          const state = number === step ? "current" : number < step ? "done" : "upcoming";
          return (
            <li
              key={label}
              aria-current={state === "current" ? "step" : undefined}
              className={cn(
                "rounded-md border px-1 py-2",
                state === "current" && "border-primary bg-primary text-primary-foreground",
                state === "done" && "border-primary/30 bg-background text-primary",
                state === "upcoming" && "bg-background text-muted-foreground",
              )}
            >
              <span className="block font-semibold">{number}</span>
              {label}
            </li>
          );
        })}
      </ol>

      {step === 1 ? (
        <section className="space-y-4" aria-labelledby="choose-service">
          <div>
            <h2 id="choose-service" className="text-lg font-semibold">
              Choose a service
            </h2>
            <p className="text-sm text-muted-foreground">
              Fees and durations are set by the clinic. You will not choose a
              doctor.
            </p>
          </div>

          {services.length === 0 ? (
            <EmptyState
              title="No active services"
              description="The clinic has not published any bookable services yet."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {services.map((service) => {
                const selected = selectedService?.id === service.id;
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => {
                      setSelectedService(service);
                      setStep(2);
                    }}
                    aria-pressed={selected}
                    className={cn(
                      "rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selected && "border-primary ring-1 ring-primary",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium">{service.name}</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(service.fee)}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {service.description ?? "Clinic service."}
                    </p>
                    <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3.5" aria-hidden="true" />
                      {service.durationMinutes ?? "—"} minutes
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      {step === 2 ? (
        <section className="space-y-4" aria-labelledby="choose-date">
          <div>
            <h2 id="choose-date" className="text-lg font-semibold">
              Choose a preferred date
            </h2>
            <p className="text-sm text-muted-foreground">
              Dates are Manila clinic dates. Weekends and closures may have no
              available times.
            </p>
          </div>

          <Card>
            <CardContent className="space-y-4 px-5 py-5">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="secondary">{selectedService?.name}</Badge>
                <span className="text-muted-foreground">
                  {selectedService?.durationMinutes} min ·{" "}
                  {formatCurrency(selectedService?.fee)}
                </span>
              </div>

              <Field>
                <FieldLabel htmlFor="booking-date">Preferred date</FieldLabel>
                <Input
                  id="booking-date"
                  type="date"
                  min={minDate}
                  max={maxDate}
                  value={date}
                  onChange={(event) => {
                    setDate(event.target.value);
                    setSelectedSlot(null);
                  }}
                  className="max-w-xs"
                />
                <FieldDescription>
                  Available times are a point-in-time estimate, not a
                  reservation.
                </FieldDescription>
              </Field>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={goBack}>
                  <ArrowLeft className="size-4" /> Back
                </Button>
                <Button
                  type="button"
                  disabled={!date}
                  onClick={() => setStep(3)}
                >
                  See times <ArrowRight className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="space-y-4" aria-labelledby="choose-time">
          <div>
            <h2 id="choose-time" className="text-lg font-semibold">
              Choose a preferred time
            </h2>
            <p className="text-sm text-muted-foreground">
              {formatDate(date)} · {selectedService?.name}
            </p>
          </div>

          {loadingSlots ? (
            <LoadingState title="Checking available times" />
          ) : slotsError ? (
            <div role="alert" className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
              <p className="flex items-start gap-2 text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {slotsError}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  if (!selectedService) return;
                  setDate((current) => `${current}`);
                }}
              >
                <RefreshCw className="size-4" /> Retry
              </Button>
            </div>
          ) : slots.length === 0 ? (
            <EmptyState
              title="No times available"
              description="This date has no open times for the selected service. Try another date."
              icon={CalendarCheck}
              action={
                <Button type="button" variant="outline" onClick={() => setStep(2)}>
                  Choose another date
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {slots.map((slot) => {
                const selected = selectedSlot?.startAt === slot.startAt;
                return (
                  <button
                    key={slot.startAt}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    aria-pressed={selected}
                    className={cn(
                      "rounded-lg border bg-card px-3 py-3 text-sm transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selected && "border-primary bg-primary text-primary-foreground",
                    )}
                  >
                    {slot.label || formatTime(slot.startAt)}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={goBack}>
              <ArrowLeft className="size-4" /> Back
            </Button>
            <Button
              type="button"
              disabled={!selectedSlot}
              onClick={() => setStep(4)}
            >
              Continue <ArrowRight className="size-4" />
            </Button>
          </div>
        </section>
      ) : null}

      {step === 4 ? (
        <section className="space-y-4" aria-labelledby="booking-details">
          <div>
            <h2 id="booking-details" className="text-lg font-semibold">
              Patient details
            </h2>
            <p className="text-sm text-muted-foreground">
              Only what the clinic needs to manage the appointment.
            </p>
          </div>

          <Card>
            <CardContent className="px-5 py-5">
              <form
                id="booking-details-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  void continueFromDetails();
                }}
                noValidate
              >
                <FieldGroup>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field data-invalid={Boolean(form.formState.errors.fullName)}>
                      <FieldLabel htmlFor="fullName">Full name</FieldLabel>
                      <Input
                        id="fullName"
                        autoComplete="name"
                        aria-invalid={Boolean(form.formState.errors.fullName)}
                        {...form.register("fullName")}
                      />
                      <FieldError errors={[form.formState.errors.fullName]} />
                    </Field>

                    <Field data-invalid={Boolean(form.formState.errors.email)}>
                      <FieldLabel htmlFor="email">Email</FieldLabel>
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        aria-invalid={Boolean(form.formState.errors.email)}
                        {...form.register("email")}
                      />
                      <FieldError errors={[form.formState.errors.email]} />
                    </Field>

                    <Field data-invalid={Boolean(form.formState.errors.mobile)}>
                      <FieldLabel htmlFor="mobile">Mobile number</FieldLabel>
                      <Input
                        id="mobile"
                        type="tel"
                        autoComplete="tel"
                        aria-invalid={Boolean(form.formState.errors.mobile)}
                        {...form.register("mobile")}
                      />
                      <FieldError errors={[form.formState.errors.mobile]} />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="dateOfBirth">
                        Date of birth{" "}
                        <span className="font-normal text-muted-foreground">
                          (optional)
                        </span>
                      </FieldLabel>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        max={minDate}
                        {...form.register("dateOfBirth")}
                      />
                      <FieldDescription>
                        Used only for age and guardian requirements.
                      </FieldDescription>
                    </Field>
                  </div>

                  {guardianRequired ? (
                    <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900 dark:bg-amber-950/40">
                      <div>
                        <p className="text-sm font-medium">Parent or guardian</p>
                        <p className="text-xs text-muted-foreground">
                          Required because the patient will be under 18 on the
                          appointment date.
                        </p>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <Field data-invalid={Boolean(form.formState.errors.guardianName)}>
                          <FieldLabel htmlFor="guardianName">Guardian name</FieldLabel>
                          <Input
                            id="guardianName"
                            autoComplete="name"
                            aria-invalid={Boolean(form.formState.errors.guardianName)}
                            {...form.register("guardianName")}
                          />
                          <FieldError errors={[form.formState.errors.guardianName]} />
                        </Field>
                        <Field data-invalid={Boolean(form.formState.errors.guardianRelationship)}>
                          <FieldLabel htmlFor="guardianRelationship">
                            Relationship
                          </FieldLabel>
                          <Input
                            id="guardianRelationship"
                            placeholder="Parent, guardian"
                            aria-invalid={Boolean(form.formState.errors.guardianRelationship)}
                            {...form.register("guardianRelationship")}
                          />
                          <FieldError errors={[form.formState.errors.guardianRelationship]} />
                        </Field>
                        <Field data-invalid={Boolean(form.formState.errors.guardianContact)}>
                          <FieldLabel htmlFor="guardianContact">
                            Guardian contact
                          </FieldLabel>
                          <Input
                            id="guardianContact"
                            type="tel"
                            aria-invalid={Boolean(form.formState.errors.guardianContact)}
                            {...form.register("guardianContact")}
                          />
                          <FieldError errors={[form.formState.errors.guardianContact]} />
                        </Field>
                      </div>
                    </div>
                  ) : null}

                  <Field data-invalid={Boolean(form.formState.errors.note)}>
                    <FieldLabel htmlFor="note">
                      Booking note{" "}
                      <span className="font-normal text-muted-foreground">
                        (optional)
                      </span>
                    </FieldLabel>
                    <Textarea
                      id="note"
                      rows={3}
                      placeholder="Operational context only, such as a preferred language."
                      aria-invalid={Boolean(form.formState.errors.note)}
                      {...form.register("note")}
                    />
                    <FieldDescription>
                      Do not enter diagnoses, prescriptions, or sensitive
                      clinical details in this field.
                    </FieldDescription>
                    <FieldError errors={[form.formState.errors.note]} />
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={goBack}>
              <ArrowLeft className="size-4" /> Back
            </Button>
            <Button type="submit" form="booking-details-form">
              Review request <ArrowRight className="size-4" />
            </Button>
          </div>
        </section>
      ) : null}

      {step === 5 ? (
        <section className="space-y-4" aria-labelledby="review-request">
          <div>
            <h2 id="review-request" className="text-lg font-semibold">
              Review your request
            </h2>
            <p className="text-sm text-muted-foreground">
              Check the details before sending. Nothing is booked until the
              clinic approves it.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Appointment request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <Detail label="Service" value={selectedService?.name} />
                <Detail
                  label="Fee"
                  value={formatCurrency(selectedService?.fee)}
                />
                <Detail label="Date" value={formatDate(date)} />
                <Detail
                  label="Preferred time"
                  value={selectedSlot?.label ?? formatTime(selectedSlot?.startAt)}
                />
                <Detail
                  label="Duration"
                  value={`${selectedService?.durationMinutes ?? "—"} minutes`}
                />
                <Detail
                  label="Booking as"
                  value={user?.role.toUpperCase() === "PATIENT" ? "Registered patient" : "Guest"}
                />
              </div>

              <div className="border-t pt-3">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Patient
                </p>
                <p className="mt-1 font-medium">{form.getValues("fullName")}</p>
                <p className="text-muted-foreground">
                  {form.getValues("email")} · {form.getValues("mobile")}
                </p>
                {guardianRequired ? (
                  <p className="mt-2 text-muted-foreground">
                    Guardian: {form.getValues("guardianName")} (
                    {form.getValues("guardianRelationship")}) ·{" "}
                    {form.getValues("guardianContact")}
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
            <p className="flex items-start gap-2">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              Appointment request only — your schedule is confirmed after clinic
              approval. The clinic may offer a different time if the requested
              slot cannot be staffed.
            </p>
          </div>

          {submitError ? (
            <div
              role="alert"
              className={cn(
                "rounded-lg border px-4 py-3 text-sm",
                conflict
                  ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
                  : "border-destructive/30 bg-destructive/5 text-destructive",
              )}
            >
              <p className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>
                  {submitError}
                  {conflict
                    ? " Your request was not submitted. Please choose another time."
                    : ""}
                </span>
              </p>
              {conflict ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => setStep(3)}
                >
                  Choose another time
                </Button>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={submitting}
            >
              <ArrowLeft className="size-4" /> Back
            </Button>
            <Button type="button" onClick={submit} disabled={submitting}>
              {submitting ? "Sending request…" : "Send appointment request"}
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-medium">{value ?? "—"}</p>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Clock,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { publicService } from "@/services/public.service";
import { patientService } from "@/services/patient.service";
import { getApiError, isConflictError } from "@/lib/api-error";
import { readList } from "@/lib/api-shape";
import { formatCurrency, formatDate, formatTime, todayInClinic } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import type { AvailabilitySlot, Service } from "@/services/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import { getServicePhoto } from "@/lib/clinic-media";
import { CLINICAL_SERVICES } from "@/components/public/services-directory";

const STEPS = [
  { id: 1, label: "Choose Service" },
  { id: 2, label: "Date & Time" },
  { id: 3, label: "Review & Confirm" },
] as const;

// Unified appointment booking component.
export function BookingFlow({ initialServiceId }: { initialServiceId?: string }) {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const [date, setDate] = useState(() => todayInClinic());
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);

  const [note, setNote] = useState("");
  const [patientMobile, setPatientMobile] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [result, setResult] = useState<{ reference?: string; id?: string } | null>(null);

  const minDate = todayInClinic();
  const maxDate = useMemo(() => {
    const next = new Date();
    next.setDate(next.getDate() + 90);
    return next.toISOString().slice(0, 10);
  }, []);

  // Fetch active clinic services.
  const loadServices = () => {
    setLoadingServices(true);
    setServicesError(null);
    publicService
      .getServices()
      .then((response) => {
        const list = readList<Service>(response.data, "services");
        const available = list.length > 0 ? list : CLINICAL_SERVICES;
        setServices(available);
        if (initialServiceId) {
          const match = available.find(
            (item) => item.id === initialServiceId || item.slug === initialServiceId,
          );
          if (match) {
            setSelectedService(match);
            setStep(2);
          }
        }
      })
      .catch((error) => {
        setServices(CLINICAL_SERVICES);
        if (initialServiceId) {
          const match = CLINICAL_SERVICES.find(
            (item) => item.id === initialServiceId || item.slug === initialServiceId,
          );
          if (match) {
            setSelectedService(match);
            setStep(2);
          }
        } else {
          setServicesError(getApiError(error, "Services could not be loaded."));
        }
      })
      .finally(() => setLoadingServices(false));
  };

  useEffect(() => {
    loadServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pre-fill patient contact number.
  useEffect(() => {
    if (!user) return;
    patientService
      .getProfile()
      .then((response) => {
        if (response.data?.mobile) {
          setPatientMobile(response.data.mobile);
        }
      })
      .catch(() => {});
  }, [user]);

  // Fetch available time slots.
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
        setSlotsError(getApiError(error, "Available times could not be loaded for this date."));
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedService, date]);

  // Submit patient appointment request.
  const submit = async () => {
    if (!selectedService || !selectedSlot) return;

    setSubmitting(true);
    setSubmitError(null);
    setConflict(false);

    try {
      const response = await patientService.requestAppointment({
        serviceId: selectedService.id,
        startAt: selectedSlot.startAt,
        note: note.trim() || undefined,
      });

      setResult({
        reference: response.data?.reference,
        id: response.data?.id,
      });
      setStep(4);
      toast.success("Appointment request submitted successfully!");
    } catch (error) {
      setSubmitError(getApiError(error, "The request could not be submitted."));
      setConflict(isConflictError(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingServices) {
    return <LoadingState title="Loading clinical service catalog…" />;
  }

  if (servicesError) {
    return (
      <Card className="rounded-2xl border-destructive/30 bg-destructive/5 p-6">
        <div role="alert" className="flex items-start gap-3 text-destructive">
          <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div className="space-y-2">
            <p className="font-semibold">{servicesError}</p>
            <p className="text-sm text-muted-foreground">
              Please retry or contact our clinic front desk directly.
            </p>
            <Button type="button" variant="outline" size="sm" onClick={loadServices} className="mt-2">
              <RefreshCw className="size-4 mr-2" /> Try again
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Render booking confirmation view.
  if (step === 4 && result) {
    return (
      <Card className="mx-auto max-w-2xl rounded-2xl border-border/80 shadow-md">
        <CardContent className="space-y-6 px-6 py-10 sm:px-10">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
            <CheckCircle2 className="size-8" aria-hidden="true" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Appointment Request Submitted
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
              Your request has been routed to our clinic team. You will receive an immediate notification once reviewed and assigned.
            </p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-secondary/30 p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Booking Reference
              </span>
              <span className="font-mono text-base font-bold text-foreground">
                {result.reference ?? result.id ?? "Registered"}
              </span>
            </div>

            <div className="grid gap-2 text-sm text-muted-foreground pt-1">
              <div className="flex items-center justify-between">
                <span>Selected Service</span>
                <span className="font-semibold text-foreground">{selectedService?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Scheduled Date</span>
                <span className="font-semibold text-foreground">{formatDate(date)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Time Slot</span>
                <span className="font-semibold text-foreground">
                  {selectedSlot?.label ?? formatTime(selectedSlot?.startAt)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Location</span>
                <span className="text-foreground">OptiCo Clinic · Makati City</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild size="lg" className="rounded-xl shadow-xs cursor-pointer">
              <Link href="/patient/appointments">View In My Appointments</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-xl cursor-pointer">
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Booking steps progress bar. */}
      <nav aria-label="Booking steps" className="border-b border-border/70 pb-6">
        <ol className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm">
          {STEPS.map((s, idx) => {
            const isCurrent = step === s.id;
            const isDone = step > s.id;
            return (
              <li key={s.id} className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex items-center gap-2.5 transition-colors",
                    isCurrent && "font-semibold text-foreground",
                    isDone && "text-muted-foreground hover:text-foreground cursor-pointer",
                    !isCurrent && !isDone && "text-muted-foreground/50",
                  )}
                  onClick={() => {
                    if (isDone) setStep(s.id as 1 | 2 | 3);
                  }}
                >
                  <span
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full text-xs font-bold transition-all",
                      isCurrent && "bg-primary text-primary-foreground shadow-xs ring-2 ring-primary/20",
                      isDone && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold",
                      !isCurrent && !isDone && "bg-muted text-muted-foreground/60",
                    )}
                  >
                    {isDone ? "✓" : s.id}
                  </span>
                  <span className="text-sm">{s.label}</span>
                </div>
                {idx < STEPS.length - 1 ? (
                  <span className="text-muted-foreground/30 font-light hidden sm:inline">/</span>
                ) : null}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Step one service selection. */}
      {step === 1 ? (
        <section className="space-y-6" aria-labelledby="choose-service">
          <div>
            <h2 id="choose-service" className="text-2xl font-bold tracking-tight text-foreground">
              Choose a Service
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Select the examination or optical consultation that fits your vision needs.
            </p>
          </div>

          {services.length === 0 ? (
            <EmptyState
              title="No services published"
              description="The clinic does not currently have active services open for online booking."
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {services.map((service) => {
                const selected = selectedService?.id === service.id;
                const photo = getServicePhoto(service.name);
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
                      "group overflow-hidden rounded-2xl border border-border/80 bg-card text-left transition-all hover:border-primary/50 hover:shadow-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring cursor-pointer flex flex-col justify-between",
                      selected && "border-primary ring-2 ring-primary/40 shadow-md",
                    )}
                  >
                    <div>
                      {/* Image Preview with Fee Pill */}
                      <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
                        <img
                          src={photo}
                          alt={service.name}
                          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute top-3 right-3 rounded-full bg-background/90 px-3 py-1 text-sm font-bold text-foreground backdrop-blur-md shadow-xs ring-1 ring-border/50">
                          {formatCurrency(service.fee)}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 space-y-2">
                        <h3 className="text-lg font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
                          {service.name}
                        </h3>
                        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                          {service.description ?? "Comprehensive optometrist consultation and ocular health assessment."}
                        </p>
                      </div>
                    </div>

                    <div className="px-5 pb-5 pt-1 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                        <Clock className="size-3.5" aria-hidden="true" />
                        {service.durationMinutes ? `${service.durationMinutes} min consultation` : "Standard duration"}
                      </span>
                      <span className="font-medium text-primary group-hover:translate-x-0.5 transition-transform">
                        Select →
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      {/* Step two schedule selection. */}
      {step === 2 ? (
        <section className="space-y-6" aria-labelledby="choose-datetime">
          {/* Active Service Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-secondary/30 p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="size-5" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Selected Service</span>
                <p className="text-base font-bold text-foreground">{selectedService?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">
                {selectedService?.durationMinutes} min · {formatCurrency(selectedService?.fee)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStep(1)}
                className="text-xs font-semibold text-primary hover:bg-primary/10 cursor-pointer"
              >
                Change
              </Button>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-12">
            {/* Left Column: Date Selector */}
            <div className="lg:col-span-5 space-y-4">
              <div>
                <h2 id="choose-datetime" className="text-xl font-bold tracking-tight text-foreground">
                  Select Consultation Date
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Clinic hours are set according to our optometrist schedule.
                </p>
              </div>

              <Card className="rounded-2xl border-border/80 shadow-xs">
                <CardContent className="p-5 space-y-4">
                  <Field>
                    <FieldLabel htmlFor="booking-date" className="text-sm font-medium">Preferred Date</FieldLabel>
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
                      className="h-11 text-base font-medium"
                    />
                    <FieldDescription className="text-xs">
                      {formatDate(date)}
                    </FieldDescription>
                  </Field>

                  <div className="flex items-center gap-2 pt-2 border-t border-border/60 text-xs text-muted-foreground">
                    <MapPin className="size-3.5 text-primary shrink-0" />
                    <span>OptiCo Clinic · Level 2 Medical Arts, Makati City</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Time Slots */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-foreground">
                  Available Consultation Times
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Select a slot for {formatDate(date)}.
                </p>
              </div>

              {loadingSlots ? (
                <div className="rounded-2xl border border-border/80 bg-card p-12 text-center">
                  <LoadingState title="Checking real-time optometrist availability…" />
                </div>
              ) : slotsError ? (
                <div role="alert" className="space-y-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm">
                  <p className="flex items-start gap-2 text-destructive">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    {slotsError}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setDate((curr) => `${curr}`)}
                    className="cursor-pointer"
                  >
                    <RefreshCw className="size-4 mr-1.5" /> Retry
                  </Button>
                </div>
              ) : slots.length === 0 ? (
                <Card className="rounded-2xl border-border/80 p-8 text-center">
                  <EmptyState
                    title="No open slots for this date"
                    description="All slots are fully booked or the clinic is closed on this day. Please choose another date."
                    icon={CalendarCheck}
                  />
                </Card>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {slots.map((slot) => {
                    const selected = selectedSlot?.startAt === slot.startAt;
                    return (
                      <button
                        key={slot.startAt}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        aria-pressed={selected}
                        className={cn(
                          "flex flex-col items-center justify-center rounded-xl border p-3.5 text-center transition-all cursor-pointer select-none",
                          selected
                            ? "border-primary bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30 font-bold"
                            : "border-border/80 bg-card hover:border-primary/40 hover:bg-secondary/40 text-foreground font-medium",
                        )}
                      >
                        <span className="text-sm">
                          {slot.label || formatTime(slot.startAt)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Stepper Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setStep(1)}
              className="rounded-xl cursor-pointer"
            >
              <ArrowLeft className="size-4 mr-2" /> Back
            </Button>
            <Button
              type="button"
              size="lg"
              disabled={!selectedSlot}
              onClick={() => setStep(3)}
              className="rounded-xl shadow-xs cursor-pointer"
            >
              Review Request <ArrowRight className="size-4 ml-2" />
            </Button>
          </div>
        </section>
      ) : null}

      {/* Step three request review. */}
      {step === 3 ? (
        <section className="space-y-6" aria-labelledby="review-request">
          <div>
            <h2 id="review-request" className="text-2xl font-bold tracking-tight text-foreground">
              Review & Confirm Consultation
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Verify your appointment details before submitting your request.
            </p>
          </div>

          {submitError ? (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-semibold">{submitError}</p>
                {conflict ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Another patient just reserved this slot. Please choose another available time.
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-12">
            {/* Patient verification summary card. */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="rounded-2xl border-border/80 shadow-xs">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Patient Account
                    </span>
                    <Badge variant="secondary" className="gap-1 text-xs font-medium">
                      <ShieldCheck className="size-3.5 text-emerald-600" />
                      Verified Patient
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground block">Full Name</span>
                      <span className="font-semibold text-base text-foreground block">
                        {user?.name ?? "Verified Patient"}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Email Address</span>
                      <span className="font-medium text-foreground block">{user?.email}</span>
                    </div>
                    {patientMobile ? (
                      <div>
                        <span className="text-xs text-muted-foreground block">Contact Mobile</span>
                        <span className="font-medium text-foreground block">{patientMobile}</span>
                      </div>
                    ) : null}
                  </div>

                  <p className="text-xs text-muted-foreground pt-2 border-t border-border/60">
                    Appointments are permanently saved to your patient portal history.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Consultation summary notes card. */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="rounded-2xl border-border/80 shadow-xs">
                <CardContent className="p-6 space-y-5">
                  <div className="space-y-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                      Consultation Details
                    </span>

                    <div className="grid gap-3 sm:grid-cols-2 text-sm bg-secondary/30 p-4 rounded-xl border border-border/60">
                      <div>
                        <span className="text-xs text-muted-foreground block">Service</span>
                        <span className="font-bold text-foreground block">{selectedService?.name}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Consultation Fee</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                          {formatCurrency(selectedService?.fee)}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Date</span>
                        <span className="font-medium text-foreground block">{formatDate(date)}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Time Slot</span>
                        <span className="font-medium text-foreground block">
                          {selectedSlot?.label ?? formatTime(selectedSlot?.startAt)} ({selectedService?.durationMinutes} min)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Optional clinical visit note. */}
                  <Field>
                    <FieldLabel htmlFor="booking-note" className="text-sm font-medium">
                      Consultation Notes <span className="font-normal text-muted-foreground">(Optional)</span>
                    </FieldLabel>
                    <Textarea
                      id="booking-note"
                      rows={3}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="e.g. Existing contact lens wearer, dry eye symptoms, or specific vision concerns…"
                      className="text-sm"
                    />
                    <FieldDescription className="text-xs">
                      Provide any non-emergency context to prepare our optometrist before arrival.
                    </FieldDescription>
                  </Field>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Stepper Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setStep(2)}
              className="rounded-xl cursor-pointer"
            >
              <ArrowLeft className="size-4 mr-2" /> Back
            </Button>
            <Button
              type="button"
              size="lg"
              disabled={submitting}
              onClick={submit}
              className="rounded-xl shadow-xs cursor-pointer min-w-44"
            >
              {submitting ? "Submitting Request…" : "Confirm Appointment Request"}
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

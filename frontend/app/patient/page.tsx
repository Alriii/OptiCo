"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, CalendarCheck, CalendarPlus, Clock3, RefreshCw } from "lucide-react";
import { patientService } from "@/services/patient.service";
import { getApiError } from "@/lib/api-error";
import { readList } from "@/lib/api-shape";
import { useAuth } from "@/context/AuthContext";
import type { Appointment } from "@/services/types";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { AppointmentCard } from "@/components/portal/appointment-card";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { usePageMeta } from "@/lib/use-page-meta";

const ACTIVE = new Set(["PENDING", "CONFIRMED", "CHECKED_IN", "IN_PROGRESS"]);

function sortTime(appointment: Appointment) {
  const value = appointment.startsAt ?? appointment.requestedStartAt;
  return value ? new Date(value).getTime() : 0;
}

export default function PatientDashboardPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  usePageMeta({
    title: "Patient Overview",
    description: "OptiCo patient portal overview, appointment status, and visit records.",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await patientService.getAppointments();
      setAppointments(readList<Appointment>(response.data, "appointments", "rows"));
    } catch (err) {
      setError(getApiError(err, "Your appointments could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const { upcoming, pending, completed } = useMemo(() => {
    const active = appointments
      .filter((item) => ACTIVE.has(item.status.toUpperCase()))
      .sort((a, b) => sortTime(a) - sortTime(b));

    return {
      upcoming: active,
      pending: active.filter((item) => item.status.toUpperCase() === "PENDING").length,
      completed: appointments.filter(
        (item) => item.status.toUpperCase() === "COMPLETED",
      ).length,
    };
  }, [appointments]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title={`Hello${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`}
        description="Your requests, confirmed visits, and appointment references in one place."
        actions={
          <Button asChild>
            <Link href="/booking">
              <CalendarPlus className="size-4" /> Request appointment
            </Link>
          </Button>
        }
      />

      {/* Dr. Octo Care Pill Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/10 via-background to-secondary/30 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col-reverse sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
              ✦ Dr. Octo Vision Health Tip
            </span>
            <h3 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
              Practicing the 20-20-20 Screen Rule
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
              Every 20 minutes spent staring at screens, look at an object 20 feet away for at least 20 seconds. This relaxes eye accommodation muscles and prevents digital strain before your next checkup.
            </p>
          </div>
          <div className="shrink-0">
            <img
              src="/mascot.jpg"
              alt="Dr. Octo"
              className="size-16 sm:size-20 rounded-2xl object-cover ring-4 ring-primary/20 shadow-md"
            />
          </div>
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
          <Button type="button" size="sm" variant="outline" onClick={load}>
            <RefreshCw className="size-4" /> Retry
          </Button>
        </div>
      ) : null}

      {loading ? (
        <LoadingState title="Loading your appointments" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Upcoming and active"
              value={upcoming.length}
              icon={CalendarCheck}
              hint="Pending requests and confirmed visits"
            />
            <StatCard
              label="Awaiting approval"
              value={pending}
              icon={Clock3}
              hint="Not yet a confirmed schedule"
            />
            <StatCard
              label="Completed"
              value={completed}
              icon={CalendarCheck}
              hint="Past visits on record"
            />
          </div>

          <section className="space-y-3" aria-labelledby="upcoming-list">
            <div className="flex items-center justify-between gap-3">
              <h2 id="upcoming-list" className="text-lg font-semibold">
                Next up
              </h2>
              <Button asChild variant="ghost" size="sm">
                <Link href="/patient/appointments">View all</Link>
              </Button>
            </div>

            {upcoming.length === 0 ? (
              <EmptyState
                icon={CalendarCheck}
                title="No upcoming appointments"
                description="You don't have any pending requests or scheduled visits. Use the Request appointment button above to book your next consultation."
              />
            ) : (
              <div className="grid gap-3">
                {upcoming.slice(0, 3).map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await patientService.getAppointments();
      setAppointments(readList<Appointment>(response.data, "appointments"));
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
        eyebrow="Patient portal"
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
                description="Send a request and the clinic will review it. A pending request does not reserve a slot."
                action={
                  <Button asChild>
                    <Link href="/booking">Request an appointment</Link>
                  </Button>
                }
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

          <section className="rounded-xl border bg-secondary/40 px-4 py-4 text-sm text-muted-foreground">
            <p>
              <strong className="font-medium text-foreground">Reminder:</strong>{" "}
              online booking is a request. The clinic confirms the schedule
              after assigning an available doctor.
            </p>
          </section>
        </>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, CalendarPlus, RefreshCw } from "lucide-react";
import { patientService } from "@/services/patient.service";
import { getApiError } from "@/lib/api-error";
import { readList } from "@/lib/api-shape";
import type { Appointment } from "@/services/types";
import { PageHeader } from "@/components/shared/page-header";
import { AppointmentCard } from "@/components/portal/appointment-card";
import { PatientAppointmentActions } from "@/components/portal/patient-appointment-actions";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { usePageMeta } from "@/lib/use-page-meta";

const ACTIVE = new Set(["PENDING", "CONFIRMED", "CHECKED_IN", "IN_PROGRESS"]);

function sortTime(appointment: Appointment) {
  const value = appointment.startsAt ?? appointment.requestedStartAt;
  return value ? new Date(value).getTime() : 0;
}

export default function PatientAppointmentsPage() {
  usePageMeta({
    title: "My Appointments",
    description: "View and manage your OptiCo optical consultations and bookings.",
  });

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

  const { active, history } = useMemo(() => {
    const sorted = [...appointments].sort((a, b) => sortTime(a) - sortTime(b));
    return {
      active: sorted.filter((item) => ACTIVE.has(item.status.toUpperCase())),
      history: sorted
        .filter((item) => !ACTIVE.has(item.status.toUpperCase()))
        .reverse(),
    };
  }, [appointments]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Records"
        title="Your appointment record"
        description="Pending requests, confirmed visits, and past appointments. Cancellation and rescheduling are requests until clinic staff confirm them."
        actions={
          <Button asChild>
            <Link href="/booking">
              <CalendarPlus className="size-4" /> New request
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
        <LoadingState title="Loading appointments" />
      ) : appointments.length === 0 ? (
        <EmptyState
          title="No appointments yet"
          description="You don't have any recorded appointments yet. Use the New request button above to book your visit."
        />
      ) : (
        <>
          <section className="space-y-3" aria-labelledby="active-appointments">
            <h2 id="active-appointments" className="text-lg font-semibold">
              Active ({active.length})
            </h2>
            {active.length === 0 ? (
              <EmptyState
                title="No active appointments"
                description="Past or cancelled appointments are listed below."
              />
            ) : (
              <div className="grid gap-3">
                {active.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    actions={
                      <PatientAppointmentActions
                        appointment={appointment}
                        onChanged={load}
                      />
                    }
                  />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3" aria-labelledby="appointment-history">
            <h2 id="appointment-history" className="text-lg font-semibold">
              History ({history.length})
            </h2>
            {history.length === 0 ? (
              <EmptyState
                title="No past appointments"
                description="Completed, cancelled, rejected, and no-show visits will appear here."
              />
            ) : (
              <div className="grid gap-3">
                {history.map((appointment) => (
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

"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CalendarCheck, CheckCircle2, Clock3, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { doctorService } from "@/services/doctor.service";
import { getApiError } from "@/lib/api-error";
import { readList } from "@/lib/api-shape";
import { formatDate, todayInClinic } from "@/lib/format";
import type { Appointment } from "@/services/types";
import { AppointmentCard } from "@/components/portal/appointment-card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";

interface DoctorScheduleProps {
  initialDate?: string;
  allowDateChange?: boolean;
}

export function DoctorSchedule({
  initialDate,
  allowDateChange = false,
}: DoctorScheduleProps) {
  const [date, setDate] = useState(initialDate ?? todayInClinic());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await doctorService.getSchedule(date);
      setAppointments(readList<Appointment>(response.data, "appointments", "rows"));
    } catch (err) {
      setError(getApiError(err, "The schedule could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  const changeStatus = async (appointment: Appointment, status: string) => {
    try {
      await doctorService.updateStatus(appointment.id, status);
      toast.success("Appointment updated.");
      await load();
    } catch (err) {
      toast.error(getApiError(err, "The status change failed."));
      throw err;
    }
  };

  const completed = appointments.filter(
    (item) => item.status.toUpperCase() === "COMPLETED",
  ).length;
  const active = appointments.filter((item) =>
    ["CONFIRMED", "CHECKED_IN", "IN_PROGRESS"].includes(item.status.toUpperCase()),
  ).length;

  return (
    <div className="space-y-5">
      {allowDateChange ? (
        <Field className="max-w-xs">
          <FieldLabel htmlFor="schedule-date">Schedule date</FieldLabel>
          <Input
            id="schedule-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </Field>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Assigned"
          value={appointments.length}
          icon={CalendarCheck}
          hint={formatDate(date)}
        />
        <StatCard
          label="Active"
          value={active}
          icon={Clock3}
          hint="Confirmed, checked in, or in progress"
        />
        <StatCard
          label="Completed"
          value={completed}
          icon={CheckCircle2}
          hint="Recorded for this date"
        />
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
        <LoadingState title="Loading your schedule" />
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No assigned appointments"
          description="Approved appointments for this date will appear here. Pending requests are not assigned to a doctor."
        />
      ) : (
        <div className="grid gap-3">
          {appointments.map((appointment) => {
            const status = appointment.status.toUpperCase();
            return (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                showPatient
                actions={
                  <>
                    {status === "CONFIRMED" ? (
                      <>
                        <ConfirmDialog
                          trigger={
                            <Button type="button" size="sm">
                              Check in
                            </Button>
                          }
                          title="Check this patient in?"
                          description="Confirm the patient has arrived. This updates the operational status."
                          confirmLabel="Check in"
                          onConfirm={() => changeStatus(appointment, "CHECKED_IN")}
                        />
                        <ConfirmDialog
                          trigger={
                            <Button type="button" size="sm" variant="outline">
                              No show
                            </Button>
                          }
                          title="Mark as no show?"
                          description="Use this only when the patient does not arrive. The clinic keeps an audit record."
                          confirmLabel="Mark no show"
                          destructive
                          onConfirm={() => changeStatus(appointment, "NO_SHOW")}
                        />
                      </>
                    ) : null}

                    {status === "CHECKED_IN" ? (
                      <>
                        <ConfirmDialog
                          trigger={
                            <Button type="button" size="sm">
                              Start visit
                            </Button>
                          }
                          title="Start the visit?"
                          description="The appointment moves to in progress."
                          confirmLabel="Start"
                          onConfirm={() => changeStatus(appointment, "IN_PROGRESS")}
                        />
                        <ConfirmDialog
                          trigger={
                            <Button type="button" size="sm" variant="outline">
                              No show
                            </Button>
                          }
                          title="Mark as no show?"
                          description="Use this only when the patient does not arrive after check-in."
                          confirmLabel="Mark no show"
                          destructive
                          onConfirm={() => changeStatus(appointment, "NO_SHOW")}
                        />
                      </>
                    ) : null}

                    {status === "IN_PROGRESS" ? (
                      <ConfirmDialog
                        trigger={
                          <Button type="button" size="sm">
                            Complete visit
                          </Button>
                        }
                        title="Complete the visit?"
                        description="This closes the appointment. The scheduling record stays available to staff."
                        confirmLabel="Complete"
                        onConfirm={() => changeStatus(appointment, "COMPLETED")}
                      />
                    ) : null}
                  </>
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

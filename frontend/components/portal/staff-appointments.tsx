"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { staffService } from "@/services/staff.service";
import { getApiError } from "@/lib/api-error";
import { readList, readNumber } from "@/lib/api-shape";
import { formatDate, formatDateTime } from "@/lib/format";
import type { Appointment } from "@/services/types";
import { AppointmentCard } from "@/components/portal/appointment-card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ReasonDialog } from "@/components/shared/reason-dialog";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS = [
  "PENDING",
  "CONFIRMED",
  "CHECKED_IN",
  "IN_PROGRESS",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
  "NO_SHOW",
];

interface StaffAppointmentsProps {
  fixedStatus?: string;
  showStatusFilter?: boolean;
  initialDate?: string;
  showDateFilter?: boolean;
}

export function StaffAppointments({
  fixedStatus,
  showStatusFilter = true,
  initialDate = "",
  showDateFilter = true,
}: StaffAppointmentsProps) {
  const [status, setStatus] = useState(fixedStatus ?? "");
  const [date, setDate] = useState(initialDate);
  const [page, setPage] = useState(1);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [total, setTotal] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await staffService.getAppointments({
        status: status || undefined,
        date: date || undefined,
        page,
      });
      setAppointments(readList<Appointment>(response.data, "appointments", "rows"));
      setTotal(
        readNumber(response.data, "total") ??
          readNumber(response.data, "count"),
      );
    } catch (err) {
      setError(getApiError(err, "Appointments could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, [status, date, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = async (
    action: () => Promise<unknown>,
    success: string,
  ) => {
    try {
      await action();
      toast.success(success);
      await load();
    } catch (err) {
      toast.error(getApiError(err, "The action could not be completed."));
      throw err;
    }
  };

  const approve = (appointment: Appointment) =>
    runAction(
      () => staffService.approve(appointment.id),
      "Appointment approved and assigned.",
    );

  const reject = (appointment: Appointment, reason: string) =>
    runAction(
      () => staffService.reject(appointment.id, reason),
      "Appointment request rejected.",
    );

  const cancel = (appointment: Appointment, reason: string) =>
    runAction(
      () => staffService.cancel(appointment.id, reason),
      "Appointment cancelled.",
    );

  const checkIn = (appointment: Appointment) =>
    runAction(
      () => staffService.checkIn(appointment.id),
      "Patient checked in.",
    );

  const complete = (appointment: Appointment) =>
    runAction(
      () => staffService.complete(appointment.id),
      "Appointment completed.",
    );

  const noShow = (appointment: Appointment) =>
    runAction(
      () => staffService.noShow(appointment.id),
      "Appointment marked as no show.",
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-end">
        {showStatusFilter && !fixedStatus ? (
          <Field className="sm:w-52">
            <FieldLabel htmlFor="staff-status">Status</FieldLabel>
            <Select
              value={status || "ALL"}
              onValueChange={(value) => {
                setStatus(value === "ALL" ? "" : value);
                setPage(1);
              }}
            >
              <SelectTrigger id="staff-status" className="w-full">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        ) : null}

        {showDateFilter ? (
          <Field className="sm:w-52">
            <FieldLabel htmlFor="staff-date">Clinic date</FieldLabel>
            <Input
              id="staff-date"
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                setPage(1);
              }}
            />
          </Field>
        ) : null}

        <div className="flex gap-2 sm:ml-auto">
          <Button type="button" variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className="size-4" /> Refresh
          </Button>
          {date ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setDate("");
                setPage(1);
              }}
            >
              Clear date
            </Button>
          ) : null}
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      ) : null}

      {loading ? (
        <LoadingState title="Loading appointments" />
      ) : appointments.length === 0 ? (
        <EmptyState
          title="No appointments match"
          description={
            date
              ? `Nothing scheduled for ${formatDate(date)} with the current filters.`
              : "No appointments match the current filters."
          }
        />
      ) : (
        <div className="grid gap-3">
          {appointments.map((appointment) => {
            const appointmentStatus = appointment.status.toUpperCase();
            const when = appointment.startsAt ?? appointment.requestedStartAt;

            return (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                showPatient
                actions={
                  <>
                    {appointmentStatus === "PENDING" ? (
                      <>
                        <ConfirmDialog
                          trigger={
                            <Button type="button" size="sm">
                              Approve
                            </Button>
                          }
                          title="Approve this appointment request?"
                          description={`${appointment.serviceName ?? appointment.service?.name ?? "Service"} · ${formatDateTime(when)} · ${appointment.patientName ?? "Patient"}. The backend rechecks the slot and assigns a doctor atomically.`}
                          confirmLabel="Approve and assign"
                          onConfirm={() => approve(appointment)}
                        />
                        <ReasonDialog
                          trigger={
                            <Button type="button" size="sm" variant="outline">
                              Reject
                            </Button>
                          }
                          title="Reject this request?"
                          description="The patient is told the request was not approved. Use a short operational reason."
                          label="Rejection reason"
                          confirmLabel="Reject request"
                          destructive
                          required
                          onSubmit={(reason) => reject(appointment, reason)}
                        />
                      </>
                    ) : null}

                    {appointmentStatus === "CONFIRMED" ? (
                      <>
                        <ConfirmDialog
                          trigger={
                            <Button type="button" size="sm">
                              Check in
                            </Button>
                          }
                          title="Check the patient in?"
                          description="Confirm the patient has arrived for this appointment."
                          confirmLabel="Check in"
                          onConfirm={() => checkIn(appointment)}
                        />
                        <ConfirmDialog
                          trigger={
                            <Button type="button" size="sm" variant="outline">
                              No show
                            </Button>
                          }
                          title="Mark as no show?"
                          description="This closes the appointment as a no-show. Use only after the patient fails to arrive."
                          confirmLabel="Mark no show"
                          destructive
                          onConfirm={() => noShow(appointment)}
                        />
                      </>
                    ) : null}

                    {appointmentStatus === "CHECKED_IN" ? (
                      <>
                        <ConfirmDialog
                          trigger={
                            <Button type="button" size="sm">
                              Complete
                            </Button>
                          }
                          title="Complete this appointment?"
                          description="This closes the visit and keeps the scheduling record for reports."
                          confirmLabel="Complete"
                          onConfirm={() => complete(appointment)}
                        />
                        <ConfirmDialog
                          trigger={
                            <Button type="button" size="sm" variant="outline">
                              No show
                            </Button>
                          }
                          title="Mark as no show?"
                          description="Use only if the checked-in patient leaves without being seen."
                          confirmLabel="Mark no show"
                          destructive
                          onConfirm={() => noShow(appointment)}
                        />
                      </>
                    ) : null}

                    {appointmentStatus === "IN_PROGRESS" ? (
                      <ConfirmDialog
                        trigger={
                          <Button type="button" size="sm">
                            Complete
                          </Button>
                        }
                        title="Complete this appointment?"
                        description="This closes the visit and keeps the scheduling record for reports."
                        confirmLabel="Complete"
                        onConfirm={() => complete(appointment)}
                      />
                    ) : null}

                    {["PENDING", "CONFIRMED", "CHECKED_IN"].includes(
                      appointmentStatus,
                    ) ? (
                      <ReasonDialog
                        trigger={
                          <Button type="button" size="sm" variant="ghost">
                            Cancel
                          </Button>
                        }
                        title="Cancel this appointment?"
                        description="The slot is released and the patient is notified. Record a short operational reason."
                        label="Cancellation reason"
                        confirmLabel="Cancel appointment"
                        destructive
                        required
                        onSubmit={(reason) => cancel(appointment, reason)}
                      />
                    ) : null}
                  </>
                }
              />
            );
          })}
        </div>
      )}

      {total !== undefined && total > appointments.length ? (
        <div className="flex items-center justify-between gap-3 text-sm">
          <p className="text-muted-foreground">
            Page {page} · {appointments.length} of {total}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={loading || page * 20 >= total}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

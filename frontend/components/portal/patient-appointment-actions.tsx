"use client";

import { useState } from "react";
import { toast } from "sonner";
import { patientService } from "@/services/patient.service";
import { getApiError } from "@/lib/api-error";
import { todayInClinic } from "@/lib/format";
import type { Appointment } from "@/services/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

interface PatientAppointmentActionsProps {
  appointment: Appointment;
  onChanged: () => Promise<void> | void;
}

// Patient appointment action controls.
export function PatientAppointmentActions({
  appointment,
  onChanged,
}: PatientAppointmentActionsProps) {
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [busy, setBusy] = useState(false);

  // Dispatch appointment cancellation request.
  const requestCancellation = async () => {
    try {
      await patientService.requestCancellation(
        appointment.id,
        "Patient requested cancellation from the portal.",
      );
      toast.success("Cancellation request sent. The clinic will confirm it.");
      await onChanged();
    } catch (error) {
      toast.error(getApiError(error, "The cancellation request failed."));
      throw error;
    }
  };

  // Dispatch appointment reschedule request.
  const requestReschedule = async () => {
    if (!date || !time) {
      toast.error("Choose a new date and time.");
      return;
    }

    const startAt = new Date(`${date}T${time}:00+08:00`);
    if (Number.isNaN(startAt.getTime())) {
      toast.error("That date and time is not valid.");
      return;
    }

    setBusy(true);
    try {
      await patientService.requestReschedule(appointment.id, {
        startAt: startAt.toISOString(),
      });
      toast.success("Reschedule request sent. The clinic will confirm it.");
      setRescheduleOpen(false);
      setDate("");
      setTime("");
      await onChanged();
    } catch (error) {
      toast.error(getApiError(error, "The reschedule request failed."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <ConfirmDialog
          trigger={
            <Button type="button" size="sm" variant="outline">
              Request cancellation
            </Button>
          }
          title="Request cancellation?"
          description="The clinic reviews cancellation requests. The appointment remains on the schedule until staff confirm it."
          confirmLabel="Send request"
          destructive
          onConfirm={requestCancellation}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setRescheduleOpen((open) => !open)}
          aria-expanded={rescheduleOpen}
        >
          {rescheduleOpen ? "Close reschedule" : "Request reschedule"}
        </Button>
      </div>

      {rescheduleOpen ? (
        <div className="rounded-lg border bg-secondary/40 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor={`date-${appointment.id}`}>New date</FieldLabel>
              <Input
                id={`date-${appointment.id}`}
                type="date"
                min={todayInClinic()}
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`time-${appointment.id}`}>New time</FieldLabel>
              <Input
                id={`time-${appointment.id}`}
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
              />
            </Field>
          </div>
          <FieldDescription className="mt-2">
            The clinic rechecks availability and may assign a different doctor.
          </FieldDescription>
          <Button
            type="button"
            size="sm"
            className="mt-3"
            onClick={requestReschedule}
            disabled={busy}
          >
            {busy ? "Sending…" : "Send reschedule request"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

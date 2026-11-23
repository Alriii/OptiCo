import { CalendarDays, Clock, MapPin, UserRound } from "lucide-react";
import type { Appointment } from "@/services/types";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AppointmentCardProps {
  appointment: Appointment;
  actions?: React.ReactNode;
  showPatient?: boolean;
  className?: string;
}

export function AppointmentCard({
  appointment,
  actions,
  showPatient = false,
  className,
}: AppointmentCardProps) {
  const serviceName =
    appointment.serviceName ?? appointment.service?.name ?? "Clinic service";
  const doctorName =
    appointment.doctorName ?? appointment.doctor?.displayName ?? null;
  const when = appointment.startsAt ?? appointment.requestedStartAt;

  return (
    <article className={cn("rounded-xl border bg-card p-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium">{serviceName}</h3>
            <StatusBadge kind="appointment" status={appointment.status} />
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            {appointment.reference ?? appointment.id}
          </p>
        </div>
        {appointment.fee !== undefined ? (
          <Badge variant="outline">{formatCurrency(appointment.fee)}</Badge>
        ) : null}
      </div>

      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <dt className="sr-only">Requested or confirmed time</dt>
            <dd>{formatDateTime(when)}</dd>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="size-4 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <dt className="sr-only">Duration</dt>
            <dd>{appointment.durationMinutes ?? "—"} minutes</dd>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <UserRound className="size-4 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <dt className="sr-only">Doctor</dt>
            <dd>{doctorName ?? "Doctor assigned after approval"}</dd>
          </div>
        </div>
        {showPatient ? (
          <div className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <dt className="sr-only">Patient</dt>
              <dd>{appointment.patientName ?? "Patient"}</dd>
            </div>
          </div>
        ) : null}
      </dl>

      {appointment.status === "PENDING" ? (
        <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-100">
          Awaiting clinic approval. This time is not reserved.
        </p>
      ) : null}

      {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
    </article>
  );
}

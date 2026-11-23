export type StatusTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger";

export interface StatusMeta {
  label: string;
  tone: StatusTone;
}

const APPOINTMENT_STATUS: Record<string, StatusMeta> = {
  PENDING: { label: "Awaiting approval", tone: "warning" },
  CONFIRMED: { label: "Confirmed", tone: "success" },
  CHECKED_IN: { label: "Checked in", tone: "info" },
  IN_PROGRESS: { label: "In progress", tone: "info" },
  COMPLETED: { label: "Completed", tone: "neutral" },
  REJECTED: { label: "Rejected", tone: "danger" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
  NO_SHOW: { label: "No show", tone: "danger" },
};

const QUEUE_STATUS: Record<string, StatusMeta> = {
  WAITING: { label: "Waiting", tone: "warning" },
  CALLED: { label: "Called", tone: "info" },
  IN_SERVICE: { label: "In service", tone: "info" },
  COMPLETED: { label: "Completed", tone: "success" },
  NO_SHOW: { label: "No show", tone: "danger" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
};

export function appointmentStatusMeta(status?: string | null): StatusMeta {
  return (
    APPOINTMENT_STATUS[status?.toUpperCase() ?? ""] ?? {
      label: status ? status.replace(/_/g, " ") : "Unknown",
      tone: "neutral",
    }
  );
}

export function queueStatusMeta(status?: string | null): StatusMeta {
  return (
    QUEUE_STATUS[status?.toUpperCase() ?? ""] ?? {
      label: status ? status.replace(/_/g, " ") : "Unknown",
      tone: "neutral",
    }
  );
}

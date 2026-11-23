import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  appointmentStatusMeta,
  queueStatusMeta,
  type StatusTone,
} from "@/lib/status";

const TONE_CLASSES: Record<StatusTone, string> = {
  neutral: "border-border bg-muted text-muted-foreground",
  info: "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  warning:
    "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
  danger:
    "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200",
};

type StatusKind = "appointment" | "queue";

interface StatusBadgeProps {
  kind: StatusKind;
  status?: string | null;
  className?: string;
}

export function StatusBadge({ kind, status, className }: StatusBadgeProps) {
  const meta =
    kind === "queue"
      ? queueStatusMeta(status)
      : appointmentStatusMeta(status);

  return (
    <Badge
      variant="outline"
      className={cn(TONE_CLASSES[meta.tone], className)}
    >
      {meta.label}
    </Badge>
  );
}

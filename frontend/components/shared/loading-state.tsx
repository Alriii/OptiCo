import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  title?: string;
  description?: string;
  fullScreen?: boolean;
  className?: string;
}

export function LoadingState({
  title = "Loading",
  description,
  fullScreen = false,
  className,
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex w-full flex-col items-center justify-center gap-3 text-center",
        fullScreen ? "min-h-[70vh]" : "py-16",
        className,
      )}
    >
      <Loader2 className="size-7 animate-spin text-primary" aria-hidden="true" />
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

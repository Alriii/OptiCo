import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: LucideIcon;
  className?: string;
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("gap-0 p-6 rounded-2xl border-border/80 shadow-xs hover:border-primary/30 transition-all", className)}>
      <CardContent className="flex items-start justify-between gap-4 p-0">
        <div className="space-y-1.5 min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{value}</p>
          {hint ? <p className="text-sm text-muted-foreground/80 leading-normal">{hint}</p> : null}
        </div>
        {Icon ? (
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
            <Icon className="size-6" aria-hidden="true" />
          </span>
        ) : null}
      </CardContent>
    </Card>
  );
}

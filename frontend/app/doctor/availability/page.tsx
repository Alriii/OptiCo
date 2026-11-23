"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Clock, RefreshCw } from "lucide-react";
import { doctorService } from "@/services/doctor.service";
import { getApiError } from "@/lib/api-error";
import { readList } from "@/lib/api-shape";
import { weekdayLabel } from "@/lib/format";
import type { DoctorAvailability } from "@/services/types";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePageMeta } from "@/lib/use-page-meta";

export default function DoctorAvailabilityPage() {
  usePageMeta({
    title: "Doctor Availability",
    description: "Manage your weekly consultation slots and clinical availability.",
  });

  const [days, setDays] = useState<DoctorAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await doctorService.getAvailability();
      setDays(readList<DoctorAvailability>(response.data, "availability", "days"));
    } catch (err) {
      setError(getApiError(err, "Your availability could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Availability"
        title="Your weekly clinic hours"
        description="These hours are set by the clinic administrator. They determine when appointments can be assigned to you."
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
        <LoadingState title="Loading availability" />
      ) : days.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No availability configured"
          description="The clinic administrator has not published weekly hours for your account yet."
        />
      ) : (
        <Card>
          <CardContent className="px-5 py-2">
            <ul className="divide-y">
              {days.map((day, index) => (
                <li
                  key={`${day.weekday}-${index}`}
                  className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-medium">{weekdayLabel(day.weekday)}</span>
                  <span className="text-sm text-muted-foreground">
                    {day.startTime} – {day.endTime}
                    {day.breakStart && day.breakEnd
                      ? ` · break ${day.breakStart} – ${day.breakEnd}`
                      : ""}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="rounded-xl border bg-secondary/40 px-4 py-4 text-sm text-muted-foreground">
        <p className="flex items-start gap-2">
          <Badge variant="outline" className="mt-0.5">
            Policy
          </Badge>
          <span>
            Time-off and schedule exceptions are managed by the clinic
            administrator in this release. Ask the administrator to record
            approved time off so availability stays accurate.
          </span>
        </p>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, Clock, Eye, RefreshCw } from "lucide-react";
import { publicService } from "@/services/public.service";
import { readList } from "@/lib/api-shape";
import { getApiError } from "@/lib/api-error";
import { formatCurrency } from "@/lib/format";
import type { Service } from "@/services/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";

const SAMPLE: Service[] = [
  {
    id: "sample-optometry",
    name: "Optometry consultation",
    description:
      "A focused conversation about your vision, comfort, and current eyewear.",
    durationMinutes: 30,
    fee: 700,
  },
  {
    id: "sample-exam",
    name: "Comprehensive eye examination",
    description:
      "A complete eye health check with time for questions and next steps.",
    durationMinutes: 45,
    fee: 1200,
  },
  {
    id: "sample-refraction",
    name: "Refraction / vision testing",
    description:
      "Measure how your eyes focus so a prescription can be prepared if needed.",
    durationMinutes: 20,
    fee: 500,
  },
  {
    id: "sample-followup",
    name: "Follow-up consultation",
    description: "A short review after a previous visit or eyewear change.",
    durationMinutes: 15,
    fee: 400,
  },
  {
    id: "sample-eyewear",
    name: "Eyewear consultation",
    description:
      "Talk through frame fit, lens options, and comfort with clinic staff.",
    durationMinutes: 30,
    fee: 600,
  },
];

export function ServicesDirectory() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sample, setSample] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    publicService
      .getServices()
      .then((response) => {
        const list = readList<Service>(response.data, "services");
        if (list.length > 0) {
          setServices(list);
          setSample(false);
        } else {
          setServices(SAMPLE);
          setSample(true);
        }
      })
      .catch((err) => {
        setServices(SAMPLE);
        setSample(true);
        setError(getApiError(err, "Services could not be loaded right now."));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    publicService
      .getServices()
      .then((response) => {
        if (!active) return;
        const list = readList<Service>(response.data, "services");
        if (list.length > 0) {
          setServices(list);
          setSample(false);
        } else {
          setServices(SAMPLE);
          setSample(true);
        }
      })
      .catch((err) => {
        if (!active) return;
        setServices(SAMPLE);
        setSample(true);
        setError(getApiError(err, "Services could not be loaded right now."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <LoadingState title="Loading services" />;
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100"
        >
          <p className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {error} Showing sample services while the clinic API is unavailable.
          </p>
          <Button type="button" size="sm" variant="outline" onClick={load}>
            <RefreshCw className="size-4" /> Retry
          </Button>
        </div>
      ) : null}

      {services.length === 0 ? (
        <EmptyState
          title="No active services yet"
          description="The clinic has not published its service list. Please check back or call the clinic."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {services.map((service) => (
            <Card key={service.id} className="gap-4 py-5">
              <CardContent className="space-y-4 px-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-primary">
                      <Eye className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h2 className="font-medium">{service.name}</h2>
                      <p className="text-xs text-muted-foreground">
                        {service.durationMinutes
                          ? `${service.durationMinutes} minutes`
                          : "Duration set by clinic"}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-medium">
                    {formatCurrency(service.fee)}
                  </p>
                </div>

                <p className="text-sm leading-relaxed text-muted-foreground">
                  {service.description ?? "Clinic service."}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3.5" aria-hidden="true" />
                    {sample
                      ? "Sample service"
                      : "Request this service online"}
                  </span>
                  {sample ? (
                    <Button asChild size="sm" variant="outline">
                      <Link href="/booking">
                        Try booking <ArrowRight className="size-3.5" />
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild size="sm">
                      <Link href={`/booking?service=${service.id}`}>
                        Request this service <ArrowRight className="size-3.5" />
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="rounded-lg border bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
        Fees shown are demo values. The clinic confirms the service, duration,
        and assigned doctor before the appointment is final.
      </p>
    </div>
  );
}

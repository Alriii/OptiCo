"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, CalendarCheck } from "lucide-react";
import { publicService } from "@/services/public.service";
import { getApiError } from "@/lib/api-error";
import type { Doctor } from "@/services/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { getDoctorPhoto } from "@/lib/clinic-media";

const SAMPLE: Doctor[] = [
  {
    id: "sample-doctor-1",
    slug: "sample-doctor-santos",
    displayName: "Dr. Sample Santos",
    credentials: "OD, Optometrist",
    bio: "Sample profile for layout review. Not a real clinician or a real clinic record. In a live clinic this section describes approved public background, focus areas, and languages spoken.",
  },
  {
    id: "sample-doctor-2",
    slug: "sample-doctor-reyes",
    displayName: "Dr. Sample Reyes",
    credentials: "OD, Optometrist",
    bio: "Sample profile for layout review. Not a real clinician or a real clinic record. In a live clinic this section describes approved public background, focus areas, and languages spoken.",
  },
  {
    id: "sample-doctor-3",
    slug: "sample-doctor-cruz",
    displayName: "Dr. Sample Cruz",
    credentials: "OD, Optometrist",
    bio: "Sample profile for layout review. Not a real clinician or a real clinic record. In a live clinic this section describes approved public background, focus areas, and languages spoken.",
  },
];

export function DoctorProfile({ slug }: { slug: string }) {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sample, setSample] = useState(false);

  useEffect(() => {
    let cancelled = false;

    publicService
      .getDoctor(slug)
      .then((response) => {
        if (cancelled) return;
        if (response.data) {
          setDoctor(response.data);
        } else {
          const fallback = SAMPLE.find((item) => item.slug === slug) ?? null;
          setDoctor(fallback);
          setSample(Boolean(fallback));
        }
      })
      .catch((err) => {
        if (cancelled) return;
        const fallback = SAMPLE.find((item) => item.slug === slug) ?? null;
        setDoctor(fallback);
        setSample(Boolean(fallback));
        setError(getApiError(err, "This profile could not be loaded."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return <LoadingState title="Loading profile" />;
  }

  if (!doctor) {
    return (
      <EmptyState
        title="Profile not available"
        description="This doctor profile may have been unpublished, or the clinic API is unavailable."
        action={
          <Button asChild variant="outline">
            <Link href="/doctors">
              <ArrowLeft className="size-4" /> Back to doctors
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="px-0">
        <Link href="/doctors">
          <ArrowLeft className="size-4" /> All doctors
        </Link>
      </Button>

      {error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      ) : null}

      <Card className="overflow-hidden rounded-3xl border border-border/80 shadow-sm">
        <CardContent className="grid gap-8 p-6 sm:p-8 md:grid-cols-[auto_1fr] md:items-start">
          <div className="relative size-32 sm:size-40 shrink-0 overflow-hidden rounded-3xl bg-secondary shadow-md ring-2 ring-primary/20">
            <img
              src={getDoctorPhoto(doctor.displayName)}
              alt={doctor.displayName}
              className="size-full object-cover"
            />
          </div>

          <div className="space-y-5">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                  {doctor.displayName}
                </h1>
                {sample ? <Badge variant="outline">Sample profile</Badge> : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Verified Clinician
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-primary">
                {doctor.credentials || "Licensed Optometrist"}
              </p>
            </div>

            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {doctor.bio ??
                "Public profile details are managed by the clinic administrator."}
            </p>

            {doctor.services?.length ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Offered Services</p>
                <div className="flex flex-wrap gap-2">
                  {doctor.services.map((service) => (
                    <Badge key={service.id} variant="secondary" className="rounded-xl px-2.5 py-1 text-xs">
                      {service.name}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="pt-2">
              <Button asChild size="lg" className="rounded-xl shadow-xs">
                <Link href="/booking">
                  <CalendarCheck className="size-4" /> Request an appointment
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="rounded-lg border bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
        You do not select a doctor during booking. The clinic assigns a
        qualified, available doctor when it approves your requested time.
      </p>
    </div>
  );
}

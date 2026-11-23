"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, CalendarCheck, Stethoscope } from "lucide-react";
import { publicService } from "@/services/public.service";
import { getApiError } from "@/lib/api-error";
import type { Doctor } from "@/services/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";

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

      <Card className="overflow-hidden">
        <CardContent className="grid gap-6 px-6 py-7 sm:grid-cols-[auto_1fr] sm:items-start">
          <span className="flex size-20 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Stethoscope className="size-8" aria-hidden="true" />
          </span>
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {doctor.displayName}
                </h1>
                {sample ? <Badge variant="outline">Sample profile</Badge> : null}
              </div>
              <p className="text-sm text-muted-foreground">
                {doctor.credentials || "Clinic doctor"}
              </p>
            </div>

            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {doctor.bio ??
                "Public profile details are managed by the clinic administrator."}
            </p>

            {doctor.services?.length ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Services</p>
                <div className="flex flex-wrap gap-2">
                  {doctor.services.map((service) => (
                    <Badge key={service.id} variant="secondary">
                      {service.name}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            <Button asChild>
              <Link href="/booking">
                <CalendarCheck className="size-4" /> Request an appointment
              </Link>
            </Button>
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

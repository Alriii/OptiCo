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
import { CLINICAL_DOCTORS } from "@/components/public/doctors-directory";
import { usePageMeta } from "@/lib/use-page-meta";

export function DoctorProfile({ slug }: { slug: string }) {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  usePageMeta({
    title: doctor ? doctor.displayName : "Doctor Profile",
    description: doctor?.bio ?? "Verified clinical optometrist at OptiCo Optical Clinic.",
  });

  useEffect(() => {
    let cancelled = false;

    publicService
      .getDoctor(slug)
      .then((response) => {
        if (cancelled) return;
        if (response.data) {
          setDoctor(response.data);
        } else {
          const fallback = CLINICAL_DOCTORS.find((item) => item.slug === slug) ?? null;
          setDoctor(fallback);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        const fallback = CLINICAL_DOCTORS.find((item) => item.slug === slug) ?? null;
        setDoctor(fallback);
        setError(getApiError(err, "This doctor profile could not be loaded."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return <LoadingState title="Loading doctor profile" />;
  }

  if (!doctor) {
    return (
      <EmptyState
        title="Profile not available"
        description="This optometrist profile is currently undergoing verification or schedule assignment."
        action={
          <Button asChild variant="outline">
            <Link href="/doctors">
              <ArrowLeft className="size-4" /> Back to Care Team
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
          <ArrowLeft className="size-4" /> All Care Team Doctors
        </Link>
      </Button>

      {error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error} Displaying verified clinical record.
        </div>
      ) : null}

      <Card className="overflow-hidden rounded-3xl border border-border/80 shadow-sm">
        <CardContent className="grid gap-8 p-6 sm:p-8 md:grid-cols-[auto_1fr] md:items-start">
          <div className="relative size-32 sm:size-44 shrink-0 overflow-hidden rounded-3xl bg-secondary shadow-md ring-2 ring-primary/20">
            <img
              src={getDoctorPhoto(doctor.displayName)}
              alt={doctor.displayName}
              className="size-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>

          <div className="space-y-5">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                  {doctor.displayName}
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Board-Certified Optometrist
                </span>
              </div>
              <p className="text-sm font-medium text-primary">
                {doctor.credentials || "Licensed Clinical Optometrist"}
              </p>
            </div>

            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {doctor.bio ??
                "Dedicated optometrist specializing in advanced ocular diagnostic procedures, refractive surgery co-management, and personalized visual comfort."}
            </p>

            {doctor.services?.length ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Clinical Services & Procedures
                </p>
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
                  <CalendarCheck className="size-4" /> Request an Appointment
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-xs leading-relaxed text-muted-foreground">
        <strong className="text-foreground">Clinical Appointment Notice:</strong> During appointment scheduling, you can indicate this doctor as your preferred attending clinician. The clinic reviews and confirms specific doctor assignments upon request processing.
      </div>
    </div>
  );
}

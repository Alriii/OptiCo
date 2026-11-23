"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, RefreshCw, Stethoscope } from "lucide-react";
import { publicService } from "@/services/public.service";
import { readList } from "@/lib/api-shape";
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
    bio: "Sample profile for layout review. Not a real clinician or a real clinic record.",
  },
  {
    id: "sample-doctor-2",
    slug: "sample-doctor-reyes",
    displayName: "Dr. Sample Reyes",
    credentials: "OD, Optometrist",
    bio: "Sample profile for layout review. Not a real clinician or a real clinic record.",
  },
  {
    id: "sample-doctor-3",
    slug: "sample-doctor-cruz",
    displayName: "Dr. Sample Cruz",
    credentials: "OD, Optometrist",
    bio: "Sample profile for layout review. Not a real clinician or a real clinic record.",
  },
];

export function DoctorsDirectory() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sample, setSample] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    publicService
      .getDoctors()
      .then((response) => {
        const list = readList<Doctor>(response.data, "doctors");
        if (list.length > 0) {
          setDoctors(list);
          setSample(false);
        } else {
          setDoctors(SAMPLE);
          setSample(true);
        }
      })
      .catch((err) => {
        setDoctors(SAMPLE);
        setSample(true);
        setError(getApiError(err, "Doctors could not be loaded right now."));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    publicService
      .getDoctors()
      .then((response) => {
        if (!active) return;
        const list = readList<Doctor>(response.data, "doctors");
        if (list.length > 0) {
          setDoctors(list);
          setSample(false);
        } else {
          setDoctors(SAMPLE);
          setSample(true);
        }
      })
      .catch((err) => {
        if (!active) return;
        setDoctors(SAMPLE);
        setSample(true);
        setError(getApiError(err, "Doctors could not be loaded right now."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <LoadingState title="Loading the care team" />;
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
            {error} Showing sample profiles while the clinic API is unavailable.
          </p>
          <Button type="button" size="sm" variant="outline" onClick={load}>
            <RefreshCw className="size-4" /> Retry
          </Button>
        </div>
      ) : null}

      {doctors.length === 0 ? (
        <EmptyState
          title="No public doctor profiles yet"
          description="The clinic has not published its care team. Please call the clinic for assistance."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doctor) => (
            <Card key={doctor.id} className="gap-4 py-5">
              <CardContent className="space-y-4 px-5">
                <div className="flex items-center gap-3">
                  <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Stethoscope className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="font-medium">{doctor.displayName}</h2>
                    <p className="text-xs text-muted-foreground">
                      {doctor.credentials || "Clinic doctor"}
                    </p>
                  </div>
                </div>

                <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {doctor.bio ??
                    "Public profile details are managed by the clinic administrator."}
                </p>

                <div className="flex items-center justify-between border-t pt-3">
                  {sample ? (
                    <Badge variant="outline">Sample profile</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Public profile
                    </span>
                  )}
                  {doctor.slug ? (
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/doctors/${doctor.slug}`}>
                        View <ArrowRight className="size-3.5" />
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="rounded-lg border bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
        Doctor assignment is automatic. Patients do not choose a doctor during
        booking; the clinic assigns a qualified, available doctor when the
        request is approved.
      </p>
    </div>
  );
}

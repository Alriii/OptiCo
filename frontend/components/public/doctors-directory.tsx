"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, RefreshCw } from "lucide-react";
import { publicService } from "@/services/public.service";
import { readList } from "@/lib/api-shape";
import { getApiError } from "@/lib/api-error";
import type { Doctor } from "@/services/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { getDoctorPhoto } from "@/lib/clinic-media";

export const CLINICAL_DOCTORS: Doctor[] = [
  {
    id: "doctor-reyes",
    slug: "dr-elena-reyes",
    displayName: "Dr. Elena Reyes",
    credentials: "OD, FAAO (Senior Clinical Optometrist)",
    bio: "Senior optometrist with over 14 years of clinical experience specializing in comprehensive ocular pathology, refractive management, and advanced dry eye therapy. Fellow of the American Academy of Optometry.",
  },
  {
    id: "doctor-tan",
    slug: "dr-marcus-tan",
    displayName: "Dr. Marcus Tan",
    credentials: "OD, FIACLE (Contact Lens & Digital Ergonomics)",
    bio: "Specializing in visual ergonomics, computer vision syndrome, and specialty toric and multifocal contact lens fittings. Fellow of the International Association of Contact Lens Educators.",
  },
  {
    id: "doctor-alcantara",
    slug: "dr-sofia-alcantara",
    displayName: "Dr. Sofia Alcantara",
    credentials: "OD (Pediatric Optometry & Binocular Vision)",
    bio: "Focusing on pediatric visual development, binocular vision therapy, and progressive myopia control with gentle, evidence-based clinical protocols.",
  },
];

export function DoctorsDirectory() {
  const [doctors, setDoctors] = useState<Doctor[]>(CLINICAL_DOCTORS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    publicService
      .getDoctors()
      .then((response) => {
        const list = readList<Doctor>(response.data, "doctors");
        if (list.length > 0) {
          setDoctors(list);
        } else {
          setDoctors(CLINICAL_DOCTORS);
        }
      })
      .catch((err) => {
        setDoctors(CLINICAL_DOCTORS);
        setError(getApiError(err, "Unable to refresh latest care team roster."));
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
        } else {
          setDoctors(CLINICAL_DOCTORS);
        }
      })
      .catch((err) => {
        if (!active) return;
        setDoctors(CLINICAL_DOCTORS);
        setError(getApiError(err, "Unable to refresh latest care team roster."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <LoadingState title="Loading optometry care team" />;
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
            {error} Displaying resident optometry care roster.
          </p>
          <Button type="button" size="sm" variant="outline" onClick={load}>
            <RefreshCw className="size-4" /> Refresh
          </Button>
        </div>
      ) : null}

      {doctors.length === 0 ? (
        <EmptyState
          title="Care team updating"
          description="Doctor rosters are being updated for the upcoming clinical term."
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {doctors.map((doctor) => {
            const photo = getDoctorPhoto(doctor.displayName);
            return (
              <Card
                key={doctor.id}
                className="group overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
              >
                <CardContent className="grid gap-6 p-6 sm:grid-cols-[130px_1fr] sm:items-start">
                  <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-secondary shadow-xs">
                    <img
                      src={photo}
                      alt={doctor.displayName}
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold tracking-tight text-foreground">
                          {doctor.displayName}
                        </h2>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Licensed Optometrist
                        </span>
                      </div>
                      <p className="text-xs font-medium text-primary">
                        {doctor.credentials || "Licensed Optometrist"}
                      </p>
                    </div>

                    <p className="text-xs leading-relaxed text-muted-foreground line-clamp-3">
                      {doctor.bio ??
                        "Experienced clinician providing comprehensive diagnostic and refractive vision care."}
                    </p>

                    {doctor.services?.length ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {doctor.services.slice(0, 3).map((service) => (
                          <Badge
                            key={service.id}
                            variant="secondary"
                            className="text-[10px] rounded-lg px-2 py-0.5 font-normal"
                          >
                            {service.name}
                          </Badge>
                        ))}
                      </div>
                    ) : null}

                    <div className="pt-2 flex items-center justify-between">
                      <Button asChild size="sm" variant="outline" className="rounded-xl text-xs">
                        <Link href={`/doctors/${doctor.slug}`}>
                          View Profile & Schedule <ArrowRight className="size-3.5" />
                        </Link>
                      </Button>
                      <Button asChild size="sm" className="rounded-xl shadow-xs text-xs">
                        <Link href="/booking">Book Visit</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-xs leading-relaxed text-muted-foreground">
        <strong className="text-foreground">Clinical Assignment Notice:</strong> Patients may request a preferred optometrist during appointment scheduling. Final physician confirmation is determined by scheduled operating shifts and required clinical specialization.
      </div>
    </div>
  );
}

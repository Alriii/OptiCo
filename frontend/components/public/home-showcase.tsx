"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { publicService } from "@/services/public.service";
import { readList } from "@/lib/api-shape";
import { formatCurrency } from "@/lib/format";
import type { Doctor, Service } from "@/services/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingState } from "@/components/shared/loading-state";
import { getServicePhoto, getDoctorPhoto } from "@/lib/clinic-media";
import { CLINICAL_SERVICES } from "@/components/public/services-directory";
import { CLINICAL_DOCTORS } from "@/components/public/doctors-directory";

export function HomeShowcase() {
  const [services, setServices] = useState<Service[]>(CLINICAL_SERVICES.slice(0, 3));
  const [doctors, setDoctors] = useState<Doctor[]>(CLINICAL_DOCTORS.slice(0, 3));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([
      publicService.getServices(),
      publicService.getDoctors(),
    ]).then(([servicesResult, doctorsResult]) => {
      if (cancelled) return;

      if (servicesResult.status === "fulfilled") {
        const list = readList<Service>(
          servicesResult.value.data,
          "services",
        );
        if (list.length > 0) {
          setServices(list.slice(0, 3));
        }
      }

      if (doctorsResult.status === "fulfilled") {
        const list = readList<Doctor>(doctorsResult.value.data, "doctors");
        if (list.length > 0) {
          setDoctors(list.slice(0, 3));
        }
      }

      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <section className="page-shell py-14 sm:py-20" aria-labelledby="services-preview">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="eyebrow">Diagnostic Services</p>
            <h2 id="services-preview" className="text-2xl font-semibold sm:text-3xl">
              Precision eye care, clearly explained
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Every procedure has a transparent fee and dedicated appointment duration. Experience attentive visual evaluations with no rushed diagnoses.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/services">
              View All Services <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <LoadingState title="Loading clinical services" className="py-10" />
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {services.map((service) => {
              const photo = getServicePhoto(service.name);
              return (
                <Card
                  key={service.id}
                  className="group overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm transition-all hover:shadow-md hover:border-primary/40"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
                    <img
                      src={photo}
                      alt={service.name}
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute top-3 right-3 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-foreground shadow-xs backdrop-blur-xs">
                      {service.fee !== undefined ? formatCurrency(service.fee) : "Clinic rate"}
                    </div>
                  </div>
                  <CardContent className="space-y-3 p-5">
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-foreground tracking-tight">{service.name}</h3>
                      <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {service.description ?? "Personalized optical care evaluation."}
                      </p>
                    </div>
                    <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
                      {service.durationMinutes ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3.5 text-primary" aria-hidden="true" />
                          {service.durationMinutes} min session
                        </span>
                      ) : (
                        <span>Standard session</span>
                      )}
                      <Button asChild size="sm" variant="ghost" className="h-7 text-xs font-medium text-primary hover:bg-primary/10">
                        <Link href={`/booking?service=${service.id}`}>Book Visit →</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section className="border-y bg-secondary/50 py-14 sm:py-20" aria-labelledby="doctors-preview">
        <div className="page-shell">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="eyebrow">Attending Clinicians</p>
              <h2 id="doctors-preview" className="text-2xl font-semibold sm:text-3xl">
                Resident Optometry Care Team
              </h2>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Board-certified specialists in clinical refraction, ocular surface health, specialty contact lens fitting, and pediatric vision care.
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/doctors">
                Meet All Clinicians <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {doctors.map((doctor) => {
              const photo = getDoctorPhoto(doctor.displayName);
              return (
                <Card
                  key={doctor.id}
                  className="group overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm transition-all hover:shadow-md hover:border-primary/40"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
                    <img
                      src={photo}
                      alt={doctor.displayName}
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <CardContent className="space-y-3 p-5">
                    <div>
                      <h3 className="text-base font-semibold text-foreground tracking-tight">
                        {doctor.displayName}
                      </h3>
                      <p className="text-xs text-primary font-medium mt-0.5">
                        {doctor.credentials || "Licensed Optometrist"}
                      </p>
                    </div>
                    <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {doctor.bio ??
                        "Dedicated eye care professional delivering comprehensive visual health assessments."}
                    </p>
                    <div className="border-t border-border/60 pt-3 flex items-center justify-between">
                      <Button asChild size="sm" variant="ghost" className="h-7 text-xs font-medium text-primary hover:bg-primary/10 px-0">
                        <Link href={`/doctors/${doctor.slug}`}>
                          View Profile & Schedule →
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}

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

const SAMPLE_SERVICES: Service[] = [
  {
    id: "demo-optometry",
    name: "Optometry consultation",
    description:
      "A focused conversation about your vision, comfort, and current eyewear.",
    durationMinutes: 30,
    fee: 700,
  },
  {
    id: "demo-eye-exam",
    name: "Comprehensive eye examination",
    description:
      "A complete eye health check with time for questions and next steps.",
    durationMinutes: 45,
    fee: 1200,
  },
  {
    id: "demo-refraction",
    name: "Refraction / vision testing",
    description:
      "Measure how your eyes focus so a prescription can be prepared if needed.",
    durationMinutes: 20,
    fee: 500,
  },
];

const SAMPLE_DOCTORS: Doctor[] = [
  {
    id: "demo-doctor-1",
    displayName: "Dr. Sample Santos",
    credentials: "OD, Optometrist",
    bio: "Sample profile for layout review. Not a real clinician.",
  },
  {
    id: "demo-doctor-2",
    displayName: "Dr. Sample Reyes",
    credentials: "OD, Optometrist",
    bio: "Sample profile for layout review. Not a real clinician.",
  },
];

export function HomeShowcase() {
  const [services, setServices] = useState<Service[]>(SAMPLE_SERVICES);
  const [doctors, setDoctors] = useState<Doctor[]>(SAMPLE_DOCTORS);
  const [loading, setLoading] = useState(true);
  const [usingSample, setUsingSample] = useState(true);

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
          setUsingSample(false);
        }
      }

      if (doctorsResult.status === "fulfilled") {
        const list = readList<Doctor>(doctorsResult.value.data, "doctors");
        if (list.length > 0) setDoctors(list.slice(0, 3));
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
            <p className="eyebrow">Care menu</p>
            <h2 id="services-preview" className="text-2xl font-semibold sm:text-3xl">
              Services, without the guesswork
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Every service has a clear duration and fee. Final scheduling is
              confirmed by clinic staff after your request is reviewed.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/services">
              All services <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <LoadingState title="Loading services" className="py-10" />
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {services.map((service) => {
              const photo = getServicePhoto(service.name);
              return (
                <Card key={service.id} className="group overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm transition-all hover:shadow-md hover:border-primary/40">
                  <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
                    <img
                      src={photo}
                      alt={service.name}
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-3 right-3 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-foreground shadow-xs backdrop-blur-xs">
                      {service.fee !== undefined ? formatCurrency(service.fee) : "Clinic rate"}
                    </div>
                  </div>
                  <CardContent className="space-y-3 p-5">
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-foreground tracking-tight">{service.name}</h3>
                      <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {service.description ?? "Personalized optical care."}
                      </p>
                    </div>
                    <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
                      {service.durationMinutes ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3.5 text-primary" aria-hidden="true" />
                          {service.durationMinutes} min session
                        </span>
                      ) : (
                        <span>Clinic schedule</span>
                      )}
                      <Button asChild size="sm" variant="ghost" className="h-7 text-xs font-medium text-primary hover:bg-primary/10">
                        <Link href={`/booking?service=${service.id}`}>Book visit →</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {usingSample ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Showing sample services because the clinic API is not reachable.
          </p>
        ) : null}
      </section>

      <section className="border-y bg-secondary/50 py-14 sm:py-20" aria-labelledby="doctors-preview">
        <div className="page-shell">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="eyebrow">Care team</p>
              <h2 id="doctors-preview" className="text-2xl font-semibold sm:text-3xl">
                Meet the clinic team
              </h2>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Patient requests do not choose a doctor. The clinic assigns an
                available, qualified doctor when the appointment is approved.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/doctors">
                Doctor directory <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map((doctor) => {
              const photo = getDoctorPhoto(doctor.displayName);
              return (
                <Card key={doctor.id} className="group overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm transition-all hover:shadow-md hover:border-primary/40">
                  <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
                    <img
                      src={photo}
                      alt={doctor.displayName}
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4 text-white">
                      <h3 className="text-base font-semibold tracking-tight">{doctor.displayName}</h3>
                      <p className="text-xs text-white/80">{doctor.credentials || "Clinic Optometrist"}</p>
                    </div>
                  </div>
                  <CardContent className="space-y-3 p-5">
                    <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {doctor.bio ??
                        "Dedicated eye care specialist focusing on patient comfort and diagnostic clarity."}
                    </p>
                    <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                      <span className="inline-flex items-center gap-1.5 font-medium text-primary text-[11px]">
                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Available Clinician
                      </span>
                      {doctor.slug ? (
                        <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs text-primary hover:bg-primary/10">
                          <Link href={`/doctors/${doctor.slug}`}>
                            Profile <ArrowRight className="size-3" />
                          </Link>
                        </Button>
                      ) : null}
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

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Eye, Stethoscope } from "lucide-react";
import { publicService } from "@/services/public.service";
import { readList } from "@/lib/api-shape";
import { formatCurrency } from "@/lib/format";
import type { Doctor, Service } from "@/services/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/shared/loading-state";

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
    name: "Dr. Sample Santos",
    title: "Optometrist",
    credentials: "OD",
    bio: "Sample profile for layout review. Not a real clinician.",
  },
  {
    id: "demo-doctor-2",
    name: "Dr. Sample Reyes",
    title: "Optometrist",
    credentials: "OD",
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
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {services.map((service) => (
              <Card key={service.id} className="gap-4 py-5">
                <CardContent className="space-y-3 px-5">
                  <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-primary">
                    <Eye className="size-5" aria-hidden="true" />
                  </span>
                  <div className="space-y-1">
                    <h3 className="font-medium">{service.name}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {service.description ?? "Clinic service."}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {service.durationMinutes ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3.5" aria-hidden="true" />
                        {service.durationMinutes} min
                      </span>
                    ) : null}
                    {service.fee !== undefined ? (
                      <span>{formatCurrency(service.fee)}</span>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
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

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map((doctor) => (
              <Card key={doctor.id} className="gap-3 py-5">
                <CardContent className="space-y-3 px-5">
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Stethoscope className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="font-medium">{doctor.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {[doctor.title, doctor.credentials]
                          .filter(Boolean)
                          .join(", ") || "Clinic doctor"}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {doctor.bio ??
                      "Public profile details are managed by the clinic administrator."}
                  </p>
                  {doctor.slug ? (
                    <Button asChild size="sm" variant="ghost" className="px-0">
                      <Link href={`/doctors/${doctor.slug}`}>
                        View profile <ArrowRight className="size-3.5" />
                      </Link>
                    </Button>
                  ) : (
                    <Badge variant="outline">Sample profile</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

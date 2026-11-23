"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, Clock, RefreshCw } from "lucide-react";
import { publicService } from "@/services/public.service";
import { readList } from "@/lib/api-shape";
import { getApiError } from "@/lib/api-error";
import { formatCurrency } from "@/lib/format";
import type { Service } from "@/services/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { getServicePhoto } from "@/lib/clinic-media";

export const CLINICAL_SERVICES: Service[] = [
  {
    id: "comprehensive-eye-examination",
    name: "Comprehensive Eye Examination",
    description:
      "Full internal and external ocular health assessment, digital retinal screening, visual field analysis, and early glaucoma risk detection.",
    durationMinutes: 45,
    fee: 1500,
  },
  {
    id: "optometry-consultation",
    name: "Optometry Consultation & Vision Assessment",
    description:
      "Primary visual acuity evaluation, binocular vision coordination assessment, and personalized ocular hygiene advice with an optometrist.",
    durationMinutes: 30,
    fee: 800,
  },
  {
    id: "refraction-vision-testing",
    name: "Precision Refraction & Prescription Testing",
    description:
      "Clinical computerized and subjective refraction testing to determine your exact optical prescription for single-vision or progressive lenses.",
    durationMinutes: 20,
    fee: 500,
  },
  {
    id: "contact-lens-fitting",
    name: "Specialty Contact Lens Evaluation & Fitting",
    description:
      "Corneal curvature topography, tear-film stability analysis, and tailored fitting for soft, toric, multifocal, or gas-permeable lenses.",
    durationMinutes: 35,
    fee: 1200,
  },
  {
    id: "eyewear-consultation",
    name: "Designer Eyewear Consultation & Fitting",
    description:
      "Facial geometry styling, ergonomic bridge alignment, pantoscopic tilt measurement, and digital progressive lens design selection.",
    durationMinutes: 30,
    fee: 600,
  },
  {
    id: "follow-up-consultation",
    name: "Optical Follow-Up & Adaptation Check",
    description:
      "Complimentary follow-up assessment to monitor lens adaptation, visual comfort, and frame fitting adjustments.",
    durationMinutes: 15,
    fee: 400,
  },
];

export function ServicesDirectory() {
  const [services, setServices] = useState<Service[]>(CLINICAL_SERVICES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    publicService
      .getServices()
      .then((response) => {
        const list = readList<Service>(response.data, "services");
        if (list.length > 0) {
          setServices(list);
        } else {
          setServices(CLINICAL_SERVICES);
        }
      })
      .catch((err) => {
        setServices(CLINICAL_SERVICES);
        setError(getApiError(err, "Unable to refresh latest clinic fee schedule."));
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
        } else {
          setServices(CLINICAL_SERVICES);
        }
      })
      .catch((err) => {
        if (!active) return;
        setServices(CLINICAL_SERVICES);
        setError(getApiError(err, "Unable to refresh latest clinic fee schedule."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <LoadingState title="Loading optical services" />;
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
            {error} Displaying verified clinic standard care menu.
          </p>
          <Button type="button" size="sm" variant="outline" onClick={load}>
            <RefreshCw className="size-4" /> Refresh
          </Button>
        </div>
      ) : null}

      {services.length === 0 ? (
        <EmptyState
          title="No services available"
          description="The clinic service catalog is currently updating. Please call our concierge desk."
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {services.map((service) => {
            const photo = getServicePhoto(service.name);
            return (
              <Card
                key={service.id}
                className="group overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-secondary">
                  <img
                    src={photo}
                    alt={service.name}
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute top-3 right-3 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-foreground shadow-xs backdrop-blur-xs">
                    {formatCurrency(service.fee)}
                  </div>
                </div>

                <CardContent className="space-y-4 p-5 sm:p-6">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">{service.name}</h2>
                    <p className="text-xs text-primary font-medium">
                      {service.durationMinutes
                        ? `${service.durationMinutes} minutes dedicated session`
                        : "Standard clinical duration"}
                    </p>
                  </div>

                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {service.description ?? "Attentive, personalized eye care examination."}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-4">
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="size-3.5 text-primary" aria-hidden="true" />
                      Individual Clinician Review
                    </span>
                    <Button asChild size="sm" className="rounded-xl shadow-xs">
                      <Link href={`/booking?service=${service.id}`}>
                        Book Service <ArrowRight className="size-3.5" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-xs leading-relaxed text-muted-foreground">
        <strong className="text-foreground">Clinical Appointment Notice:</strong> All consultations include primary visual acuity screening and slit-lamp ocular evaluation. Specialized diagnostic procedures or prescription lens orders are finalized upon consultation with your attending optometrist.
      </div>
    </div>
  );
}

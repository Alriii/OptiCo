import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  Clock,
  Eye,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardContent } from "@/components/ui/card";
import { HomeShowcase } from "@/components/public/home-showcase";
import { DEMO_CLINIC } from "@/lib/demo-clinic";
import { CLINIC_PHOTOS } from "@/lib/clinic-media";

const STEPS = [
  {
    title: "Request a time",
    description:
      "Choose a service, a clinic date, and a preferred slot. Guest booking is available.",
    icon: CalendarCheck,
  },
  {
    title: "Clinic review",
    description:
      "Staff checks doctor availability and confirms the appointment with an assigned doctor.",
    icon: ShieldCheck,
  },
  {
    title: "Visit with confidence",
    description:
      "You receive the outcome by email and in your portal. Nothing is confirmed until staff approve it.",
    icon: Eye,
  },
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-secondary/40 via-secondary/20 to-background">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-emerald-400/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 top-1/2 size-72 rounded-full bg-teal-400/10 blur-3xl"
        />

        <div className="page-shell grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-background/90 px-3 py-1 text-xs font-medium text-primary shadow-xs backdrop-blur-xs">
                <img
                  src="/mascot.jpg"
                  alt="Dr. Octo"
                  className="size-4 rounded-full object-cover ring-1 ring-primary/30"
                />
                OptiCo Smart Care
              </span>
              <Badge variant="outline" className="border-border/80 bg-background/70">
                Live Clinic System
              </Badge>
            </div>

            <div className="space-y-4">
              <p className="eyebrow flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-primary" />
                Optical care, thoughtfully scheduled
              </p>
              <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-6xl text-foreground">
                Clearer vision.
                <br />
                <span className="bg-gradient-to-r from-primary to-[#289e8f] bg-clip-text text-transparent">
                  Calmer visits.
                </span>
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Request an eye care appointment, track every update, and
                let our clinic handle the scheduling details. Guided by Dr. Octo
                and our dedicated optometry team.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-xl shadow-sm">
                <Link href="/booking">
                  Request an appointment <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-xl">
                <Link href="/services">Explore services</Link>
              </Button>
            </div>

            <p className="max-w-xl rounded-xl border border-border/80 bg-background/80 px-4 py-3 text-xs leading-relaxed text-muted-foreground shadow-xs">
              <strong className="font-medium text-foreground">
                Appointment request only.
              </strong>{" "}
              Your schedule is reviewed by clinic staff and confirmed with an assigned doctor.
            </p>
          </div>

          {/* Hero Visual Card with Clinical Photography */}
          <div className="space-y-4">
            <div className="group relative overflow-hidden rounded-3xl border border-border/80 bg-card shadow-lg shadow-primary/[0.04] transition-all">
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={CLINIC_PHOTOS.hero}
                  alt="Modern OptiCo clinic interior and eyewear gallery"
                  className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/80 px-2.5 py-0.5 text-[11px] font-medium backdrop-blur-xs">
                      ● Clinic Open Today
                    </span>
                    <h3 className="mt-1.5 text-lg font-semibold tracking-tight">
                      Modern Diagnostic Suite
                    </h3>
                  </div>
                  <p className="text-xs text-white/80">9:00 AM – 5:00 PM</p>
                </div>
              </div>

              <CardContent className="space-y-4 p-5 sm:p-6">
                <dl className="grid gap-3 text-xs sm:grid-cols-2">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    <div>
                      <dt className="font-medium text-foreground">Clinic Address</dt>
                      <dd className="text-muted-foreground">{DEMO_CLINIC.address}</dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Phone className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    <div>
                      <dt className="font-medium text-foreground">Contact & Desk</dt>
                      <dd className="text-muted-foreground">{DEMO_CLINIC.phone}</dd>
                    </div>
                  </div>
                </dl>

                <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3.5 text-primary" /> Mon – Fri, 9:00 AM – 5:00 PM
                  </span>
                  <span>Asia/Manila (PHT)</span>
                </div>
              </CardContent>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell grid gap-4 py-10 sm:grid-cols-3" aria-label="Clinic promises">
        {[
          {
            title: "One clinic, one focus",
            body: "Appointments and day-to-day operations, without clinical records.",
          },
          {
            title: "Staff-approved scheduling",
            body: "A pending request never reserves a slot or promises a doctor.",
          },
          {
            title: "Private by design",
            body: "Portal data is scoped to your account. Guest links are single-purpose.",
          },
        ].map((item) => (
          <div key={item.title} className="rounded-xl border bg-card px-5 py-4">
            <p className="text-sm font-medium">{item.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {item.body}
            </p>
          </div>
        ))}
      </section>

      <HomeShowcase />

      <section className="page-shell py-14 sm:py-20" aria-labelledby="how-it-works">
        <div className="max-w-2xl space-y-2">
          <p className="eyebrow">How it works</p>
          <h2 id="how-it-works" className="text-2xl font-semibold sm:text-3xl">
            A request, a review, then a real appointment
          </h2>
        </div>

        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="rounded-xl border bg-card p-5">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {index + 1}
                  </span>
                  <Icon className="size-5 text-primary" aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-medium">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="border-t bg-primary py-14 text-primary-foreground sm:py-16">
        <div className="page-shell flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/70">
              Ready when you are
            </p>
            <h2 className="text-2xl font-semibold sm:text-3xl">
              Start with a preferred time
            </h2>
            <p className="text-sm leading-relaxed text-primary-foreground/80">
              Send a request in a few steps. The clinic will review it and let
              you know the confirmed schedule.
            </p>
          </div>
          <Button asChild size="lg" variant="secondary">
            <Link href="/booking">
              Book a visit <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}

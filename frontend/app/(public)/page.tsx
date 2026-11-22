import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  Clock,
  Eye,
  MapPin,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { HomeShowcase } from "@/components/public/home-showcase";
import { DEMO_CLINIC, DEMO_NOTICE } from "@/lib/demo-clinic";

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
      <section className="relative overflow-hidden border-b bg-secondary/60">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-taupe/20 blur-3xl"
          style={{ backgroundColor: "#b8a48a33" }}
        />
        <div className="page-shell grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-primary/30 bg-background">
                Demo clinic
              </Badge>
              <span className="text-xs text-muted-foreground">
                Sample data for development
              </span>
            </div>

            <div className="space-y-4">
              <p className="eyebrow">Optical care, thoughtfully scheduled</p>
              <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-6xl">
                Clearer vision.
                <br />
                Calmer visits.
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Request an eye care appointment, keep track of every update, and
                let the clinic handle the scheduling details. No account needed
                for a first request.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/booking">
                  Request an appointment <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/services">Explore services</Link>
              </Button>
            </div>

            <p className="max-w-xl rounded-lg border border-border/80 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
              <strong className="font-medium text-foreground">
                Appointment request only.
              </strong>{" "}
              Your schedule is confirmed after clinic approval.
            </p>
          </div>

          <Card className="border-primary/15 bg-background shadow-md">
            <CardContent className="space-y-5 px-6 py-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Clinic hours
                  </p>
                  <p className="text-lg font-medium">Monday – Friday</p>
                </div>
                <Clock className="size-6 text-primary" aria-hidden="true" />
              </div>

              <div className="rounded-xl bg-secondary px-4 py-3">
                <p className="text-3xl font-semibold tracking-tight">
                  9:00 AM – 5:00 PM
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Asia/Manila · weekends closed
                </p>
              </div>

              <dl className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <MapPin
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <div>
                    <dt className="font-medium">Demo location</dt>
                    <dd className="text-muted-foreground">
                      {DEMO_CLINIC.address}
                    </dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Phone
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <div>
                    <dt className="font-medium">Demo contact</dt>
                    <dd className="text-muted-foreground">
                      {DEMO_CLINIC.phone}
                    </dd>
                  </div>
                </div>
              </dl>

              <p className="border-t pt-3 text-xs text-muted-foreground">
                {DEMO_NOTICE}
              </p>
            </CardContent>
          </Card>
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

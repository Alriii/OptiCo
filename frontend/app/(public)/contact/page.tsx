import Link from "next/link";
import { ArrowRight, Clock, Mail, MapPin, Phone } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DEMO_CLINIC, DEMO_NOTICE } from "@/lib/demo-clinic";
import { CLINIC_PHOTOS } from "@/lib/clinic-media";

export default function ContactPage() {
  return (
    <div className="page-shell space-y-8 py-10 sm:py-14">
      <PageHeader
        eyebrow="Visit the clinic"
        title="Contact and location"
        description="These are sample details for development. Replace them with the clinic's real contact information before any public launch."
        actions={
          <Button asChild className="rounded-xl shadow-xs">
            <Link href="/booking">
              Book a visit <ArrowRight className="size-4" />
            </Link>
          </Button>
        }
      />

      {/* Modern Clinical Photography Banner */}
      <div className="group relative aspect-[21/9] w-full overflow-hidden rounded-3xl border border-border/80 bg-secondary shadow-sm">
        <img
          src={CLINIC_PHOTOS.hero}
          alt="OptiCo Clinic and Eyewear Studio"
          className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
        <div className="absolute bottom-5 left-6 right-6 flex flex-col justify-between gap-2 text-white sm:flex-row sm:items-end">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/80 px-2.5 py-0.5 text-[11px] font-medium backdrop-blur-xs">
              ● Open for Inquiries
            </span>
            <h2 className="mt-1.5 text-xl font-semibold tracking-tight">
              OptiCo Eyewear Studio & Diagnostic Center
            </h2>
          </div>
          <p className="text-xs text-white/80">
            {DEMO_CLINIC.address}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-3xl border border-border/80">
          <CardContent className="space-y-5 p-6 sm:p-7">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">Clinic Details</h2>
              <Badge variant="outline" className="border-primary/20 text-primary">Main Facility</Badge>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="font-medium text-foreground">Clinic Address</p>
                  <p className="text-muted-foreground">{DEMO_CLINIC.address}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Phone className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="font-medium text-foreground">Phone & Desk</p>
                  <p className="text-muted-foreground">{DEMO_CLINIC.phone}</p>
                  <p className="text-muted-foreground">{DEMO_CLINIC.mobile}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Mail className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="font-medium text-foreground">Direct Email</p>
                  <p className="text-muted-foreground">{DEMO_CLINIC.email}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-secondary/50 p-3.5 text-xs text-muted-foreground">
              {DEMO_NOTICE}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border/80">
          <CardContent className="space-y-4 p-6 sm:p-7">
            <div className="flex items-center gap-2">
              <Clock className="size-5 text-primary" aria-hidden="true" />
              <h2 className="text-lg font-semibold tracking-tight">Operating Hours</h2>
            </div>
            <dl className="divide-y divide-border/60 text-sm">
              {DEMO_CLINIC.hours.map((entry) => (
                <div
                  key={entry.day}
                  className="flex items-center justify-between gap-4 py-2.5"
                >
                  <dt className="text-muted-foreground">{entry.day}</dt>
                  <dd className="font-medium text-foreground">{entry.time}</dd>
                </div>
              ))}
            </dl>
            <p className="text-xs text-muted-foreground pt-1">
              All hours are Asia/Manila (PHT). Doctor schedules and clinic closures are managed in real time.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border border-border/80 bg-secondary/30">
        <CardContent className="space-y-2 p-6 sm:p-7">
          <h2 className="text-base font-semibold tracking-tight text-foreground">Before You Visit</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Online booking submits an appointment request. Clinic staff reviews every request to ensure appropriate doctor availability and diagnostics preparation before confirming your final schedule.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

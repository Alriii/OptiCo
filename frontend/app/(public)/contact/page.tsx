import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DEMO_CLINIC, DEMO_NOTICE } from "@/lib/demo-clinic";

export default function ContactPage() {
  return (
    <div className="page-shell space-y-8 py-10 sm:py-14">
      <PageHeader
        eyebrow="Visit the clinic"
        title="Contact and location"
        description="These are sample details for development. Replace them with the clinic's real contact information before any public launch."
        actions={<Badge variant="outline">Demo data</Badge>}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-5 px-6 py-6">
            <h2 className="text-lg font-semibold">Clinic details</h2>

            <div className="space-y-4 text-sm">
              <div className="flex gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="font-medium">Address</p>
                  <p className="text-muted-foreground">{DEMO_CLINIC.address}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Phone className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="text-muted-foreground">{DEMO_CLINIC.phone}</p>
                  <p className="text-muted-foreground">{DEMO_CLINIC.mobile}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Mail className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-muted-foreground">{DEMO_CLINIC.email}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
              {DEMO_NOTICE}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 px-6 py-6">
            <div className="flex items-center gap-2">
              <Clock className="size-5 text-primary" aria-hidden="true" />
              <h2 className="text-lg font-semibold">Operating hours</h2>
            </div>
            <dl className="divide-y text-sm">
              {DEMO_CLINIC.hours.map((entry) => (
                <div
                  key={entry.day}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <dt className="text-muted-foreground">{entry.day}</dt>
                  <dd className="font-medium">{entry.time}</dd>
                </div>
              ))}
            </dl>
            <p className="text-xs text-muted-foreground">
              All times are Asia/Manila. Clinic closures and doctor time off are
              managed by the administrator and may affect availability.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-3 px-6 py-6">
          <h2 className="text-lg font-semibold">Before you visit</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Online booking sends an appointment request, not a confirmed slot.
            Wait for the clinic's approval email before treating the time as
            final. For urgent eye concerns, call the clinic directly rather than
            relying on the online request.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            This scheduling platform does not store diagnoses, prescriptions, or
            clinical test results. Please do not send sensitive clinical details
            through the booking note.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

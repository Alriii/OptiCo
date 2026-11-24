"use client";

import { useSearchParams } from "next/navigation";
import { BookingFlow } from "@/components/public/booking-flow";
import { AuthGuard } from "@/components/features/auth/AuthGuard";
import { usePageMeta } from "@/lib/use-page-meta";

export default function BookingPage() {
  usePageMeta({
    title: "Request an Appointment",
    description:
      "Schedule your vision consultation or eye exam online. Select your service, preferred clinic date, and dedicated time slot.",
  });

  const searchParams = useSearchParams();
  const service = searchParams.get("service") || undefined;

  return (
    <AuthGuard roles={["PATIENT"]}>
      <div className="page-shell py-10 sm:py-14">
        <div className="mb-8 max-w-2xl space-y-2">
          <p className="eyebrow">Appointment Request</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Schedule Your Consultation
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            Select your clinical service, preferred date, and available time slot. Your consultation is assigned to our licensed optometry team upon booking review.
          </p>
        </div>
        <BookingFlow initialServiceId={service} />
      </div>
    </AuthGuard>
  );
}

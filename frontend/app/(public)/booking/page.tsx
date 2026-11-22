import type { Metadata } from "next";
import { BookingFlow } from "@/components/public/booking-flow";

export const metadata: Metadata = {
  title: "Request an appointment",
  description:
    "Request an optical clinic appointment. Your schedule is confirmed after clinic approval.",
};

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const { service } = await searchParams;

  return (
    <div className="page-shell py-10 sm:py-14">
      <div className="mb-8 max-w-2xl space-y-2">
        <p className="eyebrow">Appointment request</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Find a time that works
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Choose a service, date, and preferred time. The clinic reviews every
          request and assigns a qualified doctor before the appointment is
          confirmed.
        </p>
      </div>
      <BookingFlow initialServiceId={service} />
    </div>
  );
}

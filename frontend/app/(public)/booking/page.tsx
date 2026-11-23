import { useSearchParams } from "next/navigation";
import { BookingFlow } from "@/components/public/booking-flow";
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

import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ServicesDirectory } from "@/components/public/services-directory";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Services",
  description: "Optical clinic services, durations, and demo fees.",
};

export default function ServicesPage() {
  return (
    <div className="page-shell space-y-8 py-10 sm:py-14">
      <PageHeader
        eyebrow="Clinic services"
        title="Eye care, clearly explained"
        description="Choose the service that fits your concern. The clinic reviews every request and assigns an available doctor at approval."
        actions={
          <Button asChild>
            <Link href="/booking">
              <CalendarCheck className="size-4" /> Request an appointment
            </Link>
          </Button>
        }
      />
      <ServicesDirectory />
    </div>
  );
}

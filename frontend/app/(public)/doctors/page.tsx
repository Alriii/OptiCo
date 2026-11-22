import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DoctorsDirectory } from "@/components/public/doctors-directory";
import { Button } from "@/components/ui/button";

export default function DoctorsPage() {
  return (
    <div className="page-shell space-y-8 py-10 sm:py-14">
      <PageHeader
        eyebrow="Care team"
        title="People who look after your eyes"
        description="Public profiles only. Availability notes, personal contact details, and staff account information stay private."
        actions={
          <Button asChild>
            <Link href="/booking">
              <CalendarCheck className="size-4" /> Request an appointment
            </Link>
          </Button>
        }
      />
      <DoctorsDirectory />
    </div>
  );
}

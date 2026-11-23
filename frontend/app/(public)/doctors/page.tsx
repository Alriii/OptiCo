import { PageHeader } from "@/components/shared/page-header";
import { DoctorsDirectory } from "@/components/public/doctors-directory";

export default function DoctorsPage() {
  return (
    <div className="page-shell space-y-8 py-10 sm:py-14">
      <PageHeader
        eyebrow="Care team"
        title="People who look after your eyes"
        description="Select a doctor to view their profile, credentials, and scheduled clinic availability."
      />
      <DoctorsDirectory />
    </div>
  );
}

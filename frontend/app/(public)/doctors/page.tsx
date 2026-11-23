import { PageHeader } from "@/components/shared/page-header";
import { DoctorsDirectory } from "@/components/public/doctors-directory";
import { usePageMeta } from "@/lib/use-page-meta";

export default function DoctorsPage() {
  usePageMeta({
    title: "Optometry Care Team",
    description:
      "Meet our licensed optometrists and ocular health specialists at OptiCo. Experienced in refraction, dry eye management, and pediatric care.",
  });

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

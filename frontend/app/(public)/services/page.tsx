import { PageHeader } from "@/components/shared/page-header";
import { ServicesDirectory } from "@/components/public/services-directory";

export default function ServicesPage() {
  return (
    <div className="page-shell space-y-8 py-10 sm:py-14">
      <PageHeader
        eyebrow="Clinic services"
        title="Eye care, clearly explained"
        description="Choose the service that fits your concern. Select any service below to proceed with your booking."
      />
      <ServicesDirectory />
    </div>
  );
}

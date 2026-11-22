import { useParams } from "next/navigation";
import { DoctorProfile } from "@/components/public/doctor-profile";

export default function DoctorProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  return (
    <div className="page-shell py-10 sm:py-14">
      <DoctorProfile slug={slug ?? ""} />
    </div>
  );
}

import type { Metadata } from "next";
import { DoctorProfile } from "@/components/public/doctor-profile";

export const metadata: Metadata = {
  title: "Doctor profile",
  description: "Public profile for an OptiCo clinic doctor.",
};

export default async function DoctorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="page-shell py-10 sm:py-14">
      <DoctorProfile slug={slug} />
    </div>
  );
}

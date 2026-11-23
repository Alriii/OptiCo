"use client";

import { PageHeader } from "@/components/shared/page-header";
import { StaffAppointments } from "@/components/portal/staff-appointments";
import { usePageMeta } from "@/lib/use-page-meta";

export default function StaffAppointmentsPage() {
  usePageMeta({
    title: "Clinic Appointments",
    description: "Comprehensive appointment schedule and status triage for clinic staff.",
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Appointments"
        title="Clinic appointment list"
        description="Filter by status or clinic date. Every destructive action asks for confirmation and keeps an audit record."
      />
      <StaffAppointments />
    </div>
  );
}

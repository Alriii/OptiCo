"use client";

import { PageHeader } from "@/components/shared/page-header";
import { DoctorSchedule } from "@/components/portal/doctor-schedule";

export default function DoctorDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Doctor portal"
        title="Today at the clinic"
        description="Your assigned schedule for today. Only appointments confirmed to you appear here."
      />
      <DoctorSchedule />
    </div>
  );
}

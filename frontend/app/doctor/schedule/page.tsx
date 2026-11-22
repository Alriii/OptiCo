"use client";

import { PageHeader } from "@/components/shared/page-header";
import { DoctorSchedule } from "@/components/portal/doctor-schedule";

export default function DoctorSchedulePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Schedule"
        title="Assigned appointments"
        description="Choose a date to review your confirmed schedule. Status actions follow the clinic's allowed transitions."
      />
      <DoctorSchedule allowDateChange />
    </div>
  );
}

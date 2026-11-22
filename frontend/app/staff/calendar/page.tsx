"use client";

import { PageHeader } from "@/components/shared/page-header";
import { StaffAppointments } from "@/components/portal/staff-appointments";
import { todayInClinic } from "@/lib/format";

export default function StaffCalendarPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Calendar"
        title="Day list"
        description="A chronological view of the clinic day. Choose another date to review a different schedule."
      />
      <StaffAppointments
        initialDate={todayInClinic()}
        showStatusFilter={false}
        showDateFilter
      />
    </div>
  );
}

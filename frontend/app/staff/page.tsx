"use client";

import { PageHeader } from "@/components/shared/page-header";
import { StaffAppointments } from "@/components/portal/staff-appointments";

export default function StaffQueuePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reception"
        title="Pending request queue"
        description="Review online requests. Approval rechecks the requested time and assigns a qualified, available doctor; a pending request does not hold a slot."
      />
      <StaffAppointments fixedStatus="PENDING" showStatusFilter={false} />
    </div>
  );
}

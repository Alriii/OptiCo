import { PolicyPage } from "@/components/public/policy-page";

export default function CancellationPage() {
  return (
    <PolicyPage
      eyebrow="Cancellations"
      title="Cancellation and rescheduling"
      summary="How to change an appointment and what happens after a request is sent."
      sections={[
        {
          heading: "Sending a request",
          body: [
            "Registered patients can request cancellation or rescheduling from the patient portal. Guests can use the secure link in their booking email.",
            "A request is not an immediate cancellation. The appointment remains on the schedule until clinic staff confirm the change.",
          ],
        },
        {
          heading: "Cutoff window",
          body: [
            "The clinic sets a cancellation cutoff, initially a configurable number of hours before the appointment. Requests inside the cutoff may need direct clinic approval.",
            "If a reschedule is approved, the clinic rechecks availability and may assign a different doctor.",
          ],
        },
        {
          heading: "Clinic-initiated changes",
          body: [
            "The clinic may cancel or reschedule when a doctor becomes unavailable, a closure is declared, or a scheduling conflict cannot be resolved.",
            "The clinic will contact the patient using the details on the booking and record the change in its audit trail.",
          ],
        },
        {
          heading: "No-shows",
          body: [
            "A confirmed appointment may be marked as a no-show when the patient does not arrive. Repeated no-shows may affect future booking options at the clinic's discretion.",
          ],
        },
      ]}
    />
  );
}

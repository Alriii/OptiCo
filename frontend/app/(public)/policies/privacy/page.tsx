import { PolicyPage } from "@/components/public/policy-page";

export default function PrivacyPage() {
  return (
    <PolicyPage
      eyebrow="Privacy"
      title="Privacy notice"
      summary="What the clinic collects for scheduling, why it is needed, and the choices available to patients and guests."
      sections={[
        {
          heading: "Information we collect",
          body: [
            "For an appointment request, the clinic needs the patient's name, email address, mobile number, date of birth when age matters, the selected service, and the requested date and time. An optional booking note is limited to operational context.",
            "Guest bookings create a secure, appointment-scoped link. The clinic stores only a hash of the guest token and never uses it as an account login.",
          ],
        },
        {
          heading: "Why we collect it",
          body: [
            "The information is used to review and schedule the appointment, contact the patient about the outcome, manage cancellations or reschedules, and keep an auditable operational record.",
            "The platform is a scheduling tool, not an electronic medical record. Do not send diagnoses, prescriptions, visual acuity results, or other clinical details through booking fields.",
          ],
        },
        {
          heading: "Sharing and retention",
          body: [
            "Appointment details are visible only to the patient or guest linked to the booking and to authorized clinic staff who need them for scheduling and clinical care operations.",
            "Retention periods, processor arrangements, and data-subject request procedures must be confirmed by the clinic before real patient data is entered.",
          ],
        },
        {
          heading: "Your choices",
          body: [
            "You may request a correction to your contact details, ask about your appointment record, or request cancellation according to clinic policy. Guest users can use the secure link in their booking email.",
            "A registered patient can update permitted profile fields in the patient portal.",
          ],
        },
      ]}
    />
  );
}

import type { Metadata } from "next";
import { PolicyPage } from "@/components/public/policy-page";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "Terms for using the demo clinic scheduling platform.",
};

export default function TermsPage() {
  return (
    <PolicyPage
      eyebrow="Terms"
      title="Terms of use"
      summary="The ground rules for using the online scheduling platform."
      sections={[
        {
          heading: "Appointment requests",
          body: [
            "Submitting the booking form creates a request, not a confirmed appointment. A requested time is not reserved. The clinic reviews the request and confirms it only after assigning a qualified, available doctor.",
            "The clinic may reject a request or propose another time when the requested slot cannot be staffed.",
          ],
        },
        {
          heading: "Accurate information",
          body: [
            "Provide accurate contact details so the clinic can reach you about the appointment. For a minor, a parent or guardian must be identified and reachable.",
            "Do not use another person's details without permission, and do not attempt to access bookings that are not yours.",
          ],
        },
        {
          heading: "No medical advice",
          body: [
            "The platform does not provide diagnosis, treatment, or prescriptions. Content on this site is operational information, not medical advice.",
            "For urgent eye symptoms, contact the clinic or emergency services directly.",
          ],
        },
        {
          heading: "Acceptable use",
          body: [
            "Do not probe, scrape, or attempt to bypass access controls. Do not submit malicious content or interfere with clinic operations.",
            "The clinic may suspend access when these terms are violated or when needed to protect patients and staff.",
          ],
        },
      ]}
    />
  );
}

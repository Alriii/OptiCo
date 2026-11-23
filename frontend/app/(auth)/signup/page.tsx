"use client";

import { SignupForm } from "@/components/features/auth/SignupForm";
import { usePageMeta } from "@/lib/use-page-meta";

export default function SignupPage() {
  usePageMeta({
    title: "Create Patient Account",
    description: "Register for an OptiCo patient account for convenient visit history and bookings.",
  });

  return <SignupForm />;
}

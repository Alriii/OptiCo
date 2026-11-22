import type { Metadata } from "next";
import { SignupForm } from "@/components/features/auth/SignupForm";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create an OptiCo patient account.",
};

export default function SignupPage() {
  return <SignupForm />;
}

import type { Metadata } from "next";
import { LoginForm } from "@/components/features/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your OptiCo patient or clinic portal.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string; invited?: string }>;
}) {
  const params = await searchParams;

  return (
    <LoginForm
      registered={params.registered === "1"}
      invited={params.invited === "1"}
    />
  );
}

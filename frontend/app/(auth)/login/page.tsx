"use client";

import { useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/features/auth/LoginForm";
import { usePageMeta } from "@/lib/use-page-meta";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "1";
  const invited = searchParams.get("invited") === "1";

  usePageMeta({
    title: "Sign In",
    description: "Sign in to access your OptiCo patient appointments and clinic portal.",
  });

  return <LoginForm registered={registered} invited={invited} />;
}

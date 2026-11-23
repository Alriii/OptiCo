"use client";

import { useSearchParams } from "next/navigation";
import { AcceptInviteForm } from "@/components/features/auth/AcceptInviteForm";
import { usePageMeta } from "@/lib/use-page-meta";

export default function AcceptInvitePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || undefined;

  usePageMeta({
    title: "Accept Staff Invitation",
    description: "Join the OptiCo clinical team and configure your account.",
  });

  return <AcceptInviteForm token={token} />;
}

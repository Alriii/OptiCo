import type { Metadata } from "next";
import { AcceptInviteForm } from "@/components/features/auth/AcceptInviteForm";

export const metadata: Metadata = {
  title: "Accept invitation",
  description: "Set a password for an invited OptiCo clinic staff account.",
  robots: { index: false, follow: false },
};

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return <AcceptInviteForm token={token} />;
}

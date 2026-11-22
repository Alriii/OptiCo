import { useSearchParams } from "next/navigation";
import { AcceptInviteForm } from "@/components/features/auth/AcceptInviteForm";

export default function AcceptInvitePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || undefined;

  return <AcceptInviteForm token={token} />;
}

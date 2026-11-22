import { AuthGuard } from "@/components/features/auth/AuthGuard";
import { PortalShell } from "@/components/shared/portal-shell";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard roles={["PATIENT"]}>
      <PortalShell role="PATIENT">{children}</PortalShell>
    </AuthGuard>
  );
}

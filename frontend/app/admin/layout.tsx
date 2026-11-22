import { AuthGuard } from "@/components/features/auth/AuthGuard";
import { PortalShell } from "@/components/shared/portal-shell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard roles={["ADMIN"]}>
      <PortalShell role="ADMIN">{children}</PortalShell>
    </AuthGuard>
  );
}

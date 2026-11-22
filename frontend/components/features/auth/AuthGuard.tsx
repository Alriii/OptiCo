"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { portalPathForRole, hasRole } from "@/lib/auth-redirect";
import { LoadingState } from "@/components/shared/loading-state";

interface AuthGuardProps {
  children: React.ReactNode;
  /** Roles allowed to render. Omit for any authenticated user. */
  roles?: readonly string[];
  /** Auth pages: authenticated users are sent to their portal. */
  guestOnly?: boolean;
}

export function AuthGuard({ children, roles, guestOnly = false }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const allowed = user ? !roles?.length || hasRole(user.role, roles) : false;
  const shouldRedirect = guestOnly ? Boolean(user) : !user || !allowed;

  useEffect(() => {
    if (isLoading) return;

    if (guestOnly) {
      if (user) router.replace(portalPathForRole(user.role));
      return;
    }

    if (!user) {
      const next = encodeURIComponent(pathname || "/");
      router.replace(`/login?next=${next}`);
      return;
    }

    if (!allowed) {
      router.replace(portalPathForRole(user.role));
    }
  }, [isLoading, guestOnly, user, allowed, router, pathname]);

  if (isLoading || shouldRedirect) {
    return (
      <LoadingState
        title="Checking your session"
        description="One moment while we open the right workspace."
        fullScreen
      />
    );
  }

  return <>{children}</>;
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { portalPathForRole } from "@/lib/auth-redirect";
import { LoadingState } from "@/components/shared/loading-state";

/**
 * Role-agnostic landing point for optimistic middleware redirects.
 * The session, not the URL, decides the destination.
 */
export default function PortalRedirectPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    router.replace(user ? portalPathForRole(user.role) : "/login");
  }, [user, isLoading, router]);

  return (
    <LoadingState
      title="Opening your portal"
      description="We are matching your account to the right workspace."
      fullScreen
    />
  );
}

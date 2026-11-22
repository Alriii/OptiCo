export type Role = "PATIENT" | "DOCTOR" | "RECEPTIONIST" | "ADMIN";

export const ROLE_LABELS: Record<Role, string> = {
  PATIENT: "Patient",
  DOCTOR: "Doctor",
  RECEPTIONIST: "Receptionist",
  ADMIN: "Administrator",
};

/**
 * Single source of truth for post-login destinations. Unknown roles land on
 * the public site instead of a random portal.
 */
export function portalPathForRole(role?: string | null): string {
  switch (role?.toUpperCase()) {
    case "PATIENT":
      return "/patient";
    case "DOCTOR":
      return "/doctor";
    case "RECEPTIONIST":
      return "/staff";
    case "ADMIN":
      return "/admin";
    default:
      return "/";
  }
}

export function hasRole(
  userRole: string | null | undefined,
  allowed: readonly string[],
): boolean {
  if (!userRole) return false;
  return allowed.some(
    (role) => role.toUpperCase() === userRole.toUpperCase(),
  );
}

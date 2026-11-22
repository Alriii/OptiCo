export const MINOR_AGE = 18;

/**
 * Age in whole years on a reference date. Uses UTC parts so a browser in a
 * different timezone cannot shift a birthday across a day boundary.
 */
export function ageOnDate(
  dateOfBirth: string | Date | null | undefined,
  reference: Date = new Date(),
): number | null {
  if (!dateOfBirth) return null;

  const dob =
    dateOfBirth instanceof Date ? dateOfBirth : new Date(`${dateOfBirth}T00:00:00Z`);
  if (Number.isNaN(dob.getTime())) return null;

  const year = reference.getUTCFullYear();
  const month = reference.getUTCMonth();
  const day = reference.getUTCDate();

  let age = year - dob.getUTCFullYear();
  const monthDiff = month - dob.getUTCMonth();

  if (monthDiff < 0 || (monthDiff === 0 && day < dob.getUTCDate())) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

export function isMinor(
  dateOfBirth: string | Date | null | undefined,
  reference: Date = new Date(),
): boolean {
  const age = ageOnDate(dateOfBirth, reference);
  return age !== null && age < MINOR_AGE;
}

/**
 * The appointment date is the policy date, not the booking date. A patient
 * who turns 18 before the visit does not need guardian details.
 */
export function requiresGuardian(
  dateOfBirth: string | null | undefined,
  appointmentDate?: string | null,
): boolean {
  if (!dateOfBirth) return false;

  const reference = appointmentDate
    ? new Date(`${appointmentDate}T00:00:00Z`)
    : new Date();

  if (Number.isNaN(reference.getTime())) return false;
  return isMinor(dateOfBirth, reference);
}

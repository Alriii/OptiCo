import { ENV } from "@/config/env";
import type { UserRole } from "@/db/schema";
import { AppError } from "@/lib/http";
import { generateOpaqueToken, hashToken } from "@/lib/tokens";
import { StaffInviteRepository } from "@/repositories/staff-invite-repository";
import { UserRepository } from "@/repositories/user-repository";
import { recordAudit } from "@/services/audit-service";
import { toSessionUser } from "@/services/auth/types";
import { enqueueEmail } from "@/services/notifications/email-service";

const userRepository = new UserRepository();
const inviteRepository = new StaffInviteRepository();
const INVITE_TTL_DAYS = 7;

export async function createStaffInviteService(
  input: { email: string; name: string; role: UserRole },
  actorUserId: string,
) {
  if (input.role === "PATIENT") throw new AppError(400, "Patients cannot be created through staff invitations");

  const email = input.email.trim().toLowerCase();
  const existing = await userRepository.findByEmail(email);

  let user;
  if (existing) {
    if (existing.status !== "INVITED") throw new AppError(409, "An account with this email already exists");
    if (existing.role !== input.role) await userRepository.setRole(existing.id, input.role);
    user = (await userRepository.findById(existing.id))!;
  } else {
    user = await userRepository.createInvitedStaff({ email, name: input.name.trim(), role: input.role });
  }

  const rawToken = generateOpaqueToken(32);
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
  await inviteRepository.create({
    email,
    role: input.role,
    tokenHash: hashToken(rawToken),
    expiresAt,
    invitedByUserId: actorUserId,
  });

  const link = `${ENV.APP_PUBLIC_URL}/accept-invite#token=${rawToken}`;
  await enqueueEmail({
    dedupeKey: `staff_invite:${user.id}:${expiresAt.toISOString()}`,
    recipient: email,
    templateKey: "staff_invite",
    payload: {
      name: user.name,
      role: input.role,
      link,
      expiresAt: expiresAt.toISOString().slice(0, 10),
    },
  });

  await recordAudit({
    actorUserId,
    action: "staff.invite_created",
    entityType: "user",
    entityId: user.id,
    metadata: { role: input.role },
  });

  return { user: toSessionUser(user), expiresAt };
}

export async function updateStaffService(
  staffId: string,
  input: { status?: "ACTIVE" | "DISABLED"; role?: UserRole },
  actorUserId: string,
) {
  if (staffId === actorUserId) throw new AppError(400, "You cannot change your own staff account");

  const user = await userRepository.findById(staffId);
  if (!user || user.role === "PATIENT") throw new AppError(404, "Staff account not found");

  if (input.status === "ACTIVE" && user.status === "INVITED") {
    throw new AppError(400, "The account must accept its invitation first");
  }

  let updated = user;
  if (input.role && input.role !== user.role) {
    updated = await userRepository.setRole(staffId, input.role);
  }
  if (input.status) {
    updated = await userRepository.setStatus(staffId, input.status);
  }

  await recordAudit({
    actorUserId,
    action: "staff.updated",
    entityType: "user",
    entityId: staffId,
    metadata: { status: input.status, role: input.role },
  });

  return { user: toSessionUser(updated) };
}

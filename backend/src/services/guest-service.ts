import { AppError } from "@/lib/http";
import { hashToken } from "@/lib/tokens";
import { AppointmentRepository } from "@/repositories/appointment-repository";
import { GuestTokenRepository } from "@/repositories/guest-token-repository";
import { recordAudit } from "@/services/audit-service";
import { toGuestAppointmentView } from "@/services/booking-service";

const guestTokenRepository = new GuestTokenRepository();
const appointmentRepository = new AppointmentRepository();

export async function exchangeGuestTokenService(token: string) {
  if (!token) throw new AppError(401, "This link is invalid or has expired");

  const row = await guestTokenRepository.findUsableByHash(hashToken(token));
  if (!row) throw new AppError(401, "This link is invalid or has expired");

  const used = await guestTokenRepository.markUsed(row.id);
  if (!used) throw new AppError(401, "This link is invalid or has expired");

  const detail = await appointmentRepository.findDetailById(row.appointmentId);
  if (!detail) throw new AppError(401, "This link is invalid or has expired");

  await recordAudit({
    actorType: "GUEST",
    action: "guest.token_exchanged",
    entityType: "appointment",
    entityId: row.appointmentId,
    metadata: { reference: detail.reference },
  });

  return { appointmentId: row.appointmentId, appointment: toGuestAppointmentView(detail) };
}

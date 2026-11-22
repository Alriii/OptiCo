import type { PaymentMethod } from "@/db/schema";
import { AppError } from "@/lib/http";
import { calculatePaymentBalance, roundMoney } from "@/lib/payment";
import { AppointmentRepository } from "@/repositories/appointment-repository";
import { PaymentRepository } from "@/repositories/payment-repository";
import { recordAudit } from "@/services/audit-service";

const paymentRepository = new PaymentRepository();
const appointmentRepository = new AppointmentRepository();

const PAYABLE_STATUSES = ["CONFIRMED", "CHECKED_IN", "IN_PROGRESS", "COMPLETED"];

async function loadAppointment(appointmentId: string) {
  const appointment = await appointmentRepository.findById(appointmentId);
  if (!appointment) throw new AppError(404, "Appointment not found");
  if (!PAYABLE_STATUSES.includes(appointment.status)) {
    throw new AppError(409, "Payments can only be recorded for confirmed or completed appointments");
  }
  return appointment;
}

export async function getPaymentBalanceService(appointmentId: string) {
  const appointment = await appointmentRepository.findById(appointmentId);
  if (!appointment) throw new AppError(404, "Appointment not found");
  const payments = await paymentRepository.listByAppointment(appointmentId);
  return calculatePaymentBalance(appointment.fee, payments);
}

export async function recordPaymentService(
  input: {
    appointmentId: string;
    amount: number;
    method: PaymentMethod;
    receiptNumber?: string | null;
    note?: string | null;
    paidAt?: Date;
  },
  actorUserId: string,
) {
  const appointment = await loadAppointment(input.appointmentId);
  if (!Number.isFinite(input.amount) || roundMoney(input.amount) <= 0) {
    throw new AppError(400, "Payment amount must be greater than zero");
  }

  const payment = await paymentRepository.create({
    appointmentId: appointment.id,
    amount: roundMoney(input.amount).toFixed(2),
    currency: "PHP",
    method: input.method,
    receiptNumber: input.receiptNumber ?? null,
    recordedByUserId: actorUserId,
    paidAt: input.paidAt ?? new Date(),
    note: input.note ?? null,
  });

  await recordAudit({
    actorUserId,
    action: "payment.recorded",
    entityType: "payment",
    entityId: payment.id,
    metadata: { appointmentId: appointment.id, amount: payment.amount, method: payment.method },
  });

  const balance = await getPaymentBalanceService(appointment.id);
  return { payment, balance };
}

export async function listPaymentsService(appointmentId: string) {
  const appointment = await appointmentRepository.findById(appointmentId);
  if (!appointment) throw new AppError(404, "Appointment not found");
  const payments = await paymentRepository.listByAppointment(appointmentId);
  return { payments, balance: calculatePaymentBalance(appointment.fee, payments) };
}

export async function reversePaymentService(paymentId: string, actorUserId: string, reason: string) {
  const original = await paymentRepository.findById(paymentId);
  if (!original) throw new AppError(404, "Payment not found");
  if (original.reversesPaymentId) throw new AppError(409, "A reversal cannot be reversed");
  if (await paymentRepository.findReversalOf(paymentId)) {
    throw new AppError(409, "This payment has already been reversed");
  }

  const reversal = await paymentRepository.create({
    appointmentId: original.appointmentId,
    amount: original.amount,
    currency: "PHP",
    method: original.method,
    receiptNumber: null,
    recordedByUserId: actorUserId,
    paidAt: new Date(),
    note: reason,
    reversesPaymentId: original.id,
  });

  await recordAudit({
    actorUserId,
    action: "payment.reversed",
    entityType: "payment",
    entityId: reversal.id,
    metadata: { reversesPaymentId: original.id, amount: original.amount },
  });

  const balance = await getPaymentBalanceService(original.appointmentId);
  return { payment: reversal, balance };
}

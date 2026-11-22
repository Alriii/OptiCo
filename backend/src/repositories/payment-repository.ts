import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { payments, type PaymentMethod } from "@/db/schema";

export type CreatePaymentInput = {
  appointmentId: string;
  amount: string;
  currency?: string;
  method: PaymentMethod;
  receiptNumber?: string | null;
  recordedByUserId?: string | null;
  paidAt?: Date;
  note?: string | null;
  reversesPaymentId?: string | null;
};

export class PaymentRepository {
  async create(input: CreatePaymentInput) {
    const [row] = await db.insert(payments).values(input).returning();
    return row;
  }

  async findById(id: string) {
    const [row] = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
    return row;
  }

  async listByAppointment(appointmentId: string) {
    return db
      .select()
      .from(payments)
      .where(eq(payments.appointmentId, appointmentId))
      .orderBy(asc(payments.createdAt));
  }

  async listActiveByAppointment(appointmentId: string) {
    return db
      .select()
      .from(payments)
      .where(and(eq(payments.appointmentId, appointmentId), isNull(payments.reversesPaymentId)))
      .orderBy(desc(payments.createdAt));
  }

  async findReversalOf(paymentId: string) {
    const [row] = await db.select().from(payments).where(eq(payments.reversesPaymentId, paymentId)).limit(1);
    return row;
  }
}

import { and, count, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";

export type AuditInput = {
  actorUserId?: string | null;
  actorType?: "USER" | "GUEST" | "SYSTEM";
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  requestId?: string | null;
};

export type AuditFilters = {
  entityType?: string;
  action?: string;
  actorUserId?: string;
  from?: Date;
  to?: Date;
};

export class AuditRepository {
  async append(input: AuditInput) {
    const [row] = await db.insert(auditLogs).values(input).returning();
    return row;
  }

  async list(filters: AuditFilters, page: number, limit: number) {
    const conditions: SQL[] = [];
    if (filters.entityType) conditions.push(eq(auditLogs.entityType, filters.entityType));
    if (filters.action) conditions.push(eq(auditLogs.action, filters.action));
    if (filters.actorUserId) conditions.push(eq(auditLogs.actorUserId, filters.actorUserId));
    if (filters.from) conditions.push(gte(auditLogs.createdAt, filters.from));
    if (filters.to) conditions.push(lte(auditLogs.createdAt, filters.to));

    const where = conditions.length ? and(...conditions) : undefined;
    const rows = await db
      .select()
      .from(auditLogs)
      .where(where)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    const [totalRow] = await db.select({ total: count() }).from(auditLogs).where(where);
    return { rows, logs: rows, auditLogs: rows, total: Number(totalRow.total) };
  }
}

import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { services } from "@/db/schema";

export type ServiceInput = {
  slug: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
  fee: string;
  isActive?: boolean;
  displayOrder?: number;
};

export class ServiceRepository {
  async listActive() {
    return db.select().from(services).where(eq(services.isActive, true)).orderBy(asc(services.displayOrder), asc(services.name));
  }

  async listAll() {
    return db.select().from(services).orderBy(asc(services.displayOrder), asc(services.name));
  }

  async findById(id: string) {
    const [service] = await db.select().from(services).where(eq(services.id, id)).limit(1);
    return service;
  }

  async findBySlug(slug: string) {
    const [service] = await db.select().from(services).where(eq(services.slug, slug)).limit(1);
    return service;
  }

  async create(input: ServiceInput) {
    const [service] = await db.insert(services).values(input).returning();
    return service;
  }

  async update(id: string, input: Partial<ServiceInput>) {
    const [service] = await db
      .update(services)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();
    return service;
  }

  async countActive() {
    const [row] = await db.select({ total: sql<number>`count(*)::int` }).from(services).where(eq(services.isActive, true));
    return row.total;
  }
}

import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { clinicSettings } from "@/db/schema";

export type ClinicSettingsInput = Partial<{
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  cancellationCutoffHours: number;
  guestLinkTtlHours: number;
}>;

export class SettingsRepository {
  async get() {
    const [row] = await db.select().from(clinicSettings).orderBy(asc(clinicSettings.id)).limit(1);
    return row;
  }

  async update(input: ClinicSettingsInput) {
    const current = await this.get();
    if (!current) throw new Error("Clinic settings row is missing");
    const [row] = await db
      .update(clinicSettings)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(clinicSettings.id, current.id))
      .returning();
    return row;
  }
}

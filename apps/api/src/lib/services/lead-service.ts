import { eq, sql } from "drizzle-orm";
import { db } from "$/db";
import {
  type ActivityKind,
  type LeadSource,
  leadActivitiesTable,
  leadsTable,
} from "$/db/schema";
import { normalizePhone } from "$/lib/utils";

type LeadInput = {
  name: string;
  phone: string;
  email?: string | null;
  city?: string | null;
  source: LeadSource;
  tags?: string[];
};

class LeadService {
  /**
   * Finds the lead by normalised phone or creates it. An existing lead keeps
   * its status, but picks up missing email/city and any new tags, and is
   * bumped back to "new" only if it had been closed.
   */
  async upsertFromPublic(input: LeadInput) {
    const phone = normalizePhone(input.phone);
    const [existing] = await db
      .select()
      .from(leadsTable)
      .where(eq(leadsTable.phone, phone))
      .limit(1);

    if (existing) {
      const tags = Array.from(
        new Set([...(existing.tags ?? []), ...(input.tags ?? [])]),
      );
      const [row] = await db
        .update(leadsTable)
        .set({
          email: existing.email || input.email || null,
          city: existing.city || input.city || null,
          tags,
          status: existing.status === "closed" ? "new" : existing.status,
        })
        .where(eq(leadsTable.id, existing.id))
        .returning();
      return { lead: row ?? existing, created: false };
    }

    const [row] = await db
      .insert(leadsTable)
      .values({
        name: input.name.trim(),
        phone,
        email: input.email || null,
        city: input.city || null,
        source: input.source,
        tags: input.tags ?? [],
      })
      .returning();
    if (!row) throw new Error("Failed to create lead");
    await this.log(row.id, "created", `Lead created from ${input.source}`);
    return { lead: row, created: true };
  }

  async log(
    leadId: number,
    kind: ActivityKind,
    message: string,
    adminId?: number | null,
  ) {
    await db
      .insert(leadActivitiesTable)
      .values({ leadId, kind, message, adminId: adminId ?? null });
  }

  async touch(leadId: number) {
    await db
      .update(leadsTable)
      .set({ lastContactedAt: sql`now()` })
      .where(eq(leadsTable.id, leadId));
  }
}

export const leadService = new LeadService();

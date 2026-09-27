import {
  and,
  arrayContains,
  count,
  desc,
  eq,
  ilike,
  or,
  sql,
} from "drizzle-orm";
import Elysia, { t } from "elysia";
import { db } from "$/db";
import {
  contactQueriesTable,
  followUpsTable,
  leadActivitiesTable,
  leadNotesTable,
  leadPriorities,
  leadSources,
  leadStatuses,
  leadsTable,
  studioBookingsTable,
} from "$/db/schema";
import { leadService } from "$/lib/services/lead-service";
import { csvEscape, fail, normalizePhone, ok } from "$/lib/utils";
import { tEnum } from "$/lib/utils/schema";
import { protectedAdmin } from "$/pre-processor";

const leadFilterQuery = t.Object({
  search: t.Optional(t.String()),
  status: t.Optional(tEnum(leadStatuses)),
  source: t.Optional(tEnum(leadSources)),
  tag: t.Optional(t.String()),
  page: t.Optional(t.String()),
  pageSize: t.Optional(t.String()),
});

type LeadFilter = typeof leadFilterQuery.static;

export function leadWhere(q: Omit<LeadFilter, "page" | "pageSize">) {
  const s = q.search?.trim();
  return and(
    s
      ? or(
          ilike(leadsTable.name, `%${s}%`),
          ilike(leadsTable.phone, `%${s.replace(/\D/g, "") || s}%`),
          ilike(leadsTable.email, `%${s}%`),
          ilike(leadsTable.city, `%${s}%`),
        )
      : undefined,
    q.status ? eq(leadsTable.status, q.status) : undefined,
    q.source ? eq(leadsTable.source, q.source) : undefined,
    q.tag ? arrayContains(leadsTable.tags, [q.tag]) : undefined,
  );
}

const leadPatch = t.Object({
  name: t.Optional(t.String({ minLength: 2 })),
  phone: t.Optional(t.String({ minLength: 10 })),
  email: t.Optional(t.Nullable(t.String())),
  city: t.Optional(t.Nullable(t.String())),
  status: t.Optional(tEnum(leadStatuses)),
  priority: t.Optional(tEnum(leadPriorities)),
  tags: t.Optional(t.Array(t.String())),
  whatsappOptIn: t.Optional(t.Boolean()),
});

export const adminLeadsController = new Elysia({
  name: "admin_leads_controller",
  prefix: "/leads",
})
  .use(protectedAdmin)
  .get(
    "/",
    async ({ query }) => {
      const page = Math.max(1, Number(query.page ?? 1));
      const pageSize = Math.min(100, Math.max(5, Number(query.pageSize ?? 20)));
      const where = leadWhere(query);

      const [rows, [total], pendingCounts] = await Promise.all([
        db
          .select()
          .from(leadsTable)
          .where(where)
          .orderBy(desc(leadsTable.createdAt))
          .limit(pageSize)
          .offset((page - 1) * pageSize),
        db.select({ n: count() }).from(leadsTable).where(where),
        db
          .select({
            leadId: followUpsTable.leadId,
            next: sql<Date>`min(${followUpsTable.dueAt})`,
          })
          .from(followUpsTable)
          .where(eq(followUpsTable.status, "pending"))
          .groupBy(followUpsTable.leadId),
      ]);
      const nextMap = new Map(pendingCounts.map((p) => [p.leadId, p.next]));
      return ok({
        rows: rows.map((r) => ({
          ...r,
          nextFollowUp: nextMap.get(r.id) ?? null,
        })),
        total: total?.n ?? 0,
        page,
        pageSize,
      });
    },
    { query: leadFilterQuery },
  )
  .get("/tags", async () => {
    const rows = await db.execute<{ tag: string }>(
      sql`select distinct unnest(${leadsTable.tags}) as tag from ${leadsTable} order by tag`,
    );
    return ok(rows.map((r) => r.tag));
  })
  .get(
    "/export",
    async ({ query, set }) => {
      const rows = await db
        .select()
        .from(leadsTable)
        .where(leadWhere(query))
        .orderBy(desc(leadsTable.createdAt));
      const header = [
        "id",
        "name",
        "phone",
        "email",
        "city",
        "source",
        "status",
        "priority",
        "tags",
        "whatsappOptIn",
        "lastContactedAt",
        "createdAt",
      ] as const;
      const csv = [
        header.join(","),
        ...rows.map((r) =>
          header
            .map((h) => {
              const v = r[h];
              return csvEscape(v instanceof Date ? v.toISOString() : v);
            })
            .join(","),
        ),
      ].join("\n");
      set.headers["content-type"] = "text/csv; charset=utf-8";
      set.headers["content-disposition"] =
        `attachment; filename="shimlawale-leads-${new Date().toISOString().slice(0, 10)}.csv"`;
      return csv;
    },
    { query: leadFilterQuery },
  )
  .post(
    "/",
    async ({ body, admin, status }) => {
      const phone = normalizePhone(body.phone);
      const [dupe] = await db
        .select({ id: leadsTable.id })
        .from(leadsTable)
        .where(eq(leadsTable.phone, phone))
        .limit(1);
      if (dupe)
        return status(409, fail(`A lead with this phone exists (#${dupe.id})`));

      const [row] = await db
        .insert(leadsTable)
        .values({
          name: body.name.trim(),
          phone,
          email: body.email || null,
          city: body.city || null,
          source: body.source ?? "manual",
          priority: body.priority ?? "medium",
          tags: body.tags ?? [],
          assignedTo: admin.id,
        })
        .returning();
      if (!row) return status(500, fail("Could not create lead"));
      await leadService.log(row.id, "created", "Lead added manually", admin.id);
      return ok(row, "Lead created");
    },
    {
      body: t.Object({
        name: t.String({ minLength: 2 }),
        phone: t.String({ minLength: 10 }),
        email: t.Optional(t.String()),
        city: t.Optional(t.String()),
        source: t.Optional(tEnum(leadSources)),
        priority: t.Optional(tEnum(leadPriorities)),
        tags: t.Optional(t.Array(t.String())),
      }),
    },
  )
  .get("/:id", async ({ params, status }) => {
    const id = Number(params.id);
    const [lead] = await db
      .select()
      .from(leadsTable)
      .where(eq(leadsTable.id, id))
      .limit(1);
    if (!lead) return status(404, fail("Lead not found"));

    const [notes, followUps, activities, bookings, queries] = await Promise.all(
      [
        db
          .select()
          .from(leadNotesTable)
          .where(eq(leadNotesTable.leadId, id))
          .orderBy(desc(leadNotesTable.createdAt)),
        db
          .select()
          .from(followUpsTable)
          .where(eq(followUpsTable.leadId, id))
          .orderBy(followUpsTable.dueAt),
        db
          .select()
          .from(leadActivitiesTable)
          .where(eq(leadActivitiesTable.leadId, id))
          .orderBy(desc(leadActivitiesTable.createdAt))
          .limit(100),
        db
          .select()
          .from(studioBookingsTable)
          .where(eq(studioBookingsTable.leadId, id))
          .orderBy(desc(studioBookingsTable.createdAt)),
        db
          .select()
          .from(contactQueriesTable)
          .where(eq(contactQueriesTable.leadId, id))
          .orderBy(desc(contactQueriesTable.createdAt)),
      ],
    );
    return ok({ lead, notes, followUps, activities, bookings, queries });
  })
  .patch(
    "/:id",
    async ({ params, body, admin, status }) => {
      const id = Number(params.id);
      const [before] = await db
        .select()
        .from(leadsTable)
        .where(eq(leadsTable.id, id))
        .limit(1);
      if (!before) return status(404, fail("Lead not found"));

      const [row] = await db
        .update(leadsTable)
        .set({
          ...body,
          ...(body.phone ? { phone: normalizePhone(body.phone) } : {}),
        })
        .where(eq(leadsTable.id, id))
        .returning();

      if (body.status && body.status !== before.status) {
        await leadService.log(
          id,
          "status_changed",
          `Status: ${before.status} → ${body.status}`,
          admin.id,
        );
      } else if (body.priority && body.priority !== before.priority) {
        await leadService.log(
          id,
          "updated",
          `Priority set to ${body.priority}`,
          admin.id,
        );
      }
      return ok(row, "Lead updated");
    },
    { body: leadPatch },
  )
  .delete("/:id", async ({ params, status }) => {
    const [row] = await db
      .delete(leadsTable)
      .where(eq(leadsTable.id, Number(params.id)))
      .returning({ id: leadsTable.id });
    if (!row) return status(404, fail("Lead not found"));
    return ok(row, "Lead deleted");
  })
  .post(
    "/:id/notes",
    async ({ params, body, admin }) => {
      const leadId = Number(params.id);
      const [row] = await db
        .insert(leadNotesTable)
        .values({ leadId, adminId: admin.id, body: body.body.trim() })
        .returning();
      await leadService.log(
        leadId,
        "note_added",
        body.body.length > 80 ? `${body.body.slice(0, 80)}…` : body.body,
        admin.id,
      );
      return ok(row, "Remark added");
    },
    { body: t.Object({ body: t.String({ minLength: 1, maxLength: 4000 }) }) },
  )
  .delete("/notes/:noteId", async ({ params, status }) => {
    const [row] = await db
      .delete(leadNotesTable)
      .where(eq(leadNotesTable.id, Number(params.noteId)))
      .returning({ id: leadNotesTable.id });
    if (!row) return status(404, fail("Remark not found"));
    return ok(row, "Remark deleted");
  })
  .post(
    "/:id/whatsapp-log",
    async ({ params, body, admin }) => {
      const leadId = Number(params.id);
      await leadService.log(
        leadId,
        "whatsapp_sent",
        body.message.length > 120
          ? `${body.message.slice(0, 120)}…`
          : body.message,
        admin.id,
      );
      await leadService.touch(leadId);
      return ok(null, "Logged");
    },
    { body: t.Object({ message: t.String() }) },
  );

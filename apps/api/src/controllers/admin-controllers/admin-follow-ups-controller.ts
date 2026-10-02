import { and, eq, gte, inArray, lt } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { db } from "$/db";
import {
  followUpStatuses,
  followUpsTable,
  followUpTypes,
  kirtanBookingsTable,
  leadsTable,
} from "$/db/schema";
import { leadService } from "$/lib/services/lead-service";
import { fail, ok } from "$/lib/utils";
import { tEnum } from "$/lib/utils/schema";
import { protectedAdmin } from "$/pre-processor";

const followUpCols = {
  id: followUpsTable.id,
  leadId: followUpsTable.leadId,
  dueAt: followUpsTable.dueAt,
  type: followUpsTable.type,
  title: followUpsTable.title,
  notes: followUpsTable.notes,
  status: followUpsTable.status,
  completedAt: followUpsTable.completedAt,
  leadName: leadsTable.name,
  leadPhone: leadsTable.phone,
};

export const adminFollowUpsController = new Elysia({
  name: "admin_follow_ups_controller",
  prefix: "/follow-ups",
})
  .use(protectedAdmin)
  .get(
    "/",
    async ({ query }) => {
      const rows = await db
        .select(followUpCols)
        .from(followUpsTable)
        .innerJoin(leadsTable, eq(leadsTable.id, followUpsTable.leadId))
        .where(
          and(
            query.from
              ? gte(followUpsTable.dueAt, new Date(query.from))
              : undefined,
            query.to ? lt(followUpsTable.dueAt, new Date(query.to)) : undefined,
            query.status ? eq(followUpsTable.status, query.status) : undefined,
          ),
        )
        .orderBy(followUpsTable.dueAt)
        .limit(500);
      return ok(rows);
    },
    {
      query: t.Object({
        from: t.Optional(t.String()),
        to: t.Optional(t.String()),
        status: t.Optional(tEnum(followUpStatuses)),
      }),
    },
  )
  /** Calendar feed: follow-ups plus confirmed kirtan programs in [from, to). */
  .get(
    "/calendar",
    async ({ query }) => {
      const from = new Date(query.from);
      const to = new Date(query.to);
      const [followUps, programs] = await Promise.all([
        db
          .select(followUpCols)
          .from(followUpsTable)
          .innerJoin(leadsTable, eq(leadsTable.id, followUpsTable.leadId))
          .where(
            and(
              gte(followUpsTable.dueAt, from),
              lt(followUpsTable.dueAt, to),
              // program reminders are shown via the booking itself
              inArray(followUpsTable.type, [
                "call",
                "whatsapp",
                "visit",
                "email",
                "meeting",
              ]),
            ),
          )
          .orderBy(followUpsTable.dueAt),
        db
          .select({
            id: kirtanBookingsTable.id,
            leadId: kirtanBookingsTable.leadId,
            name: kirtanBookingsTable.name,
            subject: kirtanBookingsTable.subject,
            eventType: kirtanBookingsTable.eventType,
            city: kirtanBookingsTable.city,
            status: kirtanBookingsTable.status,
            start: kirtanBookingsTable.scheduledStart,
            end: kirtanBookingsTable.scheduledEnd,
          })
          .from(kirtanBookingsTable)
          .where(
            and(
              inArray(kirtanBookingsTable.status, ["confirmed", "completed"]),
              gte(kirtanBookingsTable.scheduledStart, from),
              lt(kirtanBookingsTable.scheduledStart, to),
            ),
          )
          .orderBy(kirtanBookingsTable.scheduledStart),
      ]);
      return ok({ followUps, programs });
    },
    { query: t.Object({ from: t.String(), to: t.String() }) },
  )
  .post(
    "/",
    async ({ body, admin }) => {
      const [row] = await db
        .insert(followUpsTable)
        .values({
          leadId: body.leadId,
          dueAt: new Date(body.dueAt),
          type: body.type,
          title: body.title.trim(),
          notes: body.notes || null,
        })
        .returning();
      await leadService.log(
        body.leadId,
        "follow_up_created",
        `${body.type} follow-up: ${body.title}`,
        admin.id,
      );
      await db
        .update(leadsTable)
        .set({ status: "follow_up" })
        .where(
          and(eq(leadsTable.id, body.leadId), eq(leadsTable.status, "new")),
        );
      return ok(row, "Follow-up scheduled");
    },
    {
      body: t.Object({
        leadId: t.Number(),
        dueAt: t.String(),
        type: tEnum(followUpTypes),
        title: t.String({ minLength: 2 }),
        notes: t.Optional(t.String()),
      }),
    },
  )
  .patch(
    "/:id",
    async ({ params, body, admin, status }) => {
      const id = Number(params.id);
      const [before] = await db
        .select()
        .from(followUpsTable)
        .where(eq(followUpsTable.id, id))
        .limit(1);
      if (!before) return status(404, fail("Follow-up not found"));

      const [row] = await db
        .update(followUpsTable)
        .set({
          ...body,
          dueAt: body.dueAt ? new Date(body.dueAt) : undefined,
          completedAt:
            body.status === "done"
              ? new Date()
              : body.status
                ? null
                : undefined,
        })
        .where(eq(followUpsTable.id, id))
        .returning();

      if (body.status === "done" && before.status !== "done") {
        await leadService.log(
          before.leadId,
          "follow_up_done",
          `Done: ${before.title}`,
          admin.id,
        );
        await leadService.touch(before.leadId);
      }
      return ok(row, "Follow-up updated");
    },
    {
      body: t.Object({
        dueAt: t.Optional(t.String()),
        type: t.Optional(tEnum(followUpTypes)),
        title: t.Optional(t.String()),
        notes: t.Optional(t.Nullable(t.String())),
        status: t.Optional(tEnum(followUpStatuses)),
      }),
    },
  )
  .delete("/:id", async ({ params, status }) => {
    const [row] = await db
      .delete(followUpsTable)
      .where(eq(followUpsTable.id, Number(params.id)))
      .returning({ id: followUpsTable.id });
    if (!row) return status(404, fail("Follow-up not found"));
    return ok(row, "Follow-up deleted");
  });

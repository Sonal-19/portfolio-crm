import { and, desc, eq, gt, ilike, inArray, lt, ne, or } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { db } from "$/db";
import {
  bookingStatuses,
  followUpsTable,
  type LeadStatus,
  leadsTable,
  studioAddonsTable,
  studioBookingsTable,
  studioEngineersTable,
  studioInstrumentsTable,
  studioPackagesTable,
} from "$/db/schema";
import { leadService } from "$/lib/services/lead-service";
import { fail, ok } from "$/lib/utils";
import { tEnum } from "$/lib/utils/schema";
import { istTime } from "$/lib/utils/time";
import { protectedAdmin } from "$/pre-processor";

/** Moving a booking forward also moves its lead through the pipeline. */
const LEAD_STATUS_FOR: Partial<Record<string, LeadStatus>> = {
  under_review: "contacted",
  approved: "shortlisted",
  scheduled: "shortlisted",
  completed: "recorded",
};

export const adminBookingsController = new Elysia({
  name: "admin_bookings_controller",
  prefix: "/bookings",
})
  .use(protectedAdmin)
  .get(
    "/",
    async ({ query }) => {
      const s = query.search?.trim();
      const rows = await db
        .select({
          booking: studioBookingsTable,
          packageName: studioPackagesTable.name,
        })
        .from(studioBookingsTable)
        .leftJoin(
          studioPackagesTable,
          eq(studioPackagesTable.id, studioBookingsTable.packageId),
        )
        .where(
          and(
            query.status
              ? eq(studioBookingsTable.status, query.status)
              : undefined,
            s
              ? or(
                  ilike(studioBookingsTable.name, `%${s}%`),
                  ilike(studioBookingsTable.phone, `%${s}%`),
                  ilike(studioBookingsTable.projectTitle, `%${s}%`),
                )
              : undefined,
          ),
        )
        .orderBy(desc(studioBookingsTable.createdAt))
        .limit(300);
      return ok(
        rows.map((r) => ({ ...r.booking, packageName: r.packageName })),
      );
    },
    {
      query: t.Object({
        status: t.Optional(tEnum(bookingStatuses)),
        search: t.Optional(t.String()),
      }),
    },
  )
  .get("/:id", async ({ params, status }) => {
    const [row] = await db
      .select({
        booking: studioBookingsTable,
        packageName: studioPackagesTable.name,
        engineerName: studioEngineersTable.name,
      })
      .from(studioBookingsTable)
      .leftJoin(
        studioPackagesTable,
        eq(studioPackagesTable.id, studioBookingsTable.packageId),
      )
      .leftJoin(
        studioEngineersTable,
        eq(studioEngineersTable.id, studioBookingsTable.engineerId),
      )
      .where(eq(studioBookingsTable.id, Number(params.id)))
      .limit(1);
    if (!row) return status(404, fail("Booking not found"));

    const b = row.booking;
    const [instruments, addons] = await Promise.all([
      b.instrumentIds.length
        ? db
            .select({
              id: studioInstrumentsTable.id,
              name: studioInstrumentsTable.name,
            })
            .from(studioInstrumentsTable)
            .where(inArray(studioInstrumentsTable.id, b.instrumentIds))
        : [],
      b.addonIds.length
        ? db
            .select({ id: studioAddonsTable.id, name: studioAddonsTable.name })
            .from(studioAddonsTable)
            .where(inArray(studioAddonsTable.id, b.addonIds))
        : [],
    ]);
    return ok({
      ...b,
      packageName: row.packageName,
      engineerName: row.engineerName,
      instruments,
      addons,
    });
  })
  .patch(
    "/:id/status",
    async ({ params, body, admin, status }) => {
      const id = Number(params.id);
      const [b] = await db
        .select()
        .from(studioBookingsTable)
        .where(eq(studioBookingsTable.id, id))
        .limit(1);
      if (!b) return status(404, fail("Booking not found"));

      let scheduledStart = b.scheduledStart;
      let scheduledEnd = b.scheduledEnd;
      const durationHours = body.durationHours ?? b.durationHours;

      if (body.status === "scheduled") {
        if (!body.scheduledStart) {
          return status(400, fail("Pick a date and time to schedule"));
        }
        scheduledStart = new Date(body.scheduledStart);
        scheduledEnd = new Date(
          scheduledStart.getTime() + durationHours * 3_600_000,
        );
        const [clash] = await db
          .select({
            id: studioBookingsTable.id,
            name: studioBookingsTable.name,
            start: studioBookingsTable.scheduledStart,
            end: studioBookingsTable.scheduledEnd,
          })
          .from(studioBookingsTable)
          .where(
            and(
              ne(studioBookingsTable.id, id),
              eq(studioBookingsTable.status, "scheduled"),
              lt(studioBookingsTable.scheduledStart, scheduledEnd),
              gt(studioBookingsTable.scheduledEnd, scheduledStart),
            ),
          )
          .limit(1);
        if (clash?.start && clash.end) {
          return status(
            409,
            fail(
              `Clashes with ${clash.name}'s session (#${clash.id}) ${istTime(clash.start)}–${istTime(clash.end)}`,
            ),
          );
        }
      }

      const [row] = await db
        .update(studioBookingsTable)
        .set({
          status: body.status,
          durationHours,
          scheduledStart,
          scheduledEnd,
          adminRemark: body.adminRemark ?? b.adminRemark,
        })
        .where(eq(studioBookingsTable.id, id))
        .returning();

      if (b.leadId) {
        const when =
          body.status === "scheduled" && scheduledStart
            ? ` for ${scheduledStart.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}`
            : "";
        await leadService.log(
          b.leadId,
          "booking_status",
          `Studio request #${id} ${body.status.replace("_", " ")}${when}${body.adminRemark ? ` — ${body.adminRemark}` : ""}`,
          admin.id,
        );
        const nextLeadStatus = LEAD_STATUS_FOR[body.status];
        if (nextLeadStatus) {
          await db
            .update(leadsTable)
            .set({ status: nextLeadStatus })
            .where(eq(leadsTable.id, b.leadId));
        }
        if (body.status === "scheduled" && scheduledStart) {
          // Clear any previous session reminder for this booking, then add one.
          await db
            .delete(followUpsTable)
            .where(
              and(
                eq(followUpsTable.leadId, b.leadId),
                eq(followUpsTable.type, "session"),
                eq(followUpsTable.status, "pending"),
                ilike(followUpsTable.title, `%#${id}%`),
              ),
            );
          await db.insert(followUpsTable).values({
            leadId: b.leadId,
            dueAt: new Date(scheduledStart.getTime() - 86_400_000),
            type: "session",
            title: `Remind about studio session #${id} tomorrow`,
          });
        }
      }
      return ok(row, "Booking updated");
    },
    {
      body: t.Object({
        status: tEnum(bookingStatuses),
        scheduledStart: t.Optional(t.String()),
        durationHours: t.Optional(t.Number({ minimum: 1, maximum: 12 })),
        adminRemark: t.Optional(t.String()),
      }),
    },
  )
  .delete("/:id", async ({ params, status }) => {
    const [row] = await db
      .delete(studioBookingsTable)
      .where(eq(studioBookingsTable.id, Number(params.id)))
      .returning({ id: studioBookingsTable.id });
    if (!row) return status(404, fail("Booking not found"));
    return ok(row, "Booking deleted");
  });

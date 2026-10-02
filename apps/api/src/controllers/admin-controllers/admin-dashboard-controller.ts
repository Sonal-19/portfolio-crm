import { and, count, desc, eq, gte, inArray, lt } from "drizzle-orm";
import Elysia from "elysia";
import { db } from "$/db";
import {
  contactQueriesTable,
  followUpsTable,
  kirtanBookingsTable,
  leadActivitiesTable,
  leadsTable,
} from "$/db/schema";
import { ok } from "$/lib/utils";
import { IST_TZ, istDayBounds } from "$/lib/utils/time";
import { protectedAdmin } from "$/pre-processor";

function todayIst() {
  return new Date().toLocaleDateString("en-CA", { timeZone: IST_TZ });
}

export const adminDashboardController = new Elysia({
  name: "admin_dashboard_controller",
  prefix: "/dashboard",
})
  .use(protectedAdmin)
  .get("/summary", async () => {
    const { start: dayStart, end: dayEnd } = istDayBounds(todayIst());
    const weekAgo = new Date(Date.now() - 7 * 86_400_000);
    const monthStart = istDayBounds(`${todayIst().slice(0, 7)}-01`).start;
    const now = new Date();

    const one = async (q: Promise<{ n: number }[]>) => (await q)[0]?.n ?? 0;

    const [
      totalLeads,
      newLeadsWeek,
      newKirtanRequests,
      followUpsToday,
      followUpsOverdue,
      programsThisMonth,
      unreadQueries,
      bySource,
      byStatus,
      upcomingPrograms,
      todaysFollowUps,
      recentActivity,
    ] = await Promise.all([
      one(db.select({ n: count() }).from(leadsTable)),
      one(
        db
          .select({ n: count() })
          .from(leadsTable)
          .where(gte(leadsTable.createdAt, weekAgo)),
      ),
      one(
        db
          .select({ n: count() })
          .from(kirtanBookingsTable)
          .where(inArray(kirtanBookingsTable.status, ["new", "contacted"])),
      ),
      one(
        db
          .select({ n: count() })
          .from(followUpsTable)
          .where(
            and(
              eq(followUpsTable.status, "pending"),
              gte(followUpsTable.dueAt, dayStart),
              lt(followUpsTable.dueAt, dayEnd),
            ),
          ),
      ),
      one(
        db
          .select({ n: count() })
          .from(followUpsTable)
          .where(
            and(
              eq(followUpsTable.status, "pending"),
              lt(followUpsTable.dueAt, dayStart),
            ),
          ),
      ),
      one(
        db
          .select({ n: count() })
          .from(kirtanBookingsTable)
          .where(
            and(
              inArray(kirtanBookingsTable.status, ["confirmed", "completed"]),
              gte(kirtanBookingsTable.scheduledStart, monthStart),
            ),
          ),
      ),
      one(
        db
          .select({ n: count() })
          .from(contactQueriesTable)
          .where(eq(contactQueriesTable.isRead, false)),
      ),
      db
        .select({ key: leadsTable.source, n: count() })
        .from(leadsTable)
        .groupBy(leadsTable.source),
      db
        .select({ key: leadsTable.status, n: count() })
        .from(leadsTable)
        .groupBy(leadsTable.status),
      db
        .select({
          id: kirtanBookingsTable.id,
          name: kirtanBookingsTable.name,
          subject: kirtanBookingsTable.subject,
          eventType: kirtanBookingsTable.eventType,
          city: kirtanBookingsTable.city,
          scheduledStart: kirtanBookingsTable.scheduledStart,
          scheduledEnd: kirtanBookingsTable.scheduledEnd,
          leadId: kirtanBookingsTable.leadId,
        })
        .from(kirtanBookingsTable)
        .where(
          and(
            eq(kirtanBookingsTable.status, "confirmed"),
            gte(kirtanBookingsTable.scheduledStart, now),
          ),
        )
        .orderBy(kirtanBookingsTable.scheduledStart)
        .limit(5),
      db
        .select({
          id: followUpsTable.id,
          title: followUpsTable.title,
          type: followUpsTable.type,
          dueAt: followUpsTable.dueAt,
          leadId: followUpsTable.leadId,
          leadName: leadsTable.name,
          leadPhone: leadsTable.phone,
        })
        .from(followUpsTable)
        .innerJoin(leadsTable, eq(leadsTable.id, followUpsTable.leadId))
        .where(
          and(
            eq(followUpsTable.status, "pending"),
            lt(followUpsTable.dueAt, dayEnd),
          ),
        )
        .orderBy(followUpsTable.dueAt)
        .limit(8),
      db
        .select({
          id: leadActivitiesTable.id,
          kind: leadActivitiesTable.kind,
          message: leadActivitiesTable.message,
          createdAt: leadActivitiesTable.createdAt,
          leadId: leadActivitiesTable.leadId,
          leadName: leadsTable.name,
        })
        .from(leadActivitiesTable)
        .innerJoin(leadsTable, eq(leadsTable.id, leadActivitiesTable.leadId))
        .orderBy(desc(leadActivitiesTable.createdAt))
        .limit(10),
    ]);

    const completed = byStatus.find((s) => s.key === "completed")?.n ?? 0;
    return ok({
      kpis: {
        totalLeads,
        newLeadsWeek,
        newKirtanRequests,
        followUpsToday,
        followUpsOverdue,
        programsThisMonth,
        unreadQueries,
        completedRate: totalLeads
          ? Math.round((completed / totalLeads) * 100)
          : 0,
      },
      bySource,
      byStatus,
      upcomingPrograms,
      todaysFollowUps,
      recentActivity,
      serverTime: now,
    });
  });

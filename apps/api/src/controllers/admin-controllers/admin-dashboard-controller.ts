import { and, count, desc, eq, gte, inArray, lt } from "drizzle-orm";
import Elysia from "elysia";
import { db } from "$/db";
import {
  contactQueriesTable,
  followUpsTable,
  leadActivitiesTable,
  leadsTable,
  studioBookingsTable,
} from "$/db/schema";
import { ok } from "$/lib/utils";
import { istDayBounds } from "$/lib/utils/time";
import { protectedAdmin } from "$/pre-processor";

function todayIst() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
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
      pendingApplications,
      followUpsToday,
      followUpsOverdue,
      sessionsThisMonth,
      unreadQueries,
      bySource,
      byStatus,
      upcomingSessions,
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
          .from(studioBookingsTable)
          .where(
            inArray(studioBookingsTable.status, ["pending", "under_review"]),
          ),
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
          .from(studioBookingsTable)
          .where(
            and(
              eq(studioBookingsTable.status, "completed"),
              gte(studioBookingsTable.updatedAt, monthStart),
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
          id: studioBookingsTable.id,
          name: studioBookingsTable.name,
          projectTitle: studioBookingsTable.projectTitle,
          scheduledStart: studioBookingsTable.scheduledStart,
          scheduledEnd: studioBookingsTable.scheduledEnd,
          leadId: studioBookingsTable.leadId,
        })
        .from(studioBookingsTable)
        .where(
          and(
            eq(studioBookingsTable.status, "scheduled"),
            gte(studioBookingsTable.scheduledStart, now),
          ),
        )
        .orderBy(studioBookingsTable.scheduledStart)
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

    const recorded = byStatus.find((s) => s.key === "recorded")?.n ?? 0;
    return ok({
      kpis: {
        totalLeads,
        newLeadsWeek,
        pendingApplications,
        followUpsToday,
        followUpsOverdue,
        sessionsThisMonth,
        unreadQueries,
        recordedRate: totalLeads
          ? Math.round((recorded / totalLeads) * 100)
          : 0,
      },
      bySource,
      byStatus,
      upcomingSessions,
      todaysFollowUps,
      recentActivity,
      serverTime: now,
    });
  });

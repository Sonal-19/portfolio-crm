import { and, desc, eq, inArray } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { db } from "$/db";
import {
  artistTypes,
  blogPostsTable,
  contactQueriesTable,
  followUpsTable,
  siteSettingsTable,
  socialPlatforms,
  socialPostsTable,
  studioAddonsTable,
  studioBookingsTable,
  studioEngineersTable,
  studioInstrumentsTable,
  studioPackagesTable,
} from "$/db/schema";
import { leadService } from "$/lib/services/lead-service";
import { notifyService } from "$/lib/services/notify-service";
import { clientIp, rateLimitService } from "$/lib/services/rate-limit-service";
import { fail, normalizePhone, ok } from "$/lib/utils";
import { tEnum } from "$/lib/utils/schema";
import { busyRangesForDate, istDayBounds } from "$/lib/utils/time";

const FORM_LIMIT = 5;
const FORM_WINDOW_MS = 10 * 60 * 1000;
const DAY_MS = 86_400_000;

export const publicController = new Elysia({
  name: "public_controller",
  prefix: "/public",
})
  .get("/site-settings", async ({ status }) => {
    const [row] = await db.select().from(siteSettingsTable).limit(1);
    if (!row) return status(404, fail("Site settings missing"));
    return ok(row);
  })
  .get("/studio/catalog", async () => {
    const [packages, instruments, engineers, addons] = await Promise.all([
      db
        .select()
        .from(studioPackagesTable)
        .where(eq(studioPackagesTable.isActive, true))
        .orderBy(studioPackagesTable.sortOrder),
      db
        .select()
        .from(studioInstrumentsTable)
        .where(eq(studioInstrumentsTable.isActive, true))
        .orderBy(studioInstrumentsTable.sortOrder),
      db
        .select()
        .from(studioEngineersTable)
        .where(eq(studioEngineersTable.isActive, true)),
      db
        .select()
        .from(studioAddonsTable)
        .where(eq(studioAddonsTable.isActive, true)),
    ]);
    return ok({ packages, instruments, engineers, addons });
  })
  .get(
    "/studio/availability",
    async ({ query }) => ok(await busyRangesForDate(query.date)),
    {
      query: t.Object({
        date: t.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}$" }),
      }),
    },
  )
  .get(
    "/social",
    async ({ query }) => {
      const limit = Math.min(Number(query.limit ?? 9), 30);
      const rows = await db
        .select()
        .from(socialPostsTable)
        .where(
          and(
            eq(socialPostsTable.isHidden, false),
            query.platform
              ? eq(socialPostsTable.platform, query.platform)
              : undefined,
          ),
        )
        .orderBy(desc(socialPostsTable.publishedAt))
        .limit(limit);
      return ok(rows);
    },
    {
      query: t.Object({
        platform: t.Optional(tEnum(socialPlatforms)),
        limit: t.Optional(t.String()),
      }),
    },
  )
  .get(
    "/blog",
    async ({ query }) => {
      const limit = Math.min(Number(query.limit ?? 12), 50);
      const rows = await db
        .select({
          id: blogPostsTable.id,
          title: blogPostsTable.title,
          slug: blogPostsTable.slug,
          excerpt: blogPostsTable.excerpt,
          coverImagePath: blogPostsTable.coverImagePath,
          tags: blogPostsTable.tags,
          publishedAt: blogPostsTable.publishedAt,
        })
        .from(blogPostsTable)
        .where(eq(blogPostsTable.status, "published"))
        .orderBy(desc(blogPostsTable.publishedAt))
        .limit(limit);
      return ok(rows);
    },
    { query: t.Object({ limit: t.Optional(t.String()) }) },
  )
  .get("/blog/:slug", async ({ params, status }) => {
    const [row] = await db
      .select()
      .from(blogPostsTable)
      .where(
        and(
          eq(blogPostsTable.slug, params.slug),
          eq(blogPostsTable.status, "published"),
        ),
      )
      .limit(1);
    if (!row) return status(404, fail("Post not found"));
    return ok(row);
  })
  .post(
    "/contact/query",
    async ({ body, request, server, status }) => {
      // Honeypot: bots fill every field. Pretend success, store nothing.
      if (body.website) return ok(null, "Thank you!");
      if (
        !rateLimitService.hit(
          `form:${clientIp(request, server)}`,
          FORM_LIMIT,
          FORM_WINDOW_MS,
        )
      ) {
        return status(429, fail("Too many submissions, please try later."));
      }
      if (normalizePhone(body.phone).length < 11) {
        return status(400, fail("Please enter a valid phone number"));
      }

      const { lead } = await leadService.upsertFromPublic({
        name: body.name,
        phone: body.phone,
        email: body.email,
        source: "query",
        tags: ["query"],
      });
      await db.insert(contactQueriesTable).values({
        leadId: lead.id,
        name: body.name.trim(),
        phone: normalizePhone(body.phone),
        email: body.email || null,
        subject: body.subject.trim(),
        message: body.message.trim(),
      });
      await leadService.log(
        lead.id,
        "query_received",
        `Query: ${body.subject}`,
      );
      await db.insert(followUpsTable).values({
        leadId: lead.id,
        dueAt: new Date(Date.now() + DAY_MS),
        type: "call",
        title: `Reply to query: ${body.subject}`,
      });
      void notifyService.adminAlert("New query", body);
      return ok(null, "Thank you! We'll get back to you soon.");
    },
    {
      body: t.Object({
        name: t.String({ minLength: 2, maxLength: 120 }),
        phone: t.String({ minLength: 10, maxLength: 20 }),
        email: t.Optional(t.String({ maxLength: 160 })),
        subject: t.String({ minLength: 2, maxLength: 160 }),
        message: t.String({ minLength: 5, maxLength: 4000 }),
        website: t.Optional(t.String()),
      }),
    },
  )
  .post(
    "/studio/bookings",
    async ({ body, request, server, status }) => {
      if (body.website) return ok(null, "Request received");
      if (
        !rateLimitService.hit(
          `form:${clientIp(request, server)}`,
          FORM_LIMIT,
          FORM_WINDOW_MS,
        )
      ) {
        return status(429, fail("Too many submissions, please try later."));
      }
      if (normalizePhone(body.phone).length < 11) {
        return status(400, fail("Please enter a valid phone number"));
      }
      const { start } = istDayBounds(body.preferredDate);
      if (start.getTime() < Date.now() - DAY_MS) {
        return status(400, fail("Preferred date can't be in the past"));
      }

      let durationHours = body.durationHours ?? 2;
      let packageName = "Custom session";
      if (body.packageId) {
        const [pkg] = await db
          .select()
          .from(studioPackagesTable)
          .where(eq(studioPackagesTable.id, body.packageId))
          .limit(1);
        if (!pkg) return status(400, fail("Unknown session package"));
        durationHours = pkg.durationHours;
        packageName = pkg.name;
      }

      // Drop ids that don't exist / are inactive rather than failing the form.
      const instrumentIds = body.instrumentIds?.length
        ? (
            await db
              .select({ id: studioInstrumentsTable.id })
              .from(studioInstrumentsTable)
              .where(inArray(studioInstrumentsTable.id, body.instrumentIds))
          ).map((r) => r.id)
        : [];
      const addonIds = body.addonIds?.length
        ? (
            await db
              .select({ id: studioAddonsTable.id })
              .from(studioAddonsTable)
              .where(inArray(studioAddonsTable.id, body.addonIds))
          ).map((r) => r.id)
        : [];

      const { lead } = await leadService.upsertFromPublic({
        name: body.name,
        phone: body.phone,
        email: body.email,
        city: body.city,
        source: "booking",
        tags: ["studio", body.artistType],
      });

      const [booking] = await db
        .insert(studioBookingsTable)
        .values({
          leadId: lead.id,
          name: body.name.trim(),
          phone: normalizePhone(body.phone),
          email: body.email || null,
          city: body.city || null,
          artistType: body.artistType,
          experience: body.experience || null,
          sampleLink: body.sampleLink || null,
          about: body.about || null,
          packageId: body.packageId ?? null,
          instrumentIds,
          engineerId: body.engineerId ?? null,
          addonIds,
          durationHours,
          projectTitle: body.projectTitle || null,
          notes: body.notes || null,
          preferredDate: body.preferredDate,
          preferredStartTime: body.preferredStartTime,
        })
        .returning({ id: studioBookingsTable.id });

      await leadService.log(
        lead.id,
        "booking_received",
        `Studio request #${booking?.id}: ${packageName}, ${body.preferredDate} ${body.preferredStartTime}`,
      );
      await db.insert(followUpsTable).values({
        leadId: lead.id,
        dueAt: new Date(Date.now() + DAY_MS),
        type: "call",
        title: `Review studio request #${booking?.id}`,
      });
      void notifyService.adminAlert("New studio request", {
        ...body,
        package: packageName,
      });
      return ok({ id: booking?.id }, "Request received");
    },
    {
      body: t.Object({
        name: t.String({ minLength: 2, maxLength: 120 }),
        phone: t.String({ minLength: 10, maxLength: 20 }),
        email: t.Optional(t.String({ maxLength: 160 })),
        city: t.Optional(t.String({ maxLength: 80 })),
        artistType: tEnum(artistTypes),
        experience: t.Optional(t.String({ maxLength: 500 })),
        sampleLink: t.Optional(t.String({ maxLength: 500 })),
        about: t.Optional(t.String({ maxLength: 2000 })),
        packageId: t.Optional(t.Number()),
        instrumentIds: t.Optional(t.Array(t.Number(), { maxItems: 20 })),
        engineerId: t.Optional(t.Number()),
        addonIds: t.Optional(t.Array(t.Number(), { maxItems: 10 })),
        durationHours: t.Optional(t.Number({ minimum: 1, maximum: 10 })),
        projectTitle: t.Optional(t.String({ maxLength: 160 })),
        notes: t.Optional(t.String({ maxLength: 2000 })),
        preferredDate: t.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}$" }),
        preferredStartTime: t.String({ pattern: "^\\d{2}:\\d{2}$" }),
        website: t.Optional(t.String()),
      }),
    },
  );

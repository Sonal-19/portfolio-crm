import { and, asc, desc, eq, gte, lt } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { db } from "$/db";
import {
  blogPostsTable,
  contactQueriesTable,
  followUpsTable,
  kirtanBookingsTable,
  kirtanEventTypes,
  kirtanLanguages,
  kirtanRequirements,
  releasesTable,
  sangatSizes,
  siteSettingsTable,
  socialPlatforms,
  socialPostsTable,
  venueTypes,
} from "$/db/schema";
import { leadService } from "$/lib/services/lead-service";
import { notifyService } from "$/lib/services/notify-service";
import { clientIp, rateLimitService } from "$/lib/services/rate-limit-service";
import { socialSyncService } from "$/lib/services/social/social-sync-service";
import { fail, normalizePhone, ok } from "$/lib/utils";
import { tEnum } from "$/lib/utils/schema";
import { istDayBounds } from "$/lib/utils/time";

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
    // Numbers the admin switched off never leave the server.
    const contacts = row.quickBooking.contacts.filter((c) => c.isActive);
    return ok({
      ...row,
      quickBooking: {
        ...row.quickBooking,
        enabled: row.quickBooking.enabled && contacts.length > 0,
        contacts,
      },
    });
  })
  .get("/releases", async () => {
    const rows = await db
      .select()
      .from(releasesTable)
      .where(eq(releasesTable.isActive, true))
      .orderBy(asc(releasesTable.sortOrder), desc(releasesTable.releaseDate));
    return ok(rows);
  })
  /** Only says whether a program is already confirmed that day — no details. */
  .get(
    "/kirtan-availability",
    async ({ query }) => {
      const { start, end } = istDayBounds(query.date);
      const [row] = await db
        .select({ id: kirtanBookingsTable.id })
        .from(kirtanBookingsTable)
        .where(
          and(
            eq(kirtanBookingsTable.status, "confirmed"),
            gte(kirtanBookingsTable.scheduledStart, start),
            lt(kirtanBookingsTable.scheduledStart, end),
          ),
        )
        .limit(1);
      return ok({ date: query.date, busy: Boolean(row) });
    },
    {
      query: t.Object({
        date: t.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}$" }),
      }),
    },
  )
  /** Which tabs / channel filters the "Latest" section should offer. */
  .get("/social/layout", async () => ok(await socialSyncService.publicLayout()))
  /** Served from the social_posts cache; never calls a social API. */
  .get(
    "/social",
    async ({ query }) => {
      const limit = Math.min(Number(query.limit ?? 9), 30);
      const { platforms } = await socialSyncService.publicLayout();
      if (!platforms.includes(query.platform)) return ok([]);
      const rows = await db
        .select()
        .from(socialPostsTable)
        .where(
          and(
            eq(socialPostsTable.isHidden, false),
            eq(socialPostsTable.platform, query.platform),
            query.source
              ? eq(socialPostsTable.sourceId, query.source)
              : undefined,
          ),
        )
        .orderBy(desc(socialPostsTable.publishedAt))
        .limit(300);
      const arranged = await socialSyncService.arrange(query.platform, rows);
      return ok(arranged.slice(0, limit));
    },
    {
      query: t.Object({
        platform: tEnum(socialPlatforms),
        /** YouTube channel id, to show just that channel. */
        source: t.Optional(t.String({ maxLength: 64 })),
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
    "/kirtan-bookings",
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
        return status(400, fail("Please enter a valid mobile number"));
      }
      if (body.whatsapp && normalizePhone(body.whatsapp).length < 11) {
        return status(400, fail("Please enter a valid WhatsApp number"));
      }
      for (const d of [body.eventDate, body.alternateDate]) {
        if (d && istDayBounds(d).end.getTime() < Date.now()) {
          return status(400, fail("Program date can't be in the past"));
        }
      }

      const { lead } = await leadService.upsertFromPublic({
        name: body.name,
        phone: body.phone,
        email: body.email,
        city: body.city,
        source: "kirtan_booking",
        tags: ["kirtan", body.eventType, body.city.trim().toLowerCase()],
      });

      const [booking] = await db
        .insert(kirtanBookingsTable)
        .values({
          leadId: lead.id,
          name: body.name.trim(),
          phone: normalizePhone(body.phone),
          whatsapp: body.whatsapp ? normalizePhone(body.whatsapp) : null,
          email: body.email || null,
          eventType: body.eventType,
          subject: body.subject.trim(),
          language: body.language ?? "either",
          expectedSangat: body.expectedSangat ?? null,
          requirements: body.requirements ?? [],
          message: body.message || null,
          referralSource: body.referralSource || null,
          eventDate: body.eventDate,
          startTime: body.startTime,
          durationHours: body.durationHours ?? 2,
          alternateDate: body.alternateDate || null,
          venueType: body.venueType,
          venueName: body.venueName || null,
          address: body.address.trim(),
          city: body.city.trim(),
          state: body.state.trim(),
          pincode: body.pincode || null,
        })
        .returning({ id: kirtanBookingsTable.id });

      await leadService.log(
        lead.id,
        "kirtan_booking_received",
        `Kirtan request #${booking?.id}: ${body.subject} — ${body.city}, ${body.eventDate} ${body.startTime}`,
      );
      await db.insert(followUpsTable).values({
        leadId: lead.id,
        dueAt: new Date(Date.now() + DAY_MS),
        type: "call",
        title: `Call to discuss kirtan request #${booking?.id}`,
      });
      void notifyService.adminAlert("New kirtan booking request", body);
      return ok({ id: booking?.id }, "Request received");
    },
    {
      body: t.Object({
        name: t.String({ minLength: 2, maxLength: 120 }),
        phone: t.String({ minLength: 10, maxLength: 20 }),
        whatsapp: t.Optional(t.String({ maxLength: 20 })),
        email: t.Optional(t.String({ maxLength: 160 })),
        eventType: tEnum(kirtanEventTypes),
        subject: t.String({ minLength: 3, maxLength: 160 }),
        language: t.Optional(tEnum(kirtanLanguages)),
        expectedSangat: t.Optional(tEnum(sangatSizes)),
        requirements: t.Optional(
          t.Array(tEnum(kirtanRequirements), { maxItems: 10 }),
        ),
        message: t.Optional(t.String({ maxLength: 2000 })),
        referralSource: t.Optional(t.String({ maxLength: 120 })),
        eventDate: t.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}$" }),
        startTime: t.String({ pattern: "^\\d{2}:\\d{2}$" }),
        durationHours: t.Optional(t.Number({ minimum: 1, maximum: 12 })),
        alternateDate: t.Optional(t.String()),
        venueType: tEnum(venueTypes),
        venueName: t.Optional(t.String({ maxLength: 160 })),
        address: t.String({ minLength: 3, maxLength: 400 }),
        city: t.String({ minLength: 2, maxLength: 80 }),
        state: t.String({ minLength: 2, maxLength: 80 }),
        pincode: t.Optional(t.String({ maxLength: 10 })),
        website: t.Optional(t.String()),
      }),
    },
  );

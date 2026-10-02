import { and, count, desc, eq, sql } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { db } from "$/db";
import {
  blogPostsTable,
  leadSources,
  leadStatuses,
  leadsTable,
  socialPostsTable,
  waBroadcastListMembersTable,
  waBroadcastListsTable,
  waBroadcastRecipientsTable,
  waBroadcastsTable,
  waRecipientStatuses,
  waTemplateCategories,
  waTemplatesTable,
} from "$/db/schema";
import { PUBLIC_SITE_URL } from "$/env";
import { leadService } from "$/lib/services/lead-service";
import { waLink, waSender } from "$/lib/services/whatsapp/wa-sender";
import { fail, ok, renderTemplate } from "$/lib/utils";
import { tEnum } from "$/lib/utils/schema";
import { protectedAdmin } from "$/pre-processor";
import { leadWhere } from "./admin-leads-controller";

const templateBody = {
  name: t.String({ minLength: 2 }),
  body: t.String({ minLength: 2 }),
  category: tEnum(waTemplateCategories),
};
const listBody = {
  name: t.String({ minLength: 2 }),
  description: t.Optional(t.String()),
};

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

export const adminWhatsappController = new Elysia({
  name: "admin_whatsapp_controller",
  prefix: "/whatsapp",
})
  .use(protectedAdmin)
  .get("/mode", () => ok({ mode: waSender.mode }))
  // ── templates ──
  .get("/templates", async () =>
    ok(await db.select().from(waTemplatesTable).orderBy(waTemplatesTable.id)),
  )
  .post(
    "/templates",
    async ({ body }) => {
      const [row] = await db.insert(waTemplatesTable).values(body).returning();
      return ok(row, "Template saved");
    },
    { body: t.Object(templateBody) },
  )
  .patch(
    "/templates/:id",
    async ({ params, body, status }) => {
      const [row] = await db
        .update(waTemplatesTable)
        .set(body)
        .where(eq(waTemplatesTable.id, Number(params.id)))
        .returning();
      return row ? ok(row, "Template updated") : status(404, fail("Not found"));
    },
    { body: t.Partial(t.Object(templateBody)) },
  )
  .delete("/templates/:id", async ({ params }) => {
    await db
      .delete(waTemplatesTable)
      .where(eq(waTemplatesTable.id, Number(params.id)));
    return ok(null, "Template deleted");
  })
  // ── broadcast lists ──
  .get("/lists", async () => {
    const rows = await db
      .select({
        id: waBroadcastListsTable.id,
        name: waBroadcastListsTable.name,
        description: waBroadcastListsTable.description,
        createdAt: waBroadcastListsTable.createdAt,
        members: sql<number>`(select count(*)::int from ${waBroadcastListMembersTable} m where m.list_id = ${waBroadcastListsTable.id})`,
      })
      .from(waBroadcastListsTable)
      .orderBy(waBroadcastListsTable.id);
    return ok(rows);
  })
  .post(
    "/lists",
    async ({ body }) => {
      const [row] = await db
        .insert(waBroadcastListsTable)
        .values({ ...body, description: body.description ?? "" })
        .returning();
      return ok(row, "List created");
    },
    { body: t.Object(listBody) },
  )
  .patch(
    "/lists/:id",
    async ({ params, body, status }) => {
      const [row] = await db
        .update(waBroadcastListsTable)
        .set(body)
        .where(eq(waBroadcastListsTable.id, Number(params.id)))
        .returning();
      return row ? ok(row, "List updated") : status(404, fail("Not found"));
    },
    { body: t.Partial(t.Object(listBody)) },
  )
  .delete("/lists/:id", async ({ params }) => {
    await db
      .delete(waBroadcastListsTable)
      .where(eq(waBroadcastListsTable.id, Number(params.id)));
    return ok(null, "List deleted");
  })
  .get("/lists/:id/members", async ({ params }) => {
    const rows = await db
      .select({
        id: leadsTable.id,
        name: leadsTable.name,
        phone: leadsTable.phone,
        city: leadsTable.city,
        status: leadsTable.status,
        whatsappOptIn: leadsTable.whatsappOptIn,
        addedAt: waBroadcastListMembersTable.addedAt,
      })
      .from(waBroadcastListMembersTable)
      .innerJoin(
        leadsTable,
        eq(leadsTable.id, waBroadcastListMembersTable.leadId),
      )
      .where(eq(waBroadcastListMembersTable.listId, Number(params.id)))
      .orderBy(leadsTable.name);
    return ok(rows);
  })
  .post(
    "/lists/:id/members",
    async ({ params, body }) => {
      const listId = Number(params.id);
      let leadIds = body.leadIds ?? [];
      if (body.filter) {
        const matched = await db
          .select({ id: leadsTable.id })
          .from(leadsTable)
          .where(leadWhere(body.filter));
        leadIds = [...leadIds, ...matched.map((m) => m.id)];
      }
      if (leadIds.length === 0) return ok({ added: 0 }, "Nothing to add");
      const inserted = await db
        .insert(waBroadcastListMembersTable)
        .values([...new Set(leadIds)].map((leadId) => ({ listId, leadId })))
        .onConflictDoNothing()
        .returning({ leadId: waBroadcastListMembersTable.leadId });
      return ok({ added: inserted.length }, `${inserted.length} added`);
    },
    {
      body: t.Object({
        leadIds: t.Optional(t.Array(t.Number())),
        filter: t.Optional(
          t.Object({
            search: t.Optional(t.String()),
            status: t.Optional(tEnum(leadStatuses)),
            source: t.Optional(tEnum(leadSources)),
            tag: t.Optional(t.String()),
          }),
        ),
      }),
    },
  )
  .delete("/lists/:id/members/:leadId", async ({ params }) => {
    await db
      .delete(waBroadcastListMembersTable)
      .where(
        and(
          eq(waBroadcastListMembersTable.listId, Number(params.id)),
          eq(waBroadcastListMembersTable.leadId, Number(params.leadId)),
        ),
      );
    return ok(null, "Removed from list");
  })
  // ── content that can be shared ──
  .get("/shareables", async () => {
    const [blogs, socials] = await Promise.all([
      db
        .select({
          id: blogPostsTable.id,
          title: blogPostsTable.title,
          slug: blogPostsTable.slug,
        })
        .from(blogPostsTable)
        .where(eq(blogPostsTable.status, "published"))
        .orderBy(desc(blogPostsTable.publishedAt))
        .limit(20),
      db
        .select({
          id: socialPostsTable.id,
          platform: socialPostsTable.platform,
          caption: socialPostsTable.caption,
          permalink: socialPostsTable.permalink,
        })
        .from(socialPostsTable)
        .where(eq(socialPostsTable.isHidden, false))
        .orderBy(desc(socialPostsTable.publishedAt))
        .limit(20),
    ]);
    return ok([
      ...blogs.map((b) => ({
        kind: "blog" as const,
        label: `Blog: ${b.title}`,
        url: `${PUBLIC_SITE_URL}/blog/${b.slug}`,
      })),
      ...socials.map((s) => ({
        kind: s.platform,
        label: `${s.platform}: ${s.caption.slice(0, 60)}`,
        url: s.permalink,
      })),
      {
        kind: "site" as const,
        label: "Book Kirtan (request form)",
        url: `${PUBLIC_SITE_URL}/kirtan/book`,
      },
    ]);
  })
  // ── broadcasts ──
  .get("/broadcasts", async () => {
    const rows = await db
      .select({
        id: waBroadcastsTable.id,
        title: waBroadcastsTable.title,
        status: waBroadcastsTable.status,
        shareLink: waBroadcastsTable.shareLink,
        createdAt: waBroadcastsTable.createdAt,
        listName: waBroadcastListsTable.name,
        total: sql<number>`(select count(*)::int from ${waBroadcastRecipientsTable} r where r.broadcast_id = ${waBroadcastsTable.id})`,
        sent: sql<number>`(select count(*)::int from ${waBroadcastRecipientsTable} r where r.broadcast_id = ${waBroadcastsTable.id} and r.status = 'sent')`,
      })
      .from(waBroadcastsTable)
      .leftJoin(
        waBroadcastListsTable,
        eq(waBroadcastListsTable.id, waBroadcastsTable.listId),
      )
      .orderBy(desc(waBroadcastsTable.createdAt))
      .limit(100);
    return ok(rows);
  })
  .get("/broadcasts/:id", async ({ params, status }) => {
    const id = Number(params.id);
    const [broadcast] = await db
      .select()
      .from(waBroadcastsTable)
      .where(eq(waBroadcastsTable.id, id))
      .limit(1);
    if (!broadcast) return status(404, fail("Broadcast not found"));
    const recipients = await db
      .select({
        id: waBroadcastRecipientsTable.id,
        leadId: waBroadcastRecipientsTable.leadId,
        message: waBroadcastRecipientsTable.message,
        status: waBroadcastRecipientsTable.status,
        sentAt: waBroadcastRecipientsTable.sentAt,
        name: leadsTable.name,
        phone: leadsTable.phone,
      })
      .from(waBroadcastRecipientsTable)
      .innerJoin(
        leadsTable,
        eq(leadsTable.id, waBroadcastRecipientsTable.leadId),
      )
      .where(eq(waBroadcastRecipientsTable.broadcastId, id))
      .orderBy(waBroadcastRecipientsTable.id);
    return ok({
      ...broadcast,
      recipients: recipients.map((r) => ({
        ...r,
        link: waLink(r.phone, r.message),
      })),
    });
  })
  .post(
    "/broadcasts",
    async ({ body, status }) => {
      const members = await db
        .select({ id: leadsTable.id, name: leadsTable.name })
        .from(waBroadcastListMembersTable)
        .innerJoin(
          leadsTable,
          eq(leadsTable.id, waBroadcastListMembersTable.leadId),
        )
        .where(
          and(
            eq(waBroadcastListMembersTable.listId, body.listId),
            eq(leadsTable.whatsappOptIn, true),
          ),
        );
      if (members.length === 0) {
        return status(400, fail("This list has no opted-in members"));
      }
      const link = body.shareLink ?? "";
      const [broadcast] = await db
        .insert(waBroadcastsTable)
        .values({
          listId: body.listId,
          templateId: body.templateId ?? null,
          title: body.title,
          message: body.message,
          shareLink: body.shareLink || null,
        })
        .returning();
      if (!broadcast) return status(500, fail("Could not create broadcast"));
      await db.insert(waBroadcastRecipientsTable).values(
        members.map((m) => ({
          broadcastId: broadcast.id,
          leadId: m.id,
          message: renderTemplate(body.message, {
            name: firstName(m.name),
            link,
          }),
        })),
      );
      return ok(
        { id: broadcast.id, recipients: members.length },
        "Broadcast ready",
      );
    },
    {
      body: t.Object({
        listId: t.Number(),
        templateId: t.Optional(t.Number()),
        title: t.String({ minLength: 2 }),
        message: t.String({ minLength: 2 }),
        shareLink: t.Optional(t.String()),
      }),
    },
  )
  .patch(
    "/recipients/:id",
    async ({ params, body, admin, status }) => {
      const [row] = await db
        .update(waBroadcastRecipientsTable)
        .set({
          status: body.status,
          sentAt: body.status === "sent" ? new Date() : null,
        })
        .where(eq(waBroadcastRecipientsTable.id, Number(params.id)))
        .returning();
      if (!row) return status(404, fail("Recipient not found"));
      if (body.status === "sent") {
        await leadService.log(
          row.leadId,
          "whatsapp_sent",
          `Broadcast #${row.broadcastId} sent`,
          admin.id,
        );
        await leadService.touch(row.leadId);
      }
      const [pending] = await db
        .select({ n: count() })
        .from(waBroadcastRecipientsTable)
        .where(
          and(
            eq(waBroadcastRecipientsTable.broadcastId, row.broadcastId),
            eq(waBroadcastRecipientsTable.status, "pending"),
          ),
        );
      await db
        .update(waBroadcastsTable)
        .set({ status: pending?.n ? "sending" : "completed" })
        .where(eq(waBroadcastsTable.id, row.broadcastId));
      return ok(row);
    },
    { body: t.Object({ status: tEnum(waRecipientStatuses) }) },
  )
  .delete("/broadcasts/:id", async ({ params }) => {
    await db
      .delete(waBroadcastsTable)
      .where(eq(waBroadcastsTable.id, Number(params.id)));
    return ok(null, "Broadcast deleted");
  });

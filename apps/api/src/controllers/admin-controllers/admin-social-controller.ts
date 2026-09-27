import { and, desc, eq } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { db } from "$/db";
import {
  socialMediaTypes,
  socialPlatforms,
  socialPostsTable,
} from "$/db/schema";
import { socialSyncService } from "$/lib/services/social/social-sync-service";
import { fail, ok } from "$/lib/utils";
import { tEnum } from "$/lib/utils/schema";
import { protectedAdmin } from "$/pre-processor";

export const adminSocialController = new Elysia({
  name: "admin_social_controller",
  prefix: "/social",
})
  .use(protectedAdmin)
  .get(
    "/",
    async ({ query }) => {
      const rows = await db
        .select()
        .from(socialPostsTable)
        .where(
          and(
            query.platform
              ? eq(socialPostsTable.platform, query.platform)
              : undefined,
          ),
        )
        .orderBy(desc(socialPostsTable.publishedAt))
        .limit(200);
      return ok(rows);
    },
    {
      query: t.Object({
        platform: t.Optional(tEnum(socialPlatforms)),
      }),
    },
  )
  .get("/status", () => ok(socialSyncService.status()))
  .post(
    "/sync",
    async ({ body, status }) => {
      try {
        const result = body.platform
          ? [await socialSyncService.sync(body.platform)]
          : await socialSyncService.syncAll();
        return ok(result, "Sync complete");
      } catch (error) {
        return status(502, fail(`Sync failed: ${String(error)}`));
      }
    },
    {
      body: t.Object({
        platform: t.Optional(tEnum(socialPlatforms)),
      }),
    },
  )
  .post(
    "/",
    async ({ body }) => {
      const [row] = await db
        .insert(socialPostsTable)
        .values({
          ...body,
          externalId: `manual-${Date.now()}`,
          publishedAt: body.publishedAt
            ? new Date(body.publishedAt)
            : new Date(),
        })
        .returning();
      return ok(row, "Post added");
    },
    {
      body: t.Object({
        platform: tEnum(socialPlatforms),
        caption: t.String(),
        mediaType: tEnum(socialMediaTypes),
        mediaUrl: t.Optional(t.Nullable(t.String())),
        thumbnailUrl: t.Optional(t.Nullable(t.String())),
        permalink: t.String({ minLength: 8 }),
        publishedAt: t.Optional(t.String()),
      }),
    },
  )
  .patch(
    "/:id",
    async ({ params, body, status }) => {
      const [row] = await db
        .update(socialPostsTable)
        .set({ isHidden: body.isHidden })
        .where(eq(socialPostsTable.id, Number(params.id)))
        .returning();
      if (!row) return status(404, fail("Post not found"));
      return ok(row, body.isHidden ? "Hidden from site" : "Visible on site");
    },
    { body: t.Object({ isHidden: t.Boolean() }) },
  )
  .delete("/:id", async ({ params, status }) => {
    const [row] = await db
      .delete(socialPostsTable)
      .where(eq(socialPostsTable.id, Number(params.id)))
      .returning({ id: socialPostsTable.id });
    if (!row) return status(404, fail("Post not found"));
    return ok(row, "Post removed");
  });

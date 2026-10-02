import { and, desc, eq } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { db } from "$/db";
import {
  feedArrangements,
  socialMediaTypes,
  socialPlatforms,
  socialPostsTable,
  youtubeChannelsTable,
  youtubeContentKinds,
} from "$/db/schema";
import { socialSyncService } from "$/lib/services/social/social-sync-service";
import {
  previewChannel,
  resolveChannel,
  YouTubeApiError,
} from "$/lib/services/social/youtube-api";
import { fail, ok } from "$/lib/utils";
import { tEnum } from "$/lib/utils/schema";
import { protectedAdmin } from "$/pre-processor";

const errorText = (error: unknown) =>
  error instanceof Error ? error.message : String(error);
/** A missing key is the server's config; anything else is YouTube's answer. */
const ytStatus = (error: unknown) =>
  error instanceof YouTubeApiError && error.reason === "noKey" ? 400 : 502;

const channelRef = t.String({ minLength: 1, maxLength: 200 });
const includeKinds = t.Array(tEnum(youtubeContentKinds), {
  minItems: 1,
  maxItems: 3,
});
const maxVideos = t.Integer({ minimum: 1, maximum: 50 });
const NO_CHANNEL =
  "No YouTube channel found. Check the handle, e.g. @shimlawaleofficial.";

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
  .get("/status", async () => ok(await socialSyncService.status()))
  /** Dry run: looks the channel up and previews its newest uploads. */
  .post(
    "/youtube/test",
    async ({ body, status }) => {
      try {
        const channel = await resolveChannel(body.channel);
        if (!channel) return status(404, fail(NO_CHANNEL));
        const preview = await previewChannel(channel.id);
        return ok({ channel, ...preview }, "Channel found");
      } catch (error) {
        return status(ytStatus(error), fail(errorText(error)));
      }
    },
    { body: t.Object({ channel: channelRef }) },
  )
  .post(
    "/youtube/channels",
    async ({ body, status }) => {
      try {
        const channel = await resolveChannel(body.channel);
        if (!channel) return status(404, fail(NO_CHANNEL));
        const existing = await socialSyncService.channels();
        if (existing.some((c) => c.channelId === channel.id)) {
          return status(409, fail(`${channel.title} is already added`));
        }
        const [row] = await db
          .insert(youtubeChannelsTable)
          .values({
            channelId: channel.id,
            handle: channel.handle,
            title: channel.title,
            thumbnailUrl: channel.thumbnailUrl,
            subscriberCount: channel.subscriberCount,
            videoCount: channel.videoCount,
            include: body.include,
            maxVideos: body.maxVideos ?? 6,
            sortOrder: Math.max(-1, ...existing.map((c) => c.sortOrder)) + 1,
          })
          .returning();
        if (!row) return status(500, fail("Could not save the channel"));
        const synced = await socialSyncService.syncChannel(row.id);
        return ok(
          await socialSyncService.status(),
          `Added ${channel.title}, ${synced} videos synced`,
        );
      } catch (error) {
        // The channel row stays; its lastSyncError shows what went wrong.
        return status(ytStatus(error), fail(errorText(error)));
      }
    },
    {
      body: t.Object({
        channel: channelRef,
        include: includeKinds,
        maxVideos: t.Optional(maxVideos),
      }),
    },
  )
  /** The channel ids in the order they should appear on the site. */
  .put(
    "/youtube/channels/order",
    async ({ body }) => {
      await db.transaction(async (tx) => {
        for (const [sortOrder, id] of body.ids.entries()) {
          await tx
            .update(youtubeChannelsTable)
            .set({ sortOrder })
            .where(eq(youtubeChannelsTable.id, id));
        }
      });
      return ok(await socialSyncService.status(), "Order saved");
    },
    { body: t.Object({ ids: t.Array(t.Integer(), { maxItems: 100 }) }) },
  )
  .patch(
    "/youtube/channels/:id",
    async ({ params, body, status }) => {
      const [row] = await db
        .update(youtubeChannelsTable)
        .set({
          ...body,
          ...(body.label !== undefined && { label: body.label.trim() || null }),
        })
        .where(eq(youtubeChannelsTable.id, params.id))
        .returning();
      if (!row) return status(404, fail("Channel not found"));
      // Only changes to what is pulled need YouTube; a failure is kept on
      // the channel (lastSyncError) and shown in the status.
      if (
        body.include !== undefined ||
        body.maxVideos !== undefined ||
        body.isActive !== undefined
      ) {
        await socialSyncService.syncChannel(row.id).catch(() => {});
      }
      return ok(await socialSyncService.status(), "Saved");
    },
    {
      params: t.Object({ id: t.Numeric() }),
      body: t.Object({
        label: t.Optional(t.String({ maxLength: 60 })),
        include: t.Optional(includeKinds),
        maxVideos: t.Optional(maxVideos),
        isActive: t.Optional(t.Boolean()),
      }),
    },
  )
  .delete(
    "/youtube/channels/:id",
    async ({ params, status }) => {
      const [row] = await db
        .delete(youtubeChannelsTable)
        .where(eq(youtubeChannelsTable.id, params.id))
        .returning();
      if (!row) return status(404, fail("Channel not found"));
      await db
        .delete(socialPostsTable)
        .where(
          and(
            eq(socialPostsTable.platform, "youtube"),
            eq(socialPostsTable.sourceId, row.channelId),
          ),
        );
      return ok(await socialSyncService.status(), `Removed ${row.title}`);
    },
    { params: t.Object({ id: t.Numeric() }) },
  )
  .patch(
    "/feeds/:platform",
    async ({ params, body }) => {
      if (Object.keys(body).length > 0) {
        await socialSyncService.saveFeed(params.platform, body);
      }
      return ok(await socialSyncService.status(), "Saved");
    },
    {
      params: t.Object({ platform: tEnum(socialPlatforms) }),
      body: t.Object({
        showOnSite: t.Optional(t.Boolean()),
        autoSync: t.Optional(t.Boolean()),
        syncEveryHours: t.Optional(t.Integer({ minimum: 1, maximum: 24 })),
        arrangement: t.Optional(tEnum(feedArrangements)),
      }),
    },
  )
  .post(
    "/sync",
    async ({ body, status }) => {
      try {
        const result = body.platform
          ? [await socialSyncService.sync(body.platform)]
          : await socialSyncService.syncAll();
        return ok(result, "Sync complete");
      } catch (error) {
        return status(502, fail(`Sync failed: ${errorText(error)}`));
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
        .set(body)
        .where(eq(socialPostsTable.id, Number(params.id)))
        .returning();
      if (!row) return status(404, fail("Post not found"));
      return ok(row, "Saved");
    },
    {
      body: t.Object(
        {
          isHidden: t.Optional(t.Boolean()),
          isPinned: t.Optional(t.Boolean()),
        },
        { minProperties: 1 },
      ),
    },
  )
  .delete("/:id", async ({ params, status }) => {
    const [row] = await db
      .delete(socialPostsTable)
      .where(eq(socialPostsTable.id, Number(params.id)))
      .returning({ id: socialPostsTable.id });
    if (!row) return status(404, fail("Post not found"));
    return ok(row, "Post removed");
  });

import { pgTable } from "drizzle-orm/pg-core";
import { socialPlatformEnum } from "./social-posts.sql";

export const youtubeContentKinds = ["videos", "shorts", "live"] as const;
export type YoutubeContentKind = (typeof youtubeContentKinds)[number];

/** How posts of several sources (YouTube channels) are mixed on the site:
 * "newest" = purely by date, "balanced" = channels take turns in their order. */
export const feedArrangements = ["newest", "balanced"] as const;
export type FeedArrangement = (typeof feedArrangements)[number];

/** Per-platform feed settings (one row per platform, created on first save).
 * API secrets stay in the environment; only admin choices live here. */
export const socialFeedsTable = pgTable("social_feeds", (pg) => ({
  platform: socialPlatformEnum().primaryKey(),
  /** Off = the platform's tab disappears from the public "Latest" section. */
  showOnSite: pg.boolean("show_on_site").notNull().default(true),
  autoSync: pg.boolean("auto_sync").notNull().default(true),
  syncEveryHours: pg.smallint("sync_every_hours").notNull().default(6),
  /** How many of the latest posts a sync keeps. YouTube sets this per
   * channel instead (youtube_channels.max_videos). */
  maxPosts: pg.smallint("max_posts").notNull().default(12),
  arrangement: pg.text().$type<FeedArrangement>().notNull().default("newest"),
  lastSyncedAt: pg.timestamp("last_synced_at", { withTimezone: true }),
  lastSyncCount: pg.integer("last_sync_count"),
  lastSyncError: pg.text("last_sync_error"),
  updatedAt: pg
    .timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}));

export type SelectSocialFeed = typeof socialFeedsTable.$inferSelect;
export type InsertSocialFeed = typeof socialFeedsTable.$inferInsert;

/** YouTube channels the admin added in Admin → Social feed. Their newest
 * uploads are cached in social_posts (source_id = channel_id). */
export const youtubeChannelsTable = pgTable("youtube_channels", (pg) => ({
  id: pg.serial().primaryKey(),
  channelId: pg.text("channel_id").notNull().unique(),
  /** "@shimlawaleofficial"; null for channels without a handle. */
  handle: pg.text(),
  title: pg.text().notNull(),
  /** Admin's own name for the channel on the site; falls back to title. */
  label: pg.text(),
  thumbnailUrl: pg.text("thumbnail_url"),
  subscriberCount: pg.integer("subscriber_count"),
  videoCount: pg.integer("video_count"),
  /** Which kinds of uploads are pulled into the feed. */
  include: pg
    .jsonb()
    .$type<YoutubeContentKind[]>()
    .notNull()
    .default(["videos", "live"]),
  maxVideos: pg.smallint("max_videos").notNull().default(6),
  /** Paused channels keep their settings but leave the site. */
  isActive: pg.boolean("is_active").notNull().default(true),
  sortOrder: pg.smallint("sort_order").notNull().default(0),
  lastSyncedAt: pg.timestamp("last_synced_at", { withTimezone: true }),
  lastSyncCount: pg.integer("last_sync_count"),
  lastSyncError: pg.text("last_sync_error"),
  createdAt: pg
    .timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}));

export type SelectYoutubeChannel = typeof youtubeChannelsTable.$inferSelect;
export type InsertYoutubeChannel = typeof youtubeChannelsTable.$inferInsert;

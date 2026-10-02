import { pgEnum, pgTable, unique } from "drizzle-orm/pg-core";

export const socialPlatforms = ["facebook", "instagram", "youtube"] as const;
export type SocialPlatform = (typeof socialPlatforms)[number];
export const socialPlatformEnum = pgEnum("social_platform", socialPlatforms);

export const socialMediaTypes = ["image", "video", "text"] as const;
export type SocialMediaType = (typeof socialMediaTypes)[number];
export const socialMediaTypeEnum = pgEnum(
  "social_media_type",
  socialMediaTypes,
);

export type SocialStats = { likes?: number; comments?: number; views?: number };

/** Local cache of posts pulled from Facebook / Instagram / YouTube. The
 * public site reads only from here; sync providers fill it. */
export const socialPostsTable = pgTable(
  "social_posts",
  (pg) => ({
    id: pg.serial().primaryKey(),
    platform: socialPlatformEnum().notNull(),
    externalId: pg.text("external_id").notNull(),
    caption: pg.text().notNull().default(""),
    mediaType: socialMediaTypeEnum("media_type").notNull().default("image"),
    mediaUrl: pg.text("media_url"),
    thumbnailUrl: pg.text("thumbnail_url"),
    permalink: pg.text().notNull(),
    publishedAt: pg.timestamp("published_at", { withTimezone: true }).notNull(),
    stats: pg.jsonb().$type<SocialStats>().notNull().default({}),
    isHidden: pg.boolean("is_hidden").notNull().default(false),
    /** Pinned posts lead their platform's feed on the site. */
    isPinned: pg.boolean("is_pinned").notNull().default(false),
    /** Where a synced post came from: the YouTube channel id. */
    sourceId: pg.text("source_id"),
    createdAt: pg
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  }),
  (t) => [unique("social_platform_external_uq").on(t.platform, t.externalId)],
);

export type SelectSocialPost = typeof socialPostsTable.$inferSelect;
export type InsertSocialPost = typeof socialPostsTable.$inferInsert;

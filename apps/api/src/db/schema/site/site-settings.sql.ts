import { pgTable } from "drizzle-orm/pg-core";

export const studioGalleryIcons = [
  "sliders",
  "mic",
  "video",
  "disc",
  "headphones",
  "camera",
] as const;
export type StudioGalleryIcon = (typeof studioGalleryIcons)[number];

/** One photo card in the landing page's "Inside our studio" gallery. */
export type StudioGalleryItem = {
  imagePath: string;
  title: string;
  description: string;
  icon: StudioGalleryIcon;
};

export type SiteStats = {
  followers: string;
  views: string;
  years: string;
  albums: string;
};

/** Single-row table (id = 1) holding everything the public site renders
 * that the admin can edit without a deploy. */
export const siteSettingsTable = pgTable("site_settings", (pg) => ({
  id: pg.integer().primaryKey().default(1),
  artistName: pg.text("artist_name").notNull(),
  tagline: pg.text().notNull(),
  bio: pg.text().notNull(),
  heroImagePath: pg.text("hero_image_path"),
  aboutImagePath: pg.text("about_image_path"),
  /** Studio photos shown on the landing page, in display order. */
  studioGallery: pg
    .jsonb("studio_gallery")
    .$type<StudioGalleryItem[]>()
    .notNull()
    .default([]),
  /** YouTube track the hero's music card plays (any YouTube / YT Music URL). */
  heroTrackUrl: pg.text("hero_track_url"),
  heroTrackTitle: pg.text("hero_track_title"),
  /** Small line under the title, e.g. "66 Lakh+ views". */
  heroTrackSubtitle: pg.text("hero_track_subtitle"),
  studioIntro: pg.text("studio_intro").notNull(),
  studioAddress: pg.text("studio_address").notNull(),
  mapEmbedUrl: pg.text("map_embed_url"),
  phone: pg.text().notNull(),
  whatsappNumber: pg.text("whatsapp_number").notNull(),
  email: pg.text().notNull(),
  facebookUrl: pg.text("facebook_url"),
  instagramUrl: pg.text("instagram_url"),
  youtubeUrl: pg.text("youtube_url"),
  xUrl: pg.text("x_url"),
  spotifyUrl: pg.text("spotify_url"),
  appleMusicUrl: pg.text("apple_music_url"),
  whatsappChannelUrl: pg.text("whatsapp_channel_url"),
  stats: pg.jsonb().$type<SiteStats>().notNull(),
  updatedAt: pg
    .timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}));

export type SelectSiteSettings = typeof siteSettingsTable.$inferSelect;
export type InsertSiteSettings = typeof siteSettingsTable.$inferInsert;

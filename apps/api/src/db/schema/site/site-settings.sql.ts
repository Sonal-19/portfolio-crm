import { pgTable } from "drizzle-orm/pg-core";

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
  studioImagePath: pg.text("studio_image_path"),
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
    .timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}));

export type SelectSiteSettings = typeof siteSettingsTable.$inferSelect;
export type InsertSiteSettings = typeof siteSettingsTable.$inferInsert;

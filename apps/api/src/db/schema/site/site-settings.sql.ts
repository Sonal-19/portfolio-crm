import { pgTable } from "drizzle-orm/pg-core";

export const galleryIcons = [
  "khanda",
  "harmonium",
  "tabla",
  "sangat",
  "pheri",
  "headphones",
] as const;
export type GalleryIcon = (typeof galleryIcons)[number];

/** One photo card in the landing page's "Kirtan moments" gallery. */
export type GalleryItem = {
  imagePath: string;
  title: string;
  description: string;
  icon: GalleryIcon;
};

export type SiteStats = {
  followers: string;
  views: string;
  years: string;
  albums: string;
};

/** Channels the floating "Book Kirtan" button can hand off to. Only
 * WhatsApp is wired today; email (SMTP) etc. slot in here later. */
export const quickBookingChannels = ["whatsapp"] as const;
export type QuickBookingChannel = (typeof quickBookingChannels)[number];

/** `choose` = visitor picks from the active numbers, `rotate` = a random
 * active number is used so chats spread across the team. */
export const quickBookingModes = ["choose", "rotate"] as const;
export type QuickBookingMode = (typeof quickBookingModes)[number];

export type QuickBookingContact = {
  id: string;
  /** Shown to visitors when they choose, e.g. "Bhai Sahib's office". */
  label: string;
  /** Digits with country code, e.g. 919876543210. */
  number: string;
  isActive: boolean;
};

/** Floating "Book Kirtan" button on the public site. */
export type QuickBooking = {
  enabled: boolean;
  channel: QuickBookingChannel;
  label: string;
  /** Prefilled chat text; the visitor only has to press send. */
  message: string;
  mode: QuickBookingMode;
  contacts: QuickBookingContact[];
};

export const quickBookingDefault: QuickBooking = {
  enabled: false,
  channel: "whatsapp",
  label: "Book Kirtan",
  message:
    "Waheguru Ji Ka Khalsa, Waheguru Ji Ki Fateh 🙏 I want to book a kirtan program.",
  mode: "choose",
  contacts: [],
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
  /** Kirtan program photos shown on the landing page, in display order. */
  gallery: pg.jsonb("gallery").$type<GalleryItem[]>().notNull().default([]),
  /** YouTube track the hero's music card plays (any YouTube / YT Music URL). */
  heroTrackUrl: pg.text("hero_track_url"),
  heroTrackTitle: pg.text("hero_track_title"),
  /** Small line under the title, e.g. "66 Lakh+ views". */
  heroTrackSubtitle: pg.text("hero_track_subtitle"),
  /** Intro paragraph of the landing page's Kirtan Seva section. */
  kirtanIntro: pg.text("kirtan_intro").notNull(),
  /** Office / Amritvela Trust address shown in contact and footer. */
  address: pg.text().notNull(),
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
  quickBooking: pg
    .jsonb("quick_booking")
    .$type<QuickBooking>()
    .notNull()
    .default(quickBookingDefault),
  updatedAt: pg
    .timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}));

export type SelectSiteSettings = typeof siteSettingsTable.$inferSelect;
export type InsertSiteSettings = typeof siteSettingsTable.$inferInsert;

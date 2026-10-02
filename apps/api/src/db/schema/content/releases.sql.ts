import { pgEnum, pgTable } from "drizzle-orm/pg-core";

export const releasePlatforms = [
  "youtube",
  "youtube_music",
  "spotify",
  "apple_music",
  "jiosaavn",
  "amazon_music",
  "gaana",
  "instagram",
  "other",
] as const;
export type ReleasePlatform = (typeof releasePlatforms)[number];

/** One "listen on" button under a release poster. */
export type ReleaseLink = { platform: ReleasePlatform; url: string };

/** `square` = album art (1:1), `wide` = YouTube-style thumbnail (16:9). */
export const releaseAspects = ["square", "wide"] as const;
export type ReleaseAspect = (typeof releaseAspects)[number];
export const releaseAspectEnum = pgEnum("release_aspect", releaseAspects);

/** Latest album / song posters shown in the home page's hero carousel. */
export const releasesTable = pgTable("releases", (pg) => ({
  id: pg.serial().primaryKey(),
  title: pg.text().notNull(),
  /** Small line above the title, e.g. "New Album · 2026". */
  subtitle: pg.text(),
  caption: pg.text().notNull().default(""),
  posterPath: pg.text("poster_path").notNull(),
  aspect: releaseAspectEnum().notNull().default("square"),
  links: pg.jsonb().$type<ReleaseLink[]>().notNull().default([]),
  releaseDate: pg.date("release_date", { mode: "string" }),
  isActive: pg.boolean("is_active").notNull().default(true),
  sortOrder: pg.smallint("sort_order").notNull().default(0),
  createdAt: pg
    .timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: pg
    .timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}));

export type SelectRelease = typeof releasesTable.$inferSelect;
export type InsertRelease = typeof releasesTable.$inferInsert;

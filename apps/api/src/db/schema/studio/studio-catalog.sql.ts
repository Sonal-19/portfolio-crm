import { pgEnum, pgTable } from "drizzle-orm/pg-core";

// The studio is free (seva) — none of these tables carries a price.

export const studioPackagesTable = pgTable("studio_packages", (pg) => ({
  id: pg.serial().primaryKey(),
  name: pg.text().notNull(),
  slug: pg.text().notNull().unique(),
  description: pg.text().notNull(),
  durationHours: pg.smallint("duration_hours").notNull().default(2),
  includes: pg.jsonb().$type<string[]>().notNull().default([]),
  icon: pg.text().notNull().default("mic"),
  isFeatured: pg.boolean("is_featured").notNull().default(false),
  sortOrder: pg.smallint("sort_order").notNull().default(0),
  isActive: pg.boolean("is_active").notNull().default(true),
  createdAt: pg
    .timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: pg
    .timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}));

export const studioInstrumentsTable = pgTable("studio_instruments", (pg) => ({
  id: pg.serial().primaryKey(),
  name: pg.text().notNull().unique(),
  sortOrder: pg.smallint("sort_order").notNull().default(0),
  isActive: pg.boolean("is_active").notNull().default(true),
}));

export const studioEngineersTable = pgTable("studio_engineers", (pg) => ({
  id: pg.serial().primaryKey(),
  name: pg.text().notNull(),
  bio: pg.text().notNull().default(""),
  photoPath: pg.text("photo_path"),
  isActive: pg.boolean("is_active").notNull().default(true),
}));

export const addonKinds = [
  "mixing",
  "mastering",
  "video_shoot",
  "other",
] as const;
export type AddonKind = (typeof addonKinds)[number];
export const addonKindEnum = pgEnum("studio_addon_kind", addonKinds);

export const studioAddonsTable = pgTable("studio_addons", (pg) => ({
  id: pg.serial().primaryKey(),
  name: pg.text().notNull(),
  description: pg.text().notNull().default(""),
  kind: addonKindEnum().notNull().default("other"),
  isActive: pg.boolean("is_active").notNull().default(true),
}));

export type SelectStudioPackage = typeof studioPackagesTable.$inferSelect;
export type SelectStudioInstrument = typeof studioInstrumentsTable.$inferSelect;
export type SelectStudioEngineer = typeof studioEngineersTable.$inferSelect;
export type SelectStudioAddon = typeof studioAddonsTable.$inferSelect;

import { pgEnum, pgTable } from "drizzle-orm/pg-core";
import { leadsTable } from "../crm/leads.sql";
import {
  studioEngineersTable,
  studioPackagesTable,
} from "./studio-catalog.sql";

export const artistTypes = [
  "raagi",
  "kirtani_jatha",
  "singer",
  "band",
  "other",
] as const;
export type ArtistType = (typeof artistTypes)[number];
export const artistTypeEnum = pgEnum("artist_type", artistTypes);

export const bookingStatuses = [
  "pending",
  "under_review",
  "approved",
  "scheduled",
  "completed",
  "rejected",
  "cancelled",
] as const;
export type BookingStatus = (typeof bookingStatuses)[number];
export const bookingStatusEnum = pgEnum("booking_status", bookingStatuses);

/** A free "Record with Us" application. The admin reviews and schedules it. */
export const studioBookingsTable = pgTable("studio_bookings", (pg) => ({
  id: pg.serial().primaryKey(),
  leadId: pg
    .integer("lead_id")
    .references(() => leadsTable.id, { onDelete: "set null" }),
  // who
  name: pg.text().notNull(),
  phone: pg.text().notNull(),
  email: pg.text(),
  city: pg.text(),
  artistType: artistTypeEnum("artist_type").notNull().default("raagi"),
  // talent
  experience: pg.text(),
  sampleLink: pg.text("sample_link"),
  about: pg.text(),
  // what
  packageId: pg
    .integer("package_id")
    .references(() => studioPackagesTable.id, { onDelete: "set null" }),
  instrumentIds: pg.integer("instrument_ids").array().notNull().default([]),
  engineerId: pg
    .integer("engineer_id")
    .references(() => studioEngineersTable.id, { onDelete: "set null" }),
  addonIds: pg.integer("addon_ids").array().notNull().default([]),
  durationHours: pg.smallint("duration_hours").notNull().default(2),
  projectTitle: pg.text("project_title"),
  notes: pg.text(),
  // when
  preferredDate: pg.date("preferred_date", { mode: "string" }).notNull(),
  preferredStartTime: pg.text("preferred_start_time").notNull(),
  scheduledStart: pg.timestamp("scheduled_start", { withTimezone: true }),
  scheduledEnd: pg.timestamp("scheduled_end", { withTimezone: true }),
  status: bookingStatusEnum().notNull().default("pending"),
  adminRemark: pg.text("admin_remark"),
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

export type SelectStudioBooking = typeof studioBookingsTable.$inferSelect;
export type InsertStudioBooking = typeof studioBookingsTable.$inferInsert;

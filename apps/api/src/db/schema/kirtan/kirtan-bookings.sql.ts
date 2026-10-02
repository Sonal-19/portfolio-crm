import { pgEnum, pgTable } from "drizzle-orm/pg-core";
import { leadsTable } from "../crm/leads.sql";

export const kirtanEventTypes = [
  "sukhmani_sahib",
  "akhand_path_bhog",
  "sehaj_path_bhog",
  "anand_karaj",
  "gurpurab",
  "amritvela_simran",
  "prabhat_pheri",
  "silent_kirtan",
  "griha_pravesh",
  "birthday_anniversary",
  "antim_ardas",
  "business_opening",
  "other",
] as const;
export type KirtanEventType = (typeof kirtanEventTypes)[number];
export const kirtanEventTypeEnum = pgEnum(
  "kirtan_event_type",
  kirtanEventTypes,
);

export const venueTypes = [
  "gurdwara",
  "home",
  "banquet_hall",
  "open_ground",
  "other",
] as const;
export type VenueType = (typeof venueTypes)[number];
export const venueTypeEnum = pgEnum("venue_type", venueTypes);

export const sangatSizes = [
  "under_50",
  "50_200",
  "200_500",
  "500_plus",
] as const;
export type SangatSize = (typeof sangatSizes)[number];
export const sangatSizeEnum = pgEnum("sangat_size", sangatSizes);

export const kirtanLanguages = ["punjabi", "hindi", "either"] as const;
export type KirtanLanguage = (typeof kirtanLanguages)[number];
export const kirtanLanguageEnum = pgEnum("kirtan_language", kirtanLanguages);

export const kirtanRequirements = [
  "sound_available",
  "need_sound",
  "silent_kirtan_headphones",
  "langar_arranged",
  "live_stream",
] as const;
export type KirtanRequirement = (typeof kirtanRequirements)[number];

export const kirtanBookingStatuses = [
  "new",
  "contacted",
  "confirmed",
  "completed",
  "declined",
  "cancelled",
] as const;
export type KirtanBookingStatus = (typeof kirtanBookingStatuses)[number];
export const kirtanBookingStatusEnum = pgEnum(
  "kirtan_booking_status",
  kirtanBookingStatuses,
);

/** A "Book Kirtan" request from the public site. The admin calls the
 * family / committee, then confirms and schedules the program. */
export const kirtanBookingsTable = pgTable("kirtan_bookings", (pg) => ({
  id: pg.serial().primaryKey(),
  leadId: pg
    .integer("lead_id")
    .references(() => leadsTable.id, { onDelete: "set null" }),
  // who
  name: pg.text().notNull(),
  phone: pg.text().notNull(),
  whatsapp: pg.text(),
  email: pg.text(),
  // what
  eventType: kirtanEventTypeEnum("event_type").notNull(),
  subject: pg.text().notNull(),
  language: kirtanLanguageEnum().notNull().default("either"),
  expectedSangat: sangatSizeEnum("expected_sangat"),
  requirements: pg.text().array().notNull().default([]),
  message: pg.text(),
  referralSource: pg.text("referral_source"),
  // when
  eventDate: pg.date("event_date", { mode: "string" }).notNull(),
  startTime: pg.text("start_time").notNull(),
  durationHours: pg.smallint("duration_hours").notNull().default(2),
  alternateDate: pg.date("alternate_date", { mode: "string" }),
  scheduledStart: pg.timestamp("scheduled_start", { withTimezone: true }),
  scheduledEnd: pg.timestamp("scheduled_end", { withTimezone: true }),
  // where
  venueType: venueTypeEnum("venue_type").notNull().default("gurdwara"),
  venueName: pg.text("venue_name"),
  address: pg.text().notNull(),
  city: pg.text().notNull(),
  state: pg.text().notNull(),
  pincode: pg.text(),
  status: kirtanBookingStatusEnum().notNull().default("new"),
  adminRemark: pg.text("admin_remark"),
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

export type SelectKirtanBooking = typeof kirtanBookingsTable.$inferSelect;
export type InsertKirtanBooking = typeof kirtanBookingsTable.$inferInsert;

import { pgEnum, pgTable } from "drizzle-orm/pg-core";
import { adminsTable } from "../auth/admins.sql";
import { leadsTable } from "./leads.sql";

export const contactQueriesTable = pgTable("contact_queries", (pg) => ({
  id: pg.serial().primaryKey(),
  leadId: pg
    .integer("lead_id")
    .references(() => leadsTable.id, { onDelete: "set null" }),
  name: pg.text().notNull(),
  phone: pg.text().notNull(),
  email: pg.text(),
  subject: pg.text().notNull(),
  message: pg.text().notNull(),
  isRead: pg.boolean("is_read").notNull().default(false),
  createdAt: pg
    .timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}));

/** Admin remarks on a lead. */
export const leadNotesTable = pgTable("lead_notes", (pg) => ({
  id: pg.serial().primaryKey(),
  leadId: pg
    .integer("lead_id")
    .notNull()
    .references(() => leadsTable.id, { onDelete: "cascade" }),
  adminId: pg
    .integer("admin_id")
    .references(() => adminsTable.id, { onDelete: "set null" }),
  body: pg.text().notNull(),
  createdAt: pg
    .timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}));

export const followUpTypes = [
  "call",
  "whatsapp",
  "visit",
  "email",
  "meeting",
  "program",
] as const;
export type FollowUpType = (typeof followUpTypes)[number];
export const followUpTypeEnum = pgEnum("follow_up_type", followUpTypes);

export const followUpStatuses = ["pending", "done", "missed"] as const;
export type FollowUpStatus = (typeof followUpStatuses)[number];
export const followUpStatusEnum = pgEnum("follow_up_status", followUpStatuses);

export const followUpsTable = pgTable("follow_ups", (pg) => ({
  id: pg.serial().primaryKey(),
  leadId: pg
    .integer("lead_id")
    .notNull()
    .references(() => leadsTable.id, { onDelete: "cascade" }),
  dueAt: pg.timestamp("due_at", { withTimezone: true }).notNull(),
  type: followUpTypeEnum().notNull().default("call"),
  title: pg.text().notNull(),
  notes: pg.text(),
  status: followUpStatusEnum().notNull().default("pending"),
  completedAt: pg.timestamp("completed_at", { withTimezone: true }),
  createdAt: pg
    .timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}));

export const activityKinds = [
  "created",
  "status_changed",
  "note_added",
  "follow_up_created",
  "follow_up_done",
  "kirtan_booking_received",
  "kirtan_booking_status",
  "query_received",
  "whatsapp_sent",
  "updated",
] as const;
export type ActivityKind = (typeof activityKinds)[number];
export const activityKindEnum = pgEnum("lead_activity_kind", activityKinds);

/** Auto-written timeline for a lead. */
export const leadActivitiesTable = pgTable("lead_activities", (pg) => ({
  id: pg.serial().primaryKey(),
  leadId: pg
    .integer("lead_id")
    .notNull()
    .references(() => leadsTable.id, { onDelete: "cascade" }),
  kind: activityKindEnum().notNull(),
  message: pg.text().notNull(),
  adminId: pg
    .integer("admin_id")
    .references(() => adminsTable.id, { onDelete: "set null" }),
  createdAt: pg
    .timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}));

export type SelectContactQuery = typeof contactQueriesTable.$inferSelect;
export type SelectLeadNote = typeof leadNotesTable.$inferSelect;
export type SelectFollowUp = typeof followUpsTable.$inferSelect;
export type SelectLeadActivity = typeof leadActivitiesTable.$inferSelect;

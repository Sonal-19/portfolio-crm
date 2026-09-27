import { pgEnum, pgTable } from "drizzle-orm/pg-core";
import { adminsTable } from "../auth/admins.sql";

export const leadSources = [
  "booking",
  "query",
  "manual",
  "whatsapp",
  "event",
] as const;
export type LeadSource = (typeof leadSources)[number];
export const leadSourceEnum = pgEnum("lead_source", leadSources);

export const leadStatuses = [
  "new",
  "contacted",
  "follow_up",
  "shortlisted",
  "recorded",
  "closed",
] as const;
export type LeadStatus = (typeof leadStatuses)[number];
export const leadStatusEnum = pgEnum("lead_status", leadStatuses);

export const leadPriorities = ["low", "medium", "high"] as const;
export type LeadPriority = (typeof leadPriorities)[number];
export const leadPriorityEnum = pgEnum("lead_priority", leadPriorities);

export const leadsTable = pgTable("leads", (pg) => ({
  id: pg.serial().primaryKey(),
  name: pg.text().notNull(),
  /** Normalised digits-only phone with country code, e.g. 919876543210. */
  phone: pg.text().notNull().unique(),
  email: pg.text(),
  city: pg.text(),
  source: leadSourceEnum().notNull().default("manual"),
  status: leadStatusEnum().notNull().default("new"),
  priority: leadPriorityEnum().notNull().default("medium"),
  tags: pg.text().array().notNull().default([]),
  assignedTo: pg
    .integer("assigned_to")
    .references(() => adminsTable.id, { onDelete: "set null" }),
  whatsappOptIn: pg.boolean("whatsapp_opt_in").notNull().default(true),
  lastContactedAt: pg.timestamp("last_contacted_at", { withTimezone: true }),
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

export type SelectLead = typeof leadsTable.$inferSelect;
export type InsertLead = typeof leadsTable.$inferInsert;

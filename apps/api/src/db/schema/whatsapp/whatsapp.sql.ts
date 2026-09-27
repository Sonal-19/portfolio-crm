import { pgEnum, pgTable, primaryKey } from "drizzle-orm/pg-core";
import { leadsTable } from "../crm/leads.sql";

export const waTemplateCategories = ["broadcast", "followup", "share"] as const;
export type WaTemplateCategory = (typeof waTemplateCategories)[number];
export const waTemplateCategoryEnum = pgEnum(
  "wa_template_category",
  waTemplateCategories,
);

/** Message body supports {{name}} and {{link}} placeholders. */
export const waTemplatesTable = pgTable("wa_templates", (pg) => ({
  id: pg.serial().primaryKey(),
  name: pg.text().notNull(),
  body: pg.text().notNull(),
  category: waTemplateCategoryEnum().notNull().default("broadcast"),
  createdAt: pg
    .timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}));

export const waBroadcastListsTable = pgTable("wa_broadcast_lists", (pg) => ({
  id: pg.serial().primaryKey(),
  name: pg.text().notNull(),
  description: pg.text().notNull().default(""),
  createdAt: pg
    .timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}));

export const waBroadcastListMembersTable = pgTable(
  "wa_broadcast_list_members",
  (pg) => ({
    listId: pg
      .integer("list_id")
      .notNull()
      .references(() => waBroadcastListsTable.id, { onDelete: "cascade" }),
    leadId: pg
      .integer("lead_id")
      .notNull()
      .references(() => leadsTable.id, { onDelete: "cascade" }),
    addedAt: pg
      .timestamp("added_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  }),
  (t) => [primaryKey({ columns: [t.listId, t.leadId] })],
);

export const waBroadcastStatuses = ["sending", "completed"] as const;
export const waBroadcastStatusEnum = pgEnum(
  "wa_broadcast_status",
  waBroadcastStatuses,
);

export const waBroadcastsTable = pgTable("wa_broadcasts", (pg) => ({
  id: pg.serial().primaryKey(),
  listId: pg
    .integer("list_id")
    .references(() => waBroadcastListsTable.id, { onDelete: "set null" }),
  templateId: pg
    .integer("template_id")
    .references(() => waTemplatesTable.id, { onDelete: "set null" }),
  title: pg.text().notNull(),
  message: pg.text().notNull(),
  shareLink: pg.text("share_link"),
  status: waBroadcastStatusEnum().notNull().default("sending"),
  createdAt: pg
    .timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}));

export const waRecipientStatuses = ["pending", "sent", "skipped"] as const;
export type WaRecipientStatus = (typeof waRecipientStatuses)[number];
export const waRecipientStatusEnum = pgEnum(
  "wa_recipient_status",
  waRecipientStatuses,
);

export const waBroadcastRecipientsTable = pgTable(
  "wa_broadcast_recipients",
  (pg) => ({
    id: pg.serial().primaryKey(),
    broadcastId: pg
      .integer("broadcast_id")
      .notNull()
      .references(() => waBroadcastsTable.id, { onDelete: "cascade" }),
    leadId: pg
      .integer("lead_id")
      .notNull()
      .references(() => leadsTable.id, { onDelete: "cascade" }),
    message: pg.text().notNull(),
    status: waRecipientStatusEnum().notNull().default("pending"),
    sentAt: pg.timestamp("sent_at", { withTimezone: true }),
  }),
);

export type SelectWaTemplate = typeof waTemplatesTable.$inferSelect;
export type SelectWaBroadcastList = typeof waBroadcastListsTable.$inferSelect;
export type SelectWaBroadcast = typeof waBroadcastsTable.$inferSelect;

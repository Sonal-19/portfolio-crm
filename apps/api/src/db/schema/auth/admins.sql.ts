import { pgEnum, pgTable } from "drizzle-orm/pg-core";

export const adminRoles = ["admin"] as const;
export type AdminRole = (typeof adminRoles)[number];
export const adminRoleEnum = pgEnum("admin_role", adminRoles);

export const adminsTable = pgTable("admins", (pg) => ({
  id: pg.serial().primaryKey(),
  name: pg.text().notNull(),
  email: pg.text().notNull().unique(),
  passwordHash: pg.text("password_hash").notNull(),
  role: adminRoleEnum("role").notNull().default("admin"),
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

export type InsertAdmin = typeof adminsTable.$inferInsert;
export type SelectAdmin = typeof adminsTable.$inferSelect;

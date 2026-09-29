import { pgEnum, pgTable } from "drizzle-orm/pg-core";

export const blogStatuses = ["draft", "published"] as const;
export type BlogStatus = (typeof blogStatuses)[number];
export const blogStatusEnum = pgEnum("blog_status", blogStatuses);

export const blogPostsTable = pgTable("blog_posts", (pg) => ({
  id: pg.serial().primaryKey(),
  title: pg.text().notNull(),
  slug: pg.text().notNull().unique(),
  excerpt: pg.text().notNull().default(""),
  body: pg.text().notNull(),
  coverImagePath: pg.text("cover_image_path"),
  tags: pg.text().array().notNull().default([]),
  status: blogStatusEnum().notNull().default("draft"),
  publishedAt: pg.timestamp("published_at", { withTimezone: true }),
  seoTitle: pg.text("seo_title"),
  seoDescription: pg.text("seo_description"),
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

export type SelectBlogPost = typeof blogPostsTable.$inferSelect;
export type InsertBlogPost = typeof blogPostsTable.$inferInsert;

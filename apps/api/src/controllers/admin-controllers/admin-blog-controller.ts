import { desc, eq } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { db } from "$/db";
import { blogPostsTable, blogStatuses } from "$/db/schema";
import { fail, ok, slugify } from "$/lib/utils";
import { tEnum } from "$/lib/utils/schema";
import { protectedAdmin } from "$/pre-processor";

const blogBody = {
  title: t.String({ minLength: 3 }),
  slug: t.Optional(t.String()),
  excerpt: t.Optional(t.String()),
  body: t.String({ minLength: 1 }),
  coverImagePath: t.Optional(t.Nullable(t.String())),
  tags: t.Optional(t.Array(t.String())),
  status: t.Optional(tEnum(blogStatuses)),
  seoTitle: t.Optional(t.Nullable(t.String())),
  seoDescription: t.Optional(t.Nullable(t.String())),
};

export const adminBlogController = new Elysia({
  name: "admin_blog_controller",
  prefix: "/blog",
})
  .use(protectedAdmin)
  .get("/", async () => {
    const rows = await db
      .select({
        id: blogPostsTable.id,
        title: blogPostsTable.title,
        slug: blogPostsTable.slug,
        excerpt: blogPostsTable.excerpt,
        coverImagePath: blogPostsTable.coverImagePath,
        tags: blogPostsTable.tags,
        status: blogPostsTable.status,
        publishedAt: blogPostsTable.publishedAt,
        updatedAt: blogPostsTable.updatedAt,
      })
      .from(blogPostsTable)
      .orderBy(desc(blogPostsTable.updatedAt));
    return ok(rows);
  })
  .get("/:id", async ({ params, status }) => {
    const [row] = await db
      .select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, Number(params.id)))
      .limit(1);
    if (!row) return status(404, fail("Post not found"));
    return ok(row);
  })
  .post(
    "/",
    async ({ body, status }) => {
      const slug = slugify(body.slug || body.title);
      const [dupe] = await db
        .select({ id: blogPostsTable.id })
        .from(blogPostsTable)
        .where(eq(blogPostsTable.slug, slug))
        .limit(1);
      if (dupe) return status(409, fail("Another post already uses this slug"));
      const [row] = await db
        .insert(blogPostsTable)
        .values({
          ...body,
          slug,
          excerpt: body.excerpt ?? "",
          publishedAt: body.status === "published" ? new Date() : null,
        })
        .returning();
      return ok(row, "Post created");
    },
    { body: t.Object(blogBody) },
  )
  .patch(
    "/:id",
    async ({ params, body, status }) => {
      const id = Number(params.id);
      const [before] = await db
        .select()
        .from(blogPostsTable)
        .where(eq(blogPostsTable.id, id))
        .limit(1);
      if (!before) return status(404, fail("Post not found"));
      const [row] = await db
        .update(blogPostsTable)
        .set({
          ...body,
          slug: body.slug ? slugify(body.slug) : undefined,
          publishedAt:
            body.status === "published" && !before.publishedAt
              ? new Date()
              : undefined,
        })
        .where(eq(blogPostsTable.id, id))
        .returning();
      return ok(row, "Post updated");
    },
    { body: t.Partial(t.Object(blogBody)) },
  )
  .delete("/:id", async ({ params, status }) => {
    const [row] = await db
      .delete(blogPostsTable)
      .where(eq(blogPostsTable.id, Number(params.id)))
      .returning({ id: blogPostsTable.id });
    if (!row) return status(404, fail("Post not found"));
    return ok(row, "Post deleted");
  });

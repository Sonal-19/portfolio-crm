import { asc, desc, eq } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { db } from "$/db";
import { releaseAspects, releasePlatforms, releasesTable } from "$/db/schema";
import { fail, ok } from "$/lib/utils";
import { tEnum } from "$/lib/utils/schema";
import { protectedAdmin } from "$/pre-processor";

const releaseBody = {
  title: t.String({ minLength: 1, maxLength: 160 }),
  subtitle: t.Optional(t.Nullable(t.String({ maxLength: 120 }))),
  caption: t.Optional(t.String({ maxLength: 600 })),
  posterPath: t.String({ minLength: 1 }),
  aspect: t.Optional(tEnum(releaseAspects)),
  links: t.Optional(
    t.Array(
      t.Object({
        platform: tEnum(releasePlatforms),
        url: t.String({ minLength: 4, maxLength: 500 }),
      }),
      { maxItems: 10 },
    ),
  ),
  releaseDate: t.Optional(t.Nullable(t.String())),
  isActive: t.Optional(t.Boolean()),
  sortOrder: t.Optional(t.Number()),
};

export const adminReleasesController = new Elysia({
  name: "admin_releases_controller",
  prefix: "/releases",
})
  .use(protectedAdmin)
  .get("/", async () => {
    const rows = await db
      .select()
      .from(releasesTable)
      .orderBy(asc(releasesTable.sortOrder), desc(releasesTable.releaseDate));
    return ok(rows);
  })
  .post(
    "/",
    async ({ body }) => {
      const [row] = await db
        .insert(releasesTable)
        .values({ ...body, releaseDate: body.releaseDate || null })
        .returning();
      return ok(row, "Release added");
    },
    { body: t.Object(releaseBody) },
  )
  .patch(
    "/reorder",
    async ({ body }) => {
      await db.transaction(async (tx) => {
        for (const [i, id] of body.ids.entries()) {
          await tx
            .update(releasesTable)
            .set({ sortOrder: i })
            .where(eq(releasesTable.id, id));
        }
      });
      return ok(null, "Order saved");
    },
    { body: t.Object({ ids: t.Array(t.Number(), { maxItems: 200 }) }) },
  )
  .patch(
    "/:id",
    async ({ params, body, status }) => {
      const [row] = await db
        .update(releasesTable)
        .set({
          ...body,
          ...(body.releaseDate !== undefined
            ? { releaseDate: body.releaseDate || null }
            : {}),
        })
        .where(eq(releasesTable.id, Number(params.id)))
        .returning();
      if (!row) return status(404, fail("Release not found"));
      return ok(row, "Release saved");
    },
    { body: t.Partial(t.Object(releaseBody)) },
  )
  .delete("/:id", async ({ params, status }) => {
    const [row] = await db
      .delete(releasesTable)
      .where(eq(releasesTable.id, Number(params.id)))
      .returning({ id: releasesTable.id });
    if (!row) return status(404, fail("Release not found"));
    return ok(row, "Release deleted");
  });

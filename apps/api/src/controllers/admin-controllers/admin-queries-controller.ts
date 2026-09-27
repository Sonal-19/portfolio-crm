import { desc, eq } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { db } from "$/db";
import { contactQueriesTable } from "$/db/schema";
import { fail, ok } from "$/lib/utils";
import { protectedAdmin } from "$/pre-processor";

export const adminQueriesController = new Elysia({
  name: "admin_queries_controller",
  prefix: "/queries",
})
  .use(protectedAdmin)
  .get("/", async () => {
    const rows = await db
      .select()
      .from(contactQueriesTable)
      .orderBy(desc(contactQueriesTable.createdAt))
      .limit(500);
    return ok(rows);
  })
  .patch(
    "/:id",
    async ({ params, body, status }) => {
      const [row] = await db
        .update(contactQueriesTable)
        .set({ isRead: body.isRead })
        .where(eq(contactQueriesTable.id, Number(params.id)))
        .returning();
      if (!row) return status(404, fail("Query not found"));
      return ok(row);
    },
    { body: t.Object({ isRead: t.Boolean() }) },
  )
  .delete("/:id", async ({ params, status }) => {
    const [row] = await db
      .delete(contactQueriesTable)
      .where(eq(contactQueriesTable.id, Number(params.id)))
      .returning({ id: contactQueriesTable.id });
    if (!row) return status(404, fail("Query not found"));
    return ok(row, "Query deleted");
  });

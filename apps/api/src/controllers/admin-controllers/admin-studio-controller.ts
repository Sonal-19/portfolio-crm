import { eq } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { db } from "$/db";
import {
  addonKinds,
  studioAddonsTable,
  studioEngineersTable,
  studioInstrumentsTable,
  studioPackagesTable,
} from "$/db/schema";
import { fail, ok, slugify } from "$/lib/utils";
import { tEnum } from "$/lib/utils/schema";
import { protectedAdmin } from "$/pre-processor";

const packageBody = {
  name: t.String({ minLength: 2 }),
  description: t.String(),
  durationHours: t.Number({ minimum: 1, maximum: 12 }),
  includes: t.Array(t.String()),
  icon: t.Optional(t.String()),
  isFeatured: t.Optional(t.Boolean()),
  sortOrder: t.Optional(t.Number()),
  isActive: t.Optional(t.Boolean()),
};
const instrumentBody = {
  name: t.String({ minLength: 2 }),
  sortOrder: t.Optional(t.Number()),
  isActive: t.Optional(t.Boolean()),
};
const engineerBody = {
  name: t.String({ minLength: 2 }),
  bio: t.Optional(t.String()),
  photoPath: t.Optional(t.Nullable(t.String())),
  isActive: t.Optional(t.Boolean()),
};
const addonBody = {
  name: t.String({ minLength: 2 }),
  description: t.Optional(t.String()),
  kind: tEnum(addonKinds),
  isActive: t.Optional(t.Boolean()),
};

const notFound = fail("Not found");

export const adminStudioController = new Elysia({
  name: "admin_studio_controller",
  prefix: "/studio",
})
  .use(protectedAdmin)
  .get("/catalog", async () => {
    const [packages, instruments, engineers, addons] = await Promise.all([
      db
        .select()
        .from(studioPackagesTable)
        .orderBy(studioPackagesTable.sortOrder),
      db
        .select()
        .from(studioInstrumentsTable)
        .orderBy(studioInstrumentsTable.sortOrder),
      db.select().from(studioEngineersTable).orderBy(studioEngineersTable.id),
      db.select().from(studioAddonsTable).orderBy(studioAddonsTable.id),
    ]);
    return ok({ packages, instruments, engineers, addons });
  })
  // packages
  .post(
    "/packages",
    async ({ body }) => {
      const [row] = await db
        .insert(studioPackagesTable)
        .values({
          ...body,
          slug: `${slugify(body.name)}-${Date.now().toString(36)}`,
        })
        .returning();
      return ok(row, "Session type created");
    },
    { body: t.Object(packageBody) },
  )
  .patch(
    "/packages/:id",
    async ({ params, body, status }) => {
      const [row] = await db
        .update(studioPackagesTable)
        .set(body)
        .where(eq(studioPackagesTable.id, Number(params.id)))
        .returning();
      return row ? ok(row, "Session type updated") : status(404, notFound);
    },
    { body: t.Partial(t.Object(packageBody)) },
  )
  .delete("/packages/:id", async ({ params, status }) => {
    const [row] = await db
      .delete(studioPackagesTable)
      .where(eq(studioPackagesTable.id, Number(params.id)))
      .returning({ id: studioPackagesTable.id });
    return row ? ok(row, "Deleted") : status(404, notFound);
  })
  // instruments
  .post(
    "/instruments",
    async ({ body }) => {
      const [row] = await db
        .insert(studioInstrumentsTable)
        .values(body)
        .returning();
      return ok(row, "Instrument added");
    },
    { body: t.Object(instrumentBody) },
  )
  .patch(
    "/instruments/:id",
    async ({ params, body, status }) => {
      const [row] = await db
        .update(studioInstrumentsTable)
        .set(body)
        .where(eq(studioInstrumentsTable.id, Number(params.id)))
        .returning();
      return row ? ok(row, "Instrument updated") : status(404, notFound);
    },
    { body: t.Partial(t.Object(instrumentBody)) },
  )
  .delete("/instruments/:id", async ({ params, status }) => {
    const [row] = await db
      .delete(studioInstrumentsTable)
      .where(eq(studioInstrumentsTable.id, Number(params.id)))
      .returning({ id: studioInstrumentsTable.id });
    return row ? ok(row, "Deleted") : status(404, notFound);
  })
  // engineers
  .post(
    "/engineers",
    async ({ body }) => {
      const [row] = await db
        .insert(studioEngineersTable)
        .values(body)
        .returning();
      return ok(row, "Engineer added");
    },
    { body: t.Object(engineerBody) },
  )
  .patch(
    "/engineers/:id",
    async ({ params, body, status }) => {
      const [row] = await db
        .update(studioEngineersTable)
        .set(body)
        .where(eq(studioEngineersTable.id, Number(params.id)))
        .returning();
      return row ? ok(row, "Engineer updated") : status(404, notFound);
    },
    { body: t.Partial(t.Object(engineerBody)) },
  )
  .delete("/engineers/:id", async ({ params, status }) => {
    const [row] = await db
      .delete(studioEngineersTable)
      .where(eq(studioEngineersTable.id, Number(params.id)))
      .returning({ id: studioEngineersTable.id });
    return row ? ok(row, "Deleted") : status(404, notFound);
  })
  // add-ons
  .post(
    "/addons",
    async ({ body }) => {
      const [row] = await db.insert(studioAddonsTable).values(body).returning();
      return ok(row, "Add-on created");
    },
    { body: t.Object(addonBody) },
  )
  .patch(
    "/addons/:id",
    async ({ params, body, status }) => {
      const [row] = await db
        .update(studioAddonsTable)
        .set(body)
        .where(eq(studioAddonsTable.id, Number(params.id)))
        .returning();
      return row ? ok(row, "Add-on updated") : status(404, notFound);
    },
    { body: t.Partial(t.Object(addonBody)) },
  )
  .delete("/addons/:id", async ({ params, status }) => {
    const [row] = await db
      .delete(studioAddonsTable)
      .where(eq(studioAddonsTable.id, Number(params.id)))
      .returning({ id: studioAddonsTable.id });
    return row ? ok(row, "Deleted") : status(404, notFound);
  });

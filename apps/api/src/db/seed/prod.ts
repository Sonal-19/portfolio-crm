import { count } from "drizzle-orm";
import { db } from "$/db";
import {
  adminsTable,
  blogPostsTable,
  siteSettingsTable,
  studioAddonsTable,
  studioEngineersTable,
  studioInstrumentsTable,
  studioPackagesTable,
} from "$/db/schema";
import { blogSeed } from "./blog-data";
import { siteSettingsSeed } from "./site-data";
import {
  addonsSeed,
  engineersSeed,
  instrumentsSeed,
  packagesSeed,
} from "./studio-data";

// Production-safe seed: never truncates, only fills tables that are empty
// (site settings, studio catalog, blog, first admin). No demo CRM data.
// Safe to run on every deploy.

// biome-ignore lint/suspicious/noExplicitAny: generic table arg
async function isEmpty(table: any) {
  const [row] = await db.select({ n: count() }).from(table);
  return (row?.n ?? 0) === 0;
}

async function seedIfEmpty(
  label: string,
  table: unknown,
  insert: () => Promise<unknown>,
) {
  if (await isEmpty(table)) {
    await insert();
    console.info(`🌱 seeded ${label}`);
  } else {
    console.info(`⏭  ${label} already present`);
  }
}

await seedIfEmpty("admin", adminsTable, async () => {
  const password = process.env.SEED_ADMIN_PASSWORD || crypto.randomUUID();
  await db.insert(adminsTable).values({
    name: "Gurpreet Singh",
    email: "admin@shimlawale.com",
    passwordHash: await Bun.password.hash(password),
  });
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.warn(`⚠️  admin@shimlawale.com created with password: ${password}`);
  }
});
await seedIfEmpty("site settings", siteSettingsTable, () =>
  db.insert(siteSettingsTable).values(siteSettingsSeed),
);
await seedIfEmpty("studio packages", studioPackagesTable, () =>
  db.insert(studioPackagesTable).values(packagesSeed),
);
await seedIfEmpty("studio instruments", studioInstrumentsTable, () =>
  db.insert(studioInstrumentsTable).values(instrumentsSeed),
);
await seedIfEmpty("studio engineers", studioEngineersTable, () =>
  db.insert(studioEngineersTable).values(engineersSeed),
);
await seedIfEmpty("studio addons", studioAddonsTable, () =>
  db.insert(studioAddonsTable).values(addonsSeed),
);
await seedIfEmpty("blog posts", blogPostsTable, () =>
  db
    .insert(blogPostsTable)
    .values(blogSeed.map((b) => ({ ...b, status: "published" as const }))),
);

console.info("✅ prod seed done");
process.exit(0);

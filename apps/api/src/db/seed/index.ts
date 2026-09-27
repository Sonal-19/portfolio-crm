import { sql } from "drizzle-orm";
import { db } from "$/db";
import {
  adminsTable,
  blogPostsTable,
  siteSettingsTable,
  socialPostsTable,
  studioAddonsTable,
  studioEngineersTable,
  studioInstrumentsTable,
  studioPackagesTable,
} from "$/db/schema";
import { blogSeed } from "./blog-data";
import { crmSeed } from "./crm-seed";
import { siteSettingsSeed } from "./site-data";
import { socialSeedData } from "./social-data";
import {
  addonsSeed,
  engineersSeed,
  instrumentsSeed,
  packagesSeed,
} from "./studio-data";

// Safety check: prevent accidental seeding on production.
const isProduction =
  process.env.NODE_ENV === "production" ||
  process.env.DATABASE_URL?.includes("production");
if (isProduction && process.env.FORCE_SEED !== "true") {
  console.error("❌ SEED BLOCKED: Cannot run seed on production database!");
  process.exit(1);
}

const ADMIN_EMAIL = "admin@shimlawale.com";
const ADMIN_PASSWORD = "ChangeMe123!";

async function mainSeed() {
  console.info("🌱 Starting database seed (this wipes existing data)...");

  await db.transaction(async (tx) => {
    await tx.execute(sql`
      truncate table
        wa_broadcast_recipients, wa_broadcasts, wa_broadcast_list_members,
        wa_broadcast_lists, wa_templates, lead_activities, lead_notes,
        follow_ups, contact_queries, studio_bookings, leads, social_posts,
        blog_posts, studio_addons, studio_engineers, studio_instruments,
        studio_packages, site_settings, auths, admins
      restart identity cascade
    `);

    console.info("Seeding admin...");
    const [admin] = await tx
      .insert(adminsTable)
      .values({
        name: "Gurpreet Singh",
        email: ADMIN_EMAIL,
        passwordHash: await Bun.password.hash(ADMIN_PASSWORD),
      })
      .returning();
    if (!admin) throw new Error("admin seed failed");

    console.info("Seeding site settings...");
    await tx.insert(siteSettingsTable).values(siteSettingsSeed);

    console.info("Seeding studio catalog...");
    const pkgs = await tx
      .insert(studioPackagesTable)
      .values(packagesSeed)
      .returning({ id: studioPackagesTable.id });
    await tx.insert(studioInstrumentsTable).values(instrumentsSeed);
    await tx.insert(studioEngineersTable).values(engineersSeed);
    await tx.insert(studioAddonsTable).values(addonsSeed);

    console.info("Seeding blog...");
    await tx
      .insert(blogPostsTable)
      .values(blogSeed.map((b) => ({ ...b, status: "published" as const })));

    console.info("Seeding social feed cache...");
    await tx.insert(socialPostsTable).values(socialSeedData);

    await crmSeed(
      tx,
      pkgs.map((p) => p.id),
      admin.id,
    );
  });

  console.info("✅ Database seed completed successfully!");
  console.warn(
    `⚠️  Admin login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD} — CHANGE THIS before any real deployment.`,
  );
  process.exit(0);
}

await mainSeed();

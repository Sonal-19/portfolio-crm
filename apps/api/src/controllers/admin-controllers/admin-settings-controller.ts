import { eq } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { db } from "$/db";
import {
  adminsTable,
  galleryIcons,
  quickBookingChannels,
  quickBookingModes,
  siteSettingsTable,
} from "$/db/schema";
import {
  storageService,
  type UploadFolder,
  uploadFolders,
} from "$/lib/services/storage-service";
import { fail, normalizePhone, ok, youtubeId } from "$/lib/utils";
import { tEnum } from "$/lib/utils/schema";
import { protectedAdmin } from "$/pre-processor";

const nullableStr = t.Optional(t.Nullable(t.String()));

export const adminSettingsController = new Elysia({
  name: "admin_settings_controller",
})
  .use(protectedAdmin)
  .get("/settings", async ({ status }) => {
    const [row] = await db.select().from(siteSettingsTable).limit(1);
    return row ? ok(row) : status(404, fail("Settings missing"));
  })
  .patch(
    "/settings",
    async ({ body, status }) => {
      if (body.heroTrackUrl && !youtubeId(body.heroTrackUrl)) {
        return status(
          400,
          fail("Hero music must be a YouTube or YouTube Music link"),
        );
      }
      const { quickBooking } = body;
      if (quickBooking) {
        quickBooking.contacts = quickBooking.contacts.map((c) => ({
          ...c,
          number: normalizePhone(c.number),
        }));
        const bad = quickBooking.contacts.find((c) => c.number.length < 10);
        if (bad) {
          return status(
            400,
            fail(`"${bad.label || "Contact"}" needs a full WhatsApp number`),
          );
        }
        if (
          quickBooking.enabled &&
          !quickBooking.contacts.some((c) => c.isActive)
        ) {
          return status(
            400,
            fail("Turn on at least one number before showing the Book button"),
          );
        }
      }
      const [row] = await db
        .update(siteSettingsTable)
        .set(body)
        .where(eq(siteSettingsTable.id, 1))
        .returning();
      return ok(row, "Settings saved");
    },
    {
      body: t.Object({
        artistName: t.Optional(t.String()),
        tagline: t.Optional(t.String()),
        bio: t.Optional(t.String()),
        heroImagePath: nullableStr,
        aboutImagePath: nullableStr,
        gallery: t.Optional(
          t.Array(
            t.Object({
              imagePath: t.String({ minLength: 1 }),
              title: t.String({ maxLength: 80 }),
              description: t.String({ maxLength: 240 }),
              icon: tEnum(galleryIcons),
            }),
            { maxItems: 12 },
          ),
        ),
        heroTrackUrl: nullableStr,
        heroTrackTitle: nullableStr,
        heroTrackSubtitle: nullableStr,
        kirtanIntro: t.Optional(t.String()),
        address: t.Optional(t.String()),
        mapEmbedUrl: nullableStr,
        phone: t.Optional(t.String()),
        whatsappNumber: t.Optional(t.String()),
        email: t.Optional(t.String()),
        facebookUrl: nullableStr,
        instagramUrl: nullableStr,
        youtubeUrl: nullableStr,
        xUrl: nullableStr,
        spotifyUrl: nullableStr,
        appleMusicUrl: nullableStr,
        whatsappChannelUrl: nullableStr,
        stats: t.Optional(
          t.Object({
            followers: t.String(),
            views: t.String(),
            years: t.String(),
            albums: t.String(),
          }),
        ),
        quickBooking: t.Optional(
          t.Object({
            enabled: t.Boolean(),
            channel: tEnum(quickBookingChannels),
            label: t.String({ minLength: 1, maxLength: 40 }),
            message: t.String({ minLength: 1, maxLength: 500 }),
            mode: tEnum(quickBookingModes),
            contacts: t.Array(
              t.Object({
                id: t.String({ minLength: 1, maxLength: 40 }),
                label: t.String({ maxLength: 60 }),
                number: t.String({ minLength: 1, maxLength: 20 }),
                isActive: t.Boolean(),
              }),
              { maxItems: 10 },
            ),
          }),
        ),
      }),
    },
  )
  .post(
    "/settings/password",
    async ({ body, admin, status }) => {
      const valid = await Bun.password.verify(body.current, admin.passwordHash);
      if (!valid) return status(403, fail("Current password is incorrect"));
      await db
        .update(adminsTable)
        .set({ passwordHash: await Bun.password.hash(body.next) })
        .where(eq(adminsTable.id, admin.id));
      return ok(null, "Password changed");
    },
    {
      body: t.Object({
        current: t.String(),
        next: t.String({ minLength: 8 }),
      }),
    },
  )
  .post(
    "/uploads",
    async ({ body, status }) => {
      try {
        const path = await storageService.saveImage(
          body.file,
          body.folder as UploadFolder,
        );
        return ok({ path }, "Uploaded");
      } catch (error) {
        return status(400, fail((error as Error).message));
      }
    },
    {
      body: t.Object({
        file: t.File(),
        folder: tEnum(uploadFolders),
      }),
    },
  );

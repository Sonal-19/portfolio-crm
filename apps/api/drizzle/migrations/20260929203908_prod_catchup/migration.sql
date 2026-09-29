-- Brings a database created by an early `drizzle-kit push` (no migration
-- journal) up to the baseline schema. Idempotent: a no-op on fresh databases.

ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "studio_gallery" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "hero_track_url" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "hero_track_title" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "hero_track_subtitle" text;--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'site_settings' AND column_name = 'studio_image_path') THEN
    UPDATE "site_settings" SET "studio_gallery" = jsonb_build_array(
      jsonb_build_object('imagePath', "studio_image_path", 'title', 'Our recording studio',
        'description', 'Professional recording studio at Ghanta Ghar, Ludhiana.', 'icon', 'mic'))
    WHERE "studio_image_path" IS NOT NULL AND "studio_gallery" = '[]'::jsonb;
    ALTER TABLE "site_settings" DROP COLUMN "studio_image_path";
  END IF;
END $$;--> statement-breakpoint
DO $$
DECLARE r record;
BEGIN
  -- early push used timestamp-without-tz for updated_at; values were written in UTC
  FOR r IN SELECT table_name FROM information_schema.columns
           WHERE table_schema = 'public' AND column_name = 'updated_at'
             AND data_type = 'timestamp without time zone' LOOP
    EXECUTE format('ALTER TABLE %I ALTER COLUMN updated_at TYPE timestamp with time zone USING updated_at AT TIME ZONE ''UTC''', r.table_name);
  END LOOP;
END $$;

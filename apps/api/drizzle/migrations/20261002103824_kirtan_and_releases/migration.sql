-- Studio -> Book Kirtan. Existing leads keep their data: old enum values are
-- remapped (booking -> kirtan_booking, shortlisted -> confirmed, recorded ->
-- completed, session -> program, booking_* activities -> kirtan_booking_*) and
-- the studio_gallery/intro/address settings columns are renamed in place.
-- Studio bookings and the studio catalog tables are dropped.

CREATE TYPE "release_aspect" AS ENUM('square', 'wide');--> statement-breakpoint
CREATE TYPE "kirtan_booking_status" AS ENUM('new', 'contacted', 'confirmed', 'completed', 'declined', 'cancelled');--> statement-breakpoint
CREATE TYPE "kirtan_event_type" AS ENUM('sukhmani_sahib', 'akhand_path_bhog', 'sehaj_path_bhog', 'anand_karaj', 'gurpurab', 'amritvela_simran', 'prabhat_pheri', 'silent_kirtan', 'griha_pravesh', 'birthday_anniversary', 'antim_ardas', 'business_opening', 'other');--> statement-breakpoint
CREATE TYPE "kirtan_language" AS ENUM('punjabi', 'hindi', 'either');--> statement-breakpoint
CREATE TYPE "sangat_size" AS ENUM('under_50', '50_200', '200_500', '500_plus');--> statement-breakpoint
CREATE TYPE "venue_type" AS ENUM('gurdwara', 'home', 'banquet_hall', 'open_ground', 'other');--> statement-breakpoint
CREATE TABLE "releases" (
	"id" serial PRIMARY KEY,
	"title" text NOT NULL,
	"subtitle" text,
	"caption" text DEFAULT '' NOT NULL,
	"poster_path" text NOT NULL,
	"aspect" "release_aspect" DEFAULT 'square'::"release_aspect" NOT NULL,
	"links" jsonb DEFAULT '[]' NOT NULL,
	"release_date" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_feeds" (
	"platform" "social_platform" PRIMARY KEY,
	"show_on_site" boolean DEFAULT true NOT NULL,
	"auto_sync" boolean DEFAULT true NOT NULL,
	"sync_every_hours" smallint DEFAULT 6 NOT NULL,
	"max_posts" smallint DEFAULT 12 NOT NULL,
	"arrangement" text DEFAULT 'newest' NOT NULL,
	"last_synced_at" timestamp with time zone,
	"last_sync_count" integer,
	"last_sync_error" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "youtube_channels" (
	"id" serial PRIMARY KEY,
	"channel_id" text NOT NULL UNIQUE,
	"handle" text,
	"title" text NOT NULL,
	"label" text,
	"thumbnail_url" text,
	"subscriber_count" integer,
	"video_count" integer,
	"include" jsonb DEFAULT '["videos","live"]' NOT NULL,
	"max_videos" smallint DEFAULT 6 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"last_synced_at" timestamp with time zone,
	"last_sync_count" integer,
	"last_sync_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kirtan_bookings" (
	"id" serial PRIMARY KEY,
	"lead_id" integer,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"whatsapp" text,
	"email" text,
	"event_type" "kirtan_event_type" NOT NULL,
	"subject" text NOT NULL,
	"language" "kirtan_language" DEFAULT 'either'::"kirtan_language" NOT NULL,
	"expected_sangat" "sangat_size",
	"requirements" text[] DEFAULT '{}'::text[] NOT NULL,
	"message" text,
	"referral_source" text,
	"event_date" date NOT NULL,
	"start_time" text NOT NULL,
	"duration_hours" smallint DEFAULT 2 NOT NULL,
	"alternate_date" date,
	"scheduled_start" timestamp with time zone,
	"scheduled_end" timestamp with time zone,
	"venue_type" "venue_type" DEFAULT 'gurdwara'::"venue_type" NOT NULL,
	"venue_name" text,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"pincode" text,
	"status" "kirtan_booking_status" DEFAULT 'new'::"kirtan_booking_status" NOT NULL,
	"admin_remark" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "studio_bookings" DROP CONSTRAINT "studio_bookings_package_id_studio_packages_id_fkey";--> statement-breakpoint
ALTER TABLE "studio_bookings" DROP CONSTRAINT "studio_bookings_engineer_id_studio_engineers_id_fkey";--> statement-breakpoint
DROP TABLE "studio_bookings";--> statement-breakpoint
DROP TABLE "studio_addons";--> statement-breakpoint
DROP TABLE "studio_engineers";--> statement-breakpoint
DROP TABLE "studio_instruments";--> statement-breakpoint
DROP TABLE "studio_packages";--> statement-breakpoint
ALTER TABLE "site_settings" RENAME COLUMN "studio_gallery" TO "gallery";--> statement-breakpoint
ALTER TABLE "site_settings" RENAME COLUMN "studio_intro" TO "kirtan_intro";--> statement-breakpoint
ALTER TABLE "site_settings" RENAME COLUMN "studio_address" TO "address";--> statement-breakpoint
ALTER TABLE "social_posts" ADD COLUMN "is_pinned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "social_posts" ADD COLUMN "source_id" text;--> statement-breakpoint
ALTER TABLE "lead_activities" ALTER COLUMN "kind" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "lead_activity_kind";--> statement-breakpoint
CREATE TYPE "lead_activity_kind" AS ENUM('created', 'status_changed', 'note_added', 'follow_up_created', 'follow_up_done', 'kirtan_booking_received', 'kirtan_booking_status', 'query_received', 'whatsapp_sent', 'updated');--> statement-breakpoint
ALTER TABLE "lead_activities" ALTER COLUMN "kind" SET DATA TYPE "lead_activity_kind" USING (CASE "kind" WHEN 'booking_received' THEN 'kirtan_booking_received' WHEN 'booking_status' THEN 'kirtan_booking_status' ELSE "kind" END)::"lead_activity_kind";--> statement-breakpoint
ALTER TABLE "follow_ups" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "follow_ups" ALTER COLUMN "type" DROP DEFAULT;--> statement-breakpoint
DROP TYPE "follow_up_type";--> statement-breakpoint
CREATE TYPE "follow_up_type" AS ENUM('call', 'whatsapp', 'visit', 'email', 'meeting', 'program');--> statement-breakpoint
ALTER TABLE "follow_ups" ALTER COLUMN "type" SET DATA TYPE "follow_up_type" USING (CASE "type" WHEN 'session' THEN 'program' ELSE "type" END)::"follow_up_type";--> statement-breakpoint
ALTER TABLE "follow_ups" ALTER COLUMN "type" SET DEFAULT 'call'::"follow_up_type";--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "source" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "source" DROP DEFAULT;--> statement-breakpoint
DROP TYPE "lead_source";--> statement-breakpoint
CREATE TYPE "lead_source" AS ENUM('kirtan_booking', 'query', 'manual', 'whatsapp', 'event');--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "source" SET DATA TYPE "lead_source" USING (CASE "source" WHEN 'booking' THEN 'kirtan_booking' ELSE "source" END)::"lead_source";--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "source" SET DEFAULT 'manual'::"lead_source";--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
DROP TYPE "lead_status";--> statement-breakpoint
CREATE TYPE "lead_status" AS ENUM('new', 'contacted', 'follow_up', 'confirmed', 'completed', 'closed');--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "status" SET DATA TYPE "lead_status" USING (CASE "status" WHEN 'shortlisted' THEN 'confirmed' WHEN 'recorded' THEN 'completed' ELSE "status" END)::"lead_status";--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "status" SET DEFAULT 'new'::"lead_status";--> statement-breakpoint
ALTER TABLE "kirtan_bookings" ADD CONSTRAINT "kirtan_bookings_lead_id_leads_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL;--> statement-breakpoint
DROP TYPE "artist_type";--> statement-breakpoint
DROP TYPE "booking_status";--> statement-breakpoint
DROP TYPE "studio_addon_kind";
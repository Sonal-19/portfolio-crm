CREATE TYPE "admin_role" AS ENUM('admin');--> statement-breakpoint
CREATE TYPE "auth_state" AS ENUM('active', 'revoked', 'expired');--> statement-breakpoint
CREATE TYPE "blog_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "social_media_type" AS ENUM('image', 'video', 'text');--> statement-breakpoint
CREATE TYPE "social_platform" AS ENUM('facebook', 'instagram', 'youtube');--> statement-breakpoint
CREATE TYPE "lead_activity_kind" AS ENUM('created', 'status_changed', 'note_added', 'follow_up_created', 'follow_up_done', 'booking_received', 'booking_status', 'query_received', 'whatsapp_sent', 'updated');--> statement-breakpoint
CREATE TYPE "follow_up_status" AS ENUM('pending', 'done', 'missed');--> statement-breakpoint
CREATE TYPE "follow_up_type" AS ENUM('call', 'whatsapp', 'visit', 'email', 'meeting', 'session');--> statement-breakpoint
CREATE TYPE "lead_priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "lead_source" AS ENUM('booking', 'query', 'manual', 'whatsapp', 'event');--> statement-breakpoint
CREATE TYPE "lead_status" AS ENUM('new', 'contacted', 'follow_up', 'shortlisted', 'recorded', 'closed');--> statement-breakpoint
CREATE TYPE "artist_type" AS ENUM('raagi', 'kirtani_jatha', 'singer', 'band', 'other');--> statement-breakpoint
CREATE TYPE "booking_status" AS ENUM('pending', 'under_review', 'approved', 'scheduled', 'completed', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "studio_addon_kind" AS ENUM('mixing', 'mastering', 'video_shoot', 'other');--> statement-breakpoint
CREATE TYPE "wa_broadcast_status" AS ENUM('sending', 'completed');--> statement-breakpoint
CREATE TYPE "wa_recipient_status" AS ENUM('pending', 'sent', 'skipped');--> statement-breakpoint
CREATE TYPE "wa_template_category" AS ENUM('broadcast', 'followup', 'share');--> statement-breakpoint
CREATE TABLE "admins" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"password_hash" text NOT NULL,
	"role" "admin_role" DEFAULT 'admin'::"admin_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auths" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL,
	"token" text NOT NULL UNIQUE,
	"state" "auth_state" DEFAULT 'active'::"auth_state" NOT NULL,
	"device" text DEFAULT 'unknown' NOT NULL,
	"ip" text,
	"details" jsonb,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" serial PRIMARY KEY,
	"title" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"excerpt" text DEFAULT '' NOT NULL,
	"body" text NOT NULL,
	"cover_image_path" text,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"status" "blog_status" DEFAULT 'draft'::"blog_status" NOT NULL,
	"published_at" timestamp with time zone,
	"seo_title" text,
	"seo_description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_posts" (
	"id" serial PRIMARY KEY,
	"platform" "social_platform" NOT NULL,
	"external_id" text NOT NULL,
	"caption" text DEFAULT '' NOT NULL,
	"media_type" "social_media_type" DEFAULT 'image'::"social_media_type" NOT NULL,
	"media_url" text,
	"thumbnail_url" text,
	"permalink" text NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	"stats" jsonb DEFAULT '{}' NOT NULL,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "social_platform_external_uq" UNIQUE("platform","external_id")
);
--> statement-breakpoint
CREATE TABLE "contact_queries" (
	"id" serial PRIMARY KEY,
	"lead_id" integer,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "follow_ups" (
	"id" serial PRIMARY KEY,
	"lead_id" integer NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"type" "follow_up_type" DEFAULT 'call'::"follow_up_type" NOT NULL,
	"title" text NOT NULL,
	"notes" text,
	"status" "follow_up_status" DEFAULT 'pending'::"follow_up_status" NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_activities" (
	"id" serial PRIMARY KEY,
	"lead_id" integer NOT NULL,
	"kind" "lead_activity_kind" NOT NULL,
	"message" text NOT NULL,
	"admin_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_notes" (
	"id" serial PRIMARY KEY,
	"lead_id" integer NOT NULL,
	"admin_id" integer,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"phone" text NOT NULL UNIQUE,
	"email" text,
	"city" text,
	"source" "lead_source" DEFAULT 'manual'::"lead_source" NOT NULL,
	"status" "lead_status" DEFAULT 'new'::"lead_status" NOT NULL,
	"priority" "lead_priority" DEFAULT 'medium'::"lead_priority" NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"assigned_to" integer,
	"whatsapp_opt_in" boolean DEFAULT true NOT NULL,
	"last_contacted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" integer PRIMARY KEY DEFAULT 1,
	"artist_name" text NOT NULL,
	"tagline" text NOT NULL,
	"bio" text NOT NULL,
	"hero_image_path" text,
	"about_image_path" text,
	"studio_gallery" jsonb DEFAULT '[]' NOT NULL,
	"hero_track_url" text,
	"hero_track_title" text,
	"hero_track_subtitle" text,
	"studio_intro" text NOT NULL,
	"studio_address" text NOT NULL,
	"map_embed_url" text,
	"phone" text NOT NULL,
	"whatsapp_number" text NOT NULL,
	"email" text NOT NULL,
	"facebook_url" text,
	"instagram_url" text,
	"youtube_url" text,
	"x_url" text,
	"spotify_url" text,
	"apple_music_url" text,
	"whatsapp_channel_url" text,
	"stats" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_bookings" (
	"id" serial PRIMARY KEY,
	"lead_id" integer,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"city" text,
	"artist_type" "artist_type" DEFAULT 'raagi'::"artist_type" NOT NULL,
	"experience" text,
	"sample_link" text,
	"about" text,
	"package_id" integer,
	"instrument_ids" integer[] DEFAULT '{}'::integer[] NOT NULL,
	"engineer_id" integer,
	"addon_ids" integer[] DEFAULT '{}'::integer[] NOT NULL,
	"duration_hours" smallint DEFAULT 2 NOT NULL,
	"project_title" text,
	"notes" text,
	"preferred_date" date NOT NULL,
	"preferred_start_time" text NOT NULL,
	"scheduled_start" timestamp with time zone,
	"scheduled_end" timestamp with time zone,
	"status" "booking_status" DEFAULT 'pending'::"booking_status" NOT NULL,
	"admin_remark" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_addons" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"kind" "studio_addon_kind" DEFAULT 'other'::"studio_addon_kind" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_engineers" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"photo_path" text,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_instruments" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL UNIQUE,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_packages" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"description" text NOT NULL,
	"duration_hours" smallint DEFAULT 2 NOT NULL,
	"includes" jsonb DEFAULT '[]' NOT NULL,
	"icon" text DEFAULT 'mic' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wa_broadcast_list_members" (
	"list_id" integer,
	"lead_id" integer,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wa_broadcast_list_members_pkey" PRIMARY KEY("list_id","lead_id")
);
--> statement-breakpoint
CREATE TABLE "wa_broadcast_lists" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wa_broadcast_recipients" (
	"id" serial PRIMARY KEY,
	"broadcast_id" integer NOT NULL,
	"lead_id" integer NOT NULL,
	"message" text NOT NULL,
	"status" "wa_recipient_status" DEFAULT 'pending'::"wa_recipient_status" NOT NULL,
	"sent_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "wa_broadcasts" (
	"id" serial PRIMARY KEY,
	"list_id" integer,
	"template_id" integer,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"share_link" text,
	"status" "wa_broadcast_status" DEFAULT 'sending'::"wa_broadcast_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wa_templates" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"body" text NOT NULL,
	"category" "wa_template_category" DEFAULT 'broadcast'::"wa_template_category" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auths" ADD CONSTRAINT "auths_user_id_admins_id_fkey" FOREIGN KEY ("user_id") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "contact_queries" ADD CONSTRAINT "contact_queries_lead_id_leads_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_lead_id_leads_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_lead_id_leads_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_admin_id_admins_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_lead_id_leads_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_admin_id_admins_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_admins_id_fkey" FOREIGN KEY ("assigned_to") REFERENCES "admins"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "studio_bookings" ADD CONSTRAINT "studio_bookings_lead_id_leads_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "studio_bookings" ADD CONSTRAINT "studio_bookings_package_id_studio_packages_id_fkey" FOREIGN KEY ("package_id") REFERENCES "studio_packages"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "studio_bookings" ADD CONSTRAINT "studio_bookings_engineer_id_studio_engineers_id_fkey" FOREIGN KEY ("engineer_id") REFERENCES "studio_engineers"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "wa_broadcast_list_members" ADD CONSTRAINT "wa_broadcast_list_members_list_id_wa_broadcast_lists_id_fkey" FOREIGN KEY ("list_id") REFERENCES "wa_broadcast_lists"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "wa_broadcast_list_members" ADD CONSTRAINT "wa_broadcast_list_members_lead_id_leads_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "wa_broadcast_recipients" ADD CONSTRAINT "wa_broadcast_recipients_broadcast_id_wa_broadcasts_id_fkey" FOREIGN KEY ("broadcast_id") REFERENCES "wa_broadcasts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "wa_broadcast_recipients" ADD CONSTRAINT "wa_broadcast_recipients_lead_id_leads_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "wa_broadcasts" ADD CONSTRAINT "wa_broadcasts_list_id_wa_broadcast_lists_id_fkey" FOREIGN KEY ("list_id") REFERENCES "wa_broadcast_lists"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "wa_broadcasts" ADD CONSTRAINT "wa_broadcasts_template_id_wa_templates_id_fkey" FOREIGN KEY ("template_id") REFERENCES "wa_templates"("id") ON DELETE SET NULL;
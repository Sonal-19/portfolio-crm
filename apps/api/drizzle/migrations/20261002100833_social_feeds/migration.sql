CREATE TABLE IF NOT EXISTS "social_feeds" (
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
CREATE TABLE IF NOT EXISTS "youtube_channels" (
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
ALTER TABLE "social_posts" ADD COLUMN IF NOT EXISTS "is_pinned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "social_posts" ADD COLUMN IF NOT EXISTS "source_id" text;
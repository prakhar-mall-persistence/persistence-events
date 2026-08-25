CREATE TABLE IF NOT EXISTS "event_scores" (
	"event_id" integer PRIMARY KEY NOT NULL,
	"icp_score" integer NOT NULL,
	"category" text NOT NULL,
	"reason" text,
	"content_hash" text NOT NULL,
	"model" text,
	"scored_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"source_event_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"url" text NOT NULL,
	"start_at" timestamp with time zone,
	"end_at" timestamp with time zone,
	"timezone" text,
	"venue" text,
	"city" text,
	"country" text,
	"is_online" boolean DEFAULT false NOT NULL,
	"organizer" text,
	"image_url" text,
	"tags" text[],
	"price" text,
	"raw_json" jsonb,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "geographies" (
	"id" serial PRIMARY KEY NOT NULL,
	"city" text NOT NULL,
	"country" text NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"radius_km" integer DEFAULT 50 NOT NULL,
	"luma_slug" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "newsletter_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"run_date" text NOT NULL,
	"status" text NOT NULL,
	"event_count" integer DEFAULT 0 NOT NULL,
	"kit_broadcast_id" text,
	"error" text,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sources" (
	"key" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_run_at" timestamp with time zone,
	"last_status" text,
	"last_error" text,
	"last_count" integer
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_scores" ADD CONSTRAINT "event_scores_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_scores_score_idx" ON "event_scores" USING btree ("icp_score");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "events_source_uniq" ON "events" USING btree ("source","source_event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_start_idx" ON "events" USING btree ("start_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_city_idx" ON "events" USING btree ("city");
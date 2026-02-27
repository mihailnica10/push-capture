CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'scheduled', 'sending', 'completed', 'paused');--> statement-breakpoint
CREATE TYPE "public"."delivery_status" AS ENUM('pending', 'sent', 'delivered', 'opened', 'clicked', 'failed', 'bounced');--> statement-breakpoint
CREATE TABLE "campaign_deliveries" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text,
	"subscription_id" text,
	"device_id" text,
	"status" "delivery_status" NOT NULL,
	"title" text,
	"body" text,
	"payload" jsonb,
	"ab_test_variant" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"opened_at" timestamp,
	"clicked_at" timestamp,
	"failed_at" timestamp,
	"error_code" text,
	"error_message" text,
	"provider_message_id" text,
	"provider_response" jsonb,
	"retry_count" integer DEFAULT 0,
	"ttl_expired" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"campaign_type" text,
	"title_template" text NOT NULL,
	"body_template" text,
	"icon_url" text,
	"image_url" text,
	"badge_url" text,
	"sound_url" text,
	"vibrate_pattern" jsonb,
	"dir" text,
	"lang" text,
	"tag" text,
	"renotify" boolean,
	"require_interaction" boolean,
	"silent" boolean,
	"actions" jsonb,
	"click_url" text,
	"target_segment" jsonb,
	"target_expression" text,
	"scheduled_at" timestamp,
	"timezone" text,
	"max_per_hour" integer DEFAULT 1000,
	"max_per_day" integer DEFAULT 5000,
	"ttl_seconds" integer DEFAULT 86400,
	"priority" text DEFAULT 'normal',
	"urgency" text DEFAULT 'normal',
	"ab_test_parent_id" text,
	"is_ab_test_master" boolean DEFAULT false,
	"ab_test_variants" jsonb,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "devices" (
	"id" text PRIMARY KEY NOT NULL,
	"subscription_id" text,
	"user_agent" text NOT NULL,
	"platform" text NOT NULL,
	"device_type" text NOT NULL,
	"browser_name" text,
	"browser_version" text,
	"os_name" text,
	"os_version" text,
	"device_model" text,
	"device_vendor" text,
	"screen_resolution" text,
	"viewport_width" integer,
	"viewport_height" integer,
	"pixel_ratio" text,
	"network_type" text,
	"connection_downlink" text,
	"connection_rtt" integer,
	"save_data" boolean,
	"device_memory" text,
	"cpu_cores" integer,
	"gpu_vendor" text,
	"battery_level" text,
	"is_charging" boolean,
	"timezone" text,
	"timezone_offset" integer,
	"supports_actions" boolean DEFAULT false,
	"supports_images" boolean DEFAULT false,
	"supports_silent" boolean DEFAULT false,
	"supports_vibrate" boolean DEFAULT false,
	"supports_badge" boolean DEFAULT false,
	"device_fingerprint" text,
	"session_fingerprint" text,
	"first_seen" timestamp DEFAULT now() NOT NULL,
	"last_seen" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notification_events" (
	"id" text PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"campaign_id" text,
	"subscription_id" text,
	"device_id" text,
	"delivery_id" text,
	"title" text,
	"body_hash" text,
	"category" text,
	"user_segment" text,
	"ab_test_group" text,
	"timezone" text,
	"local_hour" integer,
	"day_of_week" integer,
	"platform" text,
	"browser" text,
	"network_type" text,
	"battery_level" text,
	"time_to_click" integer,
	"time_to_dismiss" integer,
	"experiment_id" text,
	"variant_id" text,
	"attribution_source" text,
	"attribution_medium" text,
	"attribution_campaign" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"subscription_id" text,
	"device_fingerprint" text,
	"opt_in_status" boolean DEFAULT true NOT NULL,
	"opt_in_changed_at" timestamp,
	"preferred_timezones" jsonb,
	"preferred_hours" jsonb,
	"preferred_days" jsonb,
	"quiet_hours_enabled" boolean DEFAULT false,
	"quiet_hours_start" time,
	"quiet_hours_end" time,
	"quiet_hours_timezone" text,
	"max_per_hour" integer DEFAULT 3,
	"max_per_day" integer DEFAULT 10,
	"max_per_week" integer DEFAULT 50,
	"categories_enabled" jsonb DEFAULT '[]',
	"categories_disabled" jsonb DEFAULT '[]',
	"enable_sound" boolean DEFAULT true,
	"enable_vibration" boolean DEFAULT true,
	"enable_badge" boolean DEFAULT true,
	"enable_images" boolean DEFAULT true,
	"dnd_until" timestamp,
	"dnd_reason" text,
	"auto_optimize" boolean DEFAULT false,
	"last_optimized_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "notification_preferences_subscription_id_unique" UNIQUE("subscription_id"),
	CONSTRAINT "notification_preferences_device_fingerprint_unique" UNIQUE("device_fingerprint")
);
--> statement-breakpoint
ALTER TABLE "campaign_deliveries" ADD CONSTRAINT "campaign_deliveries_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_deliveries" ADD CONSTRAINT "campaign_deliveries_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_deliveries" ADD CONSTRAINT "campaign_deliveries_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_ab_test_parent_id_campaigns_id_fk" FOREIGN KEY ("ab_test_parent_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_delivery_id_campaign_deliveries_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "public"."campaign_deliveries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_campaign_deliveries_campaign" ON "campaign_deliveries" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "idx_campaign_deliveries_status" ON "campaign_deliveries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_campaign_deliveries_subscription" ON "campaign_deliveries" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "idx_devices_subscription" ON "devices" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "idx_devices_platform" ON "devices" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "idx_devices_browser" ON "devices" USING btree ("browser_name");--> statement-breakpoint
CREATE INDEX "idx_devices_fingerprint" ON "devices" USING btree ("device_fingerprint");--> statement-breakpoint
CREATE INDEX "idx_events_type_date" ON "notification_events" USING btree ("event_type","created_at");--> statement-breakpoint
CREATE INDEX "idx_events_campaign" ON "notification_events" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "idx_events_ab_test" ON "notification_events" USING btree ("experiment_id","variant_id");--> statement-breakpoint
CREATE INDEX "idx_preferences_subscription" ON "notification_preferences" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "idx_preferences_fingerprint" ON "notification_preferences" USING btree ("device_fingerprint");
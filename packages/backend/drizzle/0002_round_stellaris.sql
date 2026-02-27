CREATE TABLE "failed_deliveries" (
	"id" text PRIMARY KEY NOT NULL,
	"delivery_id" text NOT NULL,
	"campaign_id" text,
	"subscription_id" text,
	"error_code" text NOT NULL,
	"error_message" text,
	"error_category" text,
	"attempt" integer NOT NULL,
	"max_attempts" integer DEFAULT 3,
	"will_retry" boolean DEFAULT true,
	"next_retry_at" timestamp,
	"last_attempt_at" timestamp DEFAULT now(),
	"resolved_at" timestamp,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "subscription_health_checks" (
	"id" text PRIMARY KEY NOT NULL,
	"subscription_id" text,
	"status" text NOT NULL,
	"status_code" integer,
	"error_message" text,
	"response_time" integer,
	"checked_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "campaigns" DROP CONSTRAINT "campaigns_ab_test_parent_id_campaigns_id_fk";
--> statement-breakpoint
ALTER TABLE "failed_deliveries" ADD CONSTRAINT "failed_deliveries_delivery_id_campaign_deliveries_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "public"."campaign_deliveries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_health_checks" ADD CONSTRAINT "subscription_health_checks_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_failed_retries" ON "failed_deliveries" USING btree ("will_retry","next_retry_at");--> statement-breakpoint
CREATE INDEX "idx_failed_delivery" ON "failed_deliveries" USING btree ("delivery_id");--> statement-breakpoint
CREATE INDEX "idx_failed_error_category" ON "failed_deliveries" USING btree ("error_category");--> statement-breakpoint
CREATE INDEX "idx_health_subscription" ON "subscription_health_checks" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "idx_health_status" ON "subscription_health_checks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_health_checked_at" ON "subscription_health_checks" USING btree ("checked_at");
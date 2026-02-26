CREATE TYPE "public"."subscription_status" AS ENUM('active', 'inactive', 'failed');--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"user_agent" text,
	"metadata" jsonb,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "traffic_events" (
	"id" text PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"method" text NOT NULL,
	"headers" jsonb,
	"body" jsonb,
	"source" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vapid_config" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"public_key" text NOT NULL,
	"private_key" text NOT NULL,
	"subject" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

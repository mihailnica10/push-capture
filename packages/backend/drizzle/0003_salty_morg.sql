CREATE TABLE "clipboard_events" (
	"id" text PRIMARY KEY NOT NULL,
	"device_fingerprint" text NOT NULL,
	"session_id" text,
	"page_view_id" text,
	"action" text NOT NULL,
	"data_type" text,
	"data_length" integer,
	"data_preview" text,
	"has_sensitive_data" boolean,
	"target_tag" text,
	"target_id" text,
	"target_name" text,
	"is_password_field" boolean,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"time_on_page" integer,
	"url" text,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "device_orientation_events" (
	"id" text PRIMARY KEY NOT NULL,
	"device_fingerprint" text NOT NULL,
	"session_id" text,
	"event_type" text NOT NULL,
	"alpha" real,
	"beta" real,
	"gamma" real,
	"absolute" boolean,
	"accel_x" real,
	"accel_y" real,
	"accel_z" real,
	"accel_including_gravity_x" real,
	"accel_including_gravity_y" real,
	"accel_including_gravity_z" real,
	"rotation_rate_alpha" real,
	"rotation_rate_beta" real,
	"rotation_rate_gamma" real,
	"interval" integer,
	"screen_orientation" text,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"url" text,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "error_tracking" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text,
	"page_view_id" text,
	"device_fingerprint" text NOT NULL,
	"error_type" text NOT NULL,
	"error_category" text,
	"severity" text NOT NULL,
	"message" text NOT NULL,
	"name" text,
	"stack" text,
	"file_name" text,
	"line_number" integer,
	"column_number" integer,
	"source" text,
	"url" text,
	"user_agent" text,
	"url_path" text,
	"page_title" text,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"time_since_page_load" integer,
	"user_impact" text,
	"affected_features" jsonb,
	"count" integer DEFAULT 1,
	"first_seen" timestamp DEFAULT now(),
	"last_seen" timestamp DEFAULT now(),
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "feature_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"device_fingerprint" text NOT NULL,
	"session_id" text,
	"feature_name" text NOT NULL,
	"feature_category" text,
	"access_type" text,
	"usage_duration" integer,
	"usage_count" integer DEFAULT 1,
	"permission_status" text,
	"url" text,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "form_interactions" (
	"id" text PRIMARY KEY NOT NULL,
	"device_fingerprint" text NOT NULL,
	"session_id" text,
	"page_view_id" text,
	"form_id" text,
	"form_action" text,
	"form_method" text,
	"form_name" text,
	"form_class" text,
	"interaction_type" text NOT NULL,
	"field_name" text,
	"field_id" text,
	"field_type" text,
	"field_class" text,
	"value_length" integer,
	"has_value" boolean,
	"is_password_field" boolean,
	"is_credit_card_field" boolean,
	"is_email_field" boolean,
	"is_valid" boolean,
	"validation_message" text,
	"required" boolean,
	"pattern" text,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"time_since_field_focus" integer,
	"fields_filled" integer,
	"total_fields" integer,
	"completion_percentage" integer,
	"url" text,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "geolocation_events" (
	"id" text PRIMARY KEY NOT NULL,
	"device_fingerprint" text NOT NULL,
	"session_id" text,
	"latitude" real,
	"longitude" real,
	"accuracy" real,
	"altitude" real,
	"altitude_accuracy" real,
	"heading" real,
	"speed" real,
	"country_code" text,
	"country_name" text,
	"region" text,
	"city" text,
	"postal_code" text,
	"time_zone" text,
	"source" text,
	"permission_status" text,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"url" text,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "network_events" (
	"id" text PRIMARY KEY NOT NULL,
	"device_fingerprint" text NOT NULL,
	"session_id" text,
	"page_view_id" text,
	"request_id" text NOT NULL,
	"request_type" text NOT NULL,
	"method" text NOT NULL,
	"url" text NOT NULL,
	"domain" text,
	"path" text,
	"initiator" text,
	"request_content_type" text,
	"request_body_size" integer,
	"status" integer,
	"status_text" text,
	"response_content_type" text,
	"response_body_size" integer,
	"response_headers" jsonb,
	"start_time" real,
	"duration" real,
	"response_time" real,
	"success" boolean,
	"error_type" text,
	"error_message" text,
	"from_cache" boolean,
	"cache_hit" boolean,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "page_views" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text,
	"device_fingerprint" text NOT NULL,
	"url" text NOT NULL,
	"page_title" text,
	"path" text NOT NULL,
	"hash" text,
	"referrer" text,
	"referrer_domain" text,
	"viewed_at" timestamp DEFAULT now() NOT NULL,
	"time_on_page" integer,
	"exited_at" timestamp,
	"viewport_width" integer,
	"viewport_height" integer,
	"scroll_percentage" integer,
	"scrolled_past_50" boolean,
	"scrolled_past_75" boolean,
	"scrolled_past_90" boolean,
	"reached_bottom" boolean,
	"clicks" integer DEFAULT 0,
	"form_interactions" integer DEFAULT 0,
	"copy_events" integer DEFAULT 0,
	"print_attempts" integer DEFAULT 0,
	"bookmarks" integer DEFAULT 0,
	"page_load_time" integer,
	"dom_content_loaded" integer,
	"first_paint" integer,
	"first_contentful_paint" integer,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "print_events" (
	"id" text PRIMARY KEY NOT NULL,
	"device_fingerprint" text NOT NULL,
	"session_id" text,
	"page_view_id" text,
	"print_type" text NOT NULL,
	"was_successful" boolean,
	"page_title" text,
	"url" text,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "resource_timing" (
	"id" text PRIMARY KEY NOT NULL,
	"page_view_id" text,
	"device_fingerprint" text NOT NULL,
	"name" text NOT NULL,
	"resource_type" text NOT NULL,
	"start_time" real,
	"duration" real,
	"transfer_size" text,
	"encoded_body_size" text,
	"decoded_body_size" text,
	"response_time" real,
	"tcp_time" real,
	"tls_time" real,
	"ttfb" real,
	"download_time" real,
	"cached" boolean,
	"cache_hit" boolean,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"initiator_type" text,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "storage_events" (
	"id" text PRIMARY KEY NOT NULL,
	"device_fingerprint" text NOT NULL,
	"session_id" text,
	"storage_type" text NOT NULL,
	"action" text NOT NULL,
	"key" text,
	"key_length" integer,
	"value_length" integer,
	"value_type" text,
	"total_keys" integer,
	"estimated_size" integer,
	"remaining_quota" integer,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"url" text,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"category" text NOT NULL,
	"description" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_behavior_events" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text,
	"page_view_id" text,
	"device_fingerprint" text NOT NULL,
	"event_type" text NOT NULL,
	"event_category" text,
	"target_selector" text,
	"target_tag" text,
	"target_id" text,
	"target_class" text,
	"target_text" text,
	"target_attributes" jsonb,
	"x" integer,
	"y" integer,
	"page_x" integer,
	"page_y" integer,
	"screen_x" integer,
	"screen_y" integer,
	"scroll_x" integer,
	"scroll_y" integer,
	"scroll_percentage" integer,
	"key" text,
	"code" text,
	"ctrl_key" boolean,
	"shift_key" boolean,
	"alt_key" boolean,
	"meta_key" boolean,
	"form_id" text,
	"form_action" text,
	"form_method" text,
	"input_name" text,
	"input_type" text,
	"input_value" text,
	"media_type" text,
	"media_action" text,
	"media_current_time" real,
	"media_duration" real,
	"media_volume" real,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"time_since_page_load" integer,
	"url" text,
	"page_title" text,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"device_fingerprint" text NOT NULL,
	"subscription_id" text,
	"session_id" text NOT NULL,
	"referrer" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"utm_term" text,
	"utm_content" text,
	"entry_url" text,
	"entry_page_title" text,
	"exit_url" text,
	"exit_page_title" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"duration" integer,
	"page_views" integer DEFAULT 0,
	"unique_pages" integer DEFAULT 0,
	"scroll_depth" integer,
	"mouse_moves" integer,
	"clicks" integer,
	"key_presses" integer,
	"touch_events" integer,
	"timezone" text,
	"locale" text,
	"screen_resolution" text,
	"viewport_size" text,
	"network_type" text,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "visibility_events" (
	"id" text PRIMARY KEY NOT NULL,
	"device_fingerprint" text NOT NULL,
	"session_id" text,
	"page_view_id" text,
	"from_state" text,
	"to_state" text NOT NULL,
	"visibility_state" text NOT NULL,
	"hidden_duration" integer,
	"visible_duration" integer,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"time_since_page_load" integer,
	"url" text,
	"page_title" text,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "web_vitals" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text,
	"page_view_id" text,
	"device_fingerprint" text NOT NULL,
	"url" text NOT NULL,
	"metric_type" text NOT NULL,
	"value" real NOT NULL,
	"rating" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"navigation_type" text,
	"connection_type" text,
	"metadata" jsonb
);
--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "color_depth" integer;--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "screen_orientation" text;--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "effective_type" text;--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "gpu_renderer" text;--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "charging_time" integer;--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "locale" text;--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "languages" jsonb;--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "supports_data" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "max_action_buttons" integer;--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "supports_webp" boolean;--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "supports_avif" boolean;--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "supports_webgl" boolean;--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "supports_webgl2" boolean;--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "supports_webgpu" boolean;--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "supports_webrtc" boolean;--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "supports_websockets" boolean;--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "supports_service_worker" boolean;--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "supports_background_sync" boolean;--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "supports_periodic_sync" boolean;--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "supports_notifications" boolean;--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "supports_push_manager" boolean;--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "supports_bluetooth" boolean;--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "supports_usb" boolean;--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "supports_serial" boolean;--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "supports_hid" boolean;--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "storage_estimate" jsonb;--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "storage_persisted" boolean;--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "has_camera" boolean;--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "has_microphone" boolean;--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "has_speakers" boolean;--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "media_devices" jsonb;--> statement-breakpoint
ALTER TABLE "clipboard_events" ADD CONSTRAINT "clipboard_events_session_id_user_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."user_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clipboard_events" ADD CONSTRAINT "clipboard_events_page_view_id_page_views_id_fk" FOREIGN KEY ("page_view_id") REFERENCES "public"."page_views"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_orientation_events" ADD CONSTRAINT "device_orientation_events_session_id_user_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."user_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "error_tracking" ADD CONSTRAINT "error_tracking_session_id_user_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."user_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "error_tracking" ADD CONSTRAINT "error_tracking_page_view_id_page_views_id_fk" FOREIGN KEY ("page_view_id") REFERENCES "public"."page_views"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_usage" ADD CONSTRAINT "feature_usage_session_id_user_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."user_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_interactions" ADD CONSTRAINT "form_interactions_session_id_user_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."user_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_interactions" ADD CONSTRAINT "form_interactions_page_view_id_page_views_id_fk" FOREIGN KEY ("page_view_id") REFERENCES "public"."page_views"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geolocation_events" ADD CONSTRAINT "geolocation_events_session_id_user_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."user_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "network_events" ADD CONSTRAINT "network_events_session_id_user_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."user_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "network_events" ADD CONSTRAINT "network_events_page_view_id_page_views_id_fk" FOREIGN KEY ("page_view_id") REFERENCES "public"."page_views"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_views" ADD CONSTRAINT "page_views_session_id_user_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."user_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "print_events" ADD CONSTRAINT "print_events_session_id_user_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."user_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "print_events" ADD CONSTRAINT "print_events_page_view_id_page_views_id_fk" FOREIGN KEY ("page_view_id") REFERENCES "public"."page_views"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_timing" ADD CONSTRAINT "resource_timing_page_view_id_page_views_id_fk" FOREIGN KEY ("page_view_id") REFERENCES "public"."page_views"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage_events" ADD CONSTRAINT "storage_events_session_id_user_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."user_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_behavior_events" ADD CONSTRAINT "user_behavior_events_session_id_user_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."user_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_behavior_events" ADD CONSTRAINT "user_behavior_events_page_view_id_page_views_id_fk" FOREIGN KEY ("page_view_id") REFERENCES "public"."page_views"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visibility_events" ADD CONSTRAINT "visibility_events_session_id_user_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."user_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visibility_events" ADD CONSTRAINT "visibility_events_page_view_id_page_views_id_fk" FOREIGN KEY ("page_view_id") REFERENCES "public"."page_views"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "web_vitals" ADD CONSTRAINT "web_vitals_session_id_user_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."user_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "web_vitals" ADD CONSTRAINT "web_vitals_page_view_id_page_views_id_fk" FOREIGN KEY ("page_view_id") REFERENCES "public"."page_views"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_clipboard_device" ON "clipboard_events" USING btree ("device_fingerprint");--> statement-breakpoint
CREATE INDEX "idx_clipboard_session" ON "clipboard_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_clipboard_action" ON "clipboard_events" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_clipboard_timestamp" ON "clipboard_events" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_orientation_device" ON "device_orientation_events" USING btree ("device_fingerprint");--> statement-breakpoint
CREATE INDEX "idx_orientation_session" ON "device_orientation_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_orientation_type" ON "device_orientation_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_orientation_timestamp" ON "device_orientation_events" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_errors_session" ON "error_tracking" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_errors_page_view" ON "error_tracking" USING btree ("page_view_id");--> statement-breakpoint
CREATE INDEX "idx_errors_type" ON "error_tracking" USING btree ("error_type");--> statement-breakpoint
CREATE INDEX "idx_errors_severity" ON "error_tracking" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_errors_timestamp" ON "error_tracking" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_feature_device" ON "feature_usage" USING btree ("device_fingerprint");--> statement-breakpoint
CREATE INDEX "idx_feature_session" ON "feature_usage" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_feature_name" ON "feature_usage" USING btree ("feature_name");--> statement-breakpoint
CREATE INDEX "idx_feature_timestamp" ON "feature_usage" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_form_device" ON "form_interactions" USING btree ("device_fingerprint");--> statement-breakpoint
CREATE INDEX "idx_form_session" ON "form_interactions" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_form_page_view" ON "form_interactions" USING btree ("page_view_id");--> statement-breakpoint
CREATE INDEX "idx_form_id" ON "form_interactions" USING btree ("form_id");--> statement-breakpoint
CREATE INDEX "idx_form_interaction" ON "form_interactions" USING btree ("interaction_type");--> statement-breakpoint
CREATE INDEX "idx_geolocation_device" ON "geolocation_events" USING btree ("device_fingerprint");--> statement-breakpoint
CREATE INDEX "idx_geolocation_session" ON "geolocation_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_geolocation_timestamp" ON "geolocation_events" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_network_device" ON "network_events" USING btree ("device_fingerprint");--> statement-breakpoint
CREATE INDEX "idx_network_session" ON "network_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_network_page_view" ON "network_events" USING btree ("page_view_id");--> statement-breakpoint
CREATE INDEX "idx_network_domain" ON "network_events" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "idx_network_status" ON "network_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_network_timestamp" ON "network_events" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_page_views_session" ON "page_views" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_page_views_device" ON "page_views" USING btree ("device_fingerprint");--> statement-breakpoint
CREATE INDEX "idx_page_views_path" ON "page_views" USING btree ("path");--> statement-breakpoint
CREATE INDEX "idx_page_views_viewed_at" ON "page_views" USING btree ("viewed_at");--> statement-breakpoint
CREATE INDEX "idx_print_device" ON "print_events" USING btree ("device_fingerprint");--> statement-breakpoint
CREATE INDEX "idx_print_session" ON "print_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_print_timestamp" ON "print_events" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_resource_timing_page_view" ON "resource_timing" USING btree ("page_view_id");--> statement-breakpoint
CREATE INDEX "idx_resource_timing_type" ON "resource_timing" USING btree ("resource_type");--> statement-breakpoint
CREATE INDEX "idx_storage_device" ON "storage_events" USING btree ("device_fingerprint");--> statement-breakpoint
CREATE INDEX "idx_storage_session" ON "storage_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_storage_type" ON "storage_events" USING btree ("storage_type");--> statement-breakpoint
CREATE INDEX "idx_storage_timestamp" ON "storage_events" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_settings_category" ON "system_settings" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_behavior_session" ON "user_behavior_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_behavior_page_view" ON "user_behavior_events" USING btree ("page_view_id");--> statement-breakpoint
CREATE INDEX "idx_behavior_type" ON "user_behavior_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_behavior_timestamp" ON "user_behavior_events" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_sessions_device_fingerprint" ON "user_sessions" USING btree ("device_fingerprint");--> statement-breakpoint
CREATE INDEX "idx_sessions_subscription" ON "user_sessions" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_started_at" ON "user_sessions" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "idx_visibility_device" ON "visibility_events" USING btree ("device_fingerprint");--> statement-breakpoint
CREATE INDEX "idx_visibility_session" ON "visibility_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_visibility_to_state" ON "visibility_events" USING btree ("to_state");--> statement-breakpoint
CREATE INDEX "idx_visibility_timestamp" ON "visibility_events" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_web_vitals_session" ON "web_vitals" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_web_vitals_page_view" ON "web_vitals" USING btree ("page_view_id");--> statement-breakpoint
CREATE INDEX "idx_web_vitals_metric" ON "web_vitals" USING btree ("metric_type");--> statement-breakpoint
CREATE INDEX "idx_web_vitals_rating" ON "web_vitals" USING btree ("rating");
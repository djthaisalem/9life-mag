import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_account_type" AS ENUM('user', 'artist');
  CREATE TYPE "public"."enum_users_role" AS ENUM('customer', 'admin', 'super_admin', 'security_admin', 'editor', 'artist_manager', 'booking_agent', 'finance', 'finance_ops', 'booking_ops', 'artist_ops');
  CREATE TYPE "public"."enum_users_portal_role" AS ENUM('artist', 'manager', 'booking');
  CREATE TYPE "public"."enum_users_portal_access_status" AS ENUM('pending', 'approved', 'suspended');
  CREATE TYPE "public"."enum_users_social_provider" AS ENUM('local', 'google', 'facebook');
  CREATE TYPE "public"."enum_media_kind" AS ENUM('image', 'audio-preview', 'source-audio', 'press-kit');
  CREATE TYPE "public"."enum_posts_status" AS ENUM('draft', 'scheduled', 'published');
  CREATE TYPE "public"."enum_artists_social_links_platform" AS ENUM('facebook', 'instagram', 'youtube', 'soundcloud', 'tiktok');
  CREATE TYPE "public"."enum_artists_role" AS ENUM('dj', 'producer', 'mc', 'rapper', 'dancer', 'live-act');
  CREATE TYPE "public"."enum_artists_gender" AS ENUM('female', 'male', 'other');
  CREATE TYPE "public"."enum_artists_profile_status" AS ENUM('draft', 'pending_review', 'published', 'archived');
  CREATE TYPE "public"."enum_tracks_track_type" AS ENUM('nonstop', 'remix', 'single', 'album');
  CREATE TYPE "public"."enum_tracks_access_level" AS ENUM('public', 'stars', 'premium', 'internal');
  CREATE TYPE "public"."enum_tracks_visibility" AS ENUM('draft', 'pending', 'public', 'hidden');
  CREATE TYPE "public"."enum_tracks_status" AS ENUM('draft', 'scheduled', 'published');
  CREATE TYPE "public"."enum_playlists_playlist_type" AS ENUM('nonstop', 'remix', 'editorial');
  CREATE TYPE "public"."enum_playlists_status" AS ENUM('draft', 'scheduled', 'published');
  CREATE TYPE "public"."enum_albums_status" AS ENUM('draft', 'scheduled', 'published');
  CREATE TYPE "public"."enum_booking_requests_status" AS ENUM('new', 'qualified', 'negotiating', 'won', 'lost');
  CREATE TYPE "public"."enum_products_product_type" AS ENUM('track', 'album', 'package');
  CREATE TYPE "public"."enum_products_license_type" AS ENUM('personal', 'performance', 'commercial');
  CREATE TYPE "public"."enum_orders_status" AS ENUM('pending', 'paid', 'failed', 'refunded');
  CREATE TYPE "public"."enum_star_topups_provider" AS ENUM('bank_qr', 'momo', 'viettel_money', 'paypal');
  CREATE TYPE "public"."enum_star_topups_status" AS ENUM('pending', 'approved', 'rejected');
  CREATE TYPE "public"."enum_wallet_ledger_event_type" AS ENUM('signup_bonus', 'daily_claim', 'bonus_claim', 'playlist_reward', 'share_reward', 'topup_approved', 'spend_general', 'spend_vote', 'spend_playback', 'spend_download', 'manual_adjustment');
  CREATE TYPE "public"."enum_password_reset_tokens_account_type" AS ENUM('user', 'artist');
  CREATE TYPE "public"."enum_cms_access_requests_status" AS ENUM('pending', 'approved', 'rejected');
  CREATE TYPE "public"."enum_agent_change_tickets_status" AS ENUM('pending', 'approved', 'rejected');
  CREATE TYPE "public"."enum_agent_change_tickets_old_agent_decision" AS ENUM('pending', 'accepted', 'rejected', 'not_required');
  CREATE TYPE "public"."enum_agent_change_tickets_new_agent_decision" AS ENUM('pending', 'accepted', 'rejected', 'not_required');
  CREATE TYPE "public"."enum_share_referrals_status" AS ENUM('pending', 'visited', 'rewarded', 'rejected');
  CREATE TYPE "public"."enum_student_applications_target_type" AS ENUM('artist', 'agent');
  CREATE TYPE "public"."enum_student_applications_status" AS ENUM('new', 'accepted', 'declined');
  CREATE TYPE "public"."enum_student_registration_settings_target_type" AS ENUM('artist', 'agent');
  CREATE TABLE "users_managed_outlet_slugs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL
  );
  
  CREATE TABLE "users_followed_artist_slugs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL
  );
  
  CREATE TABLE "users_followed_agent_slugs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"full_name" varchar,
  	"phone" varchar,
  	"account_type" "enum_users_account_type" DEFAULT 'user' NOT NULL,
  	"role" "enum_users_role" DEFAULT 'customer' NOT NULL,
  	"portal_role" "enum_users_portal_role" DEFAULT 'artist',
  	"portal_access_status" "enum_users_portal_access_status" DEFAULT 'approved',
  	"managed_agent" varchar,
  	"artist_agent" varchar,
  	"artist_profile_slug" varchar,
  	"social_provider" "enum_users_social_provider" DEFAULT 'local',
  	"social_id" varchar,
  	"artist_profile_id" integer,
  	"stars" numeric DEFAULT 100 NOT NULL,
  	"signup_stars_earned" numeric DEFAULT 100,
  	"daily_stars_earned" numeric DEFAULT 0,
  	"bonus_stars_earned" numeric DEFAULT 0,
  	"playlist_stars_earned" numeric DEFAULT 0,
  	"daily_claim_date" timestamp(3) with time zone,
  	"bonus_claim_date" timestamp(3) with time zone,
  	"is_premium" boolean DEFAULT false,
  	"is_active" boolean DEFAULT true,
  	"session_invalid_after" timestamp(3) with time zone,
  	"security_notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"kind" "enum_media_kind" DEFAULT 'image',
  	"prefix" varchar DEFAULT 'media',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"excerpt" varchar,
  	"cover_image_id" integer,
  	"category_id" integer,
  	"content" jsonb,
  	"featured" boolean DEFAULT false,
  	"published_at" timestamp(3) with time zone,
  	"status" "enum_posts_status" DEFAULT 'draft' NOT NULL,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "artists_genres" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "artists_social_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"platform" "enum_artists_social_links_platform",
  	"url" varchar
  );
  
  CREATE TABLE "artists" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"stage_name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"role" "enum_artists_role",
  	"gender" "enum_artists_gender",
  	"service_area" varchar,
  	"starting_price" numeric,
  	"booking_price_label" varchar,
  	"is_available" boolean DEFAULT true,
  	"profile_status" "enum_artists_profile_status" DEFAULT 'draft',
  	"managed_by_id" integer,
  	"hero_image_id" integer,
  	"portrait_image_id" integer,
  	"bio" jsonb,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "tracks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"music_code" varchar,
  	"cover_image_id" integer,
  	"cover_r2_key" varchar,
  	"description" varchar,
  	"primary_artist_id" integer,
  	"author" varchar,
  	"singer" varchar,
  	"remixer" varchar,
  	"mixed_in_key" varchar,
  	"tempo" numeric,
  	"duration_label" varchar,
  	"duration_seconds" numeric,
  	"release_date" timestamp(3) with time zone,
  	"is_featured" boolean DEFAULT false,
  	"is_official" boolean DEFAULT true,
  	"is_public" boolean DEFAULT true,
  	"track_type" "enum_tracks_track_type" DEFAULT 'nonstop',
  	"preview_file_id" integer,
  	"full_file_id" integer,
  	"preview_r2_key" varchar,
  	"master_r2_key" varchar,
  	"source_format" varchar,
  	"submitted_artist_slug" varchar,
  	"genre_label" varchar,
  	"album_label" varchar,
  	"access_level" "enum_tracks_access_level" DEFAULT 'public',
  	"playback_star_cost" numeric DEFAULT 0,
  	"download_star_cost" numeric DEFAULT 0,
  	"display_map" varchar,
  	"visibility" "enum_tracks_visibility" DEFAULT 'draft',
  	"requires_login_to_download" boolean DEFAULT true,
  	"download_count" numeric DEFAULT 0,
  	"share_code" varchar,
  	"published_at" timestamp(3) with time zone,
  	"status" "enum_tracks_status" DEFAULT 'draft' NOT NULL,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "playlists" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"cover_image_id" integer,
  	"description" varchar,
  	"keyword" varchar,
  	"musician" varchar,
  	"singer" varchar,
  	"playlist_type" "enum_playlists_playlist_type" DEFAULT 'nonstop',
  	"release_date" timestamp(3) with time zone,
  	"tempo" numeric,
  	"is_vip" boolean DEFAULT false,
  	"is_featured" boolean DEFAULT false,
  	"is_public" boolean DEFAULT true,
  	"share_code" varchar,
  	"published_at" timestamp(3) with time zone,
  	"status" "enum_playlists_status" DEFAULT 'draft' NOT NULL,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "playlists_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tracks_id" integer
  );
  
  CREATE TABLE "albums" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"cover_image_id" integer,
  	"description" varchar,
  	"artist_id" integer,
  	"musician" varchar,
  	"presenter" varchar,
  	"music_category" varchar,
  	"release_date" timestamp(3) with time zone,
  	"is_featured" boolean DEFAULT false,
  	"is_public" boolean DEFAULT true,
  	"share_code" varchar,
  	"published_at" timestamp(3) with time zone,
  	"status" "enum_albums_status" DEFAULT 'draft' NOT NULL,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "albums_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tracks_id" integer
  );
  
  CREATE TABLE "booking_requests" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"event_name" varchar NOT NULL,
  	"artist_id" integer,
  	"contact_name" varchar NOT NULL,
  	"contact_email" varchar NOT NULL,
  	"phone" varchar,
  	"event_date" timestamp(3) with time zone,
  	"location" varchar,
  	"budget" numeric,
  	"status" "enum_booking_requests_status" DEFAULT 'new',
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "products" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"product_type" "enum_products_product_type" DEFAULT 'track' NOT NULL,
  	"artist_id" integer,
  	"price" numeric NOT NULL,
  	"currency" varchar DEFAULT 'VND',
  	"license_type" "enum_products_license_type" DEFAULT 'personal',
  	"preview_file_id" integer,
  	"source_file_id" integer,
  	"description" jsonb,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "orders_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"product_id" integer NOT NULL,
  	"price" numeric NOT NULL
  );
  
  CREATE TABLE "orders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order_number" varchar NOT NULL,
  	"customer_id" integer NOT NULL,
  	"total_amount" numeric NOT NULL,
  	"status" "enum_orders_status" DEFAULT 'pending',
  	"payment_provider" varchar,
  	"webhook_idempotency_key" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "entitlements" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"customer_id" integer NOT NULL,
  	"product_id" integer NOT NULL,
  	"order_id" integer,
  	"downloads_remaining" numeric DEFAULT 3,
  	"expires_at" timestamp(3) with time zone,
  	"signed_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "star_topups" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"transaction_ref" varchar NOT NULL,
  	"provider_order_id" varchar,
  	"user_id" integer,
  	"site_user_id" varchar NOT NULL,
  	"user_name" varchar NOT NULL,
  	"user_email" varchar NOT NULL,
  	"package_id" varchar NOT NULL,
  	"package_title" varchar NOT NULL,
  	"provider" "enum_star_topups_provider" NOT NULL,
  	"amount" numeric NOT NULL,
  	"stars" numeric NOT NULL,
  	"status" "enum_star_topups_status" DEFAULT 'pending' NOT NULL,
  	"note" varchar,
  	"qr_url" varchar,
  	"action_url" varchar,
  	"provider_message" varchar NOT NULL,
  	"user_notice" varchar NOT NULL,
  	"reviewed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "wallet_ledger" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer,
  	"site_user_id" varchar NOT NULL,
  	"reference" varchar NOT NULL,
  	"event_type" "enum_wallet_ledger_event_type" NOT NULL,
  	"amount" numeric NOT NULL,
  	"balance_after" numeric NOT NULL,
  	"note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "request_guards_attempt_timestamps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "request_guards" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"scope" varchar NOT NULL,
  	"fingerprint" varchar NOT NULL,
  	"attempt_count" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "password_reset_tokens" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"token_hash" varchar NOT NULL,
  	"identity" varchar NOT NULL,
  	"account_type" "enum_password_reset_tokens_account_type" NOT NULL,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"used_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cms_access_requests" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"organization" varchar,
  	"requested_role" varchar NOT NULL,
  	"note" varchar,
  	"status" "enum_cms_access_requests_status" DEFAULT 'pending' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "portal_notifications" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"recipient_key" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"body" varchar NOT NULL,
  	"href" varchar,
  	"ticket_id" varchar,
  	"is_read" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "agent_change_tickets" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"artist_account_id" varchar NOT NULL,
  	"old_agent" varchar NOT NULL,
  	"new_agent" varchar NOT NULL,
  	"reason" varchar,
  	"status" "enum_agent_change_tickets_status" DEFAULT 'pending' NOT NULL,
  	"old_agent_decision" "enum_agent_change_tickets_old_agent_decision",
  	"new_agent_decision" "enum_agent_change_tickets_new_agent_decision",
  	"appeal_note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "artist_agencies_specialties" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "artist_agencies_services" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "artist_agencies" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"label" varchar,
  	"location" varchar,
  	"coverage" varchar,
  	"image" varchar,
  	"description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "share_referrals" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"owner_id" varchar NOT NULL,
  	"token" varchar NOT NULL,
  	"path" varchar NOT NULL,
  	"status" "enum_share_referrals_status" DEFAULT 'pending' NOT NULL,
  	"visitor_fingerprint" varchar,
  	"visited_at" timestamp(3) with time zone,
  	"rewarded_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "student_applications" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"target_type" "enum_student_applications_target_type" NOT NULL,
  	"target_slug" varchar NOT NULL,
  	"target_name" varchar NOT NULL,
  	"full_name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"city" varchar,
  	"experience" varchar,
  	"learning_goal" varchar NOT NULL,
  	"availability" varchar,
  	"reference_link" varchar,
  	"status" "enum_student_applications_status" DEFAULT 'new' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "student_registration_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"target_type" "enum_student_registration_settings_target_type" NOT NULL,
  	"target_slug" varchar NOT NULL,
  	"enabled" boolean DEFAULT false NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"categories_id" integer,
  	"posts_id" integer,
  	"artists_id" integer,
  	"tracks_id" integer,
  	"playlists_id" integer,
  	"albums_id" integer,
  	"booking_requests_id" integer,
  	"products_id" integer,
  	"orders_id" integer,
  	"entitlements_id" integer,
  	"star_topups_id" integer,
  	"wallet_ledger_id" integer,
  	"request_guards_id" integer,
  	"password_reset_tokens_id" integer,
  	"cms_access_requests_id" integer,
  	"portal_notifications_id" integer,
  	"agent_change_tickets_id" integer,
  	"artist_agencies_id" integer,
  	"share_referrals_id" integer,
  	"student_applications_id" integer,
  	"student_registration_settings_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_managed_outlet_slugs" ADD CONSTRAINT "users_managed_outlet_slugs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_followed_artist_slugs" ADD CONSTRAINT "users_followed_artist_slugs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_followed_agent_slugs" ADD CONSTRAINT "users_followed_agent_slugs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users" ADD CONSTRAINT "users_artist_profile_id_artists_id_fk" FOREIGN KEY ("artist_profile_id") REFERENCES "public"."artists"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "artists_genres" ADD CONSTRAINT "artists_genres_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "artists_social_links" ADD CONSTRAINT "artists_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "artists" ADD CONSTRAINT "artists_managed_by_id_users_id_fk" FOREIGN KEY ("managed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "artists" ADD CONSTRAINT "artists_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "artists" ADD CONSTRAINT "artists_portrait_image_id_media_id_fk" FOREIGN KEY ("portrait_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tracks" ADD CONSTRAINT "tracks_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tracks" ADD CONSTRAINT "tracks_primary_artist_id_artists_id_fk" FOREIGN KEY ("primary_artist_id") REFERENCES "public"."artists"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tracks" ADD CONSTRAINT "tracks_preview_file_id_media_id_fk" FOREIGN KEY ("preview_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tracks" ADD CONSTRAINT "tracks_full_file_id_media_id_fk" FOREIGN KEY ("full_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "playlists" ADD CONSTRAINT "playlists_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "playlists_rels" ADD CONSTRAINT "playlists_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."playlists"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "playlists_rels" ADD CONSTRAINT "playlists_rels_tracks_fk" FOREIGN KEY ("tracks_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "albums" ADD CONSTRAINT "albums_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "albums" ADD CONSTRAINT "albums_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "albums_rels" ADD CONSTRAINT "albums_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "albums_rels" ADD CONSTRAINT "albums_rels_tracks_fk" FOREIGN KEY ("tracks_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_preview_file_id_media_id_fk" FOREIGN KEY ("preview_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_source_file_id_media_id_fk" FOREIGN KEY ("source_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "star_topups" ADD CONSTRAINT "star_topups_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "wallet_ledger" ADD CONSTRAINT "wallet_ledger_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "request_guards_attempt_timestamps" ADD CONSTRAINT "request_guards_attempt_timestamps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."request_guards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "artist_agencies_specialties" ADD CONSTRAINT "artist_agencies_specialties_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."artist_agencies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "artist_agencies_services" ADD CONSTRAINT "artist_agencies_services_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."artist_agencies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_artists_fk" FOREIGN KEY ("artists_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tracks_fk" FOREIGN KEY ("tracks_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_playlists_fk" FOREIGN KEY ("playlists_id") REFERENCES "public"."playlists"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_albums_fk" FOREIGN KEY ("albums_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_booking_requests_fk" FOREIGN KEY ("booking_requests_id") REFERENCES "public"."booking_requests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_orders_fk" FOREIGN KEY ("orders_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_entitlements_fk" FOREIGN KEY ("entitlements_id") REFERENCES "public"."entitlements"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_star_topups_fk" FOREIGN KEY ("star_topups_id") REFERENCES "public"."star_topups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_wallet_ledger_fk" FOREIGN KEY ("wallet_ledger_id") REFERENCES "public"."wallet_ledger"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_request_guards_fk" FOREIGN KEY ("request_guards_id") REFERENCES "public"."request_guards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_password_reset_tokens_fk" FOREIGN KEY ("password_reset_tokens_id") REFERENCES "public"."password_reset_tokens"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_cms_access_requests_fk" FOREIGN KEY ("cms_access_requests_id") REFERENCES "public"."cms_access_requests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_portal_notifications_fk" FOREIGN KEY ("portal_notifications_id") REFERENCES "public"."portal_notifications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_agent_change_tickets_fk" FOREIGN KEY ("agent_change_tickets_id") REFERENCES "public"."agent_change_tickets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_artist_agencies_fk" FOREIGN KEY ("artist_agencies_id") REFERENCES "public"."artist_agencies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_share_referrals_fk" FOREIGN KEY ("share_referrals_id") REFERENCES "public"."share_referrals"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_student_applications_fk" FOREIGN KEY ("student_applications_id") REFERENCES "public"."student_applications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_student_registration_settin_fk" FOREIGN KEY ("student_registration_settings_id") REFERENCES "public"."student_registration_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_managed_outlet_slugs_order_idx" ON "users_managed_outlet_slugs" USING btree ("_order");
  CREATE INDEX "users_managed_outlet_slugs_parent_id_idx" ON "users_managed_outlet_slugs" USING btree ("_parent_id");
  CREATE INDEX "users_followed_artist_slugs_order_idx" ON "users_followed_artist_slugs" USING btree ("_order");
  CREATE INDEX "users_followed_artist_slugs_parent_id_idx" ON "users_followed_artist_slugs" USING btree ("_parent_id");
  CREATE INDEX "users_followed_agent_slugs_order_idx" ON "users_followed_agent_slugs" USING btree ("_order");
  CREATE INDEX "users_followed_agent_slugs_parent_id_idx" ON "users_followed_agent_slugs" USING btree ("_parent_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_artist_profile_idx" ON "users" USING btree ("artist_profile_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "posts_slug_idx" ON "posts" USING btree ("slug");
  CREATE INDEX "posts_cover_image_idx" ON "posts" USING btree ("cover_image_id");
  CREATE INDEX "posts_category_idx" ON "posts" USING btree ("category_id");
  CREATE INDEX "posts_updated_at_idx" ON "posts" USING btree ("updated_at");
  CREATE INDEX "posts_created_at_idx" ON "posts" USING btree ("created_at");
  CREATE INDEX "artists_genres_order_idx" ON "artists_genres" USING btree ("_order");
  CREATE INDEX "artists_genres_parent_id_idx" ON "artists_genres" USING btree ("_parent_id");
  CREATE INDEX "artists_social_links_order_idx" ON "artists_social_links" USING btree ("_order");
  CREATE INDEX "artists_social_links_parent_id_idx" ON "artists_social_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "artists_slug_idx" ON "artists" USING btree ("slug");
  CREATE INDEX "artists_managed_by_idx" ON "artists" USING btree ("managed_by_id");
  CREATE INDEX "artists_hero_image_idx" ON "artists" USING btree ("hero_image_id");
  CREATE INDEX "artists_portrait_image_idx" ON "artists" USING btree ("portrait_image_id");
  CREATE INDEX "artists_updated_at_idx" ON "artists" USING btree ("updated_at");
  CREATE INDEX "artists_created_at_idx" ON "artists" USING btree ("created_at");
  CREATE UNIQUE INDEX "tracks_slug_idx" ON "tracks" USING btree ("slug");
  CREATE UNIQUE INDEX "tracks_music_code_idx" ON "tracks" USING btree ("music_code");
  CREATE INDEX "tracks_cover_image_idx" ON "tracks" USING btree ("cover_image_id");
  CREATE INDEX "tracks_primary_artist_idx" ON "tracks" USING btree ("primary_artist_id");
  CREATE INDEX "tracks_preview_file_idx" ON "tracks" USING btree ("preview_file_id");
  CREATE INDEX "tracks_full_file_idx" ON "tracks" USING btree ("full_file_id");
  CREATE INDEX "tracks_updated_at_idx" ON "tracks" USING btree ("updated_at");
  CREATE INDEX "tracks_created_at_idx" ON "tracks" USING btree ("created_at");
  CREATE UNIQUE INDEX "playlists_slug_idx" ON "playlists" USING btree ("slug");
  CREATE INDEX "playlists_cover_image_idx" ON "playlists" USING btree ("cover_image_id");
  CREATE INDEX "playlists_updated_at_idx" ON "playlists" USING btree ("updated_at");
  CREATE INDEX "playlists_created_at_idx" ON "playlists" USING btree ("created_at");
  CREATE INDEX "playlists_rels_order_idx" ON "playlists_rels" USING btree ("order");
  CREATE INDEX "playlists_rels_parent_idx" ON "playlists_rels" USING btree ("parent_id");
  CREATE INDEX "playlists_rels_path_idx" ON "playlists_rels" USING btree ("path");
  CREATE INDEX "playlists_rels_tracks_id_idx" ON "playlists_rels" USING btree ("tracks_id");
  CREATE UNIQUE INDEX "albums_slug_idx" ON "albums" USING btree ("slug");
  CREATE INDEX "albums_cover_image_idx" ON "albums" USING btree ("cover_image_id");
  CREATE INDEX "albums_artist_idx" ON "albums" USING btree ("artist_id");
  CREATE INDEX "albums_updated_at_idx" ON "albums" USING btree ("updated_at");
  CREATE INDEX "albums_created_at_idx" ON "albums" USING btree ("created_at");
  CREATE INDEX "albums_rels_order_idx" ON "albums_rels" USING btree ("order");
  CREATE INDEX "albums_rels_parent_idx" ON "albums_rels" USING btree ("parent_id");
  CREATE INDEX "albums_rels_path_idx" ON "albums_rels" USING btree ("path");
  CREATE INDEX "albums_rels_tracks_id_idx" ON "albums_rels" USING btree ("tracks_id");
  CREATE INDEX "booking_requests_artist_idx" ON "booking_requests" USING btree ("artist_id");
  CREATE INDEX "booking_requests_updated_at_idx" ON "booking_requests" USING btree ("updated_at");
  CREATE INDEX "booking_requests_created_at_idx" ON "booking_requests" USING btree ("created_at");
  CREATE UNIQUE INDEX "products_slug_idx" ON "products" USING btree ("slug");
  CREATE INDEX "products_artist_idx" ON "products" USING btree ("artist_id");
  CREATE INDEX "products_preview_file_idx" ON "products" USING btree ("preview_file_id");
  CREATE INDEX "products_source_file_idx" ON "products" USING btree ("source_file_id");
  CREATE INDEX "products_updated_at_idx" ON "products" USING btree ("updated_at");
  CREATE INDEX "products_created_at_idx" ON "products" USING btree ("created_at");
  CREATE INDEX "orders_items_order_idx" ON "orders_items" USING btree ("_order");
  CREATE INDEX "orders_items_parent_id_idx" ON "orders_items" USING btree ("_parent_id");
  CREATE INDEX "orders_items_product_idx" ON "orders_items" USING btree ("product_id");
  CREATE UNIQUE INDEX "orders_order_number_idx" ON "orders" USING btree ("order_number");
  CREATE INDEX "orders_customer_idx" ON "orders" USING btree ("customer_id");
  CREATE INDEX "orders_updated_at_idx" ON "orders" USING btree ("updated_at");
  CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");
  CREATE UNIQUE INDEX "entitlements_code_idx" ON "entitlements" USING btree ("code");
  CREATE INDEX "entitlements_customer_idx" ON "entitlements" USING btree ("customer_id");
  CREATE INDEX "entitlements_product_idx" ON "entitlements" USING btree ("product_id");
  CREATE INDEX "entitlements_order_idx" ON "entitlements" USING btree ("order_id");
  CREATE INDEX "entitlements_updated_at_idx" ON "entitlements" USING btree ("updated_at");
  CREATE INDEX "entitlements_created_at_idx" ON "entitlements" USING btree ("created_at");
  CREATE UNIQUE INDEX "star_topups_transaction_ref_idx" ON "star_topups" USING btree ("transaction_ref");
  CREATE UNIQUE INDEX "star_topups_provider_order_id_idx" ON "star_topups" USING btree ("provider_order_id");
  CREATE INDEX "star_topups_user_idx" ON "star_topups" USING btree ("user_id");
  CREATE INDEX "star_topups_updated_at_idx" ON "star_topups" USING btree ("updated_at");
  CREATE INDEX "star_topups_created_at_idx" ON "star_topups" USING btree ("created_at");
  CREATE INDEX "wallet_ledger_user_idx" ON "wallet_ledger" USING btree ("user_id");
  CREATE UNIQUE INDEX "wallet_ledger_reference_idx" ON "wallet_ledger" USING btree ("reference");
  CREATE INDEX "wallet_ledger_updated_at_idx" ON "wallet_ledger" USING btree ("updated_at");
  CREATE INDEX "wallet_ledger_created_at_idx" ON "wallet_ledger" USING btree ("created_at");
  CREATE INDEX "request_guards_attempt_timestamps_order_idx" ON "request_guards_attempt_timestamps" USING btree ("_order");
  CREATE INDEX "request_guards_attempt_timestamps_parent_id_idx" ON "request_guards_attempt_timestamps" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "request_guards_fingerprint_idx" ON "request_guards" USING btree ("fingerprint");
  CREATE INDEX "request_guards_updated_at_idx" ON "request_guards" USING btree ("updated_at");
  CREATE INDEX "request_guards_created_at_idx" ON "request_guards" USING btree ("created_at");
  CREATE UNIQUE INDEX "password_reset_tokens_token_hash_idx" ON "password_reset_tokens" USING btree ("token_hash");
  CREATE INDEX "password_reset_tokens_updated_at_idx" ON "password_reset_tokens" USING btree ("updated_at");
  CREATE INDEX "password_reset_tokens_created_at_idx" ON "password_reset_tokens" USING btree ("created_at");
  CREATE UNIQUE INDEX "cms_access_requests_email_idx" ON "cms_access_requests" USING btree ("email");
  CREATE INDEX "cms_access_requests_updated_at_idx" ON "cms_access_requests" USING btree ("updated_at");
  CREATE INDEX "cms_access_requests_created_at_idx" ON "cms_access_requests" USING btree ("created_at");
  CREATE INDEX "portal_notifications_updated_at_idx" ON "portal_notifications" USING btree ("updated_at");
  CREATE INDEX "portal_notifications_created_at_idx" ON "portal_notifications" USING btree ("created_at");
  CREATE INDEX "agent_change_tickets_updated_at_idx" ON "agent_change_tickets" USING btree ("updated_at");
  CREATE INDEX "agent_change_tickets_created_at_idx" ON "agent_change_tickets" USING btree ("created_at");
  CREATE INDEX "artist_agencies_specialties_order_idx" ON "artist_agencies_specialties" USING btree ("_order");
  CREATE INDEX "artist_agencies_specialties_parent_id_idx" ON "artist_agencies_specialties" USING btree ("_parent_id");
  CREATE INDEX "artist_agencies_services_order_idx" ON "artist_agencies_services" USING btree ("_order");
  CREATE INDEX "artist_agencies_services_parent_id_idx" ON "artist_agencies_services" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "artist_agencies_slug_idx" ON "artist_agencies" USING btree ("slug");
  CREATE INDEX "artist_agencies_updated_at_idx" ON "artist_agencies" USING btree ("updated_at");
  CREATE INDEX "artist_agencies_created_at_idx" ON "artist_agencies" USING btree ("created_at");
  CREATE INDEX "share_referrals_owner_id_idx" ON "share_referrals" USING btree ("owner_id");
  CREATE UNIQUE INDEX "share_referrals_token_idx" ON "share_referrals" USING btree ("token");
  CREATE INDEX "share_referrals_updated_at_idx" ON "share_referrals" USING btree ("updated_at");
  CREATE INDEX "share_referrals_created_at_idx" ON "share_referrals" USING btree ("created_at");
  CREATE INDEX "student_applications_updated_at_idx" ON "student_applications" USING btree ("updated_at");
  CREATE INDEX "student_applications_created_at_idx" ON "student_applications" USING btree ("created_at");
  CREATE INDEX "student_registration_settings_updated_at_idx" ON "student_registration_settings" USING btree ("updated_at");
  CREATE INDEX "student_registration_settings_created_at_idx" ON "student_registration_settings" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("posts_id");
  CREATE INDEX "payload_locked_documents_rels_artists_id_idx" ON "payload_locked_documents_rels" USING btree ("artists_id");
  CREATE INDEX "payload_locked_documents_rels_tracks_id_idx" ON "payload_locked_documents_rels" USING btree ("tracks_id");
  CREATE INDEX "payload_locked_documents_rels_playlists_id_idx" ON "payload_locked_documents_rels" USING btree ("playlists_id");
  CREATE INDEX "payload_locked_documents_rels_albums_id_idx" ON "payload_locked_documents_rels" USING btree ("albums_id");
  CREATE INDEX "payload_locked_documents_rels_booking_requests_id_idx" ON "payload_locked_documents_rels" USING btree ("booking_requests_id");
  CREATE INDEX "payload_locked_documents_rels_products_id_idx" ON "payload_locked_documents_rels" USING btree ("products_id");
  CREATE INDEX "payload_locked_documents_rels_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("orders_id");
  CREATE INDEX "payload_locked_documents_rels_entitlements_id_idx" ON "payload_locked_documents_rels" USING btree ("entitlements_id");
  CREATE INDEX "payload_locked_documents_rels_star_topups_id_idx" ON "payload_locked_documents_rels" USING btree ("star_topups_id");
  CREATE INDEX "payload_locked_documents_rels_wallet_ledger_id_idx" ON "payload_locked_documents_rels" USING btree ("wallet_ledger_id");
  CREATE INDEX "payload_locked_documents_rels_request_guards_id_idx" ON "payload_locked_documents_rels" USING btree ("request_guards_id");
  CREATE INDEX "payload_locked_documents_rels_password_reset_tokens_id_idx" ON "payload_locked_documents_rels" USING btree ("password_reset_tokens_id");
  CREATE INDEX "payload_locked_documents_rels_cms_access_requests_id_idx" ON "payload_locked_documents_rels" USING btree ("cms_access_requests_id");
  CREATE INDEX "payload_locked_documents_rels_portal_notifications_id_idx" ON "payload_locked_documents_rels" USING btree ("portal_notifications_id");
  CREATE INDEX "payload_locked_documents_rels_agent_change_tickets_id_idx" ON "payload_locked_documents_rels" USING btree ("agent_change_tickets_id");
  CREATE INDEX "payload_locked_documents_rels_artist_agencies_id_idx" ON "payload_locked_documents_rels" USING btree ("artist_agencies_id");
  CREATE INDEX "payload_locked_documents_rels_share_referrals_id_idx" ON "payload_locked_documents_rels" USING btree ("share_referrals_id");
  CREATE INDEX "payload_locked_documents_rels_student_applications_id_idx" ON "payload_locked_documents_rels" USING btree ("student_applications_id");
  CREATE INDEX "payload_locked_documents_rels_student_registration_setti_idx" ON "payload_locked_documents_rels" USING btree ("student_registration_settings_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_managed_outlet_slugs" CASCADE;
  DROP TABLE "users_followed_artist_slugs" CASCADE;
  DROP TABLE "users_followed_agent_slugs" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "posts" CASCADE;
  DROP TABLE "artists_genres" CASCADE;
  DROP TABLE "artists_social_links" CASCADE;
  DROP TABLE "artists" CASCADE;
  DROP TABLE "tracks" CASCADE;
  DROP TABLE "playlists" CASCADE;
  DROP TABLE "playlists_rels" CASCADE;
  DROP TABLE "albums" CASCADE;
  DROP TABLE "albums_rels" CASCADE;
  DROP TABLE "booking_requests" CASCADE;
  DROP TABLE "products" CASCADE;
  DROP TABLE "orders_items" CASCADE;
  DROP TABLE "orders" CASCADE;
  DROP TABLE "entitlements" CASCADE;
  DROP TABLE "star_topups" CASCADE;
  DROP TABLE "wallet_ledger" CASCADE;
  DROP TABLE "request_guards_attempt_timestamps" CASCADE;
  DROP TABLE "request_guards" CASCADE;
  DROP TABLE "password_reset_tokens" CASCADE;
  DROP TABLE "cms_access_requests" CASCADE;
  DROP TABLE "portal_notifications" CASCADE;
  DROP TABLE "agent_change_tickets" CASCADE;
  DROP TABLE "artist_agencies_specialties" CASCADE;
  DROP TABLE "artist_agencies_services" CASCADE;
  DROP TABLE "artist_agencies" CASCADE;
  DROP TABLE "share_referrals" CASCADE;
  DROP TABLE "student_applications" CASCADE;
  DROP TABLE "student_registration_settings" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_users_account_type";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_users_portal_role";
  DROP TYPE "public"."enum_users_portal_access_status";
  DROP TYPE "public"."enum_users_social_provider";
  DROP TYPE "public"."enum_media_kind";
  DROP TYPE "public"."enum_posts_status";
  DROP TYPE "public"."enum_artists_social_links_platform";
  DROP TYPE "public"."enum_artists_role";
  DROP TYPE "public"."enum_artists_gender";
  DROP TYPE "public"."enum_artists_profile_status";
  DROP TYPE "public"."enum_tracks_track_type";
  DROP TYPE "public"."enum_tracks_access_level";
  DROP TYPE "public"."enum_tracks_visibility";
  DROP TYPE "public"."enum_tracks_status";
  DROP TYPE "public"."enum_playlists_playlist_type";
  DROP TYPE "public"."enum_playlists_status";
  DROP TYPE "public"."enum_albums_status";
  DROP TYPE "public"."enum_booking_requests_status";
  DROP TYPE "public"."enum_products_product_type";
  DROP TYPE "public"."enum_products_license_type";
  DROP TYPE "public"."enum_orders_status";
  DROP TYPE "public"."enum_star_topups_provider";
  DROP TYPE "public"."enum_star_topups_status";
  DROP TYPE "public"."enum_wallet_ledger_event_type";
  DROP TYPE "public"."enum_password_reset_tokens_account_type";
  DROP TYPE "public"."enum_cms_access_requests_status";
  DROP TYPE "public"."enum_agent_change_tickets_status";
  DROP TYPE "public"."enum_agent_change_tickets_old_agent_decision";
  DROP TYPE "public"."enum_agent_change_tickets_new_agent_decision";
  DROP TYPE "public"."enum_share_referrals_status";
  DROP TYPE "public"."enum_student_applications_target_type";
  DROP TYPE "public"."enum_student_applications_status";
  DROP TYPE "public"."enum_student_registration_settings_target_type";`)
}

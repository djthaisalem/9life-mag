import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "enum_outlet_profiles_status" AS ENUM ('draft', 'pending_review', 'published', 'cancelled');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE TABLE IF NOT EXISTS "outlet_profiles" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "status" "enum_outlet_profiles_status" DEFAULT 'draft' NOT NULL,
      "type" varchar,
      "region" varchar,
      "city" varchar,
      "hours" varchar,
      "crowd" varchar,
      "vibe" varchar,
      "summary" varchar,
      "introduction" varchar,
      "highlights" varchar,
      "table_options" varchar,
      "service_notes" varchar,
      "music_styles" varchar,
      "faq" varchar,
      "video_embed" varchar,
      "audio_embed" varchar,
      "booking_channel" varchar,
      "created_by_email" varchar,
      "cover_image_id" integer,
      "portrait_image_id" integer,
      "seo_title" varchar,
      "seo_description" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "outlet_profiles_slug_unique" UNIQUE("slug")
    );
    CREATE TABLE IF NOT EXISTS "outlet_profiles_gallery" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "media_id" integer
    );
    ALTER TABLE "outlet_profiles" ADD CONSTRAINT "outlet_profiles_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "outlet_profiles" ADD CONSTRAINT "outlet_profiles_portrait_image_id_media_id_fk" FOREIGN KEY ("portrait_image_id") REFERENCES "media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "outlet_profiles_gallery" ADD CONSTRAINT "outlet_profiles_gallery_parent_id_outlet_profiles_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "outlet_profiles"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "outlet_profiles_gallery" ADD CONSTRAINT "outlet_profiles_gallery_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE set null ON UPDATE no action;
    CREATE INDEX IF NOT EXISTS "outlet_profiles_cover_image_idx" ON "outlet_profiles" USING btree ("cover_image_id");
    CREATE INDEX IF NOT EXISTS "outlet_profiles_portrait_image_idx" ON "outlet_profiles" USING btree ("portrait_image_id");
    CREATE INDEX IF NOT EXISTS "outlet_profiles_gallery_order_idx" ON "outlet_profiles_gallery" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "outlet_profiles_gallery_parent_id_idx" ON "outlet_profiles_gallery" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "outlet_profiles_gallery_media_id_idx" ON "outlet_profiles_gallery" USING btree ("media_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "outlet_profiles_gallery";
    DROP TABLE IF EXISTS "outlet_profiles";
    DROP TYPE IF EXISTS "enum_outlet_profiles_status";
  `)
}

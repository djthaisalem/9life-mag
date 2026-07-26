import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "content_votes" (
      "id" serial PRIMARY KEY NOT NULL,
      "target_type" varchar NOT NULL,
      "target_slug" varchar NOT NULL,
      "site_user_id" varchar NOT NULL,
      "user_id" integer,
      "status" varchar DEFAULT 'confirmed' NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "content_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action,
      CONSTRAINT "content_votes_unique_user_target" UNIQUE ("target_type", "target_slug", "site_user_id")
    );
    CREATE INDEX IF NOT EXISTS "content_votes_target_idx" ON "content_votes" USING btree ("target_type", "target_slug");
    CREATE INDEX IF NOT EXISTS "content_votes_user_idx" ON "content_votes" USING btree ("site_user_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS "content_votes";`)
}

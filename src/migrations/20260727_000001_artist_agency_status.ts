import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "enum_artist_agencies_status" AS ENUM ('pending_review', 'published', 'suspended', 'cancelled');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    ALTER TABLE "artist_agencies"
      ADD COLUMN IF NOT EXISTS "status" "enum_artist_agencies_status" DEFAULT 'published' NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "artist_agencies" DROP COLUMN IF EXISTS "status";
    DROP TYPE IF EXISTS "enum_artist_agencies_status";
  `)
}

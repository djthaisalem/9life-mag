import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "playlists" ADD COLUMN "owner_site_user_id" varchar;
    ALTER TABLE "playlists" ADD COLUMN "is_user_playlist" boolean DEFAULT false;
    ALTER TABLE "playlists" ADD COLUMN "user_snapshot" jsonb;
    CREATE INDEX "playlists_owner_site_user_id_idx" ON "playlists" USING btree ("owner_site_user_id");
    CREATE UNIQUE INDEX "playlists_user_share_code_idx"
      ON "playlists" USING btree ("share_code")
      WHERE "is_user_playlist" = true;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "playlists_user_share_code_idx";
    DROP INDEX IF EXISTS "playlists_owner_site_user_id_idx";
    ALTER TABLE "playlists" DROP COLUMN IF EXISTS "user_snapshot";
    ALTER TABLE "playlists" DROP COLUMN IF EXISTS "is_user_playlist";
    ALTER TABLE "playlists" DROP COLUMN IF EXISTS "owner_site_user_id";
  `)
}

import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "share_referrals" ADD COLUMN IF NOT EXISTS "visitor_fingerprints" jsonb;
    ALTER TABLE "share_referrals" ADD COLUMN IF NOT EXISTS "visit_count" numeric DEFAULT 0;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "share_referrals" DROP COLUMN IF EXISTS "visit_count";
    ALTER TABLE "share_referrals" DROP COLUMN IF EXISTS "visitor_fingerprints";
  `)
}

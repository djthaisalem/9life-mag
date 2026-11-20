import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "_objectkey" varchar;`)
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Retain object keys on rollback: old media remain compatible with a null key,
  // while deleting the column would lose the locations of newly uploaded files.
}

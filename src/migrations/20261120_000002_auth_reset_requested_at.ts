import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_password_requested_at" timestamp(3) with time zone;`)
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Keep reset request timestamps on rollback; the nullable column is backward compatible.
}

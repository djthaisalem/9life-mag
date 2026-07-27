import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "topic_id" integer;
    ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "placement" varchar;

    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'posts_topic_id_categories_id_fk'
      ) THEN
        ALTER TABLE "posts"
          ADD CONSTRAINT "posts_topic_id_categories_id_fk"
          FOREIGN KEY ("topic_id") REFERENCES "categories"("id")
          ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "posts_topic_idx" ON "posts" USING btree ("topic_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "posts_topic_idx";
    ALTER TABLE "posts" DROP CONSTRAINT IF EXISTS "posts_topic_id_categories_id_fk";
    ALTER TABLE "posts" DROP COLUMN IF EXISTS "topic_id";
    ALTER TABLE "posts" DROP COLUMN IF EXISTS "placement";
  `)
}

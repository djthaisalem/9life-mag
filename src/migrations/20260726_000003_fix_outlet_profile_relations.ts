import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "outlet_profiles_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "media_id" integer
    );
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'outlet_profiles_rels_parent_fk') THEN
        ALTER TABLE "outlet_profiles_rels" ADD CONSTRAINT "outlet_profiles_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "outlet_profiles"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'outlet_profiles_rels_media_fk') THEN
        ALTER TABLE "outlet_profiles_rels" ADD CONSTRAINT "outlet_profiles_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;
    CREATE INDEX IF NOT EXISTS "outlet_profiles_rels_order_idx" ON "outlet_profiles_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "outlet_profiles_rels_parent_idx" ON "outlet_profiles_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "outlet_profiles_rels_path_idx" ON "outlet_profiles_rels" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "outlet_profiles_rels_media_id_idx" ON "outlet_profiles_rels" USING btree ("media_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS "outlet_profiles_rels";`)
}
